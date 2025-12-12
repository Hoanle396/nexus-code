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
import { ArrowLeft, Trash2, AlertCircle } from "lucide-react";
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

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      await projectService.delete(projectId);
      toast.success("Project deleted successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-16 h-16 border-4 border-zinc-800 border-t-white rounded-full animate-spin" />
        <p className="ml-4 text-zinc-500 text-lg">Loading project...</p>
      </div>
    );
  }

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
            Edit Project
          </CardTitle>
          <CardDescription className="text-zinc-400 text-lg mt-3">
            Update settings and information for{" "}
            <span className="font-medium text-white">{project.name}</span>
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
                placeholder="e.g. E-commerce Platform"
                className="bg-zinc-800/50 border-zinc-700 focus:border-zinc-500 text-white placeholder-zinc-500"
                {...register("name", { required: "Project name is required" })}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Platform (Read-only) */}
            <div className="space-y-2">
              <Label className="text-zinc-200">Platform</Label>
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="text-2xl">
                  {project.type === "github" ? "GitHub" : "GitLab"}
                </span>
              </div>
            </div>

            {/* Repository URL (Read-only) */}
            <div className="space-y-2">
              <Label className="text-zinc-200">Repository URL</Label>
              <p className="text-sm text-zinc-400 font-mono truncate bg-zinc-800/50 px-3 py-2 rounded-md border border-zinc-700">
                {project.repositoryUrl}
              </p>
            </div>

            {/* Business Context */}
            <div className="space-y-2">
              <Label htmlFor="businessContext" className="text-zinc-200">
                Business Context (Recommended)
              </Label>
              <Textarea
                id="businessContext"
                placeholder="Describe key business logic, coding standards, security requirements, performance concerns, or anything the AI should know about this project..."
                rows={6}
                className="bg-zinc-800/50 border-zinc-700 focus:border-zinc-500 text-white placeholder-zinc-500 resize-none"
                {...register("businessContext")}
              />
              <p className="text-xs text-zinc-500">
                This helps the AI generate more accurate and relevant code
                reviews
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
                Receive PR notifications and AI review results directly in
                Discord (bot setup required)
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
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-white data-[state=checked]:to-zinc-400"
              />
            </div>

            {/* Project Active Toggle */}
            <div className="flex items-center justify-between py-4">
              <div className="space-y-1">
                <Label
                  htmlFor="isActive"
                  className="text-zinc-200 text-base cursor-pointer"
                >
                  Project Active
                </Label>
                <p className="text-sm text-zinc-500">
                  Disable to pause all reviews and notifications
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", checked)}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-white data-[state=checked]:to-zinc-400"
              />
            </div>

            {/* Action Buttons */}
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
                {loading ? "Updating Project..." : "Update Project"}
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

          {/* Danger Zone */}
          <div className="mt-12 pt-8 border-t border-zinc-700">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <h3 className="text-xl font-semibold text-red-500">
                Danger Zone
              </h3>
            </div>
            <p className="text-zinc-400 mb-6 max-w-2xl">
              Deleting this project will permanently remove all associated data,
              including reviews, comments, and settings. This action{" "}
              <strong>cannot be undone</strong>.
            </p>
            <Button
              type="button"
              variant="destructive"
              size="lg"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              {deleting ? "Deleting Project..." : "Delete Project"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
