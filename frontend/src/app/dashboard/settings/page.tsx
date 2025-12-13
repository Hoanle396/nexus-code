"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Key, Save, Settings, User, Mail, CheckCircle } from "lucide-react";
import { authService, UpdateTokensData } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateTokensData>();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await authService.getProfile();
      updateUser(profile);
    } catch (error) {
      console.error("Failed to load profile");
    }
  };

  const onSubmit = async (data: UpdateTokensData) => {
    setLoading(true);
    try {
      await authService.updateTokens(data);
      toast.success("Tokens updated successfully!");
      await loadProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update tokens");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-16 h-16 border-4 border-zinc-800 border-t-white rounded-full animate-spin" />
        <p className="mt-6 text-zinc-500 text-lg">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-zinc-800/50">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-900/50 flex items-center justify-center flex-shrink-0">
            <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              Settings
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base">
              Manage your account and integration tokens
            </p>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <Card className="bg-zinc-900/70 border-zinc-800 backdrop-blur-sm hover:border-zinc-600 shadow-2xl transition-all duration-300">
        <CardHeader className="border-b border-zinc-800/50 pb-5 pt-6">
          <CardTitle className="flex items-center gap-3 text-white text-2xl">
            <div className="p-2 rounded-lg bg-zinc-800">
              <User className="h-5 w-5" />
            </div>
            Account Information
          </CardTitle>
          <CardDescription className="text-zinc-400 text-sm mt-3">
            Your personal details
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <Avatar className="h-24 w-24 ring-4 ring-zinc-700 ring-offset-4 ring-offset-black">
              <AvatarFallback className="bg-gradient-to-br from-zinc-600 to-zinc-800 text-3xl font-bold text-white">
                {user.fullName?.charAt(0).toUpperCase() ||
                  user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-4 text-center sm:text-left">
              <div>
                <p className="text-sm text-zinc-500">Full Name</p>
                <p className="text-2xl font-semibold text-white">
                  {user.fullName || (
                    <span className="italic text-zinc-600">Not set</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Email Address</p>
                <p className="text-xl font-medium text-white flex items-center gap-2">
                  <Mail className="h-5 w-5 text-zinc-400" />
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Tokens */}
      <Card className="bg-zinc-900/70 border-zinc-800 backdrop-blur-sm hover:border-zinc-600 shadow-2xl transition-all duration-300">
        <CardHeader className="border-b border-zinc-800/50 pb-5 pt-6">
          <CardTitle className="flex items-center gap-3 text-white text-2xl">
            <div className="p-2 rounded-lg bg-zinc-800">
              <Key className="h-5 w-5" />
            </div>
            Integration Tokens
          </CardTitle>
          <CardDescription className="text-zinc-400 text-sm mt-3">
            Configure tokens to allow AI to post comments and send notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* GitHub Token */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="githubToken" className="text-zinc-200 text-sm font-semibold">
                  GitHub Personal Access Token
                </Label>
                {user.hasGithubToken && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Configured
                  </Badge>
                )}
              </div>
              <Input
                id="githubToken"
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="bg-zinc-800/50 border-zinc-700 focus:border-white focus:ring-2 focus:ring-white/20 text-white placeholder-zinc-500 font-mono h-12 transition-all"
                {...register("githubToken")}
              />
              <p className="text-xs text-zinc-500 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                Create at:{" "}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  GitHub → Settings → Developer settings → Personal access
                  tokens
                </a>
                <br />
                <strong>Required scopes:</strong> repo, write:discussion
              </p>
            </div>

            {/* GitLab Token */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="gitlabToken" className="text-zinc-200 text-sm font-semibold">
                  GitLab Personal Access Token
                </Label>
                {user.hasGitlabToken && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Configured
                  </Badge>
                )}
              </div>
              <Input
                id="gitlabToken"
                type="password"
                placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                className="bg-zinc-800/50 border-zinc-700 focus:border-white focus:ring-2 focus:ring-white/20 text-white placeholder-zinc-500 font-mono h-12 transition-all"
                {...register("gitlabToken")}
              />
              <p className="text-xs text-zinc-500 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                Create at:{" "}
                <a
                  href="https://gitlab.com/-/profile/personal_access_tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  GitLab → Preferences → Access Tokens
                </a>
                <br />
                <strong>Required scopes:</strong> api, read_api,
                write_repository
              </p>
            </div>

            {/* Discord Bot Token */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="discordBotToken"
                  className="text-zinc-200 text-sm font-semibold"
                >
                  Discord Bot Token (Optional)
                </Label>
                {user.hasDiscordBotToken && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Configured
                  </Badge>
                )}
              </div>
              <Input
                id="discordBotToken"
                type="password"
                placeholder="MTAxMjM0NTY3ODkwMTIzNDU2Nw.GABCDE.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="bg-zinc-800/50 border-zinc-700 focus:border-white focus:ring-2 focus:ring-white/20 text-white placeholder-zinc-500 font-mono h-12 transition-all"
                {...register("discordBotToken")}
              />
              <p className="text-xs text-zinc-500 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                Create bot at:{" "}
                <a
                  href="https://discord.com/developers/applications"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Discord Developer Portal → New Application → Bot
                </a>
                <br />
                Used for sending PR notifications to your server
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className={cn(
                  "w-full sm:w-auto px-12 bg-white text-black font-semibold shadow-lg hover:shadow-xl hover:bg-zinc-200 transition-all duration-300 h-12",
                  loading && "opacity-60 cursor-not-allowed"
                )}
              >
                <Save className="h-5 w-5 mr-2" />
                {loading ? "Saving Changes..." : "Save Tokens"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
