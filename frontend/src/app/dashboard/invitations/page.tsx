'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle, XCircle, Clock } from 'lucide-react';

interface PendingInvitation {
  id: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
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
  const token = searchParams.get('token');

  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvitations();
    
    // If there's a token in URL, auto-show accept for that invitation
    if (token) {
      handleAcceptByToken(token);
    }
  }, [token]);

  const fetchInvitations = async () => {
    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/my-invitations`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      if (!response.ok) throw new Error();

      const data = await response.json();
      setInvitations(data);
    } catch (error) {
      toast.error('Unable to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptByToken = async (inviteToken: string) => {
    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/accept-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token: inviteToken }),
      });

      if (!response.ok) throw new Error();

      toast.success('Invitation accepted successfully!');
      // Remove token from URL
      router.replace('/dashboard/invitations');
      fetchInvitations();
    } catch (error) {
      toast.error('Unable to accept invitation');
    }
  };

  const handleAccept = async (invitation: PendingInvitation) => {
    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/accept-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token: invitation.invitationToken }),
      });

      if (!response.ok) throw new Error();

      toast.success('Invitation accepted successfully!');
      fetchInvitations();
    } catch (error) {
      toast.error('Unable to accept invitation');
    }
  };

  const handleDecline = async (invitation: PendingInvitation) => {
    if (!confirm('Are you sure you want to decline this invitation?')) return;

    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/decline-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token: invitation.invitationToken }),
      });

      if (!response.ok) throw new Error();

      toast.success('Invitation declined');
      fetchInvitations();
    } catch (error) {
      toast.error('Unable to decline invitation');
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, any> = {
      ADMIN: 'warning',
      MEMBER: 'success',
      VIEWER: 'default',
    };
    return <Badge variant={variants[role]}>{role}</Badge>;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Mail className="h-8 w-8" />
          Team Invitations
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your team invitation requests
        </p>
      </div>

      {invitations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No invitations</p>
            <p className="text-muted-foreground text-sm">
              You haven't received any team invitations yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation) => {
            const expired = isExpired(invitation.invitationExpiresAt);
            
            return (
              <Card key={invitation.id} className={expired ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {invitation.team.name}
                        {getPlanBadge(invitation.team.plan)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {invitation.team.description || 'No description'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {getRoleBadge(invitation.role)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {expired ? (
                        <span className="text-red-500">Expired</span>
                      ) : (
                        <span>
                          Expires: {new Date(invitation.invitationExpiresAt).toLocaleDateString('en-US')}
                        </span>
                      )}
                    </div>

                    {!expired && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAccept(invitation)}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDecline(invitation)}
                          className="flex items-center gap-1"
                        >
                          <XCircle className="h-4 w-4" />
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
