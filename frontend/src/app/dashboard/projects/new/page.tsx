"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@bprogress/next/app";
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
import { ArrowLeft, Plus, BookOpen } from "lucide-react";
import { projectService, CreateProjectData } from "@/services/project.service";
import { cn } from "@/lib/utils";
import { WebhookSetupGuide } from "@/components/webhook-setup-guide";

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
      const project = await projectService.create(data);
      toast.success("Project created successfully!");
      // Redirect to success page with project info
      router.push(
        `/dashboard/projects/success?name=${encodeURIComponent(data.name)}&id=${
          project.id
        }`
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 md:space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Projects
      </Button>

      {/* Main Card */}
      <Card className="bg-zinc-900/50 backdrop-blur-sm border-zinc-800 shadow-2xl hover:border-zinc-700 transition-colors">
        <CardHeader className="pb-6 md:pb-8 border-b border-zinc-800/50">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <CardTitle className="text-xl sm:text-3xl font-bold text-white">
                Create New Project
              </CardTitle>
              <CardDescription className="text-zinc-400 text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 flex-shrink-0"></span>
                Add a repository to enable AI-powered code reviews and improve
                code quality
              </CardDescription>
            </div>
            <div className="self-start sm:self-center">
              <WebhookSetupGuide />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Project Name */}
            <div className="space-y-3">
              <Label
                htmlFor="name"
                className="text-zinc-200 text-sm font-semibold"
              >
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. E-commerce Platform, Mobile Banking App..."
                className="bg-zinc-800/50 border-zinc-700 focus:border-white focus:ring-2 focus:ring-white/20 text-white placeholder-zinc-500 h-12 transition-all"
                {...register("name", { required: "Project name is required" })}
              />
              {errors.name && (
                <p className="text-sm text-red-500 flex items-center gap-2">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Team */}
            <div className="space-y-3">
              <Label
                htmlFor="teamId"
                className="text-zinc-200 text-sm font-semibold"
              >
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
            <div className="space-y-3">
              <Label
                htmlFor="type"
                className="text-zinc-200 text-sm font-semibold"
              >
                Platform <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(value: "github" | "gitlab") =>
                  setValue("type", value)
                }
              >
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 focus:border-white focus:ring-2 focus:ring-white/20 text-white w-full h-12 transition-all">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 w-full">
                  <SelectItem
                    value="github"
                    className="text-zinc-200 focus:bg-zinc-800"
                  >
                    🐙 GitHub
                  </SelectItem>
                  <SelectItem
                    value="gitlab"
                    className="text-zinc-200 focus:bg-zinc-800"
                  >
                    🦊 GitLab
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>

            {/* Repository URL */}
            <div className="space-y-3">
              <Label
                htmlFor="repositoryUrl"
                className="text-zinc-200 text-sm font-semibold"
              >
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

              {/* Webhook Setup Reminder */}
              <div className="mt-3 flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <BookOpen className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="text-blue-300 font-medium mb-1">
                    Don't forget to setup webhook!
                  </p>
                  <p className="text-zinc-400">
                    After creating the project, configure the webhook in your
                    repository settings.{" "}
                    <WebhookSetupGuide
                      trigger={
                        <button
                          type="button"
                          className="text-blue-400 hover:text-blue-300 underline font-medium inline"
                        >
                          View guide
                        </button>
                      }
                    />
                  </p>
                </div>
              </div>
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
                className="bg-zinc-800/50 border-zinc-700 focus:border-white focus:ring-2 focus:ring-white/20 text-white placeholder-zinc-500 resize-none transition-all"
                {...register("businessContext")}
              />
              <p className="text-xs text-zinc-500 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                This information helps the AI provide more accurate and relevant
                code reviews
              </p>
            </div>

            {/* Discord Channel ID */}
            <div className="space-y-3">
              <Label
                htmlFor="discordChannelId"
                className="text-zinc-200 text-sm font-semibold"
              >
                Discord Channel ID (Optional)
              </Label>
              <Input
                id="discordChannelId"
                placeholder="1234567890123456789"
                className="bg-zinc-800/50 border-zinc-700 focus:border-white focus:ring-2 focus:ring-white/20 text-white placeholder-zinc-500 font-mono text-sm h-12 transition-all"
                {...register("discordChannelId")}
              />
              <p className="text-xs text-zinc-500 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                Receive PR notifications and review results directly in Discord
                (requires bot setup)
              </p>
            </div>

            {/* API Tokens Section */}
            <div className="space-y-4 p-5 rounded-xl bg-zinc-800/20 border border-zinc-800">
              <div className="space-y-2">
                <h3 className="text-white text-base font-semibold">API Tokens</h3>
                <p className="text-xs text-zinc-400">
                  Configure tokens for this project to allow AI to post comments
                </p>
              </div>

              {/* GitHub Token */}
              <div className="space-y-3">
                <Label
                  htmlFor="githubToken"
                  className="text-zinc-200 text-sm font-semibold"
                >
                  GitHub Personal Access Token (Required for GitHub)
                </Label>
                <Input
                  id="githubToken"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="bg-zinc-800/50 border-zinc-700 focus:border-white focus:ring-2 focus:ring-white/20 text-white placeholder-zinc-500 font-mono h-12 transition-all"
                  {...register("githubToken")}
                />
                <p className="text-xs text-zinc-500 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                  Required scopes: repo, write:discussion
                </p>
              </div>

              {/* GitLab Token */}
              <div className="space-y-3">
                <Label
                  htmlFor="gitlabToken"
                  className="text-zinc-200 text-sm font-semibold"
                >
                  GitLab Personal Access Token (Required for GitLab)
                </Label>
                <Input
                  id="gitlabToken"
                  type="password"
                  placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                  className="bg-zinc-800/50 border-zinc-700 focus:border-white focus:ring-2 focus:ring-white/20 text-white placeholder-zinc-500 font-mono h-12 transition-all"
                  {...register("gitlabToken")}
                />
                <p className="text-xs text-zinc-500 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                  Required scopes: api, read_api, write_repository
                </p>
              </div>

              {/* Discord Bot Token */}
              <div className="space-y-3">
                <Label
                  htmlFor="discordBotToken"
                  className="text-zinc-200 text-sm font-semibold"
                >
                  Discord Bot Token (Optional)
                </Label>
                <Input
                  id="discordBotToken"
                  type="password"
                  placeholder="MTAxMjM0NTY3ODkwMTIzNDU2Nw.GABCDE.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  className="bg-zinc-800/50 border-zinc-700 focus:border-white focus:ring-2 focus:ring-white/20 text-white placeholder-zinc-500 font-mono h-12 transition-all"
                  {...register("discordBotToken")}
                />
                <p className="text-xs text-zinc-500 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                  Used for sending PR notifications to your Discord channel
                </p>
              </div>
            </div>

            {/* Auto Review Toggle */}
            <div className="p-5 rounded-xl bg-zinc-800/20 border border-zinc-800">
              <div className="flex items-center justify-between py-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="autoReview"
                    className="text-white text-base font-semibold cursor-pointer"
                  >
                    Enable Auto Review
                  </Label>
                  <p className="text-sm text-zinc-400">
                    AI will automatically review every new Pull Request
                  </p>
                </div>
                <Switch
                  id="autoReview"
                  checked={autoReview}
                  onCheckedChange={(checked) => setValue("autoReview", checked)}
                  className="data-[state=checked]:bg-white"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className={cn(
                  "flex-1 bg-white text-black font-semibold shadow-lg hover:shadow-xl hover:bg-zinc-200 transition-all duration-300 h-12",
                  loading && "opacity-60 cursor-not-allowed"
                )}
              >
                <Plus className="h-5 w-5 mr-2" />
                {loading ? "Creating Project..." : "Create Project"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-600 transition-all h-12"
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
