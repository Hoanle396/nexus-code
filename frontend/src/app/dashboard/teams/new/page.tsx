"use client";

import { useState } from "react";
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
import { ArrowLeft, Plus, Users } from "lucide-react";
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
    <div className="max-w-3xl mx-auto py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-8 text-zinc-400 hover:text-white hover:bg-zinc-900/70 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Teams
      </Button>

      {/* Main Card */}
      <Card className="bg-zinc-900/50 backdrop-blur-sm border-zinc-800 shadow-xl">
        <CardHeader className="pb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center shadow-lg">
              <Users className="h-6 w-6 text-zinc-300" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Create New Team
            </CardTitle>
          </div>
          <CardDescription className="text-zinc-400 text-lg">
            Set up a new team to invite members, manage projects, and
            collaborate efficiently
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Team Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-200">
                Team Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Engineering, Design Team, Startup Crew..."
                className="bg-zinc-800/50 border-zinc-700 focus:border-zinc-500 text-white placeholder-zinc-500 transition-colors"
                {...register("name", { required: "Team name is required" })}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-zinc-200">
                Description <span className="text-zinc-500">(Optional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Briefly describe the purpose of this team, who it's for, or any key details..."
                rows={5}
                className="bg-zinc-800/50 border-zinc-700 focus:border-zinc-500 text-white placeholder-zinc-500 resize-none transition-colors"
                {...register("description")}
              />
              <p className="text-xs text-zinc-500">
                Helps team members understand the team's focus and goals
              </p>
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
                <Plus className="h-5 w-5 mr-2" />
                {loading ? "Creating Team..." : "Create Team"}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => router.back()}
                className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
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
