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
  ) {}

  async handlePullRequestEvent(payload: any, source: 'github' | 'gitlab') {
    try {
      const prData = this.extractPullRequestData(payload, source);

      console.log(prData);
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

      // Trigger AI review
      await this.performAiReview(review.id, project, prData);
    } catch (error) {
      this.logger.error('Error handling pull request event:', error);
    }
  }

  async handleCommentEvent(payload: any, source: 'github' | 'gitlab') {
    try {
      const commentData = this.extractCommentData(payload, source);

      // Tìm review tương ứng
      const reviews = await this.reviewService.findReviewsByProject(
        commentData.projectId,
      );
      const review = reviews.find(
        (r) => r.pullRequestId === commentData.pullRequestId,
      );

      if (!review) {
        this.logger.log('Review not found for comment');
        return;
      }

      // Lưu comment
      await this.reviewService.createComment({
        reviewId: review.id,
        externalCommentId: commentData.commentId,
        type: CommentType.USER_FEEDBACK,
        content: commentData.content,
        filePath: commentData.filePath,
        lineNumber: commentData.lineNumber,
        author: commentData.author,
        parentCommentId: commentData.parentCommentId,
      });

      // Nếu comment reply AI comment, thì train lại
      if (commentData.isReplyToAi) {
        await this.trainingService.processUserFeedback(
          review.projectId,
          commentData.content,
          commentData.codeSnippet,
          commentData.aiComment,
        );
      }

      // Generate AI reply nếu cần
      const project = await this.projectRepository.findOne({
        where: { id: review.projectId },
        relations: ['user'],
      });

      if (project && commentData.isReplyToAi) {
        const aiReply = await this.aiService.generateReply(
          commentData.content,
          {
            businessContext: project.businessContext,
            reviewRules: project.reviewRules,
            codeSnippet: commentData.codeSnippet,
            fileName: commentData.filePath,
          },
        );

        // Post reply
        await this.postComment(
          project,
          commentData.pullRequestId,
          aiReply,
          commentData.filePath,
          commentData.lineNumber,
          source,
        );

        // Save AI reply
        await this.reviewService.createComment({
          reviewId: review.id,
          externalCommentId: `ai-reply-${Date.now()}`,
          type: CommentType.AI_REPLY,
          content: aiReply,
          filePath: commentData.filePath,
          lineNumber: commentData.lineNumber,
          parentCommentId: commentData.commentId,
        });
      }
    } catch (error) {
      this.logger.error('Error handling comment event:', error);
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
      const fileContents = await this.fetchFileContents(project, prData);

      const allComments = [];
      let totalLineComments = 0;
      const filesWithIssues = [];
      const filesWithoutIssues = [];

      for (const file of fileContents) {
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

      // Save analysis
      await this.reviewService.saveReviewAnalysis(reviewId, {
        totalComments: allComments.length,
        totalLineComments,
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
      host: !project.repositoryUrl.includes('gitlab.com') ? 'https://gitlab.var-meta.com' : undefined,
      token: project.user.gitlabToken,
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

        // Create review comment on specific line
        await octokit.pulls.createReviewComment({
          owner,
          repo,
          pull_number: parseInt(pullRequestId),
          body: lineComment.body,
          path: lineComment.path,
          line: lineComment.line,
          side: lineComment.side || 'RIGHT',
          commit_id: commitSha,
        });

        this.logger.log(`✅ Posted line comment on ${lineComment.path}:${lineComment.line}`);
      } else if (source === 'gitlab') {
        const api = new Gitlab({
          token: project.user.gitlabToken,
          host: !project.repositoryUrl.includes('gitlab.com') ? 'https://gitlab.var-meta.com' : undefined,
        });

        const projectId = this.parseGitlabUrl(project.repositoryUrl);

        // GitLab uses discussions API for line comments
        await api.MergeRequestDiscussions.create(
          projectId,
          parseInt(pullRequestId),
          lineComment.body,
          {
            position: {
              base_sha: commitSha,
              start_sha: commitSha,
              head_sha: commitSha,
              position_type: 'text',
              new_path: lineComment.path,
              new_line: lineComment.line,
              old_path: lineComment.path,
              old_line: lineComment.side === 'LEFT' ? lineComment.line : null,
            },
          },
        );

        this.logger.log(`Posted line comment on ${lineComment.path}:${lineComment.line}`);
      }
    } catch (error) {
      this.logger.error(`Failed to post line comment on ${lineComment.path}:${lineComment.line}:`, error);
      
      // Fallback: post as general comment if line comment fails
      await this.postComment(
        project,
        pullRequestId,
        `**${lineComment.path}:${lineComment.line}**\n\n${lineComment.body}`,
        lineComment.path,
        null,
        source,
        commitSha,
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
          host: !project.repositoryUrl.includes('gitlab.com') ? 'https://gitlab.var-meta.com' : undefined,
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
        commitSha: payload.object_attributes.last_commit?.id,
        baseSha: payload.object_attributes.target_branch,
        projectId: payload.project.id,
        filesChanged: [],
      };
    }
  }

  private extractCommentData(payload: any, source: 'github' | 'gitlab') {
    // TODO: Implement comment data extraction
    return {
      projectId: '',
      pullRequestId: '',
      commentId: '',
      content: '',
      filePath: '',
      lineNumber: null,
      author: '',
      parentCommentId: null,
      isReplyToAi: false,
      codeSnippet: '',
      aiComment: '',
    };
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
    summary += `**Files Reviewed:** ${totalFiles}\n\n`;

    if (allComments.length === 0) {
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
}
