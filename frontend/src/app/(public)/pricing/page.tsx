// Improved Dark-Themed Pricing Page (Synced with AI Reviewer Landing Page)
// Modern, premium, English version, polished animations, consistent black aesthetic

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Crown, Rocket, Building2 } from "lucide-react";

interface PricingPlan {
  name: string;
  price: number;
  billingCycle: "MONTHLY" | "YEARLY";
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
    name: "FREE",
    price: 0,
    billingCycle: "MONTHLY",
    icon: Zap,
    color: "text-gray-300",
    features: [
      "1 project",
      "1 team member",
      "100 reviews/month",
      "GitHub & GitLab integration",
      "Discord notifications",
      "Basic AI code review",
      "Community support",
    ],
    limits: {
      maxProjects: 1,
      maxMembers: 1,
      monthlyReviews: 100,
    },
  },
  {
    name: "STARTER",
    price: 29,
    billingCycle: "MONTHLY",
    icon: Rocket,
    color: "text-green-400",
    features: [
      "5 projects",
      "5 team members",
      "1,000 reviews/month",
      "GitHub & GitLab integration",
      "Discord notifications",
      "Advanced AI code review",
      "Priority support",
      "Custom review rules",
      "Team collaboration",
    ],
    limits: {
      maxProjects: 5,
      maxMembers: 5,
      monthlyReviews: 1000,
    },
  },
  {
    name: "PROFESSIONAL",
    price: 99,
    billingCycle: "MONTHLY",
    icon: Crown,
    color: "text-yellow-400",
    popular: true,
    features: [
      "20 projects",
      "20 team members",
      "5,000 reviews/month",
      "All Starter features",
      "AI training from feedback",
      "Business context understanding",
      "Custom Discord channels",
      "API access",
      "Advanced analytics",
      "24/7 support",
    ],
    limits: {
      maxProjects: 20,
      maxMembers: 20,
      monthlyReviews: 5000,
    },
  },
  {
    name: "ENTERPRISE",
    price: 299,
    billingCycle: "MONTHLY",
    icon: Building2,
    color: "text-blue-400",
    features: [
      "Unlimited projects",
      "Unlimited team members",
      "Unlimited reviews",
      "All Professional features",
      "Dedicated AI model",
      "On-premise deployment",
      "Custom integrations",
      "SLA guarantee",
      "Dedicated account manager",
      "Custom AI training",
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
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">(
    "MONTHLY"
  );

  const formatPrice = (price: number, cycle: "MONTHLY" | "YEARLY") => {
    if (price === 0) return "Free";
    const yearlyPrice =
      cycle === "YEARLY" ? Math.floor(price * 12 * 0.8) : price * 12;
    return cycle === "MONTHLY" ? `$${price}/mo` : `$${yearlyPrice}/yr`;
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 pt-24 pb-32 px-4 relative ">
      {/* Subtle Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c0f14] via-black to-[#0e1015] opacity-90 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-400 mb-10">
            Choose the plan that fits your workflow. Upgrade or downgrade
            anytime.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-[#111318] rounded-xl p-1 border border-gray-800 backdrop-blur-md shadow-md">
            <button
              onClick={() => setBillingCycle("MONTHLY")}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                billingCycle === "MONTHLY"
                  ? "bg-gray-800 text-white shadow-lg"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("YEARLY")}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 relative ${
                billingCycle === "YEARLY"
                  ? "bg-gray-800 text-white shadow-lg"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Yearly
              <Badge className="ml-2 bg-green-700 text-green-100 border-none">
                Save 20%
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {plans.map((plan) => {
            const Icon = plan.icon;

            return (
              <Card
                key={plan.name}
                className={`relative bg-[#0d0f14] border border-gray-800 hover:border-gray-600 transition-all duration-300 p-1 rounded-2xl shadow-xl group  ${
                  plan.popular ? "scale-[1.03] border-yellow-500" : ""
                }`}
              >
                <CardHeader className="text-center pb-4 pt-6">
                  <div className={`mx-auto mb-4 ${plan.color}`}>
                    <Icon className="h-12 w-12 drop-shadow-lg" />
                  </div>
                  <CardTitle className="text-2xl text-white tracking-wide">
                    {plan.name}
                  </CardTitle>

                  <div className="mt-4">
                    <div className="text-4xl font-bold text-white drop-shadow-sm">
                      {formatPrice(plan.price, billingCycle)}
                    </div>
                    {plan.price > 0 && (
                      <div className="text-sm text-gray-500 mt-1">
                        {billingCycle === "YEARLY" && "Billed annually"}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pb-6 px-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() =>
                      router.push(`/auth/register?plan=${plan.name}`)
                    }
                    className={`w-full mt-6 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                      plan.popular
                        ? "bg-yellow-500 text-black hover:bg-yellow-400"
                        : "bg-gray-900 hover:bg-gray-800 text-white"
                    }`}
                  >
                    {plan.price === 0 ? "Get Started Free" : "Choose Plan"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-32 text-center">
          <Card className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-gray-700 rounded-2xl shadow-xl backdrop-blur-xl">
            <CardContent className="py-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to level up your code quality?
              </h2>
              <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                Start with the free plan — no credit card required. Upgrade as
                your team grows.
              </p>

              <Button
                size="lg"
                onClick={() => router.push("/auth/register")}
                className="px-8 py-3 text-lg bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg"
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
