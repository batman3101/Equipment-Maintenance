'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { BreakdownForm } from '@/domains/breakdown/components/BreakdownForm';
import { Navigation } from '@/components/navigation';
import { useAuth } from '@/domains/auth/hooks/use-auth';
import type { CreateBreakdownRequest } from '@/domains/breakdown/types';
import { breakdownService } from '@/domains/breakdown/services/BreakdownService';

/**
 * 고장 등록 페이지
 * 새로운 고장을 등록할 수 있는 페이지입니다.
 */
export default function NewBreakdownPage() {
  const router = useRouter();
  const { authState } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async (data: CreateBreakdownRequest) => {
    if (!authState.user) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('고장 등록 데이터:', data);
      
      const newBreakdown = await breakdownService.createBreakdown(data);
      console.log('생성된 고장:', newBreakdown);
      
      alert('고장이 성공적으로 등록되었습니다!');
      router.push('/breakdowns');
    } catch (error) {
      console.error('고장 등록 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '고장 등록에 실패했습니다.';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/breakdowns');
  };

  // 로그인 확인
  if (authState.loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!authState.user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">고장을 등록하려면 먼저 로그인해주세요.</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 네비게이션 */}
      <Navigation />
      
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
        {/* 헤더 */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">고장 등록</h1>
          </div>
        </header>

        {/* 폼 */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <BreakdownForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={isLoading}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}