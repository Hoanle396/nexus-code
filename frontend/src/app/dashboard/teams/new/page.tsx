"use client";

import { useState } from "react";
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
import { ArrowLeft, Plus, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateTeamForm {
  name: string;
  description?: string;
}

export default function NewTeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTeamForm>();

  const onSubmit = async (data: CreateTeamForm) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create team");
      }

      toast.success("Team created successfully!");
      router.push("/dashboard/teams");
    } catch (error: any) {
      toast.error(error.message || "Failed to create team");
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
        className="text-zinc-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all duration-300"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Teams
      </Button>

      {/* Main Card */}
      <Card className="bg-zinc-900/50 backdrop-blur-sm border-emerald-400/20 shadow-2xl hover:border-emerald-400/40 transition-all duration-300">
        <CardHeader className="pb-6 md:pb-8 border-b border-zinc-800/50">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-800 flex items-center justify-center shadow-lg ring-2 ring-zinc-700 flex-shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-300" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-300 via-white to-emerald-300 bg-clip-text text-transparent">
                Create New Team
              </CardTitle>
            </div>
            <CardDescription className="text-zinc-400 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 flex-shrink-0"></span>
              Set up a new team to invite members, manage projects, and
              collaborate efficiently
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Team Name */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-zinc-200 text-sm font-semibold"
              >
                Team Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Engineering, Design Team, Startup Crew..."
                className="bg-zinc-800/50 border-zinc-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-zinc-500 h-12 transition-all duration-300"
                {...register("name", { required: "Team name is required" })}
              />
              {errors.name && (
                <p className="text-sm text-red-500 flex items-center gap-2">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-zinc-200 text-sm font-semibold"
              >
                Description <span className="text-zinc-500">(Optional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Briefly describe the purpose of this team, who it's for, or any key details..."
                rows={5}
                className="bg-zinc-800/50 border-zinc-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-zinc-500 resize-none transition-all duration-300"
                {...register("description")}
              />
              <p className="text-xs text-zinc-500 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                Helps team members understand the team's focus and goals
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className={cn(
                  "flex-1 bg-emerald-400 text-black font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/50 hover:bg-emerald-300 transition-all duration-300 hover:scale-[1.02]",
                  loading && "opacity-60 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    Create Team
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-600 transition-all"
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
