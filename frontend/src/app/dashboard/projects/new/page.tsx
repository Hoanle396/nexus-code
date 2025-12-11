'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { projectService, CreateProjectData } from '@/services/project.service';
import { ArrowLeft } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  plan: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  
  const { register, handleSubmit, formState: { errors } } = useForm<CreateProjectData>();

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      toast.error('Không thể tải danh sách teams');
    } finally {
      setLoadingTeams(false);
    }
  };

  const onSubmit = async (data: CreateProjectData) => {
    setLoading(true);
    try {
      await projectService.create(data);
      toast.success('Tạo project thành công!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Tạo project thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lại
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Tạo Project Mới</CardTitle>
          <CardDescription>
            Thêm repository để AI tự động review code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên Project *</Label>
              <Input
                id="name"
                placeholder="My Awesome Project"
                {...register('name', { required: 'Tên project là bắt buộc' })}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamId">Team *</Label>
              <select
                id="teamId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                {...register('teamId', { required: 'Team là bắt buộc' })}
                disabled={loadingTeams}
              >
                <option value="">Chọn team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.plan})
                  </option>
                ))}
              </select>
              {errors.teamId && (
                <p className="text-sm text-red-500">{errors.teamId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Platform *</Label>
              <select
                id="type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                {...register('type', { required: 'Platform là bắt buộc' })}
              >
                <option value="">Chọn platform</option>
                <option value="github">GitHub</option>
                <option value="gitlab">GitLab</option>
              </select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="repositoryUrl">Repository URL *</Label>
              <Input
                id="repositoryUrl"
                placeholder="https://github.com/username/repo"
                {...register('repositoryUrl', {
                  required: 'Repository URL là bắt buộc',
                })}
              />
              {errors.repositoryUrl && (
                <p className="text-sm text-red-500">{errors.repositoryUrl.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessContext">Business Context</Label>
              <Textarea
                id="businessContext"
                placeholder="Mô tả về business logic, quy chuẩn, những điều AI cần biết về dự án..."
                rows={5}
                {...register('businessContext')}
              />
              <p className="text-xs text-gray-500">
                Cung cấp thông tin về dự án để AI review chính xác hơn
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discordChannelId">Discord Channel ID (Optional)</Label>
              <Input
                id="discordChannelId"
                placeholder="1234567890123456789"
                {...register('discordChannelId')}
              />
              <p className="text-xs text-gray-500">
                Nhập Channel ID của Discord để nhận thông báo về PR và review (cần cài đặt bot trước)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="autoReview"
                type="checkbox"
                defaultChecked
                {...register('autoReview')}
                className="h-4 w-4"
              />
              <Label htmlFor="autoReview" className="cursor-pointer">
                Bật auto review (AI sẽ tự động review mỗi pull request)
              </Label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Đang tạo...' : 'Tạo Project'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Hủy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
