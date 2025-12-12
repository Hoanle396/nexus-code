"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
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
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  status: "PENDING" | "ACCEPTED" | "DECLINED";
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

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER" | "VIEWER">(
    "MEMBER"
  );
  const [inviteLoading, setInviteLoading] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

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
    newRole: "ADMIN" | "MEMBER" | "VIEWER"
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
      case "OWNER":
        return "destructive";
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-16 h-16 border-4 border-zinc-800 border-t-white rounded-full animate-spin" />
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
    <div className="max-w-6xl mx-auto py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-8 text-zinc-400 hover:text-white hover:bg-zinc-900/70"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Teams
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center shadow-xl">
            <Users className="h-8 w-8 text-zinc-300" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              {team.name}
            </h1>
            {team.description && (
              <p className="text-zinc-400 mt-2 text-lg">{team.description}</p>
            )}
          </div>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-zinc-400 text-sm">
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white capitalize">
                  {team.plan.toLowerCase()}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-zinc-400 text-sm">
                  Project Limit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  {team.maxProjects === -1 ? "Unlimited" : team.maxProjects}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-zinc-400 text-sm">
                  Monthly Reviews
                </CardTitle>
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

          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
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
          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Invite and manage team access
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowInviteDialog(true)}
                  className="bg-gradient-to-r from-white to-zinc-400 text-black hover:from-zinc-200 hover:to-zinc-500 shadow-lg"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-5 rounded-xl bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 transition-colors"
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
                            ? `${member.user.firstName || ""} ${
                                member.user.lastName || ""
                              }`.trim()
                            : member.user.email}
                        </p>
                        {member.role === "OWNER" && (
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
                            member.role === "OWNER" &&
                              "bg-orange-500/20 text-orange-400 border-orange-500/50"
                          )}
                        >
                          {member.role.toLowerCase()}
                        </Badge>
                        {member.status === "PENDING" && (
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
                    {member.status === "PENDING" && member.invitationToken && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyInvitationLink(member.invitationToken!)
                        }
                        className="border-zinc-600 hover:bg-zinc-700"
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

                    {member.role !== "OWNER" &&
                      member.status === "ACCEPTED" && (
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
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="MEMBER">Member</SelectItem>
                              <SelectItem value="VIEWER">Viewer</SelectItem>
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
          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
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
                  className="bg-zinc-800/50 border-zinc-700 text-white"
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
              <Button className="bg-gradient-to-r from-white to-zinc-400 text-black hover:from-zinc-200 hover:to-zinc-500">
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
                variant="destructive"
                size="lg"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Delete This Team
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Invite New Member</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Send an email invitation to join this team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-200">Email Address</Label>
              <Input
                type="email"
                placeholder="member@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-200">Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as any)}
              >
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="ADMIN">
                    Admin – Full access & manage members
                  </SelectItem>
                  <SelectItem value="MEMBER">
                    Member – Standard access
                  </SelectItem>
                  <SelectItem value="VIEWER">
                    Viewer – Read-only access
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleInviteMember}
              disabled={inviteLoading || !inviteEmail}
              className="flex-1 bg-gradient-to-r from-white to-zinc-400 text-black hover:from-zinc-200 hover:to-zinc-500"
            >
              {inviteLoading ? "Sending..." : "Send Invitation"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowInviteDialog(false)}
              className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
