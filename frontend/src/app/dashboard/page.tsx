'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, GitBranch, Activity, Settings, Users } from 'lucide-react';
import { projectService, Project } from '@/services/project.service';
import Link from 'next/link';

interface Team {
  id: string;
  name: string;
  plan: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
    loadProjects();
  }, []);

  const loadTeams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      // Silently fail
    }
  };

  const loadProjects = async (teamId?: string) => {
    try {
      const data = await projectService.getAll(teamId);
      setProjects(data);
    } catch (error) {
      toast.error('Unable to load projects list');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(teamId);
    setLoading(true);
    loadProjects(teamId === 'all' ? undefined : teamId);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-primary to-secondary bg-clip-text text-transparent">
            Projects
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Manage your projects</p>
        </div>
        <Button onClick={() => router.push('/dashboard/projects/new')} size="lg" className="shadow-lg hover:shadow-xl">
          <Plus className="h-5 w-5 mr-2" />
          Add Project
        </Button>
      </div>

      {/* Team Filter */}
      {teams.length > 0 && (
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-gray-100">
            <div className="flex items-center gap-3 flex-wrap">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-gray-700">Filter by team:</span>
              <button
                onClick={() => handleTeamChange('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedTeam === 'all'
                    ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => handleTeamChange(team.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedTeam === team.id
                      ? 'bg-gradient-to-r from-secondary to-secondary/90 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {team.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <Card className="bg-gradient-to-br from-white to-primary/5 border-2 border-dashed border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white text-4xl shadow-lg animate-pulse">
              ✨
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-primary bg-clip-text text-transparent">
                No projects yet
              </h3>
              <p className="text-gray-600 max-w-md">
                Create your first project to start automatic AI code reviews and improve code quality
              </p>
            </div>
            <Button 
              onClick={() => router.push('/dashboard/projects/new')}
              size="lg"
              className="shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <Card 
              key={project.id} 
              className="group hover:-translate-y-1 transition-all duration-300 animate-fade-in border-l-4 border-l-primary"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-2 text-base">
                      <span className="text-2xl">{project.type === 'github' ? '🐙' : '🦊'}</span>
                      {project.type === 'github' ? 'GitHub' : 'GitLab'}
                    </CardDescription>
                  </div>
                  <Link href={`/dashboard/projects/${project.id}`}>
                    <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.team && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <Badge variant="default" className="shadow-sm">
                      {project.team.name}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-700">
                  <GitBranch className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="truncate text-sm font-medium">{project.repositoryUrl}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <Badge 
                    variant={project.autoReview ? "success" : "secondary"}
                    className="shadow-sm"
                  >
                    {project.autoReview ? '✓ Auto Review ON' : 'Auto Review OFF'}
                  </Badge>
                </div>
                {project.businessContext && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                      {project.businessContext}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
