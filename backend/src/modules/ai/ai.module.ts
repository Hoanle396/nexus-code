import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { TrainingData } from '../training/training-data.entity';
import { ReviewModule } from '../review/review.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrainingData]),
    ReviewModule,
  ],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
