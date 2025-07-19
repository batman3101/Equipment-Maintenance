// EquipmentList 컴포넌트
// 설비 목록을 표시하고 관리하는 컴포넌트

'use client';

import React, { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  Button, 
  LoadingSpinner, 
  EmptyEquipmentList,
  EmptySearchResult,
  ListSkeleton
} from '@/shared/components/ui';
import { EquipmentCard } from './EquipmentCard';
import { useEquipmentList } from '../hooks/useEquipmentList';
import type { 
  Equipment, 
  EquipmentFilter, 
  EquipmentSort, 
  EquipmentStatus 
} from '../types';

export interface EquipmentListProps {
  filter?: EquipmentFilter;
  sort?: EquipmentSort;
  onEquipmentSelect?: (equipment: Equipment) => void;
  onEquipmentEdit?: (equipment: Equipment) => void;
  onEquipmentDelete?: (equipment: Equipment) => void;
  onEquipmentStatusChange?: (equipment: Equipment, status: EquipmentStatus) => void;
  onCreateNew?: () => void;
  className?: string;
  showActions?: boolean;
  compact?: boolean;
  enableInfiniteScroll?: boolean;
}

/**
 * 설비 목록 컴포넌트
 * - 무한 스크롤 지원
 * - 필터링 및 정렬 기능
 * - Pull-to-refresh 지원
 * - 빈 상태 처리
 */
export const EquipmentList = React.forwardRef<HTMLDivElement, EquipmentListProps>(
  ({ 
    filter,
    sort,
    onEquipmentSelect,
    onEquipmentEdit,
    onEquipmentDelete,
    onEquipmentStatusChange,
    onCreateNew,
    className,
    showActions = true,
    compact = false,
    enableInfiniteScroll = true,
    ...props 
  }, ref) => {
    const {
      equipment,
      loading,
      error,
      hasMore,
      total,
      loadMore,
      refresh,
      setFilter,
      setSort,
      clearError
    } = useEquipmentList({ filter, sort });

    // 필터 변경 시 적용
    useEffect(() => {
      if (filter) {
        setFilter(filter);
      }
    }, [filter, setFilter]);

    // 정렬 변경 시 적용
    useEffect(() => {
      if (sort) {
        setSort(sort);
      }
    }, [sort, setSort]);

    // 무한 스크롤 처리
    const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
      if (!enableInfiniteScroll || loading || !hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      // 90% 스크롤 시 다음 페이지 로드
      if (scrollPercentage > 0.9) {
        loadMore();
      }
    }, [enableInfiniteScroll, loading, hasMore, loadMore]);

    // Pull-to-refresh 처리
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [startY, setStartY] = React.useState(0);
    const [pullDistance, setPullDistance] = React.useState(0);

    const handleTouchStart = useCallback((event: React.TouchEvent) => {
      setStartY(event.touches[0].clientY);
    }, []);

    const handleTouchMove = useCallback((event: React.TouchEvent) => {
      const currentY = event.touches[0].clientY;
      const distance = currentY - startY;
      
      // 위로 당기는 경우만 처리
      if (distance > 0 && event.currentTarget.scrollTop === 0) {
        setPullDistance(Math.min(distance, 100));
      }
    }, [startY]);

    const handleTouchEnd = useCallback(async () => {
      if (pullDistance > 50 && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await refresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      setPullDistance(0);
    }, [pullDistance, isRefreshing, refresh]);

    // 에러 처리
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <div className="text-center">
            <svg className="h-12 w-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">오류가 발생했습니다</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={clearError} variant="primary">
              다시 시도
            </Button>
          </div>
        </div>
      );
    }

    // 로딩 중 (첫 로드)
    if (loading && equipment.length === 0) {
      return (
        <div className={cn('space-y-4', className)}>
          <ListSkeleton count={5} />
        </div>
      );
    }

    // 빈 상태 처리
    if (!loading && equipment.length === 0) {
      // 검색 결과가 없는 경우
      if (filter?.search) {
        return (
          <EmptySearchResult 
            searchTerm={filter.search}
            onClearSearch={() => setFilter({})}
          />
        );
      }
      
      // 설비가 없는 경우
      return <EmptyEquipmentList onCreateEquipment={onCreateNew} />;
    }

    return (
      <div
        ref={ref}
        className={cn('space-y-4', className)}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        {/* Pull-to-refresh 인디케이터 */}
        {pullDistance > 0 && (
          <div 
            className="flex justify-center py-2 transition-all duration-200"
            style={{ transform: `translateY(${pullDistance}px)` }}
          >
            {isRefreshing ? (
              <LoadingSpinner size="sm" />
            ) : (
              <div className="text-sm text-gray-500">
                {pullDistance > 50 ? '놓아서 새로고침' : '아래로 당겨서 새로고침'}
              </div>
            )}
          </div>
        )}

        {/* 설비 목록 헤더 */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            총 {total}개의 설비
          </div>
          {onCreateNew && (
            <Button
              variant="primary"
              size="sm"
              onClick={onCreateNew}
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              설비 등록
            </Button>
          )}
        </div>

        {/* 설비 카드 목록 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {equipment.map((item) => (
            <EquipmentCard
              key={item.id}
              equipment={item}
              onView={onEquipmentSelect}
              onEdit={onEquipmentEdit}
              onDelete={onEquipmentDelete}
              onStatusChange={onEquipmentStatusChange}
              showActions={showActions}
              compact={compact}
            />
          ))}
        </div>

        {/* 무한 스크롤 로딩 */}
        {enableInfiniteScroll && loading && equipment.length > 0 && (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="md" />
          </div>
        )}

        {/* 더 보기 버튼 (무한 스크롤 비활성화 시) */}
        {!enableInfiniteScroll && hasMore && !loading && (
          <div className="flex justify-center py-4">
            <Button
              variant="secondary"
              onClick={loadMore}
              loading={loading}
            >
              더 보기
            </Button>
          </div>
        )}

        {/* 끝 메시지 */}
        {!hasMore && equipment.length > 0 && (
          <div className="text-center py-4 text-sm text-gray-500">
            모든 설비를 불러왔습니다.
          </div>
        )}
      </div>
    );
  }
);

EquipmentList.displayName = 'EquipmentList';