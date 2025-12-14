import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenUsage } from './token-usage.entity';

// Pricing per 1M tokens (as of Dec 2024)
const MODEL_PRICING = {
  'anthropic/claude-3.5-sonnet': {
    input: 3.0,    // $3 per 1M input tokens
    output: 15.0,  // $15 per 1M output tokens
  },
  'anthropic/claude-3-opus': {
    input: 15.0,
    output: 75.0,
  },
  'openai/gpt-4-turbo': {
    input: 10.0,
    output: 30.0,
  },
  'openai/gpt-4': {
    input: 30.0,
    output: 60.0,
  },
  'openai/gpt-3.5-turbo': {
    input: 0.5,
    output: 1.5,
  },
  'gpt-4o-mini': {
    input: 0.15,   // $0.15 per 1M input tokens
    output: 0.6,   // $0.60 per 1M output tokens
  },
};

@Injectable()
export class TokenUsageService {
  private readonly logger = new Logger(TokenUsageService.name);

  constructor(
    @InjectRepository(TokenUsage)
    private tokenUsageRepository: Repository<TokenUsage>,
  ) {}

  /**
   * Calculate cost based on model pricing
   */
  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['anthropic/claude-3.5-sonnet'];
    
    const inputCost = (promptTokens / 1_000_000) * pricing.input;
    const outputCost = (completionTokens / 1_000_000) * pricing.output;
    
    return inputCost + outputCost;
  }

  /**
   * Track token usage for a review operation
   */
  async trackUsage(data: {
    projectId: string;
    reviewId?: string;
    provider?: string;
    model?: string;
    promptTokens: number;
    completionTokens: number;
    operation?: string;
    fileName?: string;
    metadata?: any;
  }): Promise<TokenUsage> {
    const {
      projectId,
      reviewId,
      provider = 'openrouter',
      model = 'anthropic/claude-3.5-sonnet',
      promptTokens,
      completionTokens,
      operation,
      fileName,
      metadata,
    } = data;

    const totalTokens = promptTokens + completionTokens;
    const estimatedCost = this.calculateCost(model, promptTokens, completionTokens);

    const usage = this.tokenUsageRepository.create({
      projectId,
      reviewId,
      provider,
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost,
      operation,
      fileName,
      metadata,
    });

    await this.tokenUsageRepository.save(usage);

    this.logger.log(
      `💰 Token usage tracked: ${totalTokens} tokens, ~$${estimatedCost.toFixed(4)} (${operation || 'unknown'})`
    );

    return usage;
  }

  /**
   * Get total usage for a project
   */
  async getProjectUsage(projectId: string, fromDate?: Date): Promise<{
    totalTokens: number;
    totalCost: number;
    byOperation: Record<string, { tokens: number; cost: number; count: number }>;
    byModel: Record<string, { tokens: number; cost: number; count: number }>;
  }> {
    const query = this.tokenUsageRepository
      .createQueryBuilder('usage')
      .where('usage.projectId = :projectId', { projectId });

    if (fromDate) {
      query.andWhere('usage.createdAt >= :fromDate', { fromDate });
    }

    const usages = await query.getMany();

    let totalTokens = 0;
    let totalCost = 0;
    const byOperation: Record<string, any> = {};
    const byModel: Record<string, any> = {};

    for (const usage of usages) {
      totalTokens += usage.totalTokens;
      totalCost += Number(usage.estimatedCost);

      // By operation
      const op = usage.operation || 'unknown';
      if (!byOperation[op]) {
        byOperation[op] = { tokens: 0, cost: 0, count: 0 };
      }
      byOperation[op].tokens += usage.totalTokens;
      byOperation[op].cost += Number(usage.estimatedCost);
      byOperation[op].count += 1;

      // By model
      if (!byModel[usage.model]) {
        byModel[usage.model] = { tokens: 0, cost: 0, count: 0 };
      }
      byModel[usage.model].tokens += usage.totalTokens;
      byModel[usage.model].cost += Number(usage.estimatedCost);
      byModel[usage.model].count += 1;
    }

    return {
      totalTokens,
      totalCost,
      byOperation,
      byModel,
    };
  }

  /**
   * Get usage statistics for dashboard
   */
  async getUsageStats(projectId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [last30Days, last7Days, allTime] = await Promise.all([
      this.getProjectUsage(projectId, thirtyDaysAgo),
      this.getProjectUsage(projectId, sevenDaysAgo),
      this.getProjectUsage(projectId),
    ]);

    return {
      last7Days,
      last30Days,
      allTime,
    };
  }

  /**
   * Get top files by token usage
   */
  async getTopFilesByUsage(projectId: string, limit = 10): Promise<Array<{
    fileName: string;
    totalTokens: number;
    totalCost: number;
    reviewCount: number;
  }>> {
    const usages = await this.tokenUsageRepository
      .createQueryBuilder('usage')
      .select('usage.fileName', 'fileName')
      .addSelect('SUM(usage.totalTokens)', 'totalTokens')
      .addSelect('SUM(usage.estimatedCost)', 'totalCost')
      .addSelect('COUNT(*)', 'reviewCount')
      .where('usage.projectId = :projectId', { projectId })
      .andWhere('usage.fileName IS NOT NULL')
      .groupBy('usage.fileName')
      .orderBy('SUM(usage.totalTokens)', 'DESC')
      .limit(limit)
      .getRawMany();

    return usages.map(u => ({
      fileName: u.fileName,
      totalTokens: parseInt(u.totalTokens),
      totalCost: parseFloat(u.totalCost),
      reviewCount: parseInt(u.reviewCount),
    }));
  }
}
