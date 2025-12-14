import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectType } from '../project/project.entity';
import { ReviewService } from '../review/review.service';
import { AiService, LineComment } from '../ai/ai.service';
import { TrainingService } from '../training/training.service';
import { DiscordService } from '../discord/discord.service';
import { ReviewStatus } from '../review/review.entity';
import { CommentType } from '../review/review-comment.entity';
import { Octokit } from '@octokit/rest';
import { Gitlab } from '@gitbeaker/node';
import { User } from '../user/user.entity';
import { SecurityScannerService } from '../security/security-scanner.service';
import { ReviewFilters } from './filters';
import { ReviewCacheService } from './cache.service';
import { TokenUsageService } from '../review/token-usage.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private reviewService: ReviewService,
    private aiService: AiService,
    private trainingService: TrainingService,
    private discordService: DiscordService,
    private securityScanner: SecurityScannerService,
    private cacheService: ReviewCacheService,
    private tokenUsageService: TokenUsageService,
    private subscriptionService: SubscriptionService,
  ) {}

  async handlePullRequestEvent(payload: any, source: 'github' | 'gitlab') {
    try {
      let prData = this.extractPullRequestData(payload, source);

      console.log('PR Data extracted:', prData);
      
      if (prData.action !== 'opened' && prData.action !== 'synchronize') {
        return;
      }

      // Tìm project tương ứng
      const project = await this.findProjectByRepository(
        prData.repositoryUrl,
        source === 'github' ? ProjectType.GITHUB : ProjectType.GITLAB,
      );

      if (!project || !project.autoReview) {
        this.logger.log('Project not found or auto-review disabled');
        return;
      }

      // For GitLab, ensure we have proper SHAs
      if (source === 'gitlab' && (!prData.baseSha || !prData.startSha)) {
        this.logger.log('Fetching GitLab MR details to get proper SHAs...');
        prData = await this.enrichGitlabMRData(project, prData);
      }

      // Load user for Discord bot token
      await this.projectRepository.manager.getRepository('User').findOne({
        where: { id: project.userId },
      }).then((user: User) => {
        if (user) {
          project.user = user;
        }
      });

      // Tạo review record
      const review = await this.reviewService.createReview({
        projectId: project.id,
        pullRequestId: prData.pullRequestId,
        pullRequestNumber: prData.pullRequestNumber,
        pullRequestTitle: prData.title,
        pullRequestUrl: prData.url,
        branch: prData.branch,
        author: prData.author,
        filesChanged: prData.filesChanged,
      });

      this.logger.log(`✅ Created review ${review.id}, processing in background...`);

      // Process in background - don't await
      // This allows webhook to return 200 immediately
      this.processReviewInBackground(review.id, project, prData).catch(error => {
        this.logger.error('Background review processing failed:', error);
      });

    } catch (error) {
      this.logger.error('Error handling pull request event:', error);
    }
  }

  /**
   * Process AI review in background
   */
  private async processReviewInBackground(reviewId: string, project: Project, prData: any) {
    try {
      // Send Discord notification
      const botToken = project.user?.discordBotToken;
      if (this.discordService.isEnabled(botToken) && project.discordChannelId && botToken) {
        await this.discordService.notifyPullRequest({
          projectName: project.name,
          pullRequestTitle: prData.title,
          pullRequestUrl: prData.url,
          author: prData.author,
          branch: prData.branch,
          filesChanged: prData.filesChanged?.length || 0,
          additions: prData.filesChanged?.reduce((sum, f) => sum + (f.additions || 0), 0) || 0,
          deletions: prData.filesChanged?.reduce((sum, f) => sum + (f.deletions || 0), 0) || 0,
        }, botToken, project.discordChannelId);
      }

      // Perform AI review
      await this.performAiReview(reviewId, project, prData);
    } catch (error) {
      this.logger.error('Error in background review processing:', error);
    }
  }

  async handleCommentEvent(payload: any, source: 'github' | 'gitlab') {
    try {
      this.logger.log(`Handling comment event from ${source}`);
      
      const commentData = await this.extractCommentData(payload, source);

      if (!commentData) {
        this.logger.warn('Failed to extract comment data');
        return;
      }

      this.logger.log(`Comment from ${commentData.author}: ${commentData.content.substring(0, 100)}...`);

      // Tìm review tương ứng
      const reviews = await this.reviewService.findReviewsByProject(
        commentData.projectId,
      );
      const review = reviews.find(
        (r) => r.pullRequestNumber.toString() === commentData.pullRequestNumber.toString(),
      );

      if (!review) {
        this.logger.log('Review not found for comment, creating placeholder');
        // Create a minimal review entry if not exists
        const project = await this.projectRepository.findOne({
          where: { id: commentData.projectId },
          relations: ['user'],
        });
        
        if (!project) {
          this.logger.error('Project not found');
          return;
        }
      

        const newReview = await this.reviewService.createReview({
          projectId: commentData.projectId,
          pullRequestId: commentData.pullRequestId,
          pullRequestNumber: commentData.pullRequestNumber,
          pullRequestTitle: 'Comment Thread',
          pullRequestUrl: '',
          branch: 'unknown',
          author: commentData.author,
        });
        
        this.logger.log(`✅ Processing comment in background...`);
        
        // Process in background
        this.handleCommentWithReview(newReview, commentData, source, project).catch(error => {
          this.logger.error('Background comment processing failed:', error);
        });
        
        return;
      }

      const project = await this.projectRepository.findOne({
        where: { id: review.projectId },
        relations: ['user'],
      });

      if (!project) {
        this.logger.error('Project not found');
        return;
      }

      this.logger.log(`✅ Processing comment in background...`);

      // Process comment in background - don't await
      this.handleCommentWithReview(review, commentData, source, project).catch(error => {
        this.logger.error('Background comment processing failed:', error);
      });

    } catch (error) {
      this.logger.error('Error handling comment event:', error);
    }
  }

  private async handleCommentWithReview(
    review: any,
    commentData: any,
    source: 'github' | 'gitlab',
    project: any,
  ) {
    try {

      // Lưu user comment
      await this.reviewService.createComment({
        reviewId: review.id,
        externalCommentId: commentData.commentId,
        type: CommentType.USER_FEEDBACK,
        content: commentData.content,
        filePath: commentData.filePath,
        lineNumber: commentData.lineNumber,
        author: commentData.author,
        parentCommentId: commentData.parentCommentId,
        metadata: {
          position: commentData.position,
          commitId: commentData.commitId,
        },
      });

      this.logger.log(`Saved user comment from ${commentData.author}`);

      // Check if should reply (reply to AI or mention bot)
      const shouldReply = commentData.isReplyToAi || 
                         commentData.content.includes('@ai-reviewer') ||
                         commentData.content.includes('@bot');

      if (!shouldReply) {
        this.logger.log('No AI reply needed');
        return;
      }

      // Process feedback if replying to AI
      if (commentData.isReplyToAi) {
        this.logger.log('Processing user feedback for training');
        await this.trainingService.processUserFeedback(
          review.projectId,
          commentData.content,
          commentData.codeSnippet,
          commentData.aiComment,
        );
      }

      // Generate AI reply
      this.logger.log('Generating AI reply...');
      const aiReply = await this.aiService.generateReply(
        commentData.content,
        {
          businessContext: project.businessContext,
          reviewRules: project.reviewRules,
          codeSnippet: commentData.codeSnippet,
          fileName: commentData.filePath,
          pullRequestTitle: review.pullRequestTitle,
        },
      );

      this.logger.log(`AI reply generated: ${aiReply.substring(0, 100)}...`);

      // Post reply to GitHub/GitLab
      if (commentData.lineNumber && commentData.filePath) {
        // Reply to inline comment
        await this.postReplyToComment(
          project,
          commentData.pullRequestNumber.toString(),
          commentData.commentId,
          aiReply,
          commentData.filePath,
          commentData.lineNumber,
          source,
        );
      } else {
        // Reply to general comment
        await this.postComment(
          project,
          commentData.pullRequestNumber.toString(),
          `@${commentData.author} ${aiReply}`,
          null,
          null,
          source,
        );
      }

      // Save AI reply
      await this.reviewService.createComment({
        reviewId: review.id,
        externalCommentId: `ai-reply-${Date.now()}-${Math.random()}`,
        type: CommentType.AI_REPLY,
        content: aiReply,
        filePath: commentData.filePath,
        lineNumber: commentData.lineNumber,
        author: 'ai-bot',
        parentCommentId: commentData.commentId,
        metadata: {
          inReplyTo: commentData.author,
        },
      });

      this.logger.log('✅ AI reply posted successfully');
    } catch (error) {
      this.logger.error('Error handling comment with review:', error);
    }
  }

  private async performAiReview(
    reviewId: string,
    project: Project,
    prData: any,
  ) {
    try {
      await this.reviewService.updateReviewStatus(
        reviewId,
        ReviewStatus.IN_PROGRESS,
      );

      // Lấy diff của từng file
      let fileContents = await this.fetchFileContents(project, prData);

      // Apply smart filtering
      const originalCount = fileContents.length;
      fileContents = ReviewFilters.filterReviewableFiles(fileContents, {
        skipAutoGenerated: true,
        skipDocs: project.reviewRules?.skipDocs || false,
        skipTests: project.reviewRules?.skipTests || false,
        skipWhitespace: true,
      });

      this.logger.log(`📊 Filtered ${originalCount} files → ${fileContents.length} reviewable files`);

      const allComments = [];
      const securityIssues = [];
      let totalLineComments = 0;
      const filesWithIssues = [];
      const filesWithoutIssues = [];

      for (const file of fileContents) {
        this.logger.log(`🔍 Reviewing ${file.filename} (${ReviewFilters.getFileCategory(file.filename)})...`);

        // Check cache first
        const cachedReview = await this.cacheService.getCachedReview(
          project.id,
          file.filename,
          file.content || file.patch || '',
        );

        if (cachedReview) {
          this.logger.log(`✅ Using cached review for ${file.filename}`);
          // Use cached review results
          if (cachedReview.lineComments?.length > 0) {
            filesWithIssues.push({
              filename: file.filename,
              reviewResult: cachedReview,
              additions: file.additions,
            });
            totalLineComments += cachedReview.lineComments.length;
          }
          continue;
        }

        // Run security scan on file content
        const fileSecurityIssues = await this.securityScanner.scanFile(
          file.filename,
          file.content || '',
        );

        if (fileSecurityIssues.length > 0) {
          this.logger.warn(`🔒 Found ${fileSecurityIssues.length} security issues in ${file.filename}`);
          securityIssues.push(...fileSecurityIssues);
        }

        // Use patch (diff) for review if available, otherwise use full content
        const codeToReview = file.patch || file.content;
        
        // Use new line-based review method (RabbitCode AI style)
        if (file.patch) {
          const reviewResult = await this.aiService.reviewCodeWithLineComments({
            businessContext: project.businessContext,
            reviewRules: project.reviewRules,
            codeSnippet: codeToReview,
            fileName: file.filename,
            pullRequestTitle: prData.title,
            pullRequestDescription: prData.description,
            fileStatus: file.status,
            additions: file.additions,
            deletions: file.deletions,
            projectId: project.id,
            reviewId: reviewId,
          });

          // Check if there are line comments
          if (reviewResult.lineComments.length > 0) {
            this.logger.log(`Found ${reviewResult.lineComments.length} line comments for ${file.filename}`);
            
            // Post inline comments directly to specific lines
            for (const lineComment of reviewResult.lineComments) {
              // Format enhanced comment body
              const enhancedBody = this.formatLineCommentBody(lineComment);

              this.logger.log(`Posting inline comment to ${file.filename}:${lineComment.line} (${lineComment.severity})`);

              allComments.push({
                file: file.filename,
                line: lineComment.line,
                comment: enhancedBody,
                severity: lineComment.severity,
                issue: lineComment.issue,
                codeError: lineComment.codeError,
                codeSuggest: lineComment.codeSuggest,
                additions: file.additions,
                deletions: file.deletions,
              });


              try {
                // Post inline comment directly to the line with proper path
                await this.postLineComment(
                  project,
                  prData.pullRequestNumber.toString(),
                  { ...lineComment, body: enhancedBody, path: file.filename },
                  project.type === ProjectType.GITHUB ? 'github' : 'gitlab',
                  prData.commitSha,
                  prData.baseSha,
                  prData.startSha,
                );
                this.logger.log(`✅ Successfully posted inline comment to ${file.filename}:${lineComment.line}`);
              } catch (error) {
                this.logger.error(`❌ Failed to post inline comment to ${file.filename}:${lineComment.line}`, error);
              }

              // Save comment with metadata
              await this.reviewService.createComment({
                reviewId,
                externalCommentId: `ai-line-${Date.now()}-${Math.random()}`,
                type: CommentType.AI_GENERATED,
                content: enhancedBody,
                filePath: file.filename,
                lineNumber: lineComment.line,
                metadata: {
                  severity: lineComment.severity,
                  side: lineComment.side,
                  issue: lineComment.issue,
                  codeError: lineComment.codeError,
                  codeSuggest: lineComment.codeSuggest,
                },
              });

              totalLineComments++;
            }

            filesWithIssues.push({
              filename: file.filename,
              reviewResult,
              additions: file.additions,
              deletions: file.deletions,
            });

            // Cache the review result
            await this.cacheService.cacheReview(
              project.id,
              file.filename,
              file.content || file.patch || '',
              reviewResult,
            );
          } else {
            // No issues found in this file
            filesWithoutIssues.push({
              filename: file.filename,
              reviewResult,
              additions: file.additions,
              deletions: file.deletions,
            });
          }
        } else {
          // Fallback to old method for files without patch
          const comments = await this.aiService.reviewCode({
            businessContext: project.businessContext,
            reviewRules: project.reviewRules,
            codeSnippet: codeToReview,
            fileName: file.filename,
            pullRequestTitle: prData.title,
            pullRequestDescription: prData.description,
            fileStatus: file.status,
            additions: file.additions,
            deletions: file.deletions,
            projectId: project.id,
            reviewId: reviewId,
          });

          for (const comment of comments) {
            allComments.push({
              file: file.filename,
              comment,
              additions: file.additions,
              deletions: file.deletions,
            });

            // Post comment lên GitHub/GitLab
            await this.postComment(
              project,
              prData.pullRequestNumber.toString(),
              comment,
              file.filename,
              null,
              project.type === ProjectType.GITHUB ? 'github' : 'gitlab',
              prData.commitSha,
            );

            // Save comment
            await this.reviewService.createComment({
              reviewId,
              externalCommentId: `ai-${Date.now()}-${Math.random()}`,
              type: CommentType.AI_GENERATED,
              content: comment,
              filePath: file.filename,
            });
          }
        }
      }

      // Post PR-level summary only if there are issues OR all files are clean
      if (filesWithIssues.length > 0 || filesWithoutIssues.length > 0) {
        const prSummary = this.generatePRSummary(
          filesWithIssues,
          filesWithoutIssues,
          prData,
          securityIssues,
        );

        await this.postComment(
          project,
          prData.pullRequestNumber.toString(),
          prSummary,
          null,
          null,
          project.type === ProjectType.GITHUB ? 'github' : 'gitlab',
          prData.commitSha,
        );
      }

      // Post security issues as separate comments
      if (securityIssues.length > 0) {
        const criticalIssues = securityIssues.filter(i => i.severity === 'critical');
        if (criticalIssues.length > 0) {
          const securityReport = this.formatSecurityReport(securityIssues);
          await this.postComment(
            project,
            prData.pullRequestNumber.toString(),
            securityReport,
            null,
            null,
            project.type === ProjectType.GITHUB ? 'github' : 'gitlab',
            prData.commitSha,
          );
        }

        // Save security issues to review comments
        for (const issue of securityIssues) {
          await this.reviewService.createComment({
            reviewId,
            externalCommentId: `security-${Date.now()}-${Math.random()}`,
            type: CommentType.AI_GENERATED,
            content: `🔒 ${issue.title}: ${issue.description}`,
            filePath: issue.file,
            lineNumber: issue.line,
            metadata: {
              severity: issue.severity,
              type: issue.type,
              cwe: issue.cwe,
              recommendation: issue.recommendation,
            },
          });
        }
      }

      // Save analysis
      await this.reviewService.saveReviewAnalysis(reviewId, {
        totalComments: allComments.length,
        totalLineComments,
        securityIssues: securityIssues.length,
        filesReviewed: fileContents.length,
        filesWithIssues: filesWithIssues.length,
        filesWithoutIssues: filesWithoutIssues.length,
        reviewedAt: new Date(),
        comments: allComments,
      });

      await this.reviewService.updateReviewStatus(
        reviewId,
        ReviewStatus.COMPLETED,
      );

      // Increment subscription usage counter
      try {
        let subscription;
        if (project.teamId) {
          // Team project - get team subscription
          subscription = await this.subscriptionService.findByTeam(project.teamId);
        } else if (project.userId) {
          // Personal project - get user subscription
          subscription = await this.subscriptionService.findByUser(project.userId);
        }

        if (subscription) {
          await this.subscriptionService.incrementUsage(subscription.id, 1);
          this.logger.log(`📊 Incremented usage for subscription ${subscription.id}: ${subscription.currentMonthReviews + 1}/${subscription.monthlyReviewLimit}`);
        } else {
          this.logger.warn(`⚠️ No subscription found for project ${project.id}`);
        }
      } catch (err) {
        this.logger.error('Failed to increment subscription usage:', err);
      }

      // Send Discord notification for review completion
      const botToken = project.user?.discordBotToken;
      if (this.discordService.isEnabled(botToken) && project.discordChannelId && botToken) {
        await this.discordService.notifyReviewComplete({
          projectName: project.name,
          pullRequestTitle: prData.title,
          pullRequestUrl: prData.url,
          totalComments: allComments.length,
          status: 'success',
        }, botToken, project.discordChannelId);
      }
    } catch (error) {
      this.logger.error('AI review failed:', error);
      await this.reviewService.updateReviewStatus(
        reviewId,
        ReviewStatus.FAILED,
      );

      // Send Discord notification for review failure
      const botToken = project.user?.discordBotToken;
      if (this.discordService.isEnabled(botToken) && project.discordChannelId && botToken) {
        const review = await this.reviewService.findReviewById(reviewId);
        await this.discordService.notifyReviewComplete({
          projectName: project.name,
          pullRequestTitle: review?.pullRequestTitle || 'Unknown',
          pullRequestUrl: review?.pullRequestUrl || '',
          totalComments: 0,
          status: 'failed',
        }, botToken, project.discordChannelId);
      }
    }
  }

  private async fetchFileContents(project: Project, prData: any) {
    try {
      if (project.type === ProjectType.GITHUB) {
        return await this.fetchGithubFileContents(project, prData);
      } else {
        return await this.fetchGitlabFileContents(project, prData);
      }
    } catch (error) {
      this.logger.error('Error fetching file contents:', error);
      return [];
    }
  }

  private async fetchGithubFileContents(project: Project, prData: any) {
    const octokit = new Octokit({
      auth: project.user.githubToken,
    });

    const [owner, repo] = this.parseGithubUrl(project.repositoryUrl);

    // Get list of files changed in PR
    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prData.pullRequestNumber,
    });

    const fileContents = [];

    for (const file of files) {
      // Skip deleted files and very large files
      if (file.status === 'removed' || file.changes > 500) {
        continue;
      }

      try {
        // Get file diff/patch
        const patch = file.patch || '';
        
        // Get full file content from head commit
        const { data: fileData } = await octokit.repos.getContent({
          owner,
          repo,
          path: file.filename,
          ref: prData.commitSha,
        });

        let content = '';
        if ('content' in fileData && fileData.content) {
          content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        }

        fileContents.push({
          filename: file.filename,
          content,
          patch,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
          status: file.status,
        });
      } catch (error) {
        this.logger.warn(`Failed to fetch content for ${file.filename}:`, error.message);
      }
    }

    return fileContents;
  }

  private async fetchGitlabFileContents(project: Project, prData: any) {
    console.log( project.user.gitlabToken)
    const api = new Gitlab({
      token: project.user.gitlabToken,
      host: this.getGitlabHost(project.repositoryUrl),
    });

    const projectId = prData.projectId || this.parseGitlabUrl(project.repositoryUrl);

    // Get merge request changes
    const changes = await api.MergeRequests.changes(projectId, prData.pullRequestNumber);

    const fileContents = [];

    for (const file of changes.changes || []) {
      // Skip deleted files
      if (file.deleted_file) {
        continue;
      }

      try {
        // Get file content
        const fileContent = await api.RepositoryFiles.show(
          projectId,
          file.new_path,
          prData.commitSha || 'HEAD',
        );

        const content = Buffer.from(fileContent.content, 'base64').toString('utf-8');

        fileContents.push({
          filename: file.new_path,
          content,
          patch: file.diff,
          additions: 0, // GitLab doesn't provide this directly in the diff
          deletions: 0,
          changes: 0,
          status: file.new_file ? 'added' : 'modified',
        });
      } catch (error) {
        this.logger.warn(`Failed to fetch content for ${file.new_path}:`, error.message);
      }
    }

    return fileContents;
  }

  /**
   * Post inline comment on specific line (RabbitCode AI style)
   */
  private async postLineComment(
    project: Project,
    pullRequestId: string,
    lineComment: any,
    source: 'github' | 'gitlab',
    commitSha: string,
    baseSha?: string,
    startSha?: string,
  ) {
    try {
      if (source === 'github') {
        const octokit = new Octokit({
          auth: project.user.githubToken,
        });

        const [owner, repo] = this.parseGithubUrl(project.repositoryUrl);

        this.logger.log(`Attempting to post inline comment: ${JSON.stringify({
          owner,
          repo,
          pull_number: pullRequestId,
          path: lineComment.path,
          line: lineComment.line,
          side: lineComment.side,
          commit_id: commitSha,
        })}`);

        // GitHub API v3 approach: Use createReview with comments
        // This is more reliable than createReviewComment for inline comments
        const reviewCommentParams: any = {
          path: lineComment.path,
          body: lineComment.body,
          side: lineComment.side || 'RIGHT',
        };

        // For single-line comments, use 'line' parameter
        // For multi-line comments, use both 'start_line' and 'line'
        if (lineComment.startLine && lineComment.startLine !== lineComment.line) {
          reviewCommentParams.start_line = lineComment.startLine;
          reviewCommentParams.start_side = lineComment.startSide || lineComment.side || 'RIGHT';
          reviewCommentParams.line = lineComment.line;
        } else {
          reviewCommentParams.line = lineComment.line;
        }

        // Create a review with inline comment
        // This approach is more reliable than standalone review comments
        await octokit.pulls.createReview({
          owner,
          repo,
          pull_number: parseInt(pullRequestId),
          commit_id: commitSha,
          event: 'COMMENT', // Just comment, not approve/request_changes
          comments: [reviewCommentParams],
        });

        this.logger.log(`✅ Posted line comment on ${lineComment.path}:${lineComment.line}`);
      } else if (source === 'gitlab') {
        const api = new Gitlab({
          token: project.user.gitlabToken,
          host: this.getGitlabHost(project.repositoryUrl),
        });

        const projectId = this.parseGitlabUrl(project.repositoryUrl);

        this.logger.log(`Attempting to post GitLab inline comment: ${JSON.stringify({
          projectId,
          mr_iid: pullRequestId,
          path: lineComment.path,
          line: lineComment.line,
          head_sha: commitSha,
          base_sha: baseSha,
          start_sha: startSha || baseSha,
        })}`);

        // GitLab uses discussions API for line comments
        // IMPORTANT: GitLab requires proper SHA values for position
        const position: any = {
          base_sha: baseSha || commitSha,
          start_sha: startSha || baseSha || commitSha,
          head_sha: commitSha,
          position_type: 'text',
          new_path: lineComment.path,
          new_line: lineComment.line,
        };

        // Only set old_path and old_line for LEFT side (deleted lines)
        if (lineComment.side === 'LEFT') {
          position.old_path = lineComment.path;
          position.old_line = lineComment.line;
          position.new_line = null;
        }

        await api.MergeRequestDiscussions.create(
          projectId,
          parseInt(pullRequestId),
          lineComment.body,
          { position },
        );

        this.logger.log(`✅ Posted GitLab line comment on ${lineComment.path}:${lineComment.line}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to post line comment on ${lineComment.path}:${lineComment.line}:`, error);
      
      // Log detailed error information for debugging
      if (error.response) {
        this.logger.error(`API Error Response (${source}):`, {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          message: error.response.data?.message || error.response.data?.error,
          errors: error.response.data?.errors,
        });
      } else if (error.message) {
        this.logger.error('Error message:', error.message);
      }
      
      // Fallback: post as general comment if line comment fails
      this.logger.log(`Falling back to general comment for ${lineComment.path}:${lineComment.line}`);
      try {
        await this.postComment(
          project,
          pullRequestId,
          `**${lineComment.path}:${lineComment.line}**\n\n${lineComment.body}`,
          lineComment.path,
          null,
          source,
          commitSha,
        );
      } catch (fallbackError) {
        this.logger.error('Fallback comment also failed:', fallbackError);
      }
    }
  }

  /**
   * Post reply to a specific comment (threaded reply)
   */
  private async postReplyToComment(
    project: Project,
    pullRequestId: string,
    commentId: string,
    reply: string,
    filePath: string,
    lineNumber: number,
    source: 'github' | 'gitlab',
  ) {
    try {
      if (source === 'github') {
        const octokit = new Octokit({
          auth: project.user.githubToken,
        });

        const [owner, repo] = this.parseGithubUrl(project.repositoryUrl);

        // Reply to review comment (creates threaded reply)
        await octokit.pulls.createReplyForReviewComment({
          owner,
          repo,
          pull_number: parseInt(pullRequestId),
          comment_id: parseInt(commentId),
          body: reply,
        });

        this.logger.log(`✅ Posted reply to comment ${commentId}`);
      } else if (source === 'gitlab') {
        const api = new Gitlab({
          token: project.user.gitlabToken,
          host: this.getGitlabHost(project.repositoryUrl),
        });

        const projectId = this.parseGitlabUrl(project.repositoryUrl);

        // Reply in the same discussion thread
        await api.MergeRequestNotes.create(
          projectId,
          parseInt(pullRequestId),
          reply,
          {
            discussion_id: commentId,
          },
        );

        this.logger.log(`✅ Posted reply to comment ${commentId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to post reply to comment ${commentId}:`, error);
      // Fallback to general comment
      await this.postComment(
        project,
        pullRequestId,
        `> Replying to comment on **${filePath}:${lineNumber}**\n\n${reply}`,
        null,
        null,
        source,
      );
    }
  }

  private async postComment(
    project: Project,
    pullRequestId: string,
    comment: string,
    filePath: string,
    lineNumber: number | null,
    source: 'github' | 'gitlab',
    commitSha?: string,
  ) {
    try {
      if (source === 'github') {
        const octokit = new Octokit({
          auth: project.user.githubToken,
        });

        // Parse repository URL
        const [owner, repo] = this.parseGithubUrl(project.repositoryUrl);

        // Create a review comment on the PR
        if (lineNumber && commitSha && filePath) {
          await octokit.pulls.createReviewComment({
            owner,
            repo,
            pull_number: parseInt(pullRequestId),
            body: comment,
            path: filePath,
            line: lineNumber,
            side: 'RIGHT',
            commit_id: commitSha,
          });
        } else {
          // Post as general PR comment if no line number
          await octokit.issues.createComment({
            owner,
            repo,
            issue_number: parseInt(pullRequestId),
            body: filePath ? `**${filePath}**\n\n${comment}` : comment,
          });
        }
      } else if (source === 'gitlab') {
        const api = new Gitlab({
          token: project.user.gitlabToken,
          host: this.getGitlabHost(project.repositoryUrl),
        });

        // Parse project ID
        const projectId = this.parseGitlabUrl(project.repositoryUrl);

        await api.MergeRequestNotes.create(
          projectId,
          parseInt(pullRequestId),
          comment,
        );
      }
    } catch (error) {
      this.logger.error('Failed to post comment:', error);
    }
  }

  /**
   * Enrich GitLab MR data by fetching details from API if needed
   */
  private async enrichGitlabMRData(project: Project, prData: any) {
    try {
      const api = new Gitlab({
        token: project.user.gitlabToken,
        host: this.getGitlabHost(project.repositoryUrl),
      });

      const projectId = this.parseGitlabUrl(project.repositoryUrl);
      
      // Fetch MR details
      const mr: any = await api.MergeRequests.show(projectId, prData.pullRequestNumber);
      
      if (mr.diff_refs) {
        this.logger.log('Got diff_refs from GitLab API:', mr.diff_refs);
        return {
          ...prData,
          commitSha: mr.diff_refs.head_sha,
          baseSha: mr.diff_refs.base_sha,
          startSha: mr.diff_refs.start_sha,
        };
      }
    } catch (error) {
      this.logger.error('Failed to enrich GitLab MR data:', error);
    }
    
    return prData;
  }

  private extractPullRequestData(payload: any, source: 'github' | 'gitlab') {
    if (source === 'github') {
      return {
        action: payload.action,
        pullRequestId: payload.pull_request.id.toString(),
        pullRequestNumber: payload.pull_request.number,
        title: payload.pull_request.title,
        description: payload.pull_request.body,
        url: payload.pull_request.html_url,
        branch: payload.pull_request.head.ref,
        author: payload.pull_request.user.login,
        repositoryUrl: payload.repository.html_url,
        commitSha: payload.pull_request.head.sha,
        baseSha: payload.pull_request.base.sha,
        filesChanged: payload.pull_request.changed_files || [],
      };
    } else {
      // GitLab MR payload
      const diffRefs = payload.object_attributes.diff_refs || {};
      
      return {
        action: payload.object_attributes.state === 'opened' ? 'opened' : 'synchronize',
        pullRequestId: payload.object_attributes.iid.toString(),
        pullRequestNumber: payload.object_attributes.iid,
        title: payload.object_attributes.title,
        description: payload.object_attributes.description,
        url: payload.object_attributes.url,
        branch: payload.object_attributes.source_branch,
        author: payload.user.username,
        repositoryUrl: payload.project.web_url,
        commitSha: diffRefs.head_sha || payload.object_attributes.last_commit?.id,
        baseSha: diffRefs.base_sha || payload.object_attributes.target_branch,
        startSha: diffRefs.start_sha || diffRefs.base_sha, // merge base
        projectId: payload.project.id,
        filesChanged: [],
      };
    }
  }

  private async extractCommentData(payload: any, source: 'github' | 'gitlab') {
    if (source === 'github') {
      // GitHub comment event
      const comment = payload.comment;
      const issue = payload.issue || payload.pull_request;
      
      // Check if it's a review comment (inline) or issue comment (general)
      const isReviewComment = !!comment.path;
      
      // Get the PR from repository
      const repositoryUrl = payload.repository.html_url;
      const project = await this.projectRepository.findOne({
        where: { repositoryUrl },
        relations: ['user'],
      });

      if (!project) {
        this.logger.warn('Project not found for repository:', repositoryUrl);
        return null;
      }

      // Check if this is a reply to AI comment
      let isReplyToAi = false;
      let aiComment = '';
      let parentCommentId = null;
      
      // For review comments, check if replying to AI
      if (comment.in_reply_to_id) {
        parentCommentId = comment.in_reply_to_id.toString();
        // Check if parent comment is from AI
        const parentComment = await this.reviewService.getCommentsByReview(project.id);
        const aiParent = parentComment.find(
          c => c.externalCommentId === parentCommentId && c.type === CommentType.AI_GENERATED
        );
        if (aiParent) {
          isReplyToAi = true;
          aiComment = aiParent.content;
        }
      }

      // Get code snippet for context
      let codeSnippet = '';
      if (isReviewComment && comment.path) {
        try {
          const octokit = new Octokit({ auth: project.user.githubToken });
          const [owner, repo] = this.parseGithubUrl(repositoryUrl);
          const { data: fileData } = await octokit.repos.getContent({
            owner,
            repo,
            path: comment.path,
            ref: comment.commit_id,
          });
          if ('content' in fileData) {
            const fullContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
            const lines = fullContent.split('\n');
            const startLine = Math.max(0, (comment.line || comment.original_line) - 5);
            const endLine = Math.min(lines.length, (comment.line || comment.original_line) + 5);
            codeSnippet = lines.slice(startLine, endLine).join('\n');
          }
        } catch (error) {
          this.logger.warn('Failed to fetch code snippet:', error.message);
        }
      }

      return {
        projectId: project.id,
        pullRequestId: issue.id.toString(),
        pullRequestNumber: issue.number,
        commentId: comment.id.toString(),
        content: comment.body,
        filePath: comment.path || null,
        lineNumber: comment.line || comment.original_line || null,
        position: comment.position || null,
        author: comment.user.login,
        parentCommentId,
        isReplyToAi,
        codeSnippet,
        aiComment,
        commitId: comment.commit_id,
      };
    } else {
      // GitLab comment event
      const note = payload.object_attributes;
      const mergeRequest = payload.merge_request;
      
      const projectId = payload.project.id;
      const project = await this.projectRepository.findOne({
        where: { repositoryUrl: payload.project.web_url },
        relations: ['user'],
      });

      if (!project) {
        this.logger.warn('Project not found for GitLab project:', projectId);
        return null;
      }

      // Check if it's a discussion note (inline comment)
      const isInlineComment = note.type === 'DiffNote';
      
      // Check if replying to AI
      let isReplyToAi = false;
      let aiComment = '';
      let parentCommentId = null;

      if (note.discussion_id) {
        // Check if discussion contains AI comment
        const comments = await this.reviewService.getCommentsByReview(project.id);
        const aiParent = comments.find(
          c => c.externalCommentId.includes(note.discussion_id) && c.type === CommentType.AI_GENERATED
        );
        if (aiParent) {
          isReplyToAi = true;
          aiComment = aiParent.content;
          parentCommentId = aiParent.externalCommentId;
        }
      }

      // Get code snippet
      let codeSnippet = '';
      if (isInlineComment && note.position) {
        try {
          const api = new Gitlab({
            token: project.user.gitlabToken,
            host: this.getGitlabHost(project.repositoryUrl),
          });
          
          const fileContent = await api.RepositoryFiles.show(
            projectId,
            note.position.new_path,
            note.position.head_sha,
          );
          
          const fullContent = Buffer.from(fileContent.content, 'base64').toString('utf-8');
          const lines = fullContent.split('\n');
          const lineNum = note.position.new_line || note.position.old_line;
          const startLine = Math.max(0, lineNum - 5);
          const endLine = Math.min(lines.length, lineNum + 5);
          codeSnippet = lines.slice(startLine, endLine).join('\n');
        } catch (error) {
          this.logger.warn('Failed to fetch code snippet:', error.message);
        }
      }

      return {
        projectId: project.id,
        pullRequestId: mergeRequest.iid.toString(),
        pullRequestNumber: mergeRequest.iid,
        commentId: note.id.toString(),
        content: note.note,
        filePath: note.position?.new_path || note.position?.old_path || null,
        lineNumber: note.position?.new_line || note.position?.old_line || null,
        position: note.position,
        author: payload.user.username,
        parentCommentId,
        isReplyToAi,
        codeSnippet,
        aiComment,
        commitId: note.commit_id,
      };
    }
  }

  private async findProjectByRepository(url: string, type: ProjectType) {
    return await this.projectRepository.findOne({
      where: { repositoryUrl: url, type },
      relations: ['user'],
    });
  }

  private parseGithubUrl(url: string): [string, string] {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    return [match[1], match[2]];
  }

  private parseGitlabUrl(url: string): string {
    // Extract project ID or path from GitLab URL
    const match = url.match(/gitlab\.var-meta\.com\/(.+)/);
    if (!match) throw new Error('Invalid GitLab URL');
    return match[1];
  }

  /**
   * Format line comment body with enhanced structure
   */
  private formatLineCommentBody(comment: LineComment): string {
    const severityEmoji = {
      error: '🐛',
      warning: '⚠️',
      info: '📝',
      suggestion: '💡',
    };

    const emoji = severityEmoji[comment.severity] || '💬';
    let body = `${emoji} **${comment.severity.toUpperCase()}**: ${comment.issue}\n\n`;

    // Add code error if provided
    if (comment.codeError) {
      body += `**Problematic code:**\n\`\`\`\n${comment.codeError}\n\`\`\`\n\n`;
    }

    // Add code suggestion if provided
    if (comment.codeSuggest) {
      body += `**Suggested fix:**\n\`\`\`\n${comment.codeSuggest}\n\`\`\`\n\n`;
    }

    // Add detailed explanation from original body if different from issue
    if (comment.body && comment.body !== comment.issue && !comment.body.startsWith(emoji)) {
      body += `**Details:**\n${comment.body}`;
    }

    return body.trim();
  }

  /**
   * Generate PR-level summary for all reviewed files
   */
  private generatePRSummary(
    filesWithIssues: any[],
    filesWithoutIssues: any[],
    prData: any,
    securityIssues: any[] = [],
  ): string {
    const totalFiles = filesWithIssues.length + filesWithoutIssues.length;
    
    // Collect all comments from all files
    const allComments = filesWithIssues.reduce((acc, file) => {
      return [...acc, ...file.reviewResult.lineComments];
    }, []);

    // Group by severity
    const errors = allComments.filter(c => c.severity === 'error');
    const warnings = allComments.filter(c => c.severity === 'warning');
    const infos = allComments.filter(c => c.severity === 'info');
    const suggestions = allComments.filter(c => c.severity === 'suggestion');

    let summary = `## 🤖 AI Code Review Summary\n\n`;
    summary += `**Pull Request:** ${prData.title}\n`;
    summary += `**Files Reviewed:** ${totalFiles}\n`;
    
    // Add security scan results
    if (securityIssues.length > 0) {
      const criticalSec = securityIssues.filter(i => i.severity === 'critical').length;
      const highSec = securityIssues.filter(i => i.severity === 'high').length;
      summary += `🔒 **Security Issues:** ${securityIssues.length} `;
      if (criticalSec > 0) summary += `(${criticalSec} critical) `;
      if (highSec > 0) summary += `(${highSec} high)`;
      summary += `\n`;
    }
    summary += `\n`;

    if (allComments.length === 0 && securityIssues.length === 0) {
      // All files are clean
      summary += `### ✅ All Clear!\n\n`;
      summary += `No issues found in any of the reviewed files. Great work! 🎉\n\n`;
      
      if (filesWithoutIssues.length > 0) {
        summary += `**Clean files:**\n`;
        filesWithoutIssues.forEach(file => {
          summary += `- ✨ \`${file.filename}\` (+${file.additions} -${file.deletions})\n`;
        });
      }

      summary += `\n---\n✅ **Status:** Ready to merge`;
      return summary;
    }

    // There are issues
    summary += `### 📊 Overview\n\n`;
    summary += `**Total Issues:** ${allComments.length}\n`;
    if (errors.length > 0) summary += `- 🐛 **${errors.length}** Critical Error${errors.length > 1 ? 's' : ''}\n`;
    if (warnings.length > 0) summary += `- ⚠️ **${warnings.length}** Warning${warnings.length > 1 ? 's' : ''}\n`;
    if (infos.length > 0) summary += `- 📝 **${infos.length}** Info${infos.length > 1 ? 's' : ''}\n`;
    if (suggestions.length > 0) summary += `- 💡 **${suggestions.length}** Suggestion${suggestions.length > 1 ? 's' : ''}\n`;

    summary += `\n> 💬 **${allComments.length}** inline comment${allComments.length > 1 ? 's' : ''} added directly to specific code lines.\n\n`;

    // Files with issues
    if (filesWithIssues.length > 0) {
      summary += `### 📁 Files with Issues (${filesWithIssues.length})\n\n`;
      filesWithIssues.forEach(file => {
        const fileComments = file.reviewResult.lineComments;
        const fileErrors = fileComments.filter(c => c.severity === 'error').length;
        const fileWarnings = fileComments.filter(c => c.severity === 'warning').length;
        
        let statusIcon = '💡';
        if (fileErrors > 0) statusIcon = '🐛';
        else if (fileWarnings > 0) statusIcon = '⚠️';
        
        summary += `${statusIcon} **\`${file.filename}\`** - ${fileComments.length} issue${fileComments.length > 1 ? 's' : ''} `;
        if (fileErrors > 0) summary += `(${fileErrors} error${fileErrors > 1 ? 's' : ''})`;
        summary += `\n`;
      });
      summary += `\n`;
    }

    // Files without issues
    if (filesWithoutIssues.length > 0) {
      summary += `### ✨ Clean Files (${filesWithoutIssues.length})\n\n`;
      filesWithoutIssues.slice(0, 5).forEach(file => {
        summary += `- ✅ \`${file.filename}\`\n`;
      });
      if (filesWithoutIssues.length > 5) {
        summary += `- ... and ${filesWithoutIssues.length - 5} more\n`;
      }
      summary += `\n`;
    }

    // Priority issues
    if (errors.length > 0) {
      summary += `### 🚨 Critical Issues\n\n`;
      errors.slice(0, 5).forEach((error, idx) => {
        // Find which file this error belongs to
        const fileWithError = filesWithIssues.find(f => 
          f.reviewResult.lineComments.some(c => c === error)
        );
        summary += `${idx + 1}. **\`${fileWithError?.filename || 'unknown'}\`** (Line ${error.line}): ${error.issue}\n`;
      });
      if (errors.length > 5) {
        summary += `   ... and ${errors.length - 5} more critical error${errors.length - 5 > 1 ? 's' : ''}\n`;
      }
      summary += `\n`;
    }

    // Recommendation
    summary += `---\n\n`;
    if (errors.length > 0) {
      summary += `⛔ **Status:** Changes Requested\n\n`;
      summary += `Please address the **${errors.length}** critical error${errors.length > 1 ? 's' : ''} before merging this PR.`;
    } else if (warnings.length > 0) {
      summary += `⚠️ **Status:** Approved with Comments\n\n`;
      summary += `Consider addressing the **${warnings.length}** warning${warnings.length > 1 ? 's' : ''} to improve code quality.`;
    } else {
      summary += `✅ **Status:** Approved\n\n`;
      summary += `Looks good! The suggestions are optional improvements for best practices.`;
    }

    return summary;
  }

  /**
   * Format security scan report
   */
  private formatSecurityReport(securityIssues: any[]): string {
    let report = `## 🔒 Security Scan Report\n\n`;

    const bySeverity = {
      critical: securityIssues.filter(i => i.severity === 'critical'),
      high: securityIssues.filter(i => i.severity === 'high'),
      medium: securityIssues.filter(i => i.severity === 'medium'),
      low: securityIssues.filter(i => i.severity === 'low'),
    };

    report += `**Total Security Issues Found:** ${securityIssues.length}\n\n`;
    
    if (bySeverity.critical.length > 0) {
      report += `### 🔴 Critical Issues (${bySeverity.critical.length})\n\n`;
      bySeverity.critical.forEach((issue, idx) => {
        report += `${idx + 1}. **${issue.title}**\n`;
        report += `   - **File:** \`${issue.file}\` (Line ${issue.line})\n`;
        report += `   - **Type:** ${issue.type}\n`;
        report += `   - **Description:** ${issue.description}\n`;
        report += `   - **Recommendation:** ${issue.recommendation}\n`;
        if (issue.cwe) report += `   - **CWE:** ${issue.cwe}\n`;
        report += `\n`;
      });
    }

    if (bySeverity.high.length > 0) {
      report += `### 🟠 High Severity Issues (${bySeverity.high.length})\n\n`;
      bySeverity.high.slice(0, 5).forEach((issue, idx) => {
        report += `${idx + 1}. **${issue.title}** in \`${issue.file}:${issue.line}\`\n`;
        report += `   ${issue.description}\n\n`;
      });
      if (bySeverity.high.length > 5) {
        report += `   ... and ${bySeverity.high.length - 5} more high severity issues\n\n`;
      }
    }

    if (bySeverity.medium.length > 0 || bySeverity.low.length > 0) {
      report += `### 📊 Other Issues\n\n`;
      report += `- 🟡 Medium: ${bySeverity.medium.length}\n`;
      report += `- 🟢 Low: ${bySeverity.low.length}\n\n`;
    }

    report += `---\n\n`;
    report += `⚠️ **Action Required:** Please review and address security issues before merging.\n\n`;
    report += `🔗 For more information about CWE (Common Weakness Enumeration), visit: https://cwe.mitre.org/\n`;

    return report;
  }

  /**
   * Generate smart summary based on review results (per file - not used anymore)
   */
  private generateSmartSummary(
    fileName: string,
    reviewResult: any,
    additions: number,
    deletions: number,
  ): string {
    const comments = reviewResult.lineComments || [];

    if (comments.length === 0) {
      return `## ✅ Code Review: \`${fileName}\`\n\n${reviewResult.summary}\n\n**Analysis:** ✨ No issues found. Code looks good!\n\n${reviewResult.overallFeedback}`;
    }

    // Group comments by severity
    const errors = comments.filter(c => c.severity === 'error');
    const warnings = comments.filter(c => c.severity === 'warning');
    const infos = comments.filter(c => c.severity === 'info');
    const suggestions = comments.filter(c => c.severity === 'suggestion');

    let summary = `## 🤖 Code Review: \`${fileName}\`\n\n`;
    summary += `**Changes:** +${additions} -${deletions}\n\n`;
    summary += `### 📊 Summary\n${reviewResult.summary}\n\n`;

    // Statistics
    summary += `### 📈 Issues Found: ${comments.length}\n\n`;
    if (errors.length > 0) summary += `- 🐛 **${errors.length}** Critical Error${errors.length > 1 ? 's' : ''}\n`;
    if (warnings.length > 0) summary += `- ⚠️ **${warnings.length}** Warning${warnings.length > 1 ? 's' : ''}\n`;
    if (infos.length > 0) summary += `- 📝 **${infos.length}** Info${infos.length > 1 ? 's' : ''}\n`;
    if (suggestions.length > 0) summary += `- 💡 **${suggestions.length}** Suggestion${suggestions.length > 1 ? 's' : ''}\n`;

    summary += `\n> 💬 **${comments.length}** inline comment${comments.length > 1 ? 's' : ''} added to specific lines.\n\n`;

    // Priority actions
    if (errors.length > 0) {
      summary += `### 🚨 Priority Actions\n`;
      errors.slice(0, 3).forEach((error, idx) => {
        summary += `${idx + 1}. Line ${error.line}: ${error.issue}\n`;
      });
      if (errors.length > 3) {
        summary += `   ... and ${errors.length - 3} more error${errors.length - 3 > 1 ? 's' : ''}\n`;
      }
      summary += `\n`;
    }

    // Overall feedback
    summary += `### 💭 Overall Feedback\n${reviewResult.overallFeedback}\n\n`;

    // Recommendation
    if (errors.length > 0) {
      summary += `---\n⛔ **Recommendation:** Please address critical errors before merging.`;
    } else if (warnings.length > 0) {
      summary += `---\n⚠️ **Recommendation:** Consider addressing warnings to improve code quality.`;
    } else {
      summary += `---\n✅ **Recommendation:** Looks good! Consider the suggestions for best practices.`;
    }

    return summary;
  }

  /**
   * Get GitLab host from repository URL
   * Auto-detects self-hosted vs gitlab.com
   * 
   * Examples:
   * - https://gitlab.com/user/repo -> undefined (default)
   * - https://gitlab.var-meta.com/user/repo -> https://gitlab.var-meta.com
   * - https://git.company.com/user/repo -> https://git.company.com
   * - https://gitlab.company.com:8080/user/repo -> https://gitlab.company.com:8080
   */
  private getGitlabHost(repositoryUrl: string): string | undefined {
    try {
      const url = new URL(repositoryUrl);
      const hostname = url.hostname;
      
      // If it's gitlab.com, return undefined (use default)
      if (hostname === 'gitlab.com') {
        this.logger.debug('Using default GitLab host (gitlab.com)');
        return undefined;
      }
      
      // For self-hosted GitLab, return the full base URL
      const host = `${url.protocol}//${hostname}${url.port ? ':' + url.port : ''}`;
      this.logger.log(`Detected self-hosted GitLab: ${host}`);
      return host;
    } catch (error) {
      this.logger.warn(`Failed to parse GitLab URL: ${repositoryUrl}`, error);
      return undefined;
    }
  }
}
