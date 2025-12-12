"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus } from "lucide-react";
import { projectService, CreateProjectData } from "@/services/project.service";
import { cn } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  plan: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateProjectData>({
    defaultValues: {
      autoReview: true,
    },
  });

  const autoReview = watch("autoReview");

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
      setLoadingTeams(false);
    }
  };

  const onSubmit = async (data: CreateProjectData) => {
    setLoading(true);
    try {
      await projectService.create(data);
      toast.success("Project created successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-8 text-zinc-400 hover:text-white hover:bg-zinc-900/70"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Projects
      </Button>

      {/* Main Card */}
      <Card className="bg-zinc-900/50 backdrop-blur-sm border-zinc-800 shadow-xl">
        <CardHeader className="pb-8">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Create New Project
          </CardTitle>
          <CardDescription className="text-zinc-400 text-lg mt-3">
            Add a repository to enable AI-powered code reviews and improve code
            quality
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-200">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. E-commerce Platform, Mobile Banking App..."
                className="bg-zinc-800/50 border-zinc-700 focus:border-zinc-500 text-white placeholder-zinc-500"
                {...register("name", { required: "Project name is required" })}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Team */}
            <div className="space-y-2">
              <Label htmlFor="teamId" className="text-zinc-200">
                Team <span className="text-red-500">*</span>
              </Label>
              <Select
                disabled={loadingTeams}
                onValueChange={(value) => setValue("teamId", value)}
              >
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white w-full">
                  <SelectValue
                    placeholder={
                      loadingTeams ? "Loading teams..." : "Select a team"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 w-full">
                  {teams.map((team) => (
                    <SelectItem
                      key={team.id}
                      value={team.id}
                      className="text-zinc-200 hover:bg-zinc-800"
                    >
                      {team.name}{" "}
                      <span className="text-zinc-500">({team.plan})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.teamId && (
                <p className="text-sm text-red-500">{errors.teamId?.message}</p>
              )}
            </div>

            {/* Platform */}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-zinc-200">
                Platform <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(value: "github" | "gitlab") =>
                  setValue("type", value)
                }
              >
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white w-full">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 w-full">
                  <SelectItem value="github" className="text-zinc-200">
                    GitHub
                  </SelectItem>
                  <SelectItem value="gitlab" className="text-zinc-200">
                    GitLab
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>

            {/* Repository URL */}
            <div className="space-y-2">
              <Label htmlFor="repositoryUrl" className="text-zinc-200">
                Repository URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="repositoryUrl"
                placeholder="https://github.com/username/repo-name"
                className="bg-zinc-800/50 border-zinc-700 focus:border-zinc-500 text-white placeholder-zinc-500 font-mono text-sm"
                {...register("repositoryUrl", {
                  required: "Repository URL is required",
                })}
              />
              {errors.repositoryUrl && (
                <p className="text-sm text-red-500">
                  {errors.repositoryUrl.message}
                </p>
              )}
            </div>

            {/* Business Context */}
            <div className="space-y-2">
              <Label htmlFor="businessContext" className="text-zinc-200">
                Business Context (Recommended)
              </Label>
              <Textarea
                id="businessContext"
                placeholder="Describe your project: main technologies, coding standards, important business logic, security concerns, performance requirements, etc."
                rows={6}
                className="bg-zinc-800/50 border-zinc-700 focus:border-zinc-500 text-white placeholder-zinc-500 resize-none"
                {...register("businessContext")}
              />
              <p className="text-xs text-zinc-500">
                This information helps the AI provide more accurate and relevant
                code reviews
              </p>
            </div>

            {/* Discord Channel ID */}
            <div className="space-y-2">
              <Label htmlFor="discordChannelId" className="text-zinc-200">
                Discord Channel ID (Optional)
              </Label>
              <Input
                id="discordChannelId"
                placeholder="1234567890123456789"
                className="bg-zinc-800/50 border-zinc-700 focus:border-zinc-500 text-white placeholder-zinc-500 font-mono text-sm"
                {...register("discordChannelId")}
              />
              <p className="text-xs text-zinc-500">
                Receive PR notifications and review results directly in Discord
                (requires bot setup)
              </p>
            </div>

            {/* Auto Review Toggle */}
            <div className="flex items-center justify-between py-4">
              <div className="space-y-1">
                <Label
                  htmlFor="autoReview"
                  className="text-zinc-200 text-base cursor-pointer"
                >
                  Enable Auto Review
                </Label>
                <p className="text-sm text-zinc-500">
                  AI will automatically review every new Pull Request
                </p>
              </div>
              <Switch
                id="autoReview"
                checked={autoReview}
                onCheckedChange={(checked) => setValue("autoReview", checked)}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className={cn(
                  "flex-1 bg-gradient-to-r from-white to-zinc-400 text-black font-semibold shadow-lg hover:shadow-xl hover:from-zinc-200 hover:to-zinc-500 transition-all duration-300",
                  loading && "opacity-80 cursor-not-allowed"
                )}
              >
                <Plus className="h-5 w-5 mr-2" />
                {loading ? "Creating Project..." : "Create Project"}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => router.back()}
                className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
