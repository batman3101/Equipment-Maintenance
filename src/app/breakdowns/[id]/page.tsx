'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { BreakdownDetail } from '@/domains/breakdown/components/BreakdownDetail';
import { FullScreenLoading } from '@/shared/components/ui/FullScreenLoading';
import { useBreakdown } from '@/domains/breakdown/hooks/useBreakdown';
import { useRepairList } from '@/domains/repair/hooks/useRepairList';
import { useAuth } from '@/domains/auth/hooks/useAuth';
import { useRealtimeNotifications } from '@/domains/breakdown/hooks/useRealtimeNotifications';
import type { Breakdown } from '@/domains/breakdown/types';

interface BreakdownDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * 고장 상세 페이지
 * 특정 고장의 상세 정보와 관련 수리 내역을 표시합니다.
 */
export default function BreakdownDetailPage({ params }: BreakdownDetailPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [id, setId] = useState<string>('');

  const {
    breakdown: fetchedBreakdown,
    loading: breakdownLoading,
    error: breakdownError,
    fetchBreakdown
  } = useBreakdown();

  const {
    repairs,
    loading: repairsLoading,
    error: repairsError,
    setFilters: setRepairFilters,
    refreshRepairs
  } = useRepairList({
    initialFilters: { breakdown_id: id },
    autoFetch: false // id가 설정된 후에 수동으로 fetch
  });

  // 실시간 업데이트 구독
  useRealtimeNotifications({
    onStatusChanged: (payload) => {
      if (payload.breakdown_id === id) {
        // 고장 정보 새로고침
        fetchBreakdown(id);
      }
    },
    onError: (error) => {
      console.error('실시간 알림 오류:', error);
    }
  });

  // params에서 id 추출
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  // 고장 정보 로드
  useEffect(() => {
    if (id) {
      fetchBreakdown(id);
    }
  }, [id, fetchBreakdown]);

  // 고장 정보 업데이트
  useEffect(() => {
    if (fetchedBreakdown) {
      setBreakdown(fetchedBreakdown);
    }
  }, [fetchedBreakdown]);

  // 수리 필터 업데이트 및 데이터 fetch
  useEffect(() => {
    if (id) {
      setRepairFilters({ breakdown_id: id });
      refreshRepairs();
    }
  }, [id, setRepairFilters, refreshRepairs]);

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    router.push(`/breakdowns/${id}/edit`);
  };

  const handleAddRepair = () => {
    router.push(`/repairs/new?breakdown_id=${id}`);
  };

  // 수정 권한 확인
  const canEdit = Boolean(breakdown && user && (
    breakdown.reporter_id === user.id || 
    user.role === 'admin' || 
    user.role === 'manager'
  ));

  // 로딩 상태
  if (breakdownLoading && !breakdown) {
    return <FullScreenLoading message="고장 정보를 불러오는 중..." isLoading={true} />;
  }

  // 에러 상태
  if (breakdownError && !breakdown) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">고장 상세</h1>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              고장 정보를 불러올 수 없습니다
            </h2>
            <p className="text-gray-600 mb-4">{breakdownError}</p>
            <div className="space-x-3">
              <button
                onClick={() => fetchBreakdown(id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                다시 시도
              </button>
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 고장 정보가 없는 경우
  if (!breakdown) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">고장 상세</h1>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              고장 정보를 찾을 수 없습니다
            </h2>
            <p className="text-gray-600 mb-4">
              요청하신 고장 정보가 존재하지 않거나 삭제되었을 수 있습니다.
            </p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">고장 상세</h1>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto">
        <BreakdownDetail
          breakdown={breakdown}
          repairs={repairs}
          repairsLoading={repairsLoading}
          canEdit={canEdit}
          onEdit={handleEdit}
          onAddRepair={handleAddRepair}
        />

        {/* 수리 내역 로딩 에러 */}
        {repairsError && (
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  수리 내역을 불러오는 중 오류가 발생했습니다: {repairsError}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}