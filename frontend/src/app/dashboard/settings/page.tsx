'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authService, UpdateTokensData } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth';
import { Key, Save } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, setValue } = useForm<UpdateTokensData>();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await authService.getProfile();
      updateUser(profile);
    } catch (error) {
      console.error('Failed to load profile');
    }
  };

  const onSubmit = async (data: UpdateTokensData) => {
    setLoading(true);
    try {
      await authService.updateTokens(data);
      toast.success('Tokens updated successfully!');
      await loadProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <p className="text-sm text-gray-600 mt-1">{user?.fullName}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Key className="h-5 w-5 mr-2" />
              <div>
                <CardTitle>API Tokens</CardTitle>
                <CardDescription>
                  Configure tokens so AI can comment on GitHub/GitLab
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="githubToken">
                  GitHub Personal Access Token
                  {user?.hasGithubToken && (
                    <span className="ml-2 text-xs text-green-600">✓ Configured</span>
                  )}
                </Label>
                <Input
                  id="githubToken"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  {...register('githubToken')}
                />
                <p className="text-xs text-gray-500">
                  Create token at: GitHub → Settings → Developer settings → Personal access tokens
                  <br />
                  Required scopes: repo, write:discussion
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gitlabToken">
                  GitLab Personal Access Token
                  {user?.hasGitlabToken && (
                    <span className="ml-2 text-xs text-green-600">✓ Configured</span>
                  )}
                </Label>
                <Input
                  id="gitlabToken"
                  type="password"
                  placeholder="glpat-xxxxxxxxxxxx"
                  {...register('gitlabToken')}
                />
                <p className="text-xs text-gray-500">
                  Create token at: GitLab → Preferences → Access Tokens
                  <br />
                  Required scopes: api, read_api, write_repository
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discordBotToken">
                  Discord Bot Token
                  {user?.hasDiscordBotToken && (
                    <span className="ml-2 text-xs text-green-600">✓ Configured</span>
                  )}
                </Label>
                <Input
                  id="discordBotToken"
                  type="password"
                  placeholder="your-discord-bot-token"
                  {...register('discordBotToken')}
                />
                <p className="text-xs text-gray-500">
                  Your Discord bot token for sending notifications
                  <br />
                  Create bot at: <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Discord Developer Portal</a>
                </p>
              </div>

              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Tokens'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
