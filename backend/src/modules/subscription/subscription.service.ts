import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from './subscription.entity';
import { Payment, PaymentStatus } from './payment.entity';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto';
import { Web3PaymentService } from './web3-payment.service';
import { Team } from '../team/team.entity';

const PLAN_PRICING = {
  [SubscriptionPlan.FREE]: {
    price: 0,
    maxProjects: 3,
    maxMembers: 5,
    monthlyReviewLimit: 100,
  },
  [SubscriptionPlan.STARTER]: {
    price: 29,
    maxProjects: 10,
    maxMembers: 10,
    monthlyReviewLimit: 1000,
  },
  [SubscriptionPlan.PROFESSIONAL]: {
    price: 99,
    maxProjects: 50,
    maxMembers: 25,
    monthlyReviewLimit: 5000,
  },
  [SubscriptionPlan.ENTERPRISE]: {
    price: 299,
    maxProjects: -1, // unlimited
    maxMembers: -1, // unlimited
    monthlyReviewLimit: -1, // unlimited
  },
};

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private web3PaymentService: Web3PaymentService,
  ) { }

  async create(userId: string, createSubscriptionDto: CreateSubscriptionDto) {
    // Check if user already has a subscription
    const existing = await this.subscriptionRepository.findOne({
      where: createSubscriptionDto.teamId
        ? { teamId: createSubscriptionDto.teamId }
        : { userId },
      relations: ['team'],
    });

    // If subscription exists, update it instead
    if (existing) {
      return await this.update(existing.id, createSubscriptionDto);
    }

    const planDetails = PLAN_PRICING[createSubscriptionDto.plan];

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription = this.subscriptionRepository.create({
      ...createSubscriptionDto,
      userId: createSubscriptionDto.teamId ? null : userId,
      price: planDetails.price,
      maxProjects: planDetails.maxProjects,
      maxMembers: planDetails.maxMembers,
      monthlyReviewLimit: planDetails.monthlyReviewLimit,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      status: createSubscriptionDto.plan === SubscriptionPlan.FREE
        ? SubscriptionStatus.ACTIVE
        : SubscriptionStatus.PENDING_PAYMENT,
    });

    const savedSubscription = await this.subscriptionRepository.save(subscription);

    // Only update team entity if this is a FREE plan (paid plans update after payment)
    if (createSubscriptionDto.teamId && createSubscriptionDto.plan === SubscriptionPlan.FREE) {
      const team = await this.subscriptionRepository.manager.findOne(Team, {
        where: { id: createSubscriptionDto.teamId },
      });

      if (team) {
        team.plan = createSubscriptionDto.plan as any;
        team.maxProjects = planDetails.maxProjects;
        team.maxMembers = planDetails.maxMembers;
        team.monthlyReviewLimit = planDetails.monthlyReviewLimit;
        await this.subscriptionRepository.manager.save(Team, team);
      }
    }

    return savedSubscription;
  }

  async findByUser(userId: string) {
    let subscription = await this.subscriptionRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    // Auto-create FREE subscription for new users
    if (!subscription) {
      const planDetails = PLAN_PRICING[SubscriptionPlan.FREE];
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      subscription = this.subscriptionRepository.create({
        userId,
        plan: SubscriptionPlan.FREE,
        price: planDetails.price,
        maxProjects: planDetails.maxProjects,
        maxMembers: planDetails.maxMembers,
        monthlyReviewLimit: planDetails.monthlyReviewLimit,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: 'monthly',
      });

      subscription = await this.subscriptionRepository.save(subscription);
    }

    return subscription;
  }

  async findByTeam(teamId: string) {
    let subscription = await this.subscriptionRepository.findOne({
      where: { teamId },
      relations: ['team'],
    });

    // Auto-create FREE subscription for new teams
    if (!subscription) {
      const planDetails = PLAN_PRICING[SubscriptionPlan.FREE];
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      subscription = this.subscriptionRepository.create({
        teamId,
        plan: SubscriptionPlan.FREE,
        price: planDetails.price,
        maxProjects: planDetails.maxProjects,
        maxMembers: planDetails.maxMembers,
        monthlyReviewLimit: planDetails.monthlyReviewLimit,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: 'monthly',
      });

      subscription = await this.subscriptionRepository.save(subscription);

      // Load the team relation
      subscription = await this.subscriptionRepository.findOne({
        where: { id: subscription.id },
        relations: ['team'],
      });
    }

    return subscription;
  }

  async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['team'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (updateSubscriptionDto.plan) {
      const planDetails = PLAN_PRICING[updateSubscriptionDto.plan];
      subscription.plan = updateSubscriptionDto.plan;
      subscription.price = planDetails.price;

      // For FREE plan, activate immediately and update limits
      if (updateSubscriptionDto.plan === SubscriptionPlan.FREE) {
        subscription.status = SubscriptionStatus.ACTIVE;
        subscription.maxProjects = planDetails.maxProjects;
        subscription.maxMembers = planDetails.maxMembers;
        subscription.monthlyReviewLimit = planDetails.monthlyReviewLimit;

        // Update period dates
        const now = new Date();
        subscription.currentPeriodStart = now;

        const periodEnd = new Date(now);
        if (subscription.billingCycle === 'yearly') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }
        subscription.currentPeriodEnd = periodEnd;

        // Update team entity for FREE plan
        if (subscription.teamId) {
          let team = subscription.team;
          if (!team) {
            team = await this.subscriptionRepository.manager.findOne(Team, {
              where: { id: subscription.teamId },
            });
          }

          if (team) {
            team.plan = subscription.plan as any;
            team.maxProjects = planDetails.maxProjects;
            team.maxMembers = planDetails.maxMembers;
            team.monthlyReviewLimit = planDetails.monthlyReviewLimit;
            await this.subscriptionRepository.manager.save(Team, team);
          }
        }
      } else {
        // For paid plans, set to PENDING_PAYMENT until payment is verified
        // Do NOT update limits or team - this happens in verifyPaymentTransaction()
        subscription.status = SubscriptionStatus.PENDING_PAYMENT;
      }
    }

    if (updateSubscriptionDto.billingCycle) {
      subscription.billingCycle = updateSubscriptionDto.billingCycle;
    }

    // Handle teamId update (moving subscription between personal and team)
    if (updateSubscriptionDto.teamId !== undefined) {
      subscription.teamId = updateSubscriptionDto.teamId || null;
      subscription.userId = updateSubscriptionDto.teamId ? null : subscription.userId;
    }

    return await this.subscriptionRepository.save(subscription);
  }

  async cancel(id: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.status = SubscriptionStatus.CANCELED;
    await this.subscriptionRepository.save(subscription);

    return { message: 'Subscription canceled successfully' };
  }

  async incrementUsage(subscriptionId: string, count: number = 1) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.currentMonthReviews += count;
    await this.subscriptionRepository.save(subscription);

    return subscription;
  }

  async checkUsageLimit(subscriptionId: string): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return false;
    }

    // Unlimited for enterprise
    if (subscription.monthlyReviewLimit === -1) {
      return true;
    }

    return subscription.currentMonthReviews < subscription.monthlyReviewLimit;
  }

  async getUsage(subscriptionId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const usagePercentage = subscription.monthlyReviewLimit === -1
      ? 0
      : (subscription.currentMonthReviews / subscription.monthlyReviewLimit) * 100;

    const remainingReviews = subscription.monthlyReviewLimit === -1
      ? -1
      : subscription.monthlyReviewLimit - subscription.currentMonthReviews;

    return {
      currentMonthReviews: subscription.currentMonthReviews,
      monthlyReviewLimit: subscription.monthlyReviewLimit,
      usagePercentage: Math.round(usagePercentage),
      remainingReviews,
    };
  }

  async resetMonthlyUsage(subscriptionId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.currentMonthReviews = 0;

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    subscription.currentPeriodStart = now;
    subscription.currentPeriodEnd = periodEnd;

    await this.subscriptionRepository.save(subscription);

    return { message: 'Monthly usage reset successfully' };
  }

  /**
   * Create payment request with salt (step 1)
   */
  async createPaymentRequest(
    userId: string,
    subscriptionId: string,
    amount: number,
  ) {
    // Validate subscription exists
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Generate payment request with salt
    const paymentRequest = this.web3PaymentService.generatePaymentRequest(
      userId,
      subscriptionId,
      amount,
    );

    // Create pending payment record
    const payment = this.paymentRepository.create({
      subscriptionId,
      amount,
      currency: 'USDT',
      status: PaymentStatus.PENDING,
      toAddress: this.web3PaymentService.getReceiverAddress(),
      metadata: {
        salt: paymentRequest.salt,
        expiresAt: paymentRequest.expiresAt,
      },
    });

    await this.paymentRepository.save(payment);

    return {
      paymentId: payment.id,
      salt: paymentRequest.salt,
      message: this.web3PaymentService.generateSignatureMessage(paymentRequest),
      amount,
      receiverAddress: this.web3PaymentService.getReceiverAddress(),
      chainInfo: this.web3PaymentService.getChainInfo(),
      expiresAt: paymentRequest.expiresAt,
    };
  }

  /**
   * Submit payment with signature (step 2)
   */
  async submitPaymentSignature(
    paymentId: string,
    signature: string,
    walletAddress: string,
  ) {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment already processed');
    }

    // Validate wallet address
    if (!this.web3PaymentService.isValidAddress(walletAddress)) {
      throw new BadRequestException('Invalid wallet address');
    }

    const salt = payment.metadata?.salt;
    if (!salt) {
      throw new BadRequestException('Invalid payment request');
    }

    // Verify signature
    await this.web3PaymentService.verifySignature(salt, signature, walletAddress);

    // Update payment with user info
    payment.fromAddress = walletAddress;
    payment.metadata = {
      ...payment.metadata,
      signature,
      signedAt: new Date().toISOString(),
    };

    await this.paymentRepository.save(payment);

    return {
      success: true,
      message: 'Signature verified. Please send USDT to complete payment.',
      paymentId: payment.id,
    };
  }

  /**
   * Admin verify transaction on-chain (step 3)
   */
  async verifyPaymentTransaction(
    paymentId: string,
    transactionHash: string,
  ) {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === PaymentStatus.SUCCEEDED) {
      throw new BadRequestException('Payment already confirmed');
    }

    const salt = payment.metadata?.salt;
    if (!salt) {
      throw new BadRequestException('Invalid payment request');
    }

    try {
      // Verify transaction on-chain
      const verification = await this.web3PaymentService.verifyPaymentTransaction(
        transactionHash,
        salt,
      );

      // Update payment with blockchain details
      payment.status = PaymentStatus.SUCCEEDED;
      payment.transactionHash = verification.transactionHash;
      payment.chainId = 11155111; // Sepolia
      payment.blockNumber = verification.blockNumber;
      payment.metadata = {
        ...payment.metadata,
        verifiedAt: new Date().toISOString(),
        blockTimestamp: verification.timestamp,
      };

      await this.paymentRepository.save(payment);

      // Activate subscription
      const subscription = await this.subscriptionRepository.findOne({
        where: { id: payment.subscriptionId },
        relations: ['team'],
      });

      if (subscription) {
        // Get plan details to update limits
        const planDetails = PLAN_PRICING[subscription.plan];

        subscription.status = SubscriptionStatus.ACTIVE;
        subscription.walletAddress = verification.from;

        // Update plan limits based on the current plan
        subscription.maxProjects = planDetails.maxProjects;
        subscription.maxMembers = planDetails.maxMembers;
        subscription.monthlyReviewLimit = planDetails.monthlyReviewLimit;

        // Update period dates
        const now = new Date();
        subscription.currentPeriodStart = now;

        const periodEnd = new Date(now);
        if (subscription.billingCycle === 'yearly') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }
        subscription.currentPeriodEnd = periodEnd;

        await this.subscriptionRepository.save(subscription);

        // Also update the team's plan and limits if this is a team subscription
        if (subscription.teamId) {
          // Fetch team if not loaded
          let team = subscription.team;
          if (!team) {
            team = await this.subscriptionRepository.manager.findOne(Team, {
              where: { id: subscription.teamId },
            });
          }

          if (team) {
            team.plan = subscription.plan as any;
            team.maxProjects = planDetails.maxProjects;
            team.maxMembers = planDetails.maxMembers;
            team.monthlyReviewLimit = planDetails.monthlyReviewLimit;
            await this.subscriptionRepository.manager.save(Team, team);
          }
        }
      }

      return {
        success: true,
        payment,
        subscription,
      };
    } catch (error) {
      payment.status = PaymentStatus.FAILED;
      payment.metadata = {
        ...payment.metadata,
        error: error.message,
        failedAt: new Date().toISOString(),
      };
      await this.paymentRepository.save(payment);
      throw error;
    }
  }

  async getPaymentHistory(subscriptionId: string) {
    return await this.paymentRepository.find({
      where: { subscriptionId },
      order: { createdAt: 'DESC' },
    });
  }

  getPlanPricing() {
    return Object.entries(PLAN_PRICING).map(([plan, details]) => ({
      plan,
      ...details,
      features: this.getPlanFeatures(plan as SubscriptionPlan),
    }));
  }

  private getPlanFeatures(plan: SubscriptionPlan): string[] {
    const features = {
      [SubscriptionPlan.FREE]: [
        'Up to 3 projects',
        'Up to 5 team members',
        '100 reviews per month',
        'Basic AI code review',
        'GitHub & GitLab integration',
        'Discord notifications',
      ],
      [SubscriptionPlan.STARTER]: [
        'Up to 10 projects',
        'Up to 10 team members',
        '1,000 reviews per month',
        'Advanced AI code review',
        'Priority support',
        'Custom review rules',
        'All FREE features',
      ],
      [SubscriptionPlan.PROFESSIONAL]: [
        'Up to 50 projects',
        'Up to 25 team members',
        '5,000 reviews per month',
        'AI training from feedback',
        'Advanced analytics',
        'API access',
        'All STARTER features',
      ],
      [SubscriptionPlan.ENTERPRISE]: [
        'Unlimited projects',
        'Unlimited team members',
        'Unlimited reviews',
        'Dedicated support',
        'Custom AI model training',
        'SLA guarantee',
        'All PROFESSIONAL features',
      ],
    };

    return features[plan] || [];
  }
}
