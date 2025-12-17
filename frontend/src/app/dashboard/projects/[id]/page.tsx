"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Trash2, AlertCircle, Loader2 } from "lucide-react";
import {
  projectService,
  UpdateProjectData,
  Project,
} from "@/services/project.service";
import { cn } from "@/lib/utils";

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UpdateProjectData>();

  const autoReview = watch("autoReview");
  const isActive = watch("isActive");

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const data = await projectService.getById(projectId);
      setProject(data);

      // Populate form
      setValue("name", data.name);
      setValue("businessContext", data.businessContext || "");
      setValue("autoReview", data.autoReview);
      setValue("isActive", data.isActive);
      setValue("discordChannelId", data.discordChannelId || "");
      setValue("githubToken", data.githubToken || "");
      setValue("gitlabToken", data.gitlabToken || "");
      setValue("discordBotToken", data.discordBotToken || "");
    } catch (error: any) {
      toast.error("Unable to load project details");
      router.push("/dashboard");
    }
  };

  const onSubmit = async (data: UpdateProjectData) => {
    setLoading(true);
    try {
      await projectService.update(projectId, data);
      toast.success("Project updated successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await projectService.delete(projectId);
      toast.success("Project deleted successfully!");
      setShowDeleteDialog(false);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Delete project error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete project";
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-16 h-16 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
        <p className="ml-4 text-zinc-500 text-lg">Loading project...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 md:space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="text-zinc-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all duration-300"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Projects
      </Button>

      {/* Main Card */}
      <Card className="bg-zinc-900/50 backdrop-blur-sm border-emerald-400/20 shadow-2xl hover:border-emerald-400/40 transition-all duration-300">
        <CardHeader className="pb-6 md:pb-8 border-b border-zinc-800/50">
          <div className="space-y-2">
            <CardTitle className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-300 via-white to-emerald-300 bg-clip-text text-transparent">
              Edit Project
            </CardTitle>
            <CardDescription className="text-zinc-400 text-sm flex items-center gap-2 flex-wrap">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 flex-shrink-0"></span>
              <span>
                Update settings and information for{" "}
                <span className="font-semibold text-white">{project.name}</span>
              </span>
            </CardDescription>
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
                placeholder="e.g. E-commerce Platform"
                className="bg-zinc-800/50 border-zinc-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-zinc-500 h-12 transition-all duration-300"
                {...register("name", { required: "Project name is required" })}
              />
              {errors.name && (
                <p className="text-sm text-red-500 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Platform (Read-only) */}
            <div className="space-y-3">
              <Label className="text-zinc-200 text-sm font-semibold">
                Platform
              </Label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-800/30 border border-zinc-700">
                <span className="text-2xl">
                  {project.type === "github" ? "🐙" : "🦊"}
                </span>
                <span className="font-semibold text-white">
                  {project.type === "github" ? "GitHub" : "GitLab"}
                </span>
              </div>
            </div>

            {/* Repository URL (Read-only) */}
            <div className="space-y-3">
              <Label className="text-zinc-200 text-sm font-semibold">
                Repository URL
              </Label>
              <div className="text-sm text-zinc-300 font-mono bg-zinc-800/50 px-4 py-3 rounded-lg border border-zinc-700 break-all">
                {project.repositoryUrl}
              </div>
            </div>

            {/* Business Context */}
            <div className="space-y-3">
              <Label
                htmlFor="businessContext"
                className="text-zinc-200 text-sm font-semibold"
              >
                Business Context (Recommended)
              </Label>
              <Textarea
                id="businessContext"
                placeholder="Describe key business logic, coding standards, security requirements, performance concerns, or anything the AI should know about this project..."
                rows={6}
                className="bg-zinc-800/50 border-zinc-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-zinc-500 resize-none transition-all duration-300"
                {...register("businessContext")}
              />
              <p className="text-xs text-zinc-500 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                This helps the AI generate more accurate and relevant code
                reviews
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
                  className="bg-zinc-800/50 border-zinc-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-zinc-500 font-mono h-12 transition-all duration-300"
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
                  className="bg-zinc-800/50 border-zinc-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-zinc-500 font-mono h-12 transition-all duration-300"
                  {...register("gitlabToken")}
                />
                <p className="text-xs text-zinc-500 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                  Required scopes: api, read_api, write_repository
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
                  className="bg-zinc-800/50 border-zinc-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-zinc-500 font-mono text-sm h-12 transition-all duration-300"
                  {...register("discordChannelId")}
                />
                <p className="text-xs text-zinc-500 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                  Receive PR notifications and AI review results directly in
                  Discord (bot setup required)
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
                  className="bg-zinc-800/50 border-zinc-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-zinc-500 font-mono h-12 transition-all duration-300"
                  {...register("discordBotToken")}
                />
                <p className="text-xs text-zinc-500 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                  Used for sending PR notifications to your Discord channel
                </p>
              </div>
            </div>

            {/* Toggles Section */}
            <div className="space-y-4 p-5 rounded-xl bg-zinc-800/20 border border-zinc-800">
              {/* Auto Review Toggle */}
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
                  className="data-[state=checked]:bg-emerald-400"
                />
              </div>

              {/* Project Active Toggle */}
              <div className="flex items-center justify-between py-2 pt-4 border-t border-zinc-700/50">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="isActive"
                    className="text-white text-base font-semibold cursor-pointer"
                  >
                    Project Active
                  </Label>
                  <p className="text-sm text-zinc-400">
                    Disable to pause all reviews and notifications
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue("isActive", checked)}
                  className="data-[state=checked]:bg-emerald-400"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className={cn(
                  "flex-1 bg-emerald-400 text-black font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/50 hover:bg-emerald-300 transition-all duration-300 h-12 hover:scale-[1.02]",
                  loading && "opacity-60 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Update Project"
                )}
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

      {/* Danger Zone - Outside form */}
      <Card className="bg-zinc-900/50 backdrop-blur-sm border-red-900/50 shadow-2xl">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-red-500">Danger Zone</h3>
          </div>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            Deleting this project will permanently remove all associated data,
            including reviews, comments, and settings.{" "}
            <strong className="text-white">This action cannot be undone</strong>
            .
          </p>
          <Button
            onClick={handleDeleteClick}
            disabled={deleting}
            className="inline-flex items-center justify-center rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-5 w-5 mr-2" />
            Delete Project
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md p-6">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <DialogTitle className="text-xl font-bold text-white text-center">
              Delete Project?
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-center text-sm">
              You're about to delete{" "}
              <span className="font-semibold text-white">
                "{project?.name}"
              </span>
              . This will permanently remove all data including reviews and
              comments.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
              <p className="text-red-400 text-xs text-center font-medium">
                ⚠️ This action cannot be undone
              </p>
            </div>
          </div>
          <DialogFooter className="flex-row gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
              className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
