import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { Project } from '../project/project.entity';
import { ReviewModule } from '../review/review.module';
import { AiModule } from '../ai/ai.module';
import { TrainingModule } from '../training/training.module';
import { DiscordModule } from '../discord/discord.module';
import { SecurityModule } from '../security/security.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { ReviewCacheService } from './cache.service';
import { Review } from '../review/review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Review]),
    ReviewModule,
    AiModule,
    TrainingModule,
    DiscordModule,
    SecurityModule,
    SubscriptionModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService, ReviewCacheService],
})
export class WebhookModule {}
