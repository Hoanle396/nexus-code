'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Plus, Mail } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState(0);

  useEffect(() => {
    setMounted(true);
    if (!user) {
      router.push('/login');
    } else {
      fetchPendingInvitations();
    }
  }, [user, router]);

  const fetchPendingInvitations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/my-invitations`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
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
    router.push('/');
  };

  if (!mounted || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <nav className="backdrop-blur-md bg-white/80 shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent hover:scale-105 transition-transform">
                AI Code Reviewer
              </Link>
              <div className="flex space-x-1">
                <Link
                  href="/dashboard"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    pathname === '/dashboard'
                      ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-md'
                      : 'text-gray-700 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  Projects
                </Link>
                <Link
                  href="/dashboard/teams"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    pathname?.startsWith('/dashboard/teams')
                      ? 'bg-gradient-to-r from-secondary to-secondary/90 text-white shadow-md'
                      : 'text-gray-700 hover:text-secondary hover:bg-secondary/5'
                  }`}
                >
                  Teams
                </Link>
                <Link
                  href="/dashboard/invitations"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1 ${
                    pathname === '/dashboard/invitations'
                      ? 'bg-gradient-to-r from-accent to-accent/90 text-white shadow-md'
                      : 'text-gray-700 hover:text-accent hover:bg-accent/5'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  Invitations
                  {pendingInvitations > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 px-2 text-xs animate-pulse">
                      {pendingInvitations}
                    </Badge>
                  )}
                </Link>
                <Link
                  href="/dashboard/billing"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    pathname === '/dashboard/billing'
                      ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-md'
                      : 'text-gray-700 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  Billing
                </Link>
                <Link
                  href="/dashboard/settings"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    pathname === '/dashboard/settings'
                      ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-md'
                      : 'text-gray-700 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  Settings
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                  {user.fullName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700">{user.fullName}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="container mx-auto px-6 py-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
