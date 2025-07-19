'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

/**
 * 배지 컴포넌트
 * - 상태 표시용
 * - 다양한 색상과 크기 지원
 * - 접근성 준수
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ 
    className,
    variant = 'default',
    size = 'md',
    children,
    ...props 
  }, ref) => {
    // 크기별 스타일
    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base'
    };

    // 변형별 스타일
    const variantClasses = {
      default: 'bg-gray-100 text-gray-800 border-gray-200',
      success: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      danger: 'bg-red-100 text-red-800 border-red-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200'
    };

    const badgeClasses = cn(
      'inline-flex items-center font-medium rounded-full border',
      'transition-colors duration-200',
      sizeClasses[size],
      variantClasses[variant],
      className
    );

    return (
      <span
        ref={ref}
        className={badgeClasses}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

/**
 * 상태 배지 컴포넌트 (고장/수리 상태용)
 */
export interface StatusBadgeProps {
  status: 'in_progress' | 'under_repair' | 'completed';
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const statusConfig = {
    in_progress: {
      variant: 'warning' as BadgeVariant,
      label: '진행 중',
      icon: (
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      )
    },
    under_repair: {
      variant: 'info' as BadgeVariant,
      label: '수리 중',
      icon: (
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      )
    },
    completed: {
      variant: 'success' as BadgeVariant,
      label: '완료',
      icon: (
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    }
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.icon}
      {config.label}
    </Badge>
  );
};