"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  CreditCard,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Wallet,
  ExternalLink,
  ArrowUpRight,
  Zap,
} from "lucide-react";
import { ethers, BrowserProvider } from "ethers";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Subscription {
  id: string;
  plan: "free" | "starter" | "professional" | "enterprise";
  status: "active" | "canceled" | "expired" | "past_due" | "trialing";
  billingCycle: "monthly" | "yearly";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  currentMonthReviews: number;
  monthlyReviewLimit: number;
  price: number;
  walletAddress?: string;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  transactionHash?: string;
  chainId?: number;
  blockNumber?: number;
  fromAddress?: string;
  toAddress?: string;
  createdAt: string;
}

interface UsageStats {
  currentMonthReviews: number;
  monthlyReviewLimit: number;
  usagePercentage: number;
  remainingReviews: number;
}

interface SupportedChain {
  chainId: number;
  name: string;
  usdcAddress: string;
}

const PLAN_PRICES = {
  free: 0,
  starter: 29,
  professional: 99,
  enterprise: 299,
};

const USDC_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Web3 states
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [supportedChains, setSupportedChains] = useState<SupportedChain[]>([]);
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchBillingData();
    checkWalletConnection();

    const planParam = searchParams.get("plan");
    if (planParam && planParam.toLowerCase() !== "free") {
      toast.success(
        `Ready to upgrade to ${planParam.toUpperCase()} plan! Connect your wallet to pay with USDC.`
      );
    }
  }, [searchParams]);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setWalletAddress(accounts[0].address);
        }
      } catch (error) {
        console.error("Wallet check failed:", error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      toast.error("MetaMask or another Web3 wallet is required");
      return;
    }

    setIsConnecting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setWalletAddress(accounts[0]);
      toast.success("Wallet connected successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress("");
    toast.success("Wallet disconnected");
  };

  const fetchBillingData = async () => {
    try {
      const token = localStorage.getItem("token");
      const subRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (subRes.ok) {
        const subData = await subRes.json();
        if (subData && subData.id) {
          setSubscription(subData);

          const [usageRes, paymentsRes] = await Promise.all([
            fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${subData.id}/usage`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            ),
            fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${subData.id}/payments`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            ),
          ]);

          if (usageRes.ok) setUsage(await usageRes.json());
          if (paymentsRes.ok) setPayments(await paymentsRes.json());
        }
      } else if (subRes.status === 404) {
        setSubscription(null);
      }
    } catch (error) {
      toast.error("Unable to load billing information");
    } finally {
      setLoading(false);
    }
  };

  const createPaymentIntent = async (plan: string) => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      let subId = subscription?.id;
      let currentSub = subscription;

      if (subId) {
        const updateRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${subId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              plan: plan.toLowerCase(),
              billingCycle: "monthly",
            }),
          }
        );
        if (updateRes.ok) currentSub = await updateRes.json();
      } else {
        const createRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/subscriptions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              plan: plan.toLowerCase(),
              billingCycle: "monthly",
            }),
          }
        );
        if (createRes.ok) {
          currentSub = await createRes.json();
          if (currentSub?.id) {
            subId = currentSub?.id;
          }
        }
      }

      setSubscription(currentSub);

      const amount = PLAN_PRICES[plan as keyof typeof PLAN_PRICES];
      const paymentRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${subId}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount, walletAddress, metadata: { plan } }),
        }
      );

      if (!paymentRes.ok) throw new Error();
      const paymentData = await paymentRes.json();
      setPendingPayment(paymentData);
      setSupportedChains(paymentData.supportedChains);
      toast.success(
        `Payment ready! Send ${amount} USDC to activate your plan.`
      );
    } catch (error) {
      toast.error("Failed to prepare payment");
    }
  };

  const sendUSDCPayment = async (chainId: number) => {
    if (!pendingPayment || !walletAddress) return;
    setProcessingPayment(true);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });

      const chain = supportedChains.find((c) => c.chainId === chainId);
      if (!chain) throw new Error("Unsupported chain");

      const usdcContract = new ethers.Contract(
        chain.usdcAddress,
        USDC_ABI,
        signer
      );
      const amount = ethers.parseUnits(pendingPayment.amount.toString(), 6);
      const tx = await usdcContract.transfer(
        pendingPayment.receiverAddress,
        amount
      );

      toast.success("Transaction sent! Confirming...");
      const receipt = await tx.wait();
      toast.success("Transaction confirmed! Verifying payment...");

      const token = localStorage.getItem("token");
      const verifyRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/payment/${pendingPayment.payment.id}/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ transactionHash: receipt.hash, chainId }),
        }
      );

      if (!verifyRes.ok) throw new Error();
      toast.success("Payment successful! Subscription activated 🎉");
      setPendingPayment(null);
      fetchBillingData();
    } catch (error: any) {
      toast.error(error.message || "Payment failed");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        "Cancel your subscription? You will keep access until the end of the current period."
      )
    )
      return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${subscription?.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        toast.success("Subscription cancelled");
        fetchBillingData();
      }
    } catch (error) {
      toast.error("Failed to cancel subscription");
    }
  };

  const formatAddress = (addr: string) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  const getBlockExplorerUrl = (chainId: number, hash: string) => {
    const explorers: Record<number, string> = {
      1: "https://etherscan.io/tx",
      11155111: "https://sepolia.etherscan.io/tx",
      137: "https://polygonscan.com/tx",
      80001: "https://mumbai.polygonscan.com/tx",
      42161: "https://arbiscan.io/tx",
      8453: "https://basescan.org/tx",
    };
    return `${explorers[chainId] || "https://etherscan.io/tx"}/${hash}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-16 h-16 border-4 border-zinc-800 border-t-white rounded-full animate-spin" />
        <p className="mt-6 text-zinc-500 text-lg">
          Loading billing information...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-zinc-800/50">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-900/50 flex items-center justify-center">
            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              Billing & Subscription
            </h1>
            <p className="text-zinc-400 mt-1 sm:mt-1.5 text-sm sm:text-base">
              Manage your plan and pay securely with USDC
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {walletAddress ? (
            <Button
              variant="outline"
              onClick={disconnectWallet}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <Wallet className="h-4 w-4 mr-2" />
              {formatAddress(walletAddress)}
            </Button>
          ) : (
            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              className="bg-gradient-to-r from-white to-zinc-400 text-black hover:from-zinc-200 hover:to-zinc-500 shadow-lg"
            >
              <Wallet className="h-5 w-5 mr-2" />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push("/pricing")}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            View Plans
          </Button>
        </div>
      </div>

      {/* Pending Payment Alert */}
      {pendingPayment && (
        <Card className="border-2 border-blue-500/50 bg-blue-900/20 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-blue-400">
              <Zap className="h-6 w-6" />
              Complete Your Payment
            </CardTitle>
            <CardDescription className="text-zinc-300">
              Send {pendingPayment.amount} USDC to activate your subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-zinc-400">Receiver Address</Label>
              <code className="block mt-2 p-3 bg-zinc-800/70 rounded-lg border border-zinc-700 text-sm font-mono text-white break-all">
                {pendingPayment.receiverAddress}
              </code>
            </div>
            <div>
              <Label className="text-zinc-400">Choose Network</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                {supportedChains.map((chain) => (
                  <Button
                    key={chain.chainId}
                    onClick={() => sendUSDCPayment(chain.chainId)}
                    disabled={processingPayment}
                    variant="outline"
                    className="border-zinc-600 hover:bg-zinc-800 hover:text-white"
                  >
                    {chain.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Subscription */}
      <Card className="bg-zinc-900/50 backdrop-blur-sm border-zinc-800">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-zinc-400" />
              <div>
                <CardTitle className="text-2xl text-white">
                  Current Plan
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Your subscription details
                </CardDescription>
              </div>
            </div>
            {subscription && (
              <Badge
                variant={
                  subscription.status === "active" ? "default" : "secondary"
                }
                className="text-lg px-4 py-1 capitalize"
              >
                {subscription.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {subscription ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-zinc-500 text-sm">Plan</p>
                  <p className="text-3xl font-bold text-white capitalize">
                    {subscription.plan}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-500 text-sm">Monthly Price</p>
                  <p className="text-3xl font-bold text-white">
                    ${subscription.price} USDC
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-500 text-sm">Billing Period</p>
                  <p className="text-2xl font-semibold text-white capitalize">
                    {subscription.billingCycle}
                  </p>
                </div>
              </div>

              {subscription.walletAddress && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Wallet className="h-5 w-5" />
                  <span>
                    Paid from: {formatAddress(subscription.walletAddress)}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar className="h-5 w-5" />
                <span>
                  {new Date(
                    subscription.currentPeriodStart
                  ).toLocaleDateString()}{" "}
                  →{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                {walletAddress && subscription.plan !== "enterprise" && (
                  <Button
                    onClick={() =>
                      createPaymentIntent(
                        subscription.plan === "free"
                          ? "starter"
                          : "professional"
                      )
                    }
                    className="bg-gradient-to-r from-white to-zinc-400 text-black hover:from-zinc-200 hover:to-zinc-500 shadow-lg font-medium"
                  >
                    <ArrowUpRight className="h-5 w-5 mr-2" />
                    Upgrade / Renew with USDC
                  </Button>
                )}
                {subscription.status === "active" &&
                  subscription.plan !== "free" && (
                    <Button
                      variant="destructive"
                      onClick={handleCancelSubscription}
                    >
                      Cancel Subscription
                    </Button>
                  )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-zinc-800 flex items-center justify-center">
                <CreditCard className="h-10 w-10 text-zinc-600" />
              </div>
              <h3 className="text-2xl font-semibold text-white">
                No Active Subscription
              </h3>
              <p className="text-zinc-400 max-w-md mx-auto">
                You're currently on the Free plan. Upgrade to unlock more AI
                reviews and features.
              </p>
              <Button
                onClick={() => router.push("/pricing")}
                className="bg-gradient-to-r from-white to-zinc-400 text-black hover:from-zinc-200 hover:to-zinc-500 shadow-lg text-lg px-8 py-6"
              >
                <Zap className="h-6 w-6 mr-3" />
                Explore Paid Plans
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      {usage && subscription && (
        <Card className="bg-zinc-900/50 backdrop-blur-sm border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-zinc-400" />
              Monthly Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-zinc-300 font-medium">
                  AI Code Reviews This Month
                </span>
                <span className="text-xl font-bold text-white">
                  {usage.currentMonthReviews} /{" "}
                  {usage.monthlyReviewLimit === -1
                    ? "Unlimited"
                    : usage.monthlyReviewLimit}
                </span>
              </div>
              <Progress value={usage.usagePercentage} className="h-4" />
              {usage.usagePercentage >= 80 &&
                usage.monthlyReviewLimit !== -1 && (
                  <div className="flex items-center gap-2 mt-4 text-orange-400">
                    <AlertCircle className="h-5 w-5" />
                    <span>
                      You’re using {usage.usagePercentage.toFixed(0)}% of your
                      monthly limit. Consider upgrading!
                    </span>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card className="bg-zinc-900/50 backdrop-blur-sm border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-zinc-400" />
            Payment History
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Your USDC transaction records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payments recorded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-5 rounded-xl bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "p-3 rounded-full",
                        payment.status === "succeeded"
                          ? "bg-emerald-500/20"
                          : payment.status === "failed"
                            ? "bg-red-500/20"
                            : "bg-zinc-700"
                      )}
                    >
                      {payment.status === "succeeded" ? (
                        <CheckCircle className="h-6 w-6 text-emerald-400" />
                      ) : payment.status === "failed" ? (
                        <AlertCircle className="h-6 w-6 text-red-400" />
                      ) : (
                        <Clock className="h-6 w-6 text-zinc-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-xl font-semibold text-white">
                          {payment.amount} {payment.currency}
                        </p>
                        <Badge
                          variant={
                            payment.status === "succeeded"
                              ? "default"
                              : payment.status === "failed"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {payment.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-400 mt-1">
                        {new Date(payment.createdAt).toLocaleDateString(
                          "en-US",
                          { year: "numeric", month: "long", day: "numeric" }
                        )}
                      </p>
                      {payment.transactionHash && payment.chainId && (
                        <a
                          href={getBlockExplorerUrl(
                            payment.chainId,
                            payment.transactionHash
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mt-2"
                        >
                          View Transaction
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  {payment.fromAddress && (
                    <div className="text-right">
                      <p className="text-sm text-zinc-500">From</p>
                      <p className="font-mono text-sm text-zinc-300">
                        {formatAddress(payment.fromAddress)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
