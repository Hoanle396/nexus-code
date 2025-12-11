'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Users, Crown, Mail, Trash2, Copy, CheckCircle } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  description?: string;
  plan: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  maxProjects: number;
  maxMembers: number;
  monthlyReviewLimit: number;
  createdAt: string;
  ownerId: string;
}

interface TeamMember {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
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
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

  const fetchTeamData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [teamRes, membersRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/${teamId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/${teamId}/members`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (!teamRes.ok || !membersRes.ok) throw new Error();

      const teamData = await teamRes.json();
      const membersData = await membersRes.json();

      setTeam(teamData);
      setMembers(membersData);
    } catch (error) {
      toast.error('Unable to load team information');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    setInviteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/${teamId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole.toLowerCase() }),
      });

      if (!response.ok) throw new Error();

      toast.success('Invitation sent successfully!');
      setShowInviteDialog(false);
      setInviteEmail('');
      fetchTeamData();
    } catch (error) {
      toast.error('Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error();

      toast.success('Member removed successfully');
      fetchTeamData();
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/${teamId}/members/${memberId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole.toLowerCase() }),
      });

      if (!response.ok) throw new Error();

      toast.success('Role updated successfully');
      fetchTeamData();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const copyInvitationLink = (token: string) => {
    const link = `${window.location.origin}/dashboard/invitations?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast.success('Invitation link copied!');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getPlanBadge = (plan: string) => {
    const variants: Record<string, any> = {
      FREE: 'default',
      STARTER: 'success',
      PROFESSIONAL: 'warning',
      ENTERPRISE: 'info',
    };
    return <Badge variant={variants[plan]}>{plan}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, any> = {
      OWNER: 'info',
      ADMIN: 'warning',
      MEMBER: 'success',
      VIEWER: 'default',
    };
    return <Badge variant={variants[role]}>{role}</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!team) {
    return <div className="text-center py-12">Team not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <p className="text-muted-foreground">{team.description}</p>
        </div>
        <div className="flex gap-2">
          {getPlanBadge(team.plan)}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members ({members.length}/{team.maxMembers})
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Service Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{team.plan}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Project Limit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{team.maxProjects}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Reviews/month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {team.monthlyReviewLimit === -1 ? 'Unlimited' : team.monthlyReviewLimit}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Team Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-medium">Name:</span> {team.name}
              </div>
              <div>
                <span className="font-medium">Description:</span> {team.description || 'No description'}
              </div>
              <div>
                <span className="font-medium">Created:</span> {new Date(team.createdAt).toLocaleDateString('en-US')}
              </div>
              <div>
                <span className="font-medium">Members:</span> {members.length}/{team.maxMembers}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Member List</CardTitle>
                  <CardDescription>Manage team members</CardDescription>
                </div>
                <Button onClick={() => setShowInviteDialog(true)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {member.role === 'OWNER' && <Crown className="h-5 w-5 text-yellow-500" />}
                      <div>
                        <div className="font-medium">
                          {member.user.firstName} {member.user.lastName} ({member.user.email})
                        </div>
                        <div className="flex gap-2 mt-1">
                          {getRoleBadge(member.role)}
                          {member.status === 'PENDING' && <Badge variant="warning">Pending</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {member.status === 'PENDING' && member.invitationToken && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyInvitationLink(member.invitationToken!)}
                        >
                          {copiedToken === member.invitationToken ? (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          ) : (
                            <Copy className="h-4 w-4 mr-1" />
                          )}
                          Copy Link
                        </Button>
                      )}
                      
                      {member.role !== 'OWNER' && (
                        <>
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="MEMBER">Member</option>
                            <option value="VIEWER">Viewer</option>
                          </select>

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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
              <CardDescription>Configure team information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Team Name</Label>
                <Input defaultValue={team.name} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input defaultValue={team.description} />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Actions that cannot be undone</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive">Delete Team</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Member</DialogTitle>
            <DialogDescription>
              Send an invitation via email to add a member to the team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="member@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="ADMIN">Admin - Manage team</option>
                <option value="MEMBER">Member - Team member</option>
                <option value="VIEWER">Viewer - View only</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleInviteMember} disabled={inviteLoading} className="flex-1">
                {inviteLoading ? 'Sending...' : 'Send Invitation'}
              </Button>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
