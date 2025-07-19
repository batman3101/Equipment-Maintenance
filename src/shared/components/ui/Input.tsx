'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * 모바일 최적화된 입력 필드 컴포넌트
 * - 44px 이상 터치 영역 보장
 * - 접근성 준수 (라벨, 에러 메시지 연결)
 * - 유효성 검사 상태 표시
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className,
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    fullWidth = true,
    id,
    ...props 
  }, ref) => {
    // 고유 ID 생성 (접근성을 위해)
    const generatedId = React.useId();
    const inputId = id || `input-${generatedId}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    // 기본 입력 필드 스타일
    const inputClasses = cn(
      'flex h-12 w-full rounded-lg border border-gray-300 bg-white px-3 py-2',
      'text-base placeholder:text-gray-500',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
      'min-h-[48px]', // 48px 최소 터치 영역
      leftIcon && 'pl-10',
      rightIcon && 'pr-10',
      error && 'border-red-500 focus:ring-red-500',
      !fullWidth && 'w-auto',
      className
    );

    // 라벨 스타일
    const labelClasses = cn(
      'block text-sm font-medium text-gray-700 mb-1',
      error && 'text-red-700'
    );

    return (
      <div className={cn('space-y-1', fullWidth ? 'w-full' : 'w-auto')}>
        {label && (
          <label htmlFor={inputId} className={labelClasses}>
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400" aria-hidden="true">
                {leftIcon}
              </div>
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(
              errorId && errorId,
              helperId && helperId
            ).trim() || undefined}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400" aria-hidden="true">
                {rightIcon}
              </div>
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p id={helperId} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';