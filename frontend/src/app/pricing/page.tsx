'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Zap, Crown, Rocket, Building2 } from 'lucide-react';

interface PricingPlan {
  name: string;
  price: number;
  billingCycle: 'MONTHLY' | 'YEARLY';
  features: string[];
  limits: {
    maxProjects: number;
    maxMembers: number;
    monthlyReviews: number;
  };
  icon: any;
  popular?: boolean;
  color: string;
}

const plans: PricingPlan[] = [
  {
    name: 'FREE',
    price: 0,
    billingCycle: 'MONTHLY',
    icon: Zap,
    color: 'text-gray-600',
    features: [
      '1 dự án',
      '1 thành viên',
      '100 reviews/tháng',
      'GitHub & GitLab integration',
      'Discord notifications',
      'Basic AI code review',
      'Community support',
    ],
    limits: {
      maxProjects: 1,
      maxMembers: 1,
      monthlyReviews: 100,
    },
  },
  {
    name: 'STARTER',
    price: 29,
    billingCycle: 'MONTHLY',
    icon: Rocket,
    color: 'text-green-600',
    features: [
      '5 dự án',
      '5 thành viên',
      '1,000 reviews/tháng',
      'GitHub & GitLab integration',
      'Discord notifications',
      'Advanced AI code review',
      'Priority support',
      'Custom review rules',
      'Team collaboration',
    ],
    limits: {
      maxProjects: 5,
      maxMembers: 5,
      monthlyReviews: 1000,
    },
  },
  {
    name: 'PROFESSIONAL',
    price: 99,
    billingCycle: 'MONTHLY',
    icon: Crown,
    color: 'text-yellow-600',
    popular: true,
    features: [
      '20 dự án',
      '20 thành viên',
      '5,000 reviews/tháng',
      'All Starter features',
      'AI training from feedback',
      'Business context understanding',
      'Custom Discord channels',
      'API access',
      'Advanced analytics',
      '24/7 support',
    ],
    limits: {
      maxProjects: 20,
      maxMembers: 20,
      monthlyReviews: 5000,
    },
  },
  {
    name: 'ENTERPRISE',
    price: 299,
    billingCycle: 'MONTHLY',
    icon: Building2,
    color: 'text-blue-600',
    features: [
      'Không giới hạn dự án',
      'Không giới hạn thành viên',
      'Không giới hạn reviews',
      'All Professional features',
      'Dedicated AI model',
      'On-premise deployment option',
      'Custom integrations',
      'SLA guarantee',
      'Dedicated account manager',
      'Custom training',
    ],
    limits: {
      maxProjects: -1,
      maxMembers: -1,
      monthlyReviews: -1,
    },
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  const handleSubscribe = (plan: PricingPlan) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login?redirect=/pricing');
      return;
    }
    router.push(`/dashboard/billing?plan=${plan.name}`);
  };

  const formatPrice = (price: number, cycle: 'MONTHLY' | 'YEARLY') => {
    if (price === 0) return 'Miễn phí';
    const yearlyPrice = cycle === 'YEARLY' ? Math.floor(price * 12 * 0.8) : price * 12;
    return cycle === 'MONTHLY' 
      ? `$${price}/tháng` 
      : `$${yearlyPrice}/năm`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            Bảng giá đơn giản, minh bạch
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Chọn gói phù hợp với nhu cầu của bạn. Nâng cấp hoặc hạ cấp bất cứ lúc nào.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingCycle === 'MONTHLY'
                  ? 'bg-white shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              Hàng tháng
            </button>
            <button
              onClick={() => setBillingCycle('YEARLY')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingCycle === 'YEARLY'
                  ? 'bg-white shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              Hàng năm
              <Badge variant="success" className="ml-2">Tiết kiệm 20%</Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            
            return (
              <Card 
                key={plan.name}
                className={`relative ${
                  plan.popular 
                    ? 'border-2 border-yellow-500 shadow-xl scale-105' 
                    : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge variant="warning" className="text-sm px-4 py-1">
                      PHỔ BIẾN NHẤT
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto mb-4 ${plan.color}`}>
                    <Icon className="h-12 w-12" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <div className="text-4xl font-bold">
                      {formatPrice(plan.price, billingCycle)}
                    </div>
                    {plan.price > 0 && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {billingCycle === 'YEARLY' && 'Thanh toán hàng năm'}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleSubscribe(plan)}
                    variant={plan.popular ? 'default' : 'outline'}
                    className="w-full mt-6"
                  >
                    {plan.price === 0 ? 'Bắt đầu miễn phí' : 'Đăng ký ngay'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-8">
            Câu hỏi thường gặp
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tôi có thể thay đổi gói bất cứ lúc nào không?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Có, bạn có thể nâng cấp hoặc hạ cấp gói của mình bất cứ lúc nào. 
                  Khi nâng cấp, bạn sẽ được tính phí theo tỷ lệ. Khi hạ cấp, thay đổi sẽ có hiệu lực từ kỳ thanh toán tiếp theo.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chính sách hoàn tiền như thế nào?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Chúng tôi cung cấp chính sách hoàn tiền 100% trong vòng 14 ngày nếu bạn không hài lòng với dịch vụ.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reviews không sử dụng hết có được chuyển sang tháng sau?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Không, số lượng reviews sẽ được reset vào đầu mỗi tháng. Chúng tôi khuyến khích bạn sử dụng hết quota hàng tháng.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gói Enterprise có những gì khác biệt?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Gói Enterprise cung cấp AI model riêng được train theo codebase của bạn, 
                  tùy chọn triển khai on-premise, SLA đảm bảo uptime 99.9%, và account manager chuyên dụng.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-none">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold mb-4">
                Sẵn sàng nâng cao chất lượng code?
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Bắt đầu với gói miễn phí, không cần thẻ tín dụng
              </p>
              <Button 
                size="lg" 
                onClick={() => router.push('/auth/register')}
                className="px-8"
              >
                Đăng ký ngay
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
