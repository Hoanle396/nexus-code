"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Badge } from "@/components/ui/badge";
import {
  LogOut,
  LayoutDashboard,
  Users,
  Mail,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const token = localStorage.getItem("token");

    // If no token and no user, redirect to login
    if (!user && !token) {
      router.push("/login");
      return;
    }

    // If has token but no user, try to fetch profile
    if (!user && token) {
      fetchProfile();
      return;
    }

    // If has user, fetch invitations
    if (user) {
      fetchPendingInvitations();
    }
  }, [user, router, isHydrated]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const userData = await response.json();
        useAuthStore.getState().setAuth(userData, token!);
      } else {
        // Invalid token, logout
        localStorage.removeItem("token");
        router.push("/login");
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      localStorage.removeItem("token");
      router.push("/login");
    }
  };

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

  if (!mounted || !isHydrated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-zinc-800 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && !localStorage.getItem("token")) {
    return null;
  }

  const isActive = (path: string) =>
    path === pathname || (path !== "/dashboard" && pathname?.startsWith(path));

  const menuItems = [
    { href: "/dashboard", label: "Projects", icon: LayoutDashboard },
    { href: "/dashboard/teams", label: "Teams", icon: Users },
    {
      href: "/dashboard/invitations",
      label: "Invitations",
      icon: Mail,
      badge: pendingInvitations > 0 ? pendingInvitations : undefined
    },
    { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-black text-gray-100 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-zinc-950 border-r border-zinc-800 transition-all duration-300 z-50 flex flex-col",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo & Toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
          <Link href="/dashboard" className="flex items-center justify-center">
            <img
              src="/logo-horizontal.svg"
              alt="Logo"
              className="h-15 transition-transform"
            />
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-zinc-900 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-zinc-400" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-zinc-400" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3.5 rounded-lg transition-all duration-200 group relative",
                  active
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-300 hover:text-white hover:bg-zinc-900/50"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="text-base font-semibold">{item.label}</span>
                    {item.badge && (
                      <Badge
                        variant="destructive"
                        className="ml-auto h-5 px-2 text-xs animate-pulse"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-400 rounded-r" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t border-zinc-800 p-3">
          <div
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-900 transition-colors",
              collapsed && "justify-center"
            )}
          >
            <Avatar className="h-9 w-9 ring-2 ring-zinc-700">
              <AvatarFallback className="bg-gradient-to-br from-zinc-600 to-zinc-800 text-white font-semibold text-sm">
                {user?.fullName?.charAt(0).toUpperCase() ||
                  user?.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-white truncate">
                  {user?.fullName || "User"}
                </p>
                <p className="text-sm text-zinc-400 truncate">{user?.email}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 mt-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="text-base font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        <main className="container mx-auto px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
