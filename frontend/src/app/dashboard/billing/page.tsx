'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';

interface Subscription {
  id: string;
  plan: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAST_DUE';
  billingCycle: 'MONTHLY' | 'YEARLY';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  currentMonthReviews: number;
  monthlyReviewLimit: number;
  price: number;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  createdAt: string;
}

interface UsageStats {
  reviewsUsed: number;
  reviewsLimit: number;
  projectsUsed: number;
  projectsLimit: number;
  membersUsed: number;
  membersLimit: number;
}

const PLAN_PRICES = {
  FREE: 0,
  STARTER: 29,
  PROFESSIONAL: 99,
  ENTERPRISE: 299,
};

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan');

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [subRes, paymentsRes, usageRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/mine`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/payments`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/usage`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData);
      }

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData);
      }

      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setUsage(usageData);
      }
    } catch (error) {
      toast.error('Unable to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          plan,
          billingCycle: 'MONTHLY'
        }),
      });

      if (!response.ok) throw new Error();

      toast.success('Plan upgraded successfully!');
      fetchBillingData();
    } catch (error) {
      toast.error('Upgrade failed');
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You can still use it until the end of the current period.')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${subscription?.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error();

      toast.success('Subscription cancelled successfully');
      fetchBillingData();
    } catch (error) {
      toast.error('Failed to cancel subscription');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      ACTIVE: 'success',
      CANCELLED: 'warning',
      EXPIRED: 'destructive',
      PAST_DUE: 'destructive',
    };
    const labels: Record<string, string> = {
      ACTIVE: 'Active',
      CANCELLED: 'Cancelled',
      EXPIRED: 'Expired',
      PAST_DUE: 'Past Due',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PENDING: 'warning',
      SUCCEEDED: 'success',
      FAILED: 'destructive',
      REFUNDED: 'default',
    };
    const labels: Record<string, string> = {
      PENDING: 'Pending',
      SUCCEEDED: 'Succeeded',
      FAILED: 'Failed',
      REFUNDED: 'Refunded',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const calculateProgress = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground">Manage your subscription and payments</p>
        </div>
        <Button onClick={() => router.push('/pricing')}>
          <TrendingUp className="h-4 w-4 mr-2" />
          View Pricing
        </Button>
      </div>

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
              <CardDescription>Information about your current plan</CardDescription>
            </div>
            {subscription && getStatusBadge(subscription.status)}
          </div>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Service Plan</div>
                  <div className="text-2xl font-bold">{subscription.plan}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Price</div>
                  <div className="text-2xl font-bold">${subscription.price}/month</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Billing Cycle</div>
                  <div className="text-lg font-medium">
                    {subscription.billingCycle === 'MONTHLY' ? 'Monthly' : 'Yearly'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Current period: {new Date(subscription.currentPeriodStart).toLocaleDateString('en-US')} - {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US')}
              </div>

              <div className="flex gap-2 pt-4">
                {subscription.plan !== 'ENTERPRISE' && (
                  <Button onClick={() => router.push('/pricing')}>
                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                    Upgrade
                  </Button>
                )}
                {subscription.status === 'ACTIVE' && subscription.plan !== 'FREE' && (
                  <Button variant="destructive" onClick={handleCancelSubscription}>
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You don't have any subscription yet</p>
              <Button onClick={() => router.push('/pricing')}>
                View Service Plans
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Stats */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Usage Statistics
            </CardTitle>
            <CardDescription>Track your usage this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Reviews Usage */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Code Reviews</span>
                <span className="text-sm text-muted-foreground">
                  {usage.reviewsUsed} / {usage.reviewsLimit === -1 ? '∞' : usage.reviewsLimit}
                </span>
              </div>
              <Progress value={calculateProgress(usage.reviewsUsed, usage.reviewsLimit)} />
              {usage.reviewsLimit !== -1 && usage.reviewsUsed >= usage.reviewsLimit * 0.8 && (
                <div className="flex items-center gap-2 mt-2 text-sm text-orange-600">
                  <AlertCircle className="h-4 w-4" />
                  Approaching limit! Consider upgrading your plan.
                </div>
              )}
            </div>

            {/* Projects Usage */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Projects</span>
                <span className="text-sm text-muted-foreground">
                  {usage.projectsUsed} / {usage.projectsLimit === -1 ? '∞' : usage.projectsLimit}
                </span>
              </div>
              <Progress value={calculateProgress(usage.projectsUsed, usage.projectsLimit)} />
            </div>

            {/* Members Usage */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Members</span>
                <span className="text-sm text-muted-foreground">
                  {usage.membersUsed} / {usage.membersLimit === -1 ? '∞' : usage.membersLimit}
                </span>
              </div>
              <Progress value={calculateProgress(usage.membersUsed, usage.membersLimit)} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>Recent transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions yet
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      payment.status === 'SUCCEEDED' ? 'bg-green-100' : 
                      payment.status === 'FAILED' ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      {payment.status === 'SUCCEEDED' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : payment.status === 'FAILED' ? (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        ${payment.amount} {payment.currency}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {payment.paymentMethod}
                    </span>
                    {getPaymentStatusBadge(payment.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Suggestions */}
      {subscription && subscription.plan !== 'ENTERPRISE' && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg mb-1">Upgrade to unlock more features</h3>
                <p className="text-muted-foreground">
                  Get more reviews, projects, and advanced features
                </p>
              </div>
              <Button onClick={() => router.push('/pricing')}>
                View Pricing
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
