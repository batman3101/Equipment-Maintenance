'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

/**
 * 모바일 최적화된 텍스트 영역 컴포넌트
 * - 접근성 준수
 * - 자동 크기 조정 옵션
 * - 문자 수 제한 표시
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className,
    label,
    error,
    helperText,
    fullWidth = true,
    resize = 'vertical',
    id,
    maxLength,
    value,
    ...props 
  }, ref) => {
    // 고유 ID 생성
    const generatedId = React.useId();
    const textareaId = id || `textarea-${generatedId}`;
    const errorId = error ? `${textareaId}-error` : undefined;
    const helperId = helperText ? `${textareaId}-helper` : undefined;

    // 문자 수 계산
    const currentLength = typeof value === 'string' ? value.length : 0;

    // 리사이즈 스타일
    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize'
    };

    // 텍스트 영역 스타일
    const textareaClasses = cn(
      'flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2',
      'text-base placeholder:text-gray-500',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
      'min-h-[100px]', // 최소 높이 설정
      resizeClasses[resize],
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
          <label htmlFor={textareaId} className={labelClasses}>
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          className={textareaClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(
            errorId && errorId,
            helperId && helperId
          ).trim() || undefined}
          maxLength={maxLength}
          value={value}
          {...props}
        />

        {/* 문자 수 표시 */}
        {maxLength && (
          <div className="flex justify-end">
            <span className={cn(
              'text-xs',
              currentLength > maxLength * 0.9 ? 'text-red-500' : 'text-gray-500'
            )}>
              {currentLength}/{maxLength}
            </span>
          </div>
        )}

        {error && (
          <p id={errorId} className="text-sm text-red-600 flex items-center" role="alert">
            <svg
              className="h-4 w-4 mr-1 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
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

Textarea.displayName = 'Textarea';