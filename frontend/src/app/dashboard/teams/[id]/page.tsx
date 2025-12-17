"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/store/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Users,
  Crown,
  Mail,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
  Settings,
  ArrowUpRight,
  Plane,
  Eye,
  Shield,
  Loader2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  description?: string;
  plan: "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
  maxProjects: number;
  maxMembers: number;
  monthlyReviewLimit: number;
  createdAt: string;
  ownerId: string;
}

interface TeamMember {
  id: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: "pending" | "accepted" | "declined";
  invitationToken?: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  const { user } = useAuthStore();

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER" | "VIEWER">(
    "MEMBER"
  );
  const [inviteLoading, setInviteLoading] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(emailRegex.test(inviteEmail));
  }, [inviteEmail]);

  // Get current user's role in this team
  const currentUserRole = useMemo(() => {
    if (!user || !members.length) return null;
    const currentUserMembership = members.find(
      (member) => member.user.id === user.id || member.user.email === user.email
    );
    return currentUserMembership?.role || null;
  }, [user, members]);

  // Check if current user can manage members (OWNER or ADMIN)
  const canManageMembers = useMemo(() => {
    return currentUserRole === "owner" || currentUserRole === "admin";
  }, [currentUserRole]);

  const fetchTeamData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [teamRes, membersRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/${teamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/${teamId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!teamRes.ok || !membersRes.ok) throw new Error();

      const teamData = await teamRes.json();
      const membersData = await membersRes.json();

      setTeam(teamData);
      setMembers(membersData);
    } catch (error) {
      toast.error("Unable to load team information");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    setInviteLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/teams/${teamId}/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: inviteEmail,
            role: inviteRole.toLowerCase(),
          }),
        }
      );

      if (!response.ok) throw new Error();

      toast.success("Invitation sent successfully!");
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteRole("MEMBER");
      fetchTeamData();
    } catch (error) {
      toast.error("Failed to send invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/teams/${teamId}/members/${memberId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error();

      toast.success("Member removed successfully");
      fetchTeamData();
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  const handleUpdateRole = async (
    memberId: string,
    newRole: "admin" | "member" | "viewer"
  ) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/teams/${teamId}/members/${memberId}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newRole.toLowerCase() }),
        }
      );

      if (!response.ok) throw new Error();

      toast.success("Role updated successfully");
      fetchTeamData();
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const copyInvitationLink = (token: string) => {
    const link = `${window.location.origin}/dashboard/invitations?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast.success("Invitation link copied to clipboard!");
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/teams/${teamId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete team");
      }

      toast.success("Team deleted successfully!");
      setShowDeleteDialog(false);
      router.push("/dashboard/teams");
    } catch (error: any) {
      console.error("Delete team error:", error);
      toast.error(error.message || "Failed to delete team");
    } finally {
      setDeleting(false);
    }
  };

  const getPlanVariant = (plan: string) => {
    switch (plan) {
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

  const getRoleVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "destructive";
      case "admin":
        return "default";
      case "member":
        return "success";
      case "viewer":
        return "secondary";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-16 h-16 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
        <p className="mt-6 text-zinc-500 text-lg">Loading team details...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-20 text-zinc-500 text-xl">
        Team not found
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="text-zinc-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all duration-300"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Teams
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-zinc-800/50">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-900/50 flex items-center justify-center">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-white">
              {team.name}
            </h1>
            {team.description && (
              <p className="text-zinc-400 mt-1 sm:mt-1.5 text-sm sm:text-base">
                {team.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={getPlanVariant(team.plan)}
            className={cn(
              "text-lg px-4 py-2 font-semibold capitalize",
              team.plan === "ENTERPRISE" &&
              "bg-red-500/20 text-red-400 border-red-500/50",
              team.plan === "PROFESSIONAL" &&
              "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
            )}
          >
            {team.plan.toLowerCase()}
          </Badge>
          {team.plan !== "ENTERPRISE" && (
            <Button
              onClick={() => router.push(`/dashboard/billing?team=${teamId}`)}
              size="default"
              className="bg-emerald-400 text-black hover:bg-emerald-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/50 transition-all duration-300 font-semibold group w-full sm:w-auto hover:scale-[1.02]"
            >
              <Plane className="h-5 w-5 mr-2 rotate-15 group-hover:-rotate-15 transition-transform duration-300" />
              Upgrade Plan
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-zinc-900/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">
            Members ({members.length}/
            {team.maxMembers === -1 ? "∞" : team.maxMembers})
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-zinc-900/50 border-emerald-400/20 backdrop-blur-sm hover:border-emerald-400/40 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-zinc-400">Current Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white capitalize">
                  {team.plan.toLowerCase()}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-emerald-400/20 backdrop-blur-sm hover:border-emerald-400/40 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-zinc-400">Project Limit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  {team.maxProjects === -1 ? "Unlimited" : team.maxProjects}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-emerald-400/20 backdrop-blur-sm hover:border-emerald-400/40 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-zinc-400">Monthly Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  {team.monthlyReviewLimit === -1
                    ? "Unlimited"
                    : team.monthlyReviewLimit}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-zinc-900/50 border-emerald-400/20 backdrop-blur-sm hover:border-emerald-400/40 transition-all duration-300">
            <CardHeader>
              <CardTitle>Team Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-zinc-300">
              <div>
                <span className="font-medium text-zinc-500">Created:</span>{" "}
                {new Date(team.createdAt).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium text-zinc-500">Members:</span>{" "}
                {members.length}/
                {team.maxMembers === -1 ? "Unlimited" : team.maxMembers}
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-zinc-500">Description:</span>{" "}
                {team.description || (
                  <span className="italic text-zinc-600">No description</span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          <Card className="bg-zinc-900/50 border-emerald-400/20 backdrop-blur-sm hover:border-emerald-400/40 transition-all duration-300">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Invite and manage team access
                  </CardDescription>
                </div>
                {canManageMembers && (
                  <Button
                    onClick={() => setShowInviteDialog(true)}
                    className="bg-emerald-400 text-black hover:bg-emerald-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/50 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-5 rounded-xl bg-zinc-800/50 border border-emerald-400/20 hover:border-emerald-400/40 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 ring-2 ring-zinc-700">
                      <AvatarFallback className="bg-gradient-to-br from-zinc-600 to-zinc-800 text-white font-semibold">
                        {member.user.firstName?.[0] ||
                          member.user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-white">
                          {member.user.firstName || member.user.lastName
                            ? `${member.user.firstName || ""} ${member.user.lastName || ""
                              }`.trim()
                            : member.user.email}
                        </p>
                        {member.role === "owner" && (
                          <Crown className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-sm text-zinc-400">
                        {member.user.email}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant={getRoleVariant(member.role)}
                          className={cn(
                            "capitalize",
                            member.role === "owner" &&
                            "bg-orange-500/20 text-orange-400 border-orange-500/50"
                          )}
                        >
                          {member.role.toLowerCase()}
                        </Badge>
                        {member.status === "pending" && (
                          <Badge
                            variant="secondary"
                            className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                          >
                            Pending Invitation
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {member.status === "pending" && member.invitationToken && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyInvitationLink(member.invitationToken!)
                        }
                        className="border-zinc-600 text-white hover:bg-zinc-700"
                      >
                        {copiedToken === member.invitationToken ? (
                          <CheckCircle className="h-4 w-4 mr-1 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4 mr-1" />
                        )}
                        {copiedToken === member.invitationToken
                          ? "Copied!"
                          : "Copy Link"}
                      </Button>
                    )}

                    {canManageMembers &&
                      member.role !== "owner" &&
                      member.status === "accepted" && (
                        <>
                          <Select
                            value={member.role}
                            onValueChange={(value) =>
                              handleUpdateRole(member.id, value as any)
                            }
                          >
                            <SelectTrigger className=" bg-zinc-800 border-zinc-700 text-white w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-700">
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-zinc-900/50 border-emerald-400/20 backdrop-blur-sm hover:border-emerald-400/40 transition-all duration-300">
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
              <CardDescription>
                Update team name and description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-zinc-200">Team Name</Label>
                <Input
                  defaultValue={team.name}
                  className="bg-zinc-800/50 border-zinc-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white transition-all duration-300"
                  placeholder="Team name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-200">Description</Label>
                <Input
                  defaultValue={team.description || ""}
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                  placeholder="Team description (optional)"
                />
              </div>
              <Button className="bg-emerald-400 text-black hover:bg-emerald-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/50 transition-all duration-300 hover:scale-[1.02]">
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-900/50 bg-red-900/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <CardTitle className="text-red-500">Danger Zone</CardTitle>
              </div>
              <CardDescription className="text-zinc-400">
                These actions are permanent and cannot be undone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteClick}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Delete This Team
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md p-6">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <DialogTitle className="text-xl font-bold text-white text-center">
              Delete Team?
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-center text-sm">
              You're about to delete{" "}
              <span className="font-semibold text-white">"{team?.name}"</span>.
              This will permanently remove all team data, projects, and members.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
              <p className="text-red-400 text-xs text-center font-medium">
                ⚠️ This action cannot be undone
              </p>
            </div>
          </div>
          <DialogFooter className="flex-row gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
              className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
          {/* Header with gradient */}
          <div className="relative mx-0 mt-0 px-6 py-6 rounded-t-lg bg-gradient-to-br from-emerald-500/10 via-emerald-400/5 to-transparent border-b border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center ring-2 ring-emerald-500/30">
                <Mail className="h-6 w-6 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">
                  Invite Team Member
                </DialogTitle>
                <DialogDescription className="text-zinc-400 text-sm">
                  Send an invitation to collaborate on this team
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="space-y-6 py-2 rounded-b-lg p-6">
            {/* Email Input with Validation */}
            <div className="space-y-2">
              <Label className="text-zinc-200 font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className={cn(
                    "bg-zinc-800/50 border-zinc-700 h-12 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-zinc-500 transition-all duration-300 pr-10",
                    inviteEmail &&
                    (emailValid
                      ? "border-emerald-500/50 focus:border-emerald-400"
                      : "border-red-500/50 focus:border-red-400")
                  )}
                />
                {inviteEmail && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {emailValid ? (
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                )}
              </div>
              {inviteEmail && !emailValid && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Please enter a valid email address
                </p>
              )}
            </div>

            {/* Role Selection Cards */}
            <div className="space-y-3">
              <Label className="text-zinc-200 font-medium">
                Select Role & Permissions
              </Label>
              <div className="grid grid-cols-1 gap-3">
                {/* Admin Role */}
                <button
                  type="button"
                  onClick={() => setInviteRole("ADMIN")}
                  className={cn(
                    "relative p-2 rounded-xl border-2 text-left transition-all duration-300 group",
                    inviteRole === "ADMIN"
                      ? "border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
                      : "border-zinc-700 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/50"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
                        inviteRole === "ADMIN"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-zinc-700/50 text-zinc-400 group-hover:bg-zinc-600/50"
                      )}
                    >
                      <Shield className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-white">Admin</h4>
                        {inviteRole === "ADMIN" && (
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                        )}
                      </div>
                      <p className="text-sm text-zinc-400 mt-1">
                        Full access to manage team, projects, and members
                      </p>
                    </div>
                  </div>
                </button>

                {/* Member Role */}
                <button
                  type="button"
                  onClick={() => setInviteRole("MEMBER")}
                  className={cn(
                    "relative p-2 rounded-xl border-2 text-left transition-all duration-300 group",
                    inviteRole === "MEMBER"
                      ? "border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
                      : "border-zinc-700 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/50"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
                        inviteRole === "MEMBER"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-zinc-700/50 text-zinc-400 group-hover:bg-zinc-600/50"
                      )}
                    >
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-white">Member</h4>
                        {inviteRole === "MEMBER" && (
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                        )}
                      </div>
                      <p className="text-sm text-zinc-400 mt-1">
                        Standard access to collaborate on team projects
                      </p>
                    </div>
                  </div>
                </button>

                {/* Viewer Role */}
                <button
                  type="button"
                  onClick={() => setInviteRole("VIEWER")}
                  className={cn(
                    "relative p-2 rounded-xl border-2 text-left transition-all duration-300 group",
                    inviteRole === "VIEWER"
                      ? "border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
                      : "border-zinc-700 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/50"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
                        inviteRole === "VIEWER"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-zinc-700/50 text-zinc-400 group-hover:bg-zinc-600/50"
                      )}
                    >
                      <Eye className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-white">Viewer</h4>
                        {inviteRole === "VIEWER" && (
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                        )}
                      </div>
                      <p className="text-sm text-zinc-400 mt-1">
                        Read-only access to view team projects
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <DialogFooter className="flex-row gap-3 sm:gap-3 pt-4 border-t border-zinc-800 px-6 py-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setShowInviteDialog(false);
                setInviteEmail("");
                setInviteRole("MEMBER");
              }}
              disabled={inviteLoading}
              className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all duration-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteMember}
              size="lg"
              disabled={inviteLoading || !inviteEmail || !emailValid}
              className={cn(
                "flex-1 bg-emerald-400 text-black hover:bg-emerald-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/50 transition-all duration-300 font-semibold",
                (!inviteLoading && inviteEmail && emailValid) &&
                "hover:scale-[1.02]"
              )}
            >
              {inviteLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending Invitation...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Send Invitation
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
