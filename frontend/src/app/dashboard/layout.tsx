"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Mail } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState(0);

  useEffect(() => {
    setMounted(true);
    if (!user) {
      router.push("/login");
    } else {
      fetchPendingInvitations();
    }
  }, [user, router]);

  const fetchPendingInvitations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/teams/my-invitations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setPendingInvitations(data.length);
      }
    } catch (error) {
      // Silently fail
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!mounted || !user) {
    return null;
  }

  const isActive = (path: string) =>
    path === pathname || (path !== "/dashboard" && pathname?.startsWith(path));

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <nav className="backdrop-blur-md bg-black border-b border-zinc-800 sticky top-0 z-50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard">
              <div className="text-xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent cursor-pointer">
                AI Code Reviewer
              </div>
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-8">
              <Link
                href="/dashboard"
                className={cn(
                  "relative text-zinc-300 transition-all duration-300 group",
                  isActive("/dashboard") && "text-white"
                )}
              >
                Projects
                <span
                  className={cn(
                    "absolute left-0 -bottom-1 h-[2px] bg-white transition-all duration-300",
                    isActive("/dashboard") ? "w-full" : "w-0 group-hover:w-full"
                  )}
                />
              </Link>

              <Link
                href="/dashboard/teams"
                className={cn(
                  "relative text-zinc-300 transition-all duration-300 group",
                  isActive("/dashboard/teams") && "text-white"
                )}
              >
                Teams
                <span
                  className={cn(
                    "absolute left-0 -bottom-1 h-[2px] bg-white transition-all duration-300",
                    isActive("/dashboard/teams")
                      ? "w-full"
                      : "w-0 group-hover:w-full"
                  )}
                />
              </Link>

              <Link
                href="/dashboard/invitations"
                className={cn(
                  "relative text-zinc-300 transition-all duration-300 group flex items-center gap-1.5",
                  isActive("/dashboard/invitations") && "text-white"
                )}
              >
                Invitations
                {pendingInvitations > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-1 h-5 px-2 text-xs animate-pulse"
                  >
                    {pendingInvitations}
                  </Badge>
                )}
                <span
                  className={cn(
                    "absolute left-0 -bottom-1 h-[2px] bg-white transition-all duration-300",
                    isActive("/dashboard/invitations")
                      ? "w-full"
                      : "w-0 group-hover:w-full"
                  )}
                />
              </Link>

              <Link
                href="/dashboard/billing"
                className={cn(
                  "relative text-zinc-300 transition-all duration-300 group",
                  isActive("/dashboard/billing") && "text-white"
                )}
              >
                Billing
                <span
                  className={cn(
                    "absolute left-0 -bottom-1 h-[2px] bg-white transition-all duration-300",
                    isActive("/dashboard/billing")
                      ? "w-full"
                      : "w-0 group-hover:w-full"
                  )}
                />
              </Link>

              <Link
                href="/dashboard/settings"
                className={cn(
                  "relative text-zinc-300 transition-all duration-300 group",
                  isActive("/dashboard/settings") && "text-white"
                )}
              >
                Settings
                <span
                  className={cn(
                    "absolute left-0 -bottom-1 h-[2px] bg-white transition-all duration-300",
                    isActive("/dashboard/settings")
                      ? "w-full"
                      : "w-0 group-hover:w-full"
                  )}
                />
              </Link>
            </div>

            {/* User Dropdown - Click to open */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-zinc-900/70 transition-all duration-200 focus:outline-none"
              >
                <Avatar className="h-9 w-9 ring-2 ring-zinc-700 ring-offset-2 ring-offset-black">
                  <AvatarFallback className="bg-gradient-to-br from-zinc-600 to-zinc-800 text-white font-semibold">
                    {user.fullName?.charAt(0).toUpperCase() ||
                      user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-200">
                    {user.fullName || "User"}
                  </span>
                  <span className="text-xs text-zinc-500">{user.email}</span>
                </div>

                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-zinc-500 transition-transform duration-200",
                    isOpen && "rotate-180 text-zinc-300"
                  )}
                />
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                  />

                  <div className="absolute right-0 top-full mt-2 w-56 z-50">
                    <div className="bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 py-2 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 border-b border-zinc-800">
                        <p className="text-sm font-semibold text-white">
                          {user.fullName || "User"}
                        </p>
                        <p className="text-xs text-zinc-400 truncate">
                          {user.email}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          handleLogout();
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/70 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
