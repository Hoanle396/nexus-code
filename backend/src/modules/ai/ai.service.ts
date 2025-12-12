import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TrainingData,
  TrainingDataType,
} from '../training/training-data.entity';
import type OpenRouter  from '@openrouter/sdk';
import { dynamicImport } from '../../utils';

interface CodeReviewContext {
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
