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
import { TokenUsageService } from '../review/token-usage.service';

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
  projectId?: string;
  reviewId?: string;
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
    private tokenUsageService: TokenUsageService,
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
    const comments = await this.callAiApi(
      systemPrompt,
      userPrompt,
      context.projectId,
      context.reviewId,
      fileName,
    );

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

    // Build detailed mapping of line numbers to code content for AI
    const lineMapping = diffInfo.chunks.flatMap(chunk => {
      return chunk.lines
        .filter(l => l.type === 'add')
        .map(l => ({
          lineNumber: l.lineNumber,
          code: l.content,  // Keep full content including whitespace
          type: 'added'
        }));
    });

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

**CRITICAL - Line Number Mapping:**
Below is the EXACT mapping of line numbers to code in the NEW file (after changes).
You MUST use these EXACT line numbers when commenting:

${lineMapping.length > 0 ? lineMapping.map(m => {
  const displayCode = m.code.length > 100 ? m.code.substring(0, 100) + '...' : m.code;
  return `Line ${m.lineNumber}: ${displayCode}`;
}).join('\n') : 'No added lines found in the diff'}

**IMPORTANT Rules:**
- ONLY comment on lines that appear in the mapping above
- Use the EXACT line number from the mapping
- Always use "side": "RIGHT" (for new/added code)
- If a line number is NOT in the mapping above, DO NOT comment on it

