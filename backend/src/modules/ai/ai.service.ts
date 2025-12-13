import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TrainingData,
  TrainingDataType,
} from '../training/training-data.entity';
import type OpenRouter from '@openrouter/sdk';
import { dynamicImport } from '../../utils';

export interface CodeReviewContext {
  businessContext?: string;
  reviewRules?: Record<string, any>;
  codeSnippet: string;
  fileName: string;
  pullRequestTitle?: string;
  pullRequestDescription?: string;
  fileStatus?: string;
  additions?: number;
  deletions?: number;
}

export interface LineComment {
  path: string;
  line: number;
  side: 'RIGHT' | 'LEFT';
  body: string;
  startLine?: number;
  severity: 'error' | 'warning' | 'info' | 'suggestion';
  issue: string;
  codeError?: string;
  codeSuggest?: string;
}

export interface ReviewResult {
  summary: string;
  lineComments: LineComment[];
  overallFeedback: string;
}

interface TrainingExample {
  codeSnippet: string;
  aiComment: string;
  userFeedback?: string;
  correctedComment?: string;
}

@Injectable()
export class AiService {
  private openaiApiKey: string;
  private anthropicApiKey: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(TrainingData)
    private trainingDataRepository: Repository<TrainingData>,
  ) {
    this.openaiApiKey = this.configService.get('OPENAI_API_KEY');
  }
  async reviewCode(context: CodeReviewContext): Promise<string[]> {
    const {
      businessContext,
      reviewRules,
      codeSnippet,
      fileName,
      fileStatus,
      additions,
      deletions,
    } = context;

    // Lấy training data liên quan
    const trainingExamples = await this.getRelevantTrainingData(
      context.pullRequestTitle || '',
    );

    const systemPrompt = this.buildSystemPrompt(
      businessContext,
      reviewRules,
      trainingExamples,
    );

    // Build context about the change
    let changeContext = '';
    if (fileStatus === 'added') {
      changeContext = 'This is a NEW file being added.';
    } else if (fileStatus === 'modified') {
      changeContext = `This file is being MODIFIED (${additions || 0} additions, ${deletions || 0} deletions).`;
    } else if (fileStatus === 'renamed') {
      changeContext = 'This file is being RENAMED.';
    }

    // Detect if this is a diff/patch format
    const isDiff = codeSnippet.includes('@@') && (codeSnippet.includes('+++') || codeSnippet.includes('---'));

    const userPrompt = `
Review the following code changes from file: **${fileName}**

${changeContext}

${isDiff ? '**Git Diff:**' : '**Full File Content:**'}
\`\`\`diff
${codeSnippet}
\`\`\`

${context.pullRequestTitle ? `**PR Title:** ${context.pullRequestTitle}` : ''}
${context.pullRequestDescription ? `**PR Description:** ${context.pullRequestDescription}` : ''}

**Requirements:**
1. Focus on the CHANGED LINES (lines starting with + in diff)
2. Check technical correctness and logic
3. Verify against business context if provided
4. Identify potential bugs, security issues, and code smells
5. Suggest specific, actionable improvements
6. Be concise and clear

**Format:** Each issue on a separate line with appropriate emoji:
🐛 Bugs or logic errors
⚠️ Warnings or code smells  
💡 Suggestions for improvement
🔒 Security issues
📝 Business logic concerns
✨ Best practice recommendations

**Important:** 
- Only comment on ACTUAL issues, don't create generic comments
- Be specific about line numbers and code snippets when possible
- If the code looks good, say "✅ Code looks good, no issues found"
`;

    // Gọi AI API
    const comments = await this.callAiApi(systemPrompt, userPrompt);

    return comments;
  }

  /**
   * Review code and generate inline comments for specific lines
   * Similar to RabbitCode AI - comments directly on changed lines
   */
  async reviewCodeWithLineComments(context: CodeReviewContext): Promise<ReviewResult> {
    const {
      businessContext,
      reviewRules,
      codeSnippet,
      fileName,
      fileStatus,
      additions,
      deletions,
    } = context;

    // Lấy training data liên quan
    const trainingExamples = await this.getRelevantTrainingData(
      context.pullRequestTitle || '',
    );

    const systemPrompt = this.buildLineCommentSystemPrompt(
      businessContext,
      reviewRules,
      trainingExamples,
    );

    // Parse diff to extract line numbers
    const diffInfo = this.parseDiff(codeSnippet);

    // Build list of changed lines for AI reference
    const changedLinesInfo = diffInfo.chunks.map(chunk => {
      const added = chunk.lines.filter(l => l.type === 'add').map(l => l.lineNumber);
      const deleted = chunk.lines.filter(l => l.type === 'delete').map(l => l.lineNumber);
      return {
        start: chunk.newStart,
        addedLines: added,
        deletedLines: deleted,
      };
    });

    const userPrompt = `
Review the following code changes from file: **${fileName}**

**File Status:** ${fileStatus || 'modified'}
**Changes:** +${additions || 0} -${deletions || 0}

**IMPORTANT - Line Numbers:**
The diff shows changes in these ranges:
${changedLinesInfo.map(info => `- Lines ${info.start}+: Added lines: [${info.addedLines.join(', ')}]`).join('\n')}

When you comment on a line:
- Use "side": "RIGHT" for NEW code (lines with +)
- Use "side": "LEFT" for OLD code (lines with -)
- The line number must be the EXACT line number from the new file (after changes)

**Git Diff:**
\`\`\`diff
${codeSnippet}
\`\`\`

${context.pullRequestTitle ? `**PR Title:** ${context.pullRequestTitle}` : ''}
${context.pullRequestDescription ? `**PR Description:** ${context.pullRequestDescription}` : ''}

**Your task:**
1. Analyze each changed line (lines starting with + or -)
2. For each issue found, provide:
   - The EXACT line number where the issue occurs
   - Whether it's on the RIGHT (new code, +) or LEFT (old code, -) side
   - The severity level: error, warning, info, or suggestion
   - Description of the issue
   - The problematic code snippet (codeError)
   - Suggested fix or improvement (codeSuggest)
   - Complete comment body with emoji prefix

**Response format (JSON):**
{
  "summary": "Brief overview of the review (1-2 sentences)",
  "lineComments": [
    {
      "line": <line_number>,
      "side": "RIGHT" or "LEFT",
      "severity": "error" | "warning" | "info" | "suggestion",
      "issue": "Clear description of the problem",
      "codeError": "The problematic code snippet",
      "codeSuggest": "Suggested code fix or improvement",
      "body": "Full comment with emoji prefix (🐛/⚠️/💡/🔒/📝/✨)"
    }
  ],
  "overallFeedback": "General feedback about the entire change"
}

**Severity Levels:**
- error: Critical bugs, security vulnerabilities, logic errors
- warning: Code smells, potential issues, deprecated APIs
- info: Business logic concerns, documentation needs
- suggestion: Best practices, performance improvements, style improvements

**Important:**
- Only comment on REAL issues, not generic observations
- Be precise with line numbers from the diff
- Focus on changed lines (+ for RIGHT side)
- If code is good, return empty lineComments array
- Provide specific codeError and codeSuggest when applicable
- Use appropriate emoji: 🐛 error, ⚠️ warning, 📝 info, 💡 suggestion, 🔒 security, ✨ best practices
`;

    const response = await this.callAiApiForStructuredReview(systemPrompt, userPrompt);

    // Validate line numbers against actual diff
    const validLineNumbers = new Set([...diffInfo.addedLines, ...diffInfo.deletedLines]);
    
    console.log('Diff info - Added lines:', diffInfo.addedLines);
    console.log('Diff info - Deleted lines:', diffInfo.deletedLines);
    console.log('AI returned line comments:', response.lineComments.map(c => ({ line: c.line, side: c.side })));

    // Filter and validate line comments
    response.lineComments = response.lineComments
      .map(comment => ({
        ...comment,
        path: fileName,
      }))
      .filter(comment => {
        // For RIGHT side (new code), check if line is in added lines
        if (comment.side === 'RIGHT' && !diffInfo.addedLines.includes(comment.line)) {
          console.warn(`Skipping comment on line ${comment.line} - not in added lines`);
          return false;
        }
        // For LEFT side (old code), check if line is in deleted lines  
        if (comment.side === 'LEFT' && !diffInfo.deletedLines.includes(comment.line)) {
          console.warn(`Skipping comment on line ${comment.line} - not in deleted lines`);
          return false;
        }
        return true;
      });

    console.log('Validated line comments:', response.lineComments.length);

    return response;
  }

  /**
   * Parse git diff to extract line information
   */
  private parseDiff(diff: string): { addedLines: number[], deletedLines: number[], chunks: any[] } {
    const addedLines: number[] = [];
    const deletedLines: number[] = [];
    const chunks: any[] = [];

    const lines = diff.split('\n');
    let currentLine = 0;
    let currentChunk: any = null;

    for (const line of lines) {
      // Parse chunk header (e.g., @@ -1,5 +1,6 @@)
      const chunkMatch = line.match(/^@@\s+-(\d+),?(\d*)\s+\+(\d+),?(\d*)\s+@@/);
      if (chunkMatch) {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = {
          oldStart: parseInt(chunkMatch[1]),
          oldLines: parseInt(chunkMatch[2] || '1'),
          newStart: parseInt(chunkMatch[3]),
          newLines: parseInt(chunkMatch[4] || '1'),
          lines: []
        };
        currentLine = currentChunk.newStart;
        continue;
      }

      if (currentChunk) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          addedLines.push(currentLine);
          currentChunk.lines.push({ type: 'add', lineNumber: currentLine, content: line.substring(1) });
          currentLine++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          deletedLines.push(currentLine);
          currentChunk.lines.push({ type: 'delete', lineNumber: currentLine, content: line.substring(1) });
        } else if (line.startsWith(' ')) {
          currentChunk.lines.push({ type: 'context', lineNumber: currentLine, content: line.substring(1) });
          currentLine++;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return { addedLines, deletedLines, chunks };
  }
  private buildSystemPrompt(
    businessContext?: string,
    reviewRules?: Record<string, any>,
    trainingExamples?: TrainingExample[],
  ): string {
    let prompt = `You are a professional AI Code Reviewer. Your task is to review code thoroughly, accurately, and helpfully.

**Your expertise includes:**
- Identifying bugs, security vulnerabilities, and performance issues
- Suggesting best practices and design patterns
- Checking code quality, readability, and maintainability
- Understanding business logic and context

**Review principles:**
- Be constructive and specific
- Focus on important issues, not nitpicking
- Provide actionable suggestions with examples
- Consider the context and purpose of the code
- Balance thoroughness with practicality

`;

    if (businessContext) {
      prompt += `**BUSINESS CONTEXT:**
${businessContext}

Please ensure code changes align with this business context.

`;
    }

    if (reviewRules) {
      prompt += `**PROJECT-SPECIFIC REVIEW RULES:**
${JSON.stringify(reviewRules, null, 2)}

These are custom rules for this project. Pay special attention to these.

`;
    }

    if (trainingExamples && trainingExamples.length > 0) {
      prompt += `**LEARNING FROM PREVIOUS REVIEWS:**
Here are examples of good reviews from this project:

`;
      trainingExamples.slice(0, 5).forEach((example, index) => {
        prompt += `
Example ${index + 1}:
Code: ${example.codeSnippet.substring(0, 200)}...
AI Comment: ${example.aiComment}
`;
        if (example.correctedComment) {
          prompt += `User Correction: ${example.correctedComment}
`;
        }
      });
      prompt += `
Learn from these examples to provide better reviews for this project.
`;
    }

    return prompt;
  }

  private buildLineCommentSystemPrompt(
    businessContext?: string,
    reviewRules?: Record<string, any>,
    trainingExamples?: TrainingExample[],
  ): string {
    let prompt = `You are RabbitCode AI - an expert code reviewer that provides inline comments on specific lines of code.

**Your capabilities:**
- Deep analysis of code changes line-by-line
- Identifying bugs, security issues, performance problems, and code smells
- Providing precise, actionable feedback with exact line numbers
- Understanding context from git diffs and pull request information
- Suggesting improvements with clear explanations

**Review approach (like RabbitCode AI):**
1. Analyze the diff to understand what changed
2. Focus on NEW code (lines with +) in the RIGHT side
3. Check OLD code (lines with -) in the LEFT side when relevant
4. Comment directly on specific lines where issues are found
5. Provide severity levels: error, warning, info, suggestion
6. Be concise but thorough in explanations

**Comment quality standards:**
- ONLY comment on real issues - no generic observations
- Be specific about the problem and solution
- Include code examples when helpful
- Consider the broader context of the change
- Use appropriate emojis: 🐛 bugs, ⚠️ warnings, 💡 suggestions, 🔒 security, 📝 business, ✨ best practices

**Response format:**
- Return valid JSON with summary, lineComments array, and overallFeedback
- Each lineComment must have: line, side, severity, body
- Line numbers must match the diff exactly
- If no issues found, return empty lineComments array

`;

    if (businessContext) {
      prompt += `**BUSINESS CONTEXT:**
${businessContext}

Ensure code changes align with business requirements.

`;
    }

    if (reviewRules) {
      prompt += `**PROJECT RULES:**
${JSON.stringify(reviewRules, null, 2)}

Apply these custom rules strictly.

`;
    }

    if (trainingExamples && trainingExamples.length > 0) {
      prompt += `**LEARNING EXAMPLES:**
`;
      trainingExamples.slice(0, 3).forEach((example, index) => {
        prompt += `
Example ${index + 1}:
Code: ${example.codeSnippet.substring(0, 150)}...
Good Comment: ${example.aiComment}
`;
        if (example.correctedComment) {
          prompt += `Correction: ${example.correctedComment}\n`;
        }
      });
    }

    return prompt;
  }

  private async getRelevantTrainingData(
    context: string,
  ): Promise<TrainingExample[]> {
    // Lấy training data có positive feedback hoặc corrections
    const trainingData = await this.trainingDataRepository.find({
      where: [
        { type: TrainingDataType.POSITIVE },
        { type: TrainingDataType.CORRECTION },
      ],
      order: { useCount: 'DESC', createdAt: 'DESC' },
      take: 10,
    });

    return trainingData.map((data) => ({
      codeSnippet: data.codeSnippet,
      aiComment: data.aiComment,
      userFeedback: data.userFeedback,
      correctedComment: data.correctedComment,
    }));
  }

  private async callAiApi(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string[]> {
    // TODO: Implement thật với OpenAI hoặc Anthropic
    // Đây là mock response

    try {
      const openRouterModule = await dynamicImport<typeof OpenRouter>('@openrouter/sdk');

      const openRouter = new openRouterModule.OpenRouter({
        apiKey: this.configService.get('OPENROUTER_API_KEY'),

      });

      const completion = await openRouter.chat.send({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        stream: false,
      });

      const response = completion.choices[0].message.content;
      console.log('AI API response:', response);

      // Split response into multiple comments if needed
      const comments = (response as string)
        .split('\n')
        .filter(line => line.trim().length > 0)
        .filter(line => {
          // Only keep lines that start with emoji or are continuations
          const emojiPattern = /^[\u{1F300}-\u{1F9FF}]|^[⚠️🐛💡🔒📝✨✅]/u;
          return emojiPattern.test(line.trim());
        });

      return comments.length > 0 ? comments : [response as string];
    } catch (error) {
      console.error('AI API call failed:', error);
      return ['⚠️ Unable to analyze code at this time. Please try again later.'];
    }
  }

  /**
   * Call AI API for structured review with line comments (RabbitCode AI style)
   */
  private async callAiApiForStructuredReview(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<ReviewResult> {
    try {
      const openRouterModule = await dynamicImport<typeof OpenRouter>('@openrouter/sdk');

      const openRouter = new openRouterModule.OpenRouter({
        apiKey: this.configService.get('OPENROUTER_API_KEY'),
      });

      const completion = await openRouter.chat.send({
        model: "gpt-4o-mini", // or "anthropic/claude-3-sonnet" for better code understanding
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent structured output
        stream: false,
        responseFormat: {
          type: 'json_schema',
          jsonSchema: {
            name: 'ReviewResult',
            schema: {
              type: 'object',
              properties: {
                summary: { type: 'string', description: 'Brief overview of the review' },
                lineComments: {
                  type: 'array',
                  description: 'Array of inline comments for specific lines',
                  items: {
                    type: 'object',
                    properties: {
                      line: { type: 'number', description: 'Line number in the file' },
                      side: { type: 'string', enum: ['RIGHT', 'LEFT'], description: 'RIGHT for new code, LEFT for old code' },
                      severity: { type: 'string', enum: ['error', 'warning', 'info', 'suggestion'], description: 'Issue severity level' },
                      issue: { type: 'string', description: 'Description of the issue found' },
                      codeError: { type: 'string', description: 'The problematic code snippet' },
                      codeSuggest: { type: 'string', description: 'Suggested code fix or improvement' },
                      body: { type: 'string', description: 'Full comment body with emoji prefix' }
                    },
                    required: ['line', 'side', 'severity', 'issue', 'body'],
                    additionalProperties: false
                  }
                },
                overallFeedback: { type: 'string', description: 'General feedback about the entire change' },
              },
              required: ['summary', 'lineComments', 'overallFeedback'],
              additionalProperties: false
            },
          }
        }
      });

      const response = completion.choices[0].message.content as string;
      console.log('AI Structured Review response:', response);

      // Parse JSON response
      const reviewResult = JSON.parse(response) as ReviewResult;

      // Validate and sanitize the response
      if (!reviewResult.lineComments) {
        reviewResult.lineComments = [];
      }

      // Ensure each comment has required fields
      reviewResult.lineComments = reviewResult.lineComments
        .filter(comment => comment.line && comment.body && comment.issue)
        .map(comment => ({
          ...comment,
          side: comment.side || 'RIGHT',
          severity: comment.severity || 'info',
          issue: comment.issue,
          codeError: comment.codeError || '',
          codeSuggest: comment.codeSuggest || '',
        }));

      return {
        summary: reviewResult.summary || '✅ Code review completed',
        lineComments: reviewResult.lineComments,
        overallFeedback: reviewResult.overallFeedback || 'No additional feedback',
      };
    } catch (error) {
      console.error('AI Structured Review API call failed:', error);

      // Return safe fallback
      return {
        summary: '⚠️ Unable to complete detailed review at this time',
        lineComments: [],
        overallFeedback: 'Please try again later or review manually.',
      };
    }
  }

  async generateReply(
    userComment: string,
    context: CodeReviewContext,
  ): Promise<string> {
    const systemPrompt = `You are an AI Code Reviewer assistant. Reply to user comments professionally, helpfully, and respectfully.

Guidelines:
- Be humble and open to feedback
- Provide clear explanations when asked
- Acknowledge if you made a mistake
- Offer alternative solutions when appropriate
- Keep responses concise but thorough`;

    const userPrompt = `
**User's comment:** ${userComment}

**Code context:**
File: ${context.fileName}
\`\`\`
${context.codeSnippet}
\`\`\`

Provide an appropriate response. If the user is correcting you or providing feedback, acknowledge it and learn from it. If they're asking for clarification, explain clearly.
`;

    const replies = await this.callAiApi(systemPrompt, userPrompt);
    return replies.join('\n');
  }
}
