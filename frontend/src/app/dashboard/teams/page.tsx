'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Settings, Crown } from 'lucide-react';
import Link from 'next/link';

interface Team {
  id: string;
  name: string;
  description?: string;
  plan: string;
  maxProjects: number;
  maxMembers: number;
  role: string;
  owner: {
    fullName: string;
    email: string;
  };
  createdAt: string;
}

export default function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      toast.error('Unable to load teams list');
    } finally {
      setLoading(false);
    }
  };

  const getPlanBadge = (plan: string) => {
    const variants: Record<string, any> = {
      free: 'default',
      starter: 'info',
      professional: 'success',
      enterprise: 'warning',
    };
    return variants[plan] || 'default';
  };

  const getRoleBadge = (role: string) => {
    if (role === 'owner') return 'warning';
    if (role === 'admin') return 'info';
    return 'default';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-600 mt-1">Manage teams and collaborators</p>
        </div>
        <Button onClick={() => router.push('/dashboard/teams/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No teams yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create a team to collaborate with teammates
            </p>
            <Button onClick={() => router.push('/dashboard/teams/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {team.name}
                      {team.role === 'owner' && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {team.description || 'No description'}
                    </CardDescription>
                  </div>
                  <Link href={`/dashboard/teams/${team.id}`}>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={getPlanBadge(team.plan)}>
                      {team.plan.toUpperCase()}
                    </Badge>
                    <Badge variant={getRoleBadge(team.role)}>
                      {team.role.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Projects:</span>
                      <span className="font-medium">{team.maxProjects === -1 ? 'Unlimited' : team.maxProjects}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Members:</span>
                      <span className="font-medium">{team.maxMembers === -1 ? 'Unlimited' : team.maxMembers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Owner:</span>
                      <span className="font-medium truncate max-w-[150px]">{team.owner.fullName}</span>
                    </div>
                  </div>

                  <Link href={`/dashboard/teams/${team.id}`}>
                    <Button variant="outline" className="w-full mt-2">
                      Xem Chi Tiết
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
