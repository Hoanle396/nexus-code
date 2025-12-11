import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('subscriptions')
@ApiBearerAuth('JWT-auth')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  create(@Request() req, @Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionService.create(req.user.id, createSubscriptionDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user subscription' })
  @ApiResponse({ status: 200, description: 'Returns user subscription' })
  findMine(@Request() req) {
    return this.subscriptionService.findByUser(req.user.id);
  }

  @Get('team/:teamId')
  @ApiOperation({ summary: 'Get team subscription' })
  @ApiResponse({ status: 200, description: 'Returns team subscription' })
  findByTeam(@Param('teamId') teamId: string) {
    return this.subscriptionService.findByTeam(teamId);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all available plans and pricing' })
  @ApiResponse({ status: 200, description: 'Returns pricing plans' })
  getPlans() {
    return this.subscriptionService.getPlanPricing();
  }

  @Get(':id/usage')
  @ApiOperation({ summary: 'Get subscription usage' })
  @ApiResponse({ status: 200, description: 'Returns usage statistics' })
  getUsage(@Param('id') id: string) {
    return this.subscriptionService.getUsage(id);
  }

  @Get(':id/payments')
  @ApiOperation({ summary: 'Get payment history' })
  @ApiResponse({ status: 200, description: 'Returns payment history' })
  getPaymentHistory(@Param('id') id: string) {
    return this.subscriptionService.getPaymentHistory(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update subscription' })
  @ApiResponse({ status: 200, description: 'Subscription updated' })
  update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionService.update(id, updateSubscriptionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, description: 'Subscription canceled' })
  cancel(@Param('id') id: string) {
    return this.subscriptionService.cancel(id);
  }

  @Post(':id/reset-usage')
  @ApiOperation({ summary: 'Reset monthly usage (admin only)' })
  @ApiResponse({ status: 200, description: 'Usage reset' })
  resetUsage(@Param('id') id: string) {
    return this.subscriptionService.resetMonthlyUsage(id);
  }
}
