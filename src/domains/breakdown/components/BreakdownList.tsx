'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { BreakdownCard } from './BreakdownCard';
import { BreakdownListFilter } from './BreakdownListFilter';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { FullScreenLoading } from '@/shared/components/ui/FullScreenLoading';
import { useBreakdownList } from '../hooks/useBreakdownList';
import type { Breakdown, BreakdownFilter } from '../types';

interface BreakdownListProps {
  onBreakdownClick?: (breakdown: Breakdown) => void;
}

/**
 * 고장 목록 컴포넌트
 * 고장 목록을 표시하고 필터링, 검색, 무한 스크롤, Pull-to-refresh 기능을 제공합니다.
 */
export function BreakdownList({ onBreakdownClick }: BreakdownListProps) {
  const [filter, setFilter] = useState<BreakdownFilter>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const lastScrollTop = useRef<number>(0);

  const {
    breakdowns,
    loading,
    error,
    total,
    hasMore,
    refetch,
    loadMore,
    updateFilter
  } = useBreakdownList({
    filter,
    autoFetch: true
  });

  // 필터 업데이트 핸들러
  const handleFilterChange = useCallback((newFilter: BreakdownFilter) => {
    setFilter(newFilter);
    updateFilter(newFilter);
  }, [updateFilter]);

  // 검색 핸들러
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Pull-to-refresh 구현
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (scrollContainerRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || scrollContainerRef.current?.scrollTop !== 0) {
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - touchStartY.current);
    const maxDistance = 100;
    
    setPullDistance(Math.min(distance, maxDistance));

    // 당겨내리기 임계값 도달 시 새로고침 준비
    if (distance > 60) {
      e.preventDefault();
    }
  }, [isPulling]);

  const handleTouchEnd = useCallback(async () => {
    if (isPulling && pullDistance > 60) {
      setIsRefreshing(true);
      try {
        await refetch();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
  }, [isPulling, pullDistance, refetch]);

  // 무한 스크롤 구현
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || loading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    lastScrollTop.current = scrollTop;

    // 하단 근처에 도달하면 더 로드
    if (scrollHeight - scrollTop - clientHeight < 200) {
      loadMore();
    }
  }, [loading, hasMore, loadMore]);

  // 스크롤 이벤트 리스너 등록
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // 로딩 상태
  if (loading && breakdowns.length === 0) {
    return <FullScreenLoading message="고장 목록을 불러오는 중..." />;
  }

  // 에러 상태
  if (error && breakdowns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 필터 */}
      <BreakdownListFilter
        filter={filter}
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
      />

      {/* Pull-to-refresh 인디케이터 */}
      {(isPulling || isRefreshing) && (
        <div 
          className="flex items-center justify-center py-4 bg-blue-50 transition-all duration-200"
          style={{ 
            transform: `translateY(${Math.max(0, pullDistance - 60)}px)`,
            opacity: pullDistance > 30 ? 1 : pullDistance / 30
          }}
        >
          <RefreshCw 
            className={`w-5 h-5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} 
          />
          <span className="ml-2 text-sm text-blue-600">
            {isRefreshing ? '새로고침 중...' : pullDistance > 60 ? '놓아서 새로고침' : '당겨서 새로고침'}
          </span>
        </div>
      )}

      {/* 목록 컨테이너 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {breakdowns.length === 0 ? (
          <EmptyState
            title="등록된 고장이 없습니다"
            description={
              searchQuery || filter.status
                ? "검색 조건을 변경하거나 필터를 초기화해보세요."
                : "첫 번째 고장을 등록해보세요."
            }
            actionLabel={searchQuery || filter.status ? "필터 초기화" : undefined}
            onAction={searchQuery || filter.status ? () => {
              setSearchQuery('');
              handleFilterChange({});
            } : undefined}
          />
        ) : (
          <div className="p-4 space-y-3">
            {/* 결과 요약 */}
            <div className="text-sm text-gray-600 mb-4">
              총 {total}건의 고장 중 {breakdowns.length}건 표시
            </div>

            {/* 고장 카드 목록 */}
            {breakdowns.map((breakdown) => (
              <BreakdownCard
                key={breakdown.id}
                breakdown={breakdown}
                onClick={onBreakdownClick}
              />
            ))}

            {/* 로딩 인디케이터 */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-gray-600">더 불러오는 중...</span>
              </div>
            )}

            {/* 더 이상 데이터가 없을 때 */}
            {!hasMore && breakdowns.length > 0 && (
              <div className="text-center py-8 text-sm text-gray-500">
                모든 고장을 불러왔습니다.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}