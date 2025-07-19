'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'primary' | 'white' | 'gray';
}

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * 로딩 스피너 컴포넌트
 * - 다양한 크기 지원
 * - 접근성 준수 (aria-label)
 */
export const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ size = 'md', className, color = 'primary', ...props }, ref) => {
    // 크기별 스타일
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8'
    };

    // 색상별 스타일
    const colorClasses = {
      primary: 'text-blue-600',
      white: 'text-white',
      gray: 'text-gray-400'
    };

    return (
      <div
        ref={ref}
        className={cn('inline-block', className)}
        role="status"
        aria-label="로딩 중"
        {...props}
      >
        <svg
          className={cn(
            'animate-spin',
            sizeClasses[size],
            colorClasses[color]
          )}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="sr-only">로딩 중...</span>
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * 스켈레톤 UI 컴포넌트
 * - 콘텐츠 로딩 중 플레이스홀더 제공
 * - 다양한 형태 지원
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse rounded-md bg-gray-200',
          className
        )}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

/**
 * 카드 스켈레톤 컴포넌트
 */
export const CardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
};

/**
 * 리스트 스켈레톤 컴포넌트
 */
export const ListSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
};

/**
 * 테이블 스켈레톤 컴포넌트
 */
export const TableSkeleton = ({ 
  rows = 5, 
  columns = 4 
}: { 
  rows?: number; 
  columns?: number; 
}) => {
  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex space-x-4 p-3 border-b">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* 행들 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 p-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};