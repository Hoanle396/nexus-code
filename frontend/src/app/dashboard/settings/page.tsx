"use client";

import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Key, Settings, User, Mail } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth";
import DashboardHeader from "@/components/layout/dashboard-header";

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();

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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-16 h-16 border-4 border-zinc-800 border-t-emerald-400 rounded-full animate-spin" />
        <p className="mt-6 text-zinc-500 text-lg">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-8">
      {/* Header */}
      <DashboardHeader
        icon={<Settings className="h-5 w-5 sm:h-6 sm:w-6 text-white" />}
        title="Settings"
        description="Manage your account information"
      />

      {/* Account Information */}
      <Card className="bg-zinc-900/70 border-emerald-400/20 backdrop-blur-sm hover:border-emerald-400/40 shadow-2xl transition-all duration-300">
        <CardHeader className="border-b border-zinc-800/50 pb-5 pt-6">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-emerald-300 via-white to-emerald-300 bg-clip-text text-transparent">
            <User className="h-6 w-6 text-emerald-400" />
            Profile Information
          </CardTitle>
          <CardDescription className="text-zinc-400 text-sm mt-3">
            Your personal details
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <Avatar className="h-24 w-24 ring-4 ring-emerald-400/30 ring-offset-4 ring-offset-black">
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

      {/* Info Card */}
      <Card className="bg-zinc-900/70 border-emerald-400/20 backdrop-blur-sm hover:border-emerald-400/40 shadow-2xl transition-all duration-300">
        <CardHeader className="border-b border-zinc-800/50 pb-5 pt-6">
          <CardTitle className="flex items-center gap-3 text-white text-2xl">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-400/30">
              <Key className="h-5 w-5 text-emerald-400" />
            </div>
            API Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-400/30">
            <p className="text-emerald-300 text-sm">
              <strong>Note:</strong> API tokens (GitHub, GitLab, Discord Bot) are now configured per project.
              Go to your project settings to configure tokens for each individual project.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
