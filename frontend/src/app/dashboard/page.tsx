"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@bprogress/next/app";
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
import { QuickStartGuide } from "@/components/quick-start-guide";
import DashboardHeader from "@/components/layout/dashboard-header";

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <DashboardHeader
        icon={<GitBranch className="h-5 w-5 sm:h-6 sm:w-6 text-white" />}
        title="Projects"
        description="Manage and monitor your code review projects"
        rightAction={
          <Button
            onClick={() => router.push("/dashboard/projects/new")}
            size="default"
            className="bg-emerald-400 text-black hover:bg-emerald-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/50 transition-all duration-300 font-semibold group w-full sm:w-auto hover:scale-[1.02]"
          >
            <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            Add Project
          </Button>
        }
      />

      {/* Team Filter */}
      {teams.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 py-2.5 px-4 rounded-md bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-zinc-800/50">
              <Users className="h-4 w-4 text-zinc-400" />
            </div>
            <span className="text-sm font-semibold text-zinc-300">
              Filter by team:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleTeamChange("all")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
                selectedTeam === "all"
                  ? "bg-emerald-400 text-black shadow-lg shadow-emerald-500/30"
                  : "bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-700 hover:border-emerald-400/40 hover:shadow-lg transition-all duration-300"
              )}
            >
              All Projects
            </button>
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => handleTeamChange(team.id)}
                className={cn(
                  "px-5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-300",
                  selectedTeam === team.id
                    ? "bg-emerald-400 text-black shadow-lg shadow-emerald-500/30"
                    : "bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-700 hover:border-emerald-400/40 hover:shadow-lg transition-all duration-300"
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
        <div className="flex flex-col items-center justify-center py-32">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-zinc-800 border-t-emerald-400 rounded-full animate-spin" />
            <div
              className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-zinc-600 rounded-full animate-spin animation-delay-150"
              style={{ animationDirection: "reverse" }}
            />
          </div>
          <div className="mt-8 space-y-2 text-center">
            <p className="text-zinc-300 text-lg font-semibold">
              Loading projects...
            </p>
            <p className="text-zinc-500 text-sm">Please wait a moment</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        /* Empty State */
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm h-full shadow-2xl">
              <CardContent className="flex flex-col items-center justify-center py-24 space-y-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-4xl shadow-2xl ring-4 ring-zinc-800/50 ring-offset-4 ring-offset-black">
                    ✨
                  </div>
                </div>
                <div className="text-center space-y-4 max-w-md">
                  <h3 className="text-2xl font-bold text-white">
                    No projects yet
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Start by creating your first project to enable AI-powered
                    code reviews and streamline your development workflow
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/dashboard/projects/new")}
                  className="bg-emerald-400 text-black hover:bg-emerald-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/50 transition-all duration-300 font-semibold group mt-4 hover:scale-[1.02]"
                >
                  <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                  Create Your First Project
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <QuickStartGuide />
          </div>
        </div>
      ) : (
        /* Projects Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, index) => (
            <Card
              key={project.id}
              className="group bg-zinc-900/70 border-zinc-800 hover:border-emerald-400/40 backdrop-blur-sm hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <CardHeader className="py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-white group-hover:text-zinc-100 transition-colors line-clamp-1">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-2.5">
                      <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-zinc-800/50 border border-zinc-700/50 group-hover:border-zinc-600 transition-colors">
                        <span className="text-base">
                          {project.type === "github" ? "🐙" : "🦊"}
                        </span>
                        <span className="font-medium text-zinc-300 text-sm">
                          {project.type === "github" ? "GitHub" : "GitLab"}
                        </span>
                      </div>
                    </CardDescription>
                  </div>
                  <Link href={`/dashboard/projects/${project.id}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all duration-300 hover:scale-110"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>

              <CardContent className="space-y-2">
                {project.team && (
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-zinc-800/30 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                    <div className="p-1.5 rounded-md bg-zinc-800">
                      <Users className="h-3.5 w-3.5 text-zinc-400" />
                    </div>
                    <span className="text-sm font-medium text-zinc-300">
                      {project.team.name}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-800/20 border border-zinc-800/50 group-hover:border-zinc-700/50 transition-colors">
                  <GitBranch className="h-4 w-4 flex-shrink-0 text-zinc-500" />
                  <span className="text-sm truncate font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">
                    {project.repositoryUrl}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all duration-300",
                      project.autoReview
                        ? "bg-emerald-400/20 border-emerald-400/40 hover:border-emerald-400/60"
                        : "bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600"
                    )}
                  >
                    <div
                      className={cn(
                        "p-1 rounded-full",
                        project.autoReview ? "bg-emerald-500/20" : "bg-zinc-700"
                      )}
                    >
                      <Activity
                        className={cn(
                          "h-3.5 w-3.5",
                          project.autoReview
                            ? "text-emerald-400"
                            : "text-zinc-500"
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        project.autoReview
                          ? "text-emerald-400"
                          : "text-zinc-400"
                      )}
                    >
                      {project.autoReview ? "Auto Review" : "Manual Review"}
                    </span>
                    {project.autoReview && (
                      <span className="text-emerald-400 text-xs">✓</span>
                    )}
                  </div>
                </div>

                {project.businessContext && (
                  <div className="pt-4 mt-4 border-t border-zinc-800/50">
                    <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3 group-hover:text-zinc-300 transition-colors">
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
