'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
}

/**
 * 빈 상태 컴포넌트
 * - 데이터가 없을 때 표시
 * - 사용자 가이드 제공
 * - 액션 버튼 지원
 * - 다양한 아이콘 지원
 */
export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ 
    icon,
    title,
    description,
    action,
    className,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center text-center p-8 space-y-4',
          'min-h-[300px]',
          className
        )}
        {...props}
      >
        {/* 아이콘 */}
        <div className="flex-shrink-0">
          {icon || (
            <svg
              className="h-16 w-16 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          )}
        </div>

        {/* 텍스트 콘텐츠 */}
        <div className="space-y-2 max-w-sm">
          <h3 className="text-lg font-medium text-gray-900">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-500 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* 액션 버튼 */}
        {action && (
          <Button
            variant={action.variant || 'primary'}
            onClick={action.onClick}
            className="mt-4"
          >
            {action.label}
          </Button>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

/**
 * 미리 정의된 빈 상태 컴포넌트들
 */

// 고장 목록이 비어있을 때
export const EmptyBreakdownList = ({ onCreateBreakdown }: { onCreateBreakdown?: () => void }) => (
  <EmptyState
    icon={
      <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    }
    title="등록된 고장이 없습니다"
    description="아직 등록된 설비 고장이 없습니다. 새로운 고장을 등록해보세요."
    action={onCreateBreakdown ? {
      label: '고장 등록하기',
      onClick: onCreateBreakdown,
      variant: 'primary'
    } : undefined}
  />
);

// 수리 내역이 비어있을 때
export const EmptyRepairList = ({ onCreateRepair }: { onCreateRepair?: () => void }) => (
  <EmptyState
    icon={
      <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    }
    title="수리 내역이 없습니다"
    description="이 고장에 대한 수리 내역이 아직 없습니다. 수리를 완료한 후 내역을 등록해보세요."
    action={onCreateRepair ? {
      label: '수리 내역 등록',
      onClick: onCreateRepair,
      variant: 'primary'
    } : undefined}
  />
);

// 검색 결과가 없을 때
export const EmptySearchResult = ({ searchTerm, onClearSearch }: { 
  searchTerm?: string; 
  onClearSearch?: () => void; 
}) => (
  <EmptyState
    icon={
      <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    }
    title="검색 결과가 없습니다"
    description={
      searchTerm 
        ? `'${searchTerm}'에 대한 검색 결과를 찾을 수 없습니다. 다른 검색어를 시도해보세요.`
        : '검색 조건에 맞는 결과를 찾을 수 없습니다.'
    }
    action={onClearSearch ? {
      label: '검색 초기화',
      onClick: onClearSearch,
      variant: 'secondary'
    } : undefined}
  />
);

// 설비 목록이 비어있을 때
export const EmptyEquipmentList = ({ onCreateEquipment }: { onCreateEquipment?: () => void }) => (
  <EmptyState
    icon={
      <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    }
    title="등록된 설비가 없습니다"
    description="아직 등록된 설비가 없습니다. 새로운 설비를 등록해보세요."
    action={onCreateEquipment ? {
      label: '설비 등록하기',
      onClick: onCreateEquipment,
      variant: 'primary'
    } : undefined}
  />
);

// 네트워크 오류 상태
export const EmptyNetworkError = ({ onRetry }: { onRetry?: () => void }) => (
  <EmptyState
    icon={
      <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    }
    title="연결에 문제가 발생했습니다"
    description="네트워크 연결을 확인하고 다시 시도해주세요."
    action={onRetry ? {
      label: '다시 시도',
      onClick: onRetry,
      variant: 'primary'
    } : undefined}
  />
);