**Git Diff:**
\`\`\`diff
${codeSnippet}
\`\`\`

${context.pullRequestTitle ? `**PR Title:** ${context.pullRequestTitle}` : ''}
${context.pullRequestDescription ? `**PR Description:** ${context.pullRequestDescription}` : ''}

**Your task:**
1. Review the code content shown in the "Line Number Mapping" section above
2. For each issue found, provide:
   - The EXACT line number from the mapping (e.g., if you see "Line 42: const user = await..." and find an issue, use line: 42)
   - side must ALWAYS be "RIGHT"
   - The severity level: error, warning, info, or suggestion
   - Description of the issue
   - The problematic code snippet (codeError) - copy from the mapping
   - Suggested fix or improvement (codeSuggest)
   - Complete comment body with emoji prefix

**CRITICAL REMINDER:**
- You can ONLY comment on line numbers that exist in the "Line Number Mapping" section
- Use the EXACT line numbers shown in that mapping
- Do NOT guess or calculate line numbers yourself
- Do NOT comment on lines not listed in the mapping

**Response format (JSON):**
{
  "summary": "Brief overview of the review (1-2 sentences)",
  "lineComments": [
    {
      "line": <exact_line_number_from_mapping>,
      "side": "RIGHT",
      "severity": "error" | "warning" | "info" | "suggestion",
      "issue": "Clear description of the problem",
      "codeError": "The problematic code snippet",
      "codeSuggest": "Suggested code fix or improvement",
      "body": "Full comment with emoji prefix (🐛/⚠️/💡/🔒/📝/✨)"
    }
  ],
  "overallFeedback": "General feedback about the entire change"
}

**Example:**
If the mapping shows:
  Line 42: const user = await userService.findById(id);
  Line 43: return user.data;

And you find an issue on line 43, your response should be:
{
  "lineComments": [
    {
      "line": 43,
      "side": "RIGHT",
      "severity": "error",
      "issue": "Potential null pointer - user.data might be undefined",
      "codeError": "return user.data;",
      "codeSuggest": "return user?.data ?? null;",
      "body": "🐛 Error: Potential null pointer - user.data might be undefined. Consider using optional chaining."
    }
  ]
}

**Severity Levels:**
- error: Critical bugs, security vulnerabilities, logic errors
- warning: Code smells, potential issues, deprecated APIs
- info: Business logic concerns, documentation needs
- suggestion: Best practices, performance improvements, style improvements

**Important:**
- Only comment on REAL issues, not generic observations
- Be precise with line numbers from the diff (use line numbers from NEW file)
- **ONLY comment on ADDED lines (lines with + prefix, RIGHT side)**
- side must always be "RIGHT"
- If code is good, return empty lineComments array
- Provide specific codeError and codeSuggest when applicable
- Use appropriate emoji: 🐛 error, ⚠️ warning, 📝 info, 💡 suggestion, 🔒 security, ✨ best practices
`;

    const response = await this.callAiApiForStructuredReview(
      systemPrompt,
      userPrompt,
      context.projectId,
      context.reviewId,
      fileName,
    );

    // Validate line numbers against actual diff
    const validLineNumbersSet = new Set(diffInfo.addedLines);
    const originalCommentCount = response.lineComments.length;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Diff Analysis for:', fileName);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Added lines (RIGHT side):', diffInfo.addedLines.length, 'lines');
    console.log('   Valid line numbers:', diffInfo.addedLines.slice(0, 20).join(', '), diffInfo.addedLines.length > 20 ? '...' : '');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 AI returned', originalCommentCount, 'line comments:');
    response.lineComments.forEach((c, idx) => {
      const isValid = validLineNumbersSet.has(c.line);
      console.log(`   ${idx + 1}. Line ${c.line} (${c.side}) ${isValid ? '✓' : '✗ INVALID'} - ${c.issue?.substring(0, 50)}...`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Filter and validate line comments
    // GitHub API only supports commenting on RIGHT side (new/added lines) reliably
    response.lineComments = response.lineComments
      .map(comment => ({
        ...comment,
        path: fileName,
        side: 'RIGHT' as 'RIGHT' | 'LEFT', // Force RIGHT side for GitHub API compatibility
      }))
      .filter(comment => {
        // Only allow comments on added lines (RIGHT side)
        if (!validLineNumbersSet.has(comment.line)) {
          console.warn(`❌ REJECTED: Comment on line ${comment.line} - not in valid added lines`);
          console.warn(`   Issue: ${comment.issue}`);
          console.warn(`   Hint: Valid lines are: [${Array.from(validLineNumbersSet).slice(0, 10).join(', ')}...]`);
          return false;
        }
        console.log(`✅ ACCEPTED: Comment on line ${comment.line} - "${comment.issue?.substring(0, 60)}..."`);
        return true;
      });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📝 Final result: ${response.lineComments.length}/${originalCommentCount} comments validated successfully`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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
    let newLineNumber = 0;  // Line number in new file (RIGHT side)
    let oldLineNumber = 0;  // Line number in old file (LEFT side)
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
        oldLineNumber = currentChunk.oldStart;
        newLineNumber = currentChunk.newStart;
        continue;
      }

      if (currentChunk) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          // Added line - only exists in new file (RIGHT side)
          addedLines.push(newLineNumber);
          currentChunk.lines.push({ type: 'add', lineNumber: newLineNumber, content: line.substring(1) });
          newLineNumber++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          // Deleted line - only exists in old file (LEFT side)
          deletedLines.push(oldLineNumber);
          currentChunk.lines.push({ type: 'delete', lineNumber: oldLineNumber, content: line.substring(1) });
          oldLineNumber++;
        } else if (line.startsWith(' ')) {
          // Context line - exists in both old and new files
          currentChunk.lines.push({ type: 'context', newLine: newLineNumber, oldLine: oldLineNumber, content: line.substring(1) });
          newLineNumber++;
          oldLineNumber++;
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
    projectId?: string,
    reviewId?: string,
    fileName?: string,
  ): Promise<string[]> {
    // TODO: Implement thật với OpenAI hoặc Anthropic
    // Đây là mock response

    try {
      const openRouterModule = await dynamicImport<typeof OpenRouter>('@openrouter/sdk');

      const openRouter = new openRouterModule.OpenRouter({
        apiKey: this.configService.get('OPENROUTER_API_KEY'),

      });

      const model = "gpt-4o-mini";
      const completion = await openRouter.chat.send({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        stream: false,
      });

      const response = completion.choices[0].message.content;
      console.log('AI API response:', response);

      // Track token usage
      if (projectId && completion.usage) {
        await this.tokenUsageService.trackUsage({
          projectId,
          reviewId,
          model,
          promptTokens: completion.usage.promptTokens || 0,
          completionTokens: completion.usage.completionTokens || 0,
          operation: 'code_review',
          fileName,
        }).catch(err => console.error('Failed to track token usage:', err));
      }

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
    projectId?: string,
    reviewId?: string,
    fileName?: string,
  ): Promise<ReviewResult> {
    try {
      const openRouterModule = await dynamicImport<typeof OpenRouter>('@openrouter/sdk');

      const openRouter = new openRouterModule.OpenRouter({
        apiKey: this.configService.get('OPENROUTER_API_KEY'),
      });

      const model = "gpt-4o-mini"; // or "anthropic/claude-3-sonnet" for better code understanding
      const completion = await openRouter.chat.send({
        model,
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

      // Track token usage
      if (projectId && completion.usage) {
        await this.tokenUsageService.trackUsage({
          projectId,
          reviewId,
          model,
          promptTokens: completion.usage.promptTokens || 0,
          completionTokens: completion.usage.completionTokens || 0,
          operation: 'structured_review',
          fileName,
        }).catch(err => console.error('Failed to track token usage:', err));
      }

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

**Your personality:**
- Professional but friendly
- Humble and open to feedback
- Clear and concise communicator
- Knowledgeable but not arrogant

**Response guidelines:**
1. Acknowledge user's input first
2. If they're correcting you: Admit mistake gracefully and thank them
3. If they're asking questions: Provide clear, detailed explanation
4. If they disagree: Respect their opinion and explain your reasoning
5. If they're adding context: Incorporate it into your understanding
6. Always be constructive and helpful

**Tone:**
- Use emojis sparingly (only when appropriate)
- Be conversational but professional
- Keep responses focused and to-the-point
- Avoid being defensive or argumentative`;

    const userPrompt = `
**User's comment:** 
${userComment}

${context.pullRequestTitle ? `**PR Context:** ${context.pullRequestTitle}` : ''}

${context.fileName ? `**File:** ${context.fileName}` : ''}

${context.codeSnippet ? `**Code context:**
\`\`\`
${context.codeSnippet}
\`\`\`
` : ''}

**Instructions:**
Analyze the user's comment and provide an appropriate response:
- If it's feedback on your review → Acknowledge and learn
- If it's a question → Answer clearly with examples if needed
- If it's additional context → Thank them and adjust your understanding
- If it's a disagreement → Explain your reasoning politely
- If it's asking for changes → Suggest concrete next steps

Keep your response focused and under 200 words unless more detail is needed.
`;

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

      const response = completion.choices[0].message.content as string;
      console.log('AI Reply generated:', response);

      return response;
    } catch (error) {
      console.error('AI Reply generation failed:', error);
      return `Thanks for your comment! I appreciate the feedback. Let me know if you have any other questions or concerns.`;
    }
  }
}
