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
import { Mail, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PendingInvitation {
  id: string;
  role: "ADMIN" | "MEMBER" | "VIEWER";
  invitationToken: string;
  invitationExpiresAt: string;
  team: {
    id: string;
    name: string;
    description?: string;
    plan: string;
  };
}

export default function InvitationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvitations();

    if (token) {
      handleAcceptByToken(token);
    }
  }, [token]);

  const fetchInvitations = async () => {
    try {
      const authToken = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/teams/my-invitations`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (!response.ok) throw new Error();

      const data = await response.json();
      setInvitations(data);
    } catch (error) {
      toast.error("Unable to load invitations");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptByToken = async (inviteToken: string) => {
    try {
      const authToken = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/teams/accept-invitation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ token: inviteToken }),
        }
      );

      if (!response.ok) throw new Error();

      toast.success("Invitation accepted successfully!");
      router.replace("/dashboard/invitations");
      fetchInvitations();
    } catch (error) {
      toast.error("Unable to accept invitation");
    }
  };

  const handleAccept = async (invitation: PendingInvitation) => {
    try {
      const authToken = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/teams/accept-invitation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ token: invitation.invitationToken }),
        }
      );

      if (!response.ok) throw new Error();

      toast.success("Invitation accepted successfully!");
      fetchInvitations();
    } catch (error) {
      toast.error("Unable to accept invitation");
    }
  };

  const handleDecline = async (invitation: PendingInvitation) => {
    if (!confirm("Are you sure you want to decline this invitation?")) return;

    try {
      const authToken = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/teams/decline-invitation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ token: invitation.invitationToken }),
        }
      );

      if (!response.ok) throw new Error();

      toast.success("Invitation declined");
      fetchInvitations();
    } catch (error) {
      toast.error("Unable to decline invitation");
    }
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  const formatExpiry = (expiresAt: string) => {
    const date = new Date(expiresAt);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `Expires in ${days} day${days > 1 ? "s" : ""}`;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `Expires in ${hours} hour${hours > 1 ? "s" : ""}`;
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "default";
      case "MEMBER":
        return "success";
      case "VIEWER":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getPlanVariant = (plan: string) => {
    switch (plan.toUpperCase()) {
      case "FREE":
        return "secondary";
      case "STARTER":
        return "default";
      case "PROFESSIONAL":
        return "success";
      case "ENTERPRISE":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-16 h-16 border-4 border-zinc-800 border-t-white rounded-full animate-spin" />
        <p className="mt-6 text-zinc-500 text-lg font-medium">
          Loading invitations...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-zinc-800/50">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-900/50 flex items-center justify-center flex-shrink-0">
            <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              Team Invitations
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base">
              Review and respond to pending team invitations
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {invitations.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm shadow-2xl">
          <CardContent className="flex flex-col items-center justify-center py-24 space-y-8">
            <div className="w-28 h-28 rounded-full bg-zinc-800 flex items-center justify-center shadow-2xl ring-4 ring-zinc-800/50 ring-offset-4 ring-offset-black">
              <Mail className="h-14 w-14 text-zinc-400" />
            </div>
            <div className="text-center space-y-4 max-w-md">
              <h3 className="text-4xl font-bold text-white">
                No Pending Invitations
              </h3>
              <p className="text-zinc-400 text-base leading-relaxed">
                You don't have any team invitations at the moment.
              </p>
              <p className="text-zinc-500 text-sm">
                When someone invites you to a team, it will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Invitations List */
        <div className="space-y-6">
          {invitations.map((invitation, index) => {
            const expired = isExpired(invitation.invitationExpiresAt);

            return (
              <Card
                key={invitation.id}
                className={cn(
                  "bg-zinc-900/70 border-zinc-800 backdrop-blur-sm hover:border-zinc-600 hover:shadow-2xl transition-all duration-300",
                  expired && "opacity-60 border-zinc-700"
                )}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <CardHeader className="pb-5 pt-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <CardTitle className="text-2xl font-bold text-white">
                          {invitation.team.name}
                        </CardTitle>
                        <Badge
                          variant={getPlanVariant(invitation.team.plan)}
                          className={cn(
                            "capitalize font-semibold px-3 py-1",
                            invitation.team.plan.toUpperCase() ===
                            "ENTERPRISE" &&
                            "bg-red-500/10 text-red-400 border-red-500/30",
                            invitation.team.plan.toUpperCase() ===
                            "PROFESSIONAL" &&
                            "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          )}
                        >
                          {invitation.team.plan.toLowerCase()}
                        </Badge>
                      </div>
                      {invitation.team.description && (
                        <CardDescription className="text-zinc-400 text-sm leading-relaxed">
                          {invitation.team.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge
                      variant={getRoleVariant(invitation.role)}
                      className={cn(
                        "px-4 py-2 font-bold capitalize text-sm",
                        invitation.role === "ADMIN" &&
                        "bg-blue-500/10 text-blue-400 border-blue-500/30",
                        invitation.role === "MEMBER" &&
                        "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      )}
                    >
                      {invitation.role.toLowerCase()}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-800/30 border border-zinc-800">
                      <Clock className="h-5 w-5 flex-shrink-0 text-zinc-500" />
                      <span
                        className={cn("font-semibold", expired ? "text-red-400" : "text-zinc-300")}
                      >
                        {formatExpiry(invitation.invitationExpiresAt)}
                      </span>
                      {expired && (
                        <span className="flex items-center gap-1.5 text-red-400 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          Expired
                        </span>
                      )}
                    </div>

                    {!expired && (
                      <div className="flex gap-3">
                        <Button
                          size="lg"
                          onClick={() => handleAccept(invitation)}
                          className="bg-white text-black hover:bg-zinc-200 shadow-lg hover:shadow-xl font-semibold"
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Accept
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={() => handleDecline(invitation)}
                          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-600"
                        >
                          <XCircle className="h-5 w-5 mr-2" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
