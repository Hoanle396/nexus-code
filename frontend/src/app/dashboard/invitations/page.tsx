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
    <div className="max-w-4xl mx-auto py-8 space-y-10">
      {/* Header */}
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center shadow-xl">
          <Mail className="h-8 w-8 text-zinc-300" />
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Team Invitations
          </h1>
          <p className="text-zinc-400 mt-2 text-lg">
            Review and respond to pending team invitations
          </p>
        </div>
      </div>

      {/* Empty State */}
      {invitations.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 space-y-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center shadow-2xl">
              <Mail className="h-12 w-12 text-zinc-500" />
            </div>
            <div className="text-center space-y-4 max-w-md">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                No Pending Invitations
              </h3>
              <p className="text-zinc-400 text-lg">
                You don't have any team invitations at the moment.
              </p>
              <p className="text-zinc-500">
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
                  "bg-zinc-900/70 border-zinc-800 backdrop-blur-sm hover:border-zinc-700 hover:shadow-2xl transition-all duration-300",
                  expired && "opacity-60 border-zinc-700"
                )}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                        {invitation.team.name}
                        <Badge
                          variant={getPlanVariant(invitation.team.plan)}
                          className={cn(
                            "capitalize font-medium",
                            invitation.team.plan.toUpperCase() ===
                              "ENTERPRISE" &&
                              "bg-red-500/20 text-red-400 border-red-500/50"
                          )}
                        >
                          {invitation.team.plan.toLowerCase()}
                        </Badge>
                      </CardTitle>
                      {invitation.team.description && (
                        <CardDescription className="mt-3 text-zinc-400 text-base">
                          {invitation.team.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge
                      variant={getRoleVariant(invitation.role)}
                      className={cn(
                        "text-lg px-4 py-2 font-semibold capitalize",
                        invitation.role === "ADMIN" &&
                          "bg-blue-500/20 text-blue-400 border-blue-500/50"
                      )}
                    >
                      {invitation.role.toLowerCase()}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-3 text-zinc-400">
                      <Clock className="h-5 w-5 flex-shrink-0" />
                      <span
                        className={cn("font-medium", expired && "text-red-500")}
                      >
                        {formatExpiry(invitation.invitationExpiresAt)}
                      </span>
                      {expired && (
                        <span className="flex items-center gap-1 text-red-500">
                          <AlertCircle className="h-4 w-4" />
                          Invitation expired
                        </span>
                      )}
                    </div>

                    {!expired && (
                      <div className="flex gap-4">
                        <Button
                          size="lg"
                          onClick={() => handleAccept(invitation)}
                          className="bg-gradient-to-r from-white to-zinc-400 text-black hover:from-zinc-200 hover:to-zinc-500 shadow-lg hover:shadow-xl font-medium"
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Accept Invitation
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={() => handleDecline(invitation)}
                          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
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
