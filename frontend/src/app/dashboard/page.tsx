"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, GitBranch, Activity, Settings, Users } from "lucide-react";
import { projectService, Project } from "@/services/project.service";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  plan: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
    loadProjects();
  }, []);

  const loadTeams = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams`, {
        headers: { Authorization: `Bearer ${token}` },
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
      toast.error("Unable to load projects list");
    } finally {
      setLoading(false);
    }
  };

  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(teamId);
    setLoading(true);
    loadProjects(teamId === "all" ? undefined : teamId);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Projects
          </h1>
          <p className="text-zinc-400 mt-2 text-lg">
            Manage and monitor your code review projects
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/projects/new")}
          size="lg"
          className="bg-gradient-to-r from-white to-zinc-400 text-black hover:from-zinc-200 hover:to-zinc-500 shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Project
        </Button>
      </div>

      {/* Team Filter */}
      {teams.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 text-zinc-400">
            <Users className="h-5 w-5" />
            <span className="text-sm font-medium">Filter by team:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleTeamChange("all")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                selectedTeam === "all"
                  ? "bg-gradient-to-r from-white to-zinc-400 text-black shadow-md"
                  : "bg-zinc-800/70 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-700"
              )}
            >
              All Projects
            </button>
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => handleTeamChange(team.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  selectedTeam === team.id
                    ? "bg-gradient-to-r from-white to-zinc-400 text-black shadow-md"
                    : "bg-zinc-800/70 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-700"
                )}
              >
                {team.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 border-4 border-zinc-800 border-t-white rounded-full animate-spin" />
          <p className="text-zinc-500 mt-6 text-lg font-medium">
            Loading projects...
          </p>
        </div>
      ) : projects.length === 0 ? (
        /* Empty State */
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 space-y-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-white/10 to-zinc-600 flex items-center justify-center text-5xl shadow-2xl">
              ✨
            </div>
            <div className="text-center space-y-4 max-w-md">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                No projects yet
              </h3>
              <p className="text-zinc-400 text-lg">
                Start by creating your first project to enable AI-powered code
                reviews
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/projects/new")}
              size="lg"
              className="bg-gradient-to-r from-white to-zinc-400 text-black hover:from-zinc-200 hover:to-zinc-500 shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Projects Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <Card
              key={project.id}
              className="group bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 backdrop-blur-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-white group-hover:text-zinc-200 transition-colors line-clamp-1">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-2 text-zinc-400">
                      <span className="text-2xl">
                        {project.type === "github" ? "🐙" : "🦊"}
                      </span>
                      <span className="font-medium">
                        {project.type === "github" ? "GitHub" : "GitLab"}
                      </span>
                    </CardDescription>
                  </div>
                  <Link href={`/dashboard/projects/${project.id}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {project.team && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-zinc-500" />
                    <Badge
                      variant="outline"
                      className="border-zinc-700 text-zinc-300 bg-zinc-800/50"
                    >
                      {project.team.name}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-3 text-zinc-400">
                  <GitBranch className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm truncate font-medium">
                    {project.repositoryUrl}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-zinc-500" />
                  <Badge
                    variant={project.autoReview ? "default" : "secondary"}
                    className={cn(
                      "font-medium",
                      project.autoReview
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700"
                    )}
                  >
                    {project.autoReview
                      ? "✓ Auto Review ON"
                      : "Auto Review OFF"}
                  </Badge>
                </div>

                {project.businessContext && (
                  <div className="pt-4 border-t border-zinc-800">
                    <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3">
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
