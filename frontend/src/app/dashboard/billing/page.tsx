"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@bprogress/next/app";
import Link from "next/link";
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
  Send,
} from "lucide-react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSignMessage,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { parseUnits } from "viem";
import { USDT_CONTRACT_ADDRESS, USDT_ABI } from "@/lib/wagmi.config";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardHeader from "@/components/layout/dashboard-header";

interface Team {
  id: string;
  name: string;
  description?: string;
  plan: string;
  role: string;
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

interface PaymentRequest {
  paymentId: string;
  salt: string;
  message: string;
  amount: number;
  receiverAddress: string;
  chainInfo: {
    chainId: number;
    name: string;
    usdtAddress: string;
  };
  expiresAt: number;
}

const PLAN_PRICES = {
  free: 0,
  starter: 29,
  professional: 99,
  enterprise: 299,
};

interface Team {
  id: string;
  name: string;
  description?: string;
  plan: string;
  role: string;
}

export default function BillingPage() {
  const router = useRouter();
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(
    null
  );
  const [processingStep, setProcessingStep] = useState<string>("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedContext, setSelectedContext] = useState<string>("");

  useEffect(() => {
    // Check for team parameter in URL
    const params = new URLSearchParams(window.location.search);
    const teamParam = params.get("team");

    if (teamParam) {
      setSelectedContext(teamParam);
    }

    loadTeams();
    fetchBillingData();
  }, []);

  useEffect(() => {
    fetchBillingData();
  }, [selectedContext]);

  const loadTeams = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
        // Only set default if not already set by URL param
        if (!selectedContext) {
          if (data.length > 0) {
            setSelectedContext(data[0].id);
          } else {
            setSelectedContext("personal");
          }
        }
      }
    } catch (error) {
      console.error("Unable to load teams", error);
      setSelectedContext("personal");
    }
  };

  const fetchBillingData = async () => {
    // Don't fetch if context not set yet
    if (!selectedContext) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const endpoint =
        selectedContext === "personal"
          ? `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/me`
          : `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/team/${selectedContext}`;

      const subRes = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
      }
    } catch (error) {
      toast.error("Unable to load billing information");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = () => {
    const injectedConnector = connectors.find((c) => c.id === "injected");
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    } else {
      toast.error("No wallet connector found. Please install MetaMask.");
    }
  };

  const handleUpgrade = async (plan: string) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setProcessingStep("Creating payment request...");
      const token = localStorage.getItem("token");
      let subId = subscription?.id;

      // Create or update subscription
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
              ...(selectedContext !== "personal" && {
                teamId: selectedContext,
              }),
            }),
          }
        );
        if (updateRes.ok) {
          const updatedSub = await updateRes.json();
          setSubscription(updatedSub);
        }
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
              ...(selectedContext !== "personal" && {
                teamId: selectedContext,
              }),
            }),
          }
        );
        if (createRes.ok) {
          const newSub = await createRes.json();
          setSubscription(newSub);
          subId = newSub.id;
        }
      }

      // Step 1: Create payment request
      const amount = PLAN_PRICES[plan as keyof typeof PLAN_PRICES];
      const paymentReqRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${subId}/payment/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount }),
        }
      );

      if (!paymentReqRes.ok)
        throw new Error("Failed to create payment request");

      const paymentReqData: PaymentRequest = await paymentReqRes.json();
      setPaymentRequest(paymentReqData);

      // Step 2: Sign message
      setProcessingStep("Waiting for signature...");
      const signature = await signMessageAsync({
        message: paymentReqData.message,
      });

      setProcessingStep("Submitting signature...");
      const signatureRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/payment/${paymentReqData.paymentId}/signature`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            signature,
            walletAddress: address,
          }),
        }
      );

      if (!signatureRes.ok) throw new Error("Signature verification failed");

      toast.success("Signature verified! Ready to send USDT.");
      setProcessingStep("");
    } catch (error: any) {
      toast.error(error.message || "Payment initiation failed");
      setProcessingStep("");
      setPaymentRequest(null);
    }
  };

  const handleSendUSDT = async () => {
    if (!paymentRequest || !address) return;

    try {
      setProcessingStep("Switching to Sepolia Testnet...");

      // Switch to Sepolia if needed
      if (chainId !== sepolia.id) {
        await switchChain({ chainId: sepolia.id });
      }

      setProcessingStep("Sending USDT...");
      const amountInWei = parseUnits(paymentRequest.amount.toString(), 6);

      const hash = await writeContractAsync({
        address: USDT_CONTRACT_ADDRESS,
        abi: USDT_ABI,
        functionName: "transfer",
        args: [paymentRequest.receiverAddress as `0x${string}`, amountInWei],
      });

      toast.success("Transaction sent! 🎉");
      toast.loading("Our system is automatically verifying your payment...");

      setProcessingStep("Waiting for automatic verification...");

      // Store transaction hash for backend to pick up
      const token = localStorage.getItem("token");

      // Wait for blockchain confirmation and listener to pick up the event
      // The backend listener will automatically verify the payment
      let attempts = 0;
      const maxAttempts = 30; // Check for 30 seconds

      const checkInterval = setInterval(async () => {
        attempts++;

        // Check if payment has been verified
        const paymentsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${subscription?.id}/payments`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (paymentsRes.ok) {
          const payments = await paymentsRes.json();
          const currentPayment = payments.find(
            (p: any) => p.id === paymentRequest.paymentId
          );

          if (currentPayment?.status === "succeeded") {
            clearInterval(checkInterval);
            toast.dismiss();
            toast.success("Payment verified! Subscription activated 🎉");
            setPaymentRequest(null);
            setProcessingStep("");
            fetchBillingData();
            return;
          }
        }

        // Stop checking after max attempts
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          toast.dismiss();
          toast.success(
            "Payment submitted! Our system will verify it automatically within a few minutes.",
            { duration: 5000 }
          );
          setPaymentRequest(null);
          setProcessingStep("");
          fetchBillingData();
        }
      }, 1000); // Check every second
    } catch (error: any) {
      toast.error(error.message || "Payment failed");
      setProcessingStep("");
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

  const formatAddress = (addr?: string) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-16 h-16 border-4 border-zinc-800 border-t-emerald-400 rounded-full animate-spin" />
        <p className="mt-6 text-zinc-500 text-lg">
          Loading billing information...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-8">
      {/* Header */}
      <DashboardHeader
        icon={<DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />}
        title="Team Billing"
        description="Manage team subscriptions and pay securely with USDT"
        rightAction={
          isConnected && address ? (
            <Button
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800/50 hover:border-zinc-600 text-white"
              onClick={() => disconnect()}
            >
              {`${address.slice(0, 6)}...${address.slice(-4)}`}
            </Button>
          ) : (
            <Button
              onClick={handleConnectWallet}
              className="bg-emerald-400 text-black hover:bg-emerald-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/50 transition-all duration-300 font-semibold hover:scale-[1.02]"
            >
              Connect Wallet
            </Button>
          )
        }
      />

      {/* Context Selector (Team Selection) */}
      <Card className="bg-zinc-900/50 backdrop-blur-sm border-emerald-400/20 hover:border-emerald-400/40 transition-all duration-300">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <Label className="text-zinc-300 font-medium">Select Team:</Label>
            <Select value={selectedContext} onValueChange={setSelectedContext}>
              <SelectTrigger className="w-80 bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem
                    key={team.id}
                    value={team.id}
                    className="text-slate-800"
                  >
                    {team.name} - {team.plan.toUpperCase()} Plan
                  </SelectItem>
                ))}
                <SelectItem value="personal" className="text-slate-800">
                  💼 Personal Account
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Processing Payment Alert */}
      {processingStep && (
        <Card className="border-2 border-blue-500/50 bg-blue-900/20 backdrop-blur-sm shadow-2xl">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div>
                <p className="text-white font-semibold">{processingStep}</p>
                <p className="text-zinc-400 text-sm">Please wait...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Request Alert */}
      {paymentRequest && !processingStep && (
        <Card className="border-2 border-green-500/50 bg-green-900/20 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-green-400">
              <Send className="h-6 w-6" />
              Ready to Send USDT
            </CardTitle>
            <CardDescription className="text-zinc-300">
              Sign verified! Now send {paymentRequest.amount} USDT to complete
              your payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-zinc-400">Receiver Address</Label>
              <code className="block mt-2 p-3 bg-zinc-800/70 rounded-lg border border-zinc-700 text-sm font-mono text-white break-all">
                {paymentRequest.receiverAddress}
              </code>
            </div>
            <div>
              <Label className="text-zinc-400">Network</Label>
              <p className="text-white font-semibold mt-1">
                {paymentRequest.chainInfo.name}
              </p>
            </div>
            <Button
              onClick={handleSendUSDT}
              disabled={!!processingStep}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
            >
              <Send className="h-5 w-5 mr-2" />
              Send {paymentRequest.amount} USDT
            </Button>
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
                  {selectedContext !== "personal" && teams.length > 0 && (
                    <span className="text-base font-normal text-zinc-400 ml-3">
                      ({teams.find((t) => t.id === selectedContext)?.name})
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  {selectedContext === "personal"
                    ? "Personal subscription"
                    : "Team subscription"}
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
                    ${subscription.price} USDT
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
                {isConnected && subscription.plan === "free" && (
                  <>
                    <Button
                      onClick={() => handleUpgrade("starter")}
                      disabled={!!processingStep}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg font-medium"
                    >
                      <ArrowUpRight className="h-5 w-5 mr-2" />
                      Upgrade to Starter - $29/mo
                    </Button>
                    <Button
                      onClick={() => handleUpgrade("professional")}
                      disabled={!!processingStep}
                      className="bg-gradient-to-r from-white to-zinc-400 text-black hover:from-zinc-200 hover:to-zinc-500 shadow-lg font-medium"
                    >
                      <ArrowUpRight className="h-5 w-5 mr-2" />
                      Upgrade to Professional - $99/mo
                    </Button>
                    <Button
                      onClick={() => handleUpgrade("enterprise")}
                      disabled={!!processingStep}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg font-medium"
                    >
                      <ArrowUpRight className="h-5 w-5 mr-2" />
                      Upgrade to Enterprise - $299/mo
                    </Button>
                  </>
                )}
                {isConnected && subscription.plan === "starter" && (
                  <>
                    <Button
                      onClick={() => handleUpgrade("professional")}
                      disabled={!!processingStep}
                      className="bg-gradient-to-r from-white to-zinc-400 text-black hover:from-zinc-200 hover:to-zinc-500 shadow-lg font-medium"
                    >
                      <ArrowUpRight className="h-5 w-5 mr-2" />
                      Upgrade to Professional - $99/mo
                    </Button>
                    <Button
                      onClick={() => handleUpgrade("enterprise")}
                      disabled={!!processingStep}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg font-medium"
                    >
                      <ArrowUpRight className="h-5 w-5 mr-2" />
                      Upgrade to Enterprise - $299/mo
                    </Button>
                  </>
                )}
                {isConnected && subscription.plan === "professional" && (
                  <Button
                    onClick={() => handleUpgrade("enterprise")}
                    disabled={!!processingStep}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg font-medium"
                  >
                    <ArrowUpRight className="h-5 w-5 mr-2" />
                    Upgrade to Enterprise - $299/mo
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
                You're currently on the Free plan. Upgrade to unlock more
                features.
              </p>
              <Link href="/pricing" target="_blank">
                <Button className="bg-gradient-to-r from-white to-zinc-400 text-black hover:from-zinc-200 hover:to-zinc-500 shadow-lg text-lg px-8 py-6">
                  <Zap className="h-6 w-6 mr-3" />
                  Explore Paid Plans
                  <ExternalLink className="h-5 w-5 ml-3" />
                </Button>
              </Link>
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
                      You're using {usage.usagePercentage.toFixed(0)}% of your
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
            Your USDT transaction records
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
                      {payment.transactionHash && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${payment.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1"
                        >
                          View on Explorer
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
