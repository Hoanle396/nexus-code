'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="backdrop-blur-md bg-white/80 shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              AI Code Reviewer
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => router.push('/pricing')} className="hover:text-primary">
                Bảng giá
              </Button>
              <Button variant="ghost" onClick={() => router.push('/login')} className="hover:text-primary">
                Đăng nhập
              </Button>
              <Button onClick={() => router.push('/auth/register')} className="shadow-lg hover:shadow-xl">
                Bắt đầu miễn phí
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-20">
        <div className="text-center animate-fade-in">
          <div className="inline-block mb-4 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
            ✨ Powered by Advanced AI
          </div>
          <h1 className="text-7xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              AI Code Reviewer
            </span>
          </h1>
          <p className="text-2xl text-gray-700 mb-10 max-w-3xl mx-auto font-medium leading-relaxed">
            Hệ thống review code tự động với AI. Hiểu business context, phát hiện lỗi chính xác, 
            và học từ feedback của bạn.
          </p>
          
          <div className="flex gap-4 justify-center mb-6 animate-slide-in">
            <Button size="lg" onClick={() => router.push('/auth/register')} className="text-base px-8 py-6 shadow-xl hover:shadow-2xl">
              🚀 Bắt đầu miễn phí
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/pricing')} className="text-base px-8 py-6">
              💎 Xem bảng giá
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600 mb-20">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Không cần thẻ tín dụng</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Dùng thử miễn phí</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Hủy bất cứ lúc nào</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-primary/30 hover:-translate-y-2">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🤖</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">AI Review Thông Minh</h3>
              <p className="text-gray-600 leading-relaxed">
                AI hiểu business context và review code theo đúng quy chuẩn của dự án
              </p>
              <div className="mt-4 text-primary font-semibold group-hover:translate-x-2 transition-transform duration-300 inline-flex items-center">
                Tìm hiểu thêm →
              </div>
            </div>
            
            <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-secondary/30 hover:-translate-y-2">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🔄</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Tự Động Hóa</h3>
              <p className="text-gray-600 leading-relaxed">
                Webhook tự động review mỗi pull request, comment ngay lập tức
              </p>
              <div className="mt-4 text-secondary font-semibold group-hover:translate-x-2 transition-transform duration-300 inline-flex items-center">
                Tìm hiểu thêm →
              </div>
            </div>
            
            <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-accent/30 hover:-translate-y-2">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">📚</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Học & Cải Thiện</h3>
              <p className="text-gray-600 leading-relaxed">
                AI học từ feedback của bạn, ngày càng review chính xác hơn
              </p>
              <div className="mt-4 text-accent font-semibold group-hover:translate-x-2 transition-transform duration-300 inline-flex items-center">
                Tìm hiểu thêm →
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
