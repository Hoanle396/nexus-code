import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../review/review.entity';
import * as crypto from 'crypto';

export interface CachedReview {
  commitSha: string;
  fileHash: string;
  reviewResult: any;
  cachedAt: Date;
}

@Injectable()
export class ReviewCacheService {
  private readonly logger = new Logger(ReviewCacheService.name);
  private memoryCache = new Map<string, CachedReview>();
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  /**
   * Generate hash for file content
   */
  private hashFileContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Generate cache key
   */
  private getCacheKey(projectId: string, filename: string, fileHash: string): string {
    return `${projectId}:${filename}:${fileHash}`;
  }

  /**
   * Check if file content was already reviewed
   */
  async getCachedReview(
    projectId: string,
    filename: string,
    content: string
  ): Promise<any | null> {
    const fileHash = this.hashFileContent(content);
    const cacheKey = this.getCacheKey(projectId, filename, fileHash);

    // Check memory cache first
    const memCached = this.memoryCache.get(cacheKey);
    if (memCached && Date.now() - memCached.cachedAt.getTime() < this.CACHE_TTL) {
      this.logger.log(`✅ Cache HIT (memory) for ${filename}`);
      return memCached.reviewResult;
    }

    // Check database cache
    try {
      const reviews = await this.reviewRepository
        .createQueryBuilder('review')
        .leftJoinAndSelect('review.comments', 'comments')
        .where('review.projectId = :projectId', { projectId })
        .andWhere("comments.filePath = :filename", { filename })
        .andWhere("comments.metadata->>'fileHash' = :fileHash", { fileHash })
        .andWhere('review.createdAt > :minDate', { 
          minDate: new Date(Date.now() - this.CACHE_TTL) 
        })
        .orderBy('review.createdAt', 'DESC')
        .limit(1)
        .getMany();

      if (reviews.length > 0 && reviews[0].comments.length > 0) {
        this.logger.log(`✅ Cache HIT (database) for ${filename}`);
        
        const reviewResult = {
          summary: reviews[0].comments[0].metadata?.summary || 'Cached review',
          lineComments: reviews[0].comments
            .filter(c => c.lineNumber)
            .map(c => ({
              line: c.lineNumber,
              side: c.metadata?.side || 'RIGHT',
              severity: c.metadata?.severity || 'info',
              issue: c.metadata?.issue || '',
              codeError: c.metadata?.codeError || '',
              codeSuggest: c.metadata?.codeSuggest || '',
              body: c.content,
            })),
          overallFeedback: reviews[0].comments[0].metadata?.overallFeedback || '',
          cached: true,
        };

        // Store in memory cache
        this.memoryCache.set(cacheKey, {
          commitSha: reviews[0].pullRequestId,
          fileHash,
          reviewResult,
          cachedAt: new Date(),
        });

        return reviewResult;
      }
    } catch (error) {
      this.logger.error('Cache lookup error:', error);
    }

    this.logger.log(`❌ Cache MISS for ${filename}`);
    return null;
  }

  /**
   * Store review result in cache
   */
  async cacheReview(
    projectId: string,
    filename: string,
    content: string,
    reviewResult: any,
  ): Promise<void> {
    const fileHash = this.hashFileContent(content);
    const cacheKey = this.getCacheKey(projectId, filename, fileHash);

    // Store in memory cache
    this.memoryCache.set(cacheKey, {
      commitSha: '',
      fileHash,
      reviewResult: { ...reviewResult, cached: false },
      cachedAt: new Date(),
    });

    this.logger.log(`💾 Cached review for ${filename}`);
  }

  /**
   * Invalidate cache for a file
   */
  invalidateCache(projectId: string, filename: string): void {
    // Remove all cache entries for this file
    for (const [key, _] of this.memoryCache.entries()) {
      if (key.startsWith(`${projectId}:${filename}:`)) {
        this.memoryCache.delete(key);
      }
    }
    this.logger.log(`🗑️  Invalidated cache for ${filename}`);
  }

  /**
   * Clear old cache entries
   */
  async cleanupCache(): Promise<void> {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, cached] of this.memoryCache.entries()) {
      if (now - cached.cachedAt.getTime() > this.CACHE_TTL) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`🧹 Cleaned up ${cleaned} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      entriesInMemory: this.memoryCache.size,
      ttlMs: this.CACHE_TTL,
    };
  }
}
