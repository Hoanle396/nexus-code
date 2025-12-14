import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewService } from './review.service';
import { Review } from './review.entity';
import { ReviewComment } from './review-comment.entity';
import { TokenUsage } from './token-usage.entity';
import { TokenUsageService } from './token-usage.service';

@Module({
  imports: [TypeOrmModule.forFeature([Review, ReviewComment, TokenUsage])],
  providers: [ReviewService, TokenUsageService],
  exports: [ReviewService, TokenUsageService],
})
export class ReviewModule {}
