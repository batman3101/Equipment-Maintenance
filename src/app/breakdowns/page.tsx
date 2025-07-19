'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { BreakdownList } from '@/domains/breakdown/components/BreakdownList';
import type { Breakdown } from '@/domains/breakdown/types';

/**
 * 고장 목록 페이지
 * 등록된 고장들을 조회하고 관리할 수 있는 메인 페이지입니다.
 */
export default function BreakdownsPage() {
  const router = useRouter();

  const handleBreakdownClick = (breakdown: Breakdown) => {
    router.push(`/breakdowns/${breakdown.id}`);
  };

  const handleCreateBreakdown = () => {
    router.push('/breakdowns/new');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">고장 목록</h1>
          <button
            onClick={handleCreateBreakdown}
            className="
              flex items-center gap-2 px-4 py-2 bg-blue-600 text-white 
              rounded-lg hover:bg-blue-700 active:bg-blue-800
              transition-colors duration-200 min-h-[44px]
              font-medium text-sm
            "
          >
            <Plus className="w-4 h-4" />
            고장 등록
          </button>
        </div>
      </header>

      {/* 고장 목록 */}
      <main className="flex-1 overflow-hidden">
        <BreakdownList onBreakdownClick={handleBreakdownClick} />
      </main>
    </div>
  );
}