'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// 버튼 변형 타입 정의
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

/**
 * 모바일 최적화된 버튼 컴포넌트
 * - 44px 이상 터치 영역 보장
 * - 접근성 준수 (ARIA 속성)
 * - 로딩 상태 지원
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    fullWidth = false,
    disabled,
    children, 
    ...props 
  }, ref) => {
    // 기본 스타일 클래스
    const baseClasses = [
      'inline-flex items-center justify-center rounded-lg font-medium',
      'transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'active:scale-95 transition-transform',
      fullWidth ? 'w-full' : ''
    ];

    // 크기별 스타일 (최소 44px 터치 영역 보장)
    const sizeClasses = {
      sm: 'h-10 px-3 text-sm min-h-[44px]', // 44px 최소 높이
      md: 'h-12 px-4 text-base min-h-[48px]', // 48px 권장 높이
      lg: 'h-14 px-6 text-lg min-h-[56px]'   // 56px 큰 버튼
    };

    // 변형별 스타일
    const variantClasses = {
      primary: [
        'bg-blue-600 text-white hover:bg-blue-700',
        'focus:ring-blue-500',
        'disabled:bg-blue-300'
      ],
      secondary: [
        'bg-gray-200 text-gray-900 hover:bg-gray-300',
        'focus:ring-gray-500',
        'disabled:bg-gray-100'
      ],
      danger: [
        'bg-red-600 text-white hover:bg-red-700',
        'focus:ring-red-500',
        'disabled:bg-red-300'
      ],
      ghost: [
        'bg-transparent text-gray-700 hover:bg-gray-100',
        'focus:ring-gray-500',
        'disabled:text-gray-400'
      ]
    };

    const combinedClasses = cn(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      className
    );

    // 햅틱 피드백 (모바일에서)
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      // 모바일 디바이스에서 햅틱 피드백 제공
      if ('vibrate' in navigator && window.innerWidth <= 768) {
        navigator.vibrate(10); // 10ms 진동
      }
      
      props.onClick?.(event);
    };

    return (
      <button
        className={combinedClasses}
        ref={ref}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';