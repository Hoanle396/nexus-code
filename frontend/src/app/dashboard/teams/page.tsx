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
import { Plus, Users, Settings, Crown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      toast.error("Unable to load teams");
    } finally {
      setLoading(false);
    }
  };

  const getPlanVariant = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "free":
        return "secondary";
      case "starter":
        return "default";
      case "professional":
        return "success";
      case "enterprise":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getRoleVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case "owner":
        return "destructive";
      case "admin":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Teams
          </h1>
          <p className="text-zinc-400 mt-2 text-lg">
            Manage your teams and collaborate with members
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/teams/new")}
          size="lg"
          className="bg-gradient-to-r from-white to-zinc-400 text-black hover:from-zinc-200 hover:to-zinc-500 shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Team
        </Button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 border-4 border-zinc-800 border-t-white rounded-full animate-spin" />
          <p className="text-zinc-500 mt-6 text-lg font-medium">
            Loading teams...
          </p>
        </div>
      ) : teams.length === 0 ? (
        /* Empty State */
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 space-y-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center shadow-2xl">
              <Users className="h-12 w-12 text-zinc-500" />
            </div>
            <div className="text-center space-y-4 max-w-md">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                No teams yet
              </h3>
              <p className="text-zinc-400 text-lg">
                Create a team to invite members and manage projects together
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/teams/new")}
              size="lg"
              className="bg-gradient-to-r from-white to-zinc-400 text-black hover:from-zinc-200 hover:to-zinc-500 shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Teams Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team, index) => (
            <Card
              key={team.id}
              className="group bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 backdrop-blur-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-white flex items-center gap-2.5 group-hover:text-zinc-200 transition-colors">
                      {team.name}
                      {team.role === "owner" && (
                        <Crown className="h-5 w-5 text-yellow-500" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2 text-zinc-400 line-clamp-2">
                      {team.description || "No description provided"}
                    </CardDescription>
                  </div>
                  <Link href={`/dashboard/teams/${team.id}`}>
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
                {/* Plan & Role Badges */}
                <div className="flex items-center justify-between">
                  <Badge
                    variant={getPlanVariant(team.plan)}
                    className={cn(
                      "font-medium capitalize",
                      team.plan === "enterprise" &&
                        "bg-red-500/20 text-red-400 border-red-500/50",
                      team.plan === "professional" &&
                        "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                    )}
                  >
                    {team.plan}
                  </Badge>
                  <Badge
                    variant={getRoleVariant(team.role)}
                    className={cn(
                      "font-medium capitalize",
                      team.role === "owner" &&
                        "bg-orange-500/20 text-orange-400 border-orange-500/50",
                      team.role === "admin" &&
                        "bg-blue-500/20 text-blue-400 border-blue-500/50"
                    )}
                  >
                    {team.role}
                  </Badge>
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm text-zinc-400">
                  <div className="flex justify-between">
                    <span>Projects Limit</span>
                    <span className="font-semibold text-zinc-200">
                      {team.maxProjects === -1 ? "Unlimited" : team.maxProjects}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Members Limit</span>
                    <span className="font-semibold text-zinc-200">
                      {team.maxMembers === -1 ? "Unlimited" : team.maxMembers}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Owner</span>
                    <span
                      className="font-semibold text-zinc-200 truncate max-w-[140px]"
                      title={team.owner.fullName || team.owner.email}
                    >
                      {team.owner.fullName || team.owner.email}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <Link href={`/dashboard/teams/${team.id}`} className="block">
                  <Button
                    variant="outline"
                    className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-600 transition-all"
                  >
                    View Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
