import { IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlan } from '../subscription.entity';

export class CreateSubscriptionDto {
  @ApiProperty({ enum: SubscriptionPlan })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiProperty({ required: false })
  @IsOptional()
  teamId?: string;

  @ApiProperty({ default: 'monthly', required: false })
  @IsOptional()
  billingCycle?: string;
}

export class UpdateSubscriptionDto {
  @ApiProperty({ enum: SubscriptionPlan, required: false })
  @IsEnum(SubscriptionPlan)
  @IsOptional()
  plan?: SubscriptionPlan;

  @ApiProperty({ required: false })
  @IsOptional()
  billingCycle?: string;
}

export class SubscriptionUsageDto {
  @ApiProperty()
  currentMonthReviews: number;

  @ApiProperty()
  monthlyReviewLimit: number;

  @ApiProperty()
  usagePercentage: number;

  @ApiProperty()
  remainingReviews: number;
}
