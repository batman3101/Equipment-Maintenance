'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

/**
 * 구분선 컴포넌트
 * - 수평/수직 방향 지원
 * - 다양한 스타일 변형
 * - 텍스트 라벨 지원
 * - 접근성 준수
 */
export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ 
    className,
    orientation = 'horizontal',
    variant = 'solid',
    spacing = 'md',
    children,
    ...props 
  }, ref) => {
    // 방향별 기본 스타일
    const orientationClasses = {
      horizontal: 'w-full border-t',
      vertical: 'h-full border-l'
    };

    // 변형별 스타일
    const variantClasses = {
      solid: 'border-solid',
      dashed: 'border-dashed',
      dotted: 'border-dotted'
    };

    // 간격별 스타일
    const spacingClasses = {
      none: orientation === 'horizontal' ? 'my-0' : 'mx-0',
      sm: orientation === 'horizontal' ? 'my-2' : 'mx-2',
      md: orientation === 'horizontal' ? 'my-4' : 'mx-4',
      lg: orientation === 'horizontal' ? 'my-6' : 'mx-6'
    };

    // 텍스트가 있는 경우
    if (children) {
      return (
        <div
          ref={ref}
          className={cn(
            'relative flex items-center',
            spacingClasses[spacing],
            className
          )}
          role="separator"
          {...props}
        >
          <div className={cn(
            'flex-grow border-t border-gray-200',
            variantClasses[variant]
          )} />
          <span className="px-3 text-sm text-gray-500 bg-white">
            {children}
          </span>
          <div className={cn(
            'flex-grow border-t border-gray-200',
            variantClasses[variant]
          )} />
        </div>
      );
    }

    // 일반 구분선
    return (
      <div
        ref={ref}
        className={cn(
          'border-gray-200',
          orientationClasses[orientation],
          variantClasses[variant],
          spacingClasses[spacing],
          orientation === 'vertical' && 'min-h-[1px]',
          className
        )}
        role="separator"
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';