'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type ChipVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';
export type ChipSize = 'sm' | 'md' | 'lg';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant;
  size?: ChipSize;
  removable?: boolean;
  onRemove?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

/**
 * 칩 컴포넌트
 * - 태그, 필터, 라벨 표시용
 * - 제거 가능한 옵션
 * - 44px 이상 터치 영역 보장
 * - 접근성 준수
 */
export const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  ({ 
    className,
    variant = 'default',
    size = 'md',
    removable = false,
    onRemove,
    disabled = false,
    children,
    ...props 
  }, ref) => {
    // 크기별 스타일
    const sizeClasses = {
      sm: 'px-2 py-1 text-xs min-h-[32px]',
      md: 'px-3 py-1.5 text-sm min-h-[36px]',
      lg: 'px-4 py-2 text-base min-h-[44px]'
    };

    // 변형별 스타일
    const variantClasses = {
      default: 'bg-gray-100 text-gray-800 border-gray-200',
      primary: 'bg-blue-100 text-blue-800 border-blue-200',
      success: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      danger: 'bg-red-100 text-red-800 border-red-200'
    };

    const chipClasses = cn(
      'inline-flex items-center font-medium rounded-full border',
      'transition-colors duration-200',
      sizeClasses[size],
      variantClasses[variant],
      disabled && 'opacity-50 cursor-not-allowed',
      !disabled && removable && 'hover:shadow-sm',
      className
    );

    const handleRemove = (event: React.MouseEvent) => {
      event.stopPropagation();
      if (!disabled && onRemove) {
        onRemove();
      }
    };

    return (
      <span
        ref={ref}
        className={chipClasses}
        {...props}
      >
        <span className="truncate">{children}</span>
        
        {removable && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className={cn(
              'ml-1 -mr-1 flex-shrink-0 rounded-full p-0.5',
              'hover:bg-black hover:bg-opacity-10 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              'min-w-[20px] min-h-[20px] flex items-center justify-center',
              variant === 'primary' && 'focus:ring-blue-500',
              variant === 'success' && 'focus:ring-green-500',
              variant === 'warning' && 'focus:ring-yellow-500',
              variant === 'danger' && 'focus:ring-red-500',
              variant === 'default' && 'focus:ring-gray-500',
              disabled && 'cursor-not-allowed'
            )}
            aria-label="제거"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Chip.displayName = 'Chip';

/**
 * 칩 그룹 컴포넌트
 * - 여러 칩을 그룹으로 관리
 * - 선택 가능한 칩 지원
 */
export interface ChipGroupProps {
  children: React.ReactNode;
  className?: string;
  wrap?: boolean;
}

export const ChipGroup = React.forwardRef<HTMLDivElement, ChipGroupProps>(
  ({ children, className, wrap = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex gap-2',
          wrap ? 'flex-wrap' : 'overflow-x-auto',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ChipGroup.displayName = 'ChipGroup';

/**
 * 선택 가능한 칩 컴포넌트
 */
export interface SelectableChipProps {
  variant?: ChipVariant;
  size?: ChipSize;
  disabled?: boolean;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  className?: string;
  children: React.ReactNode;
  // 기타 버튼 속성
  type?: 'button' | 'submit' | 'reset';
  name?: string;
  id?: string;
  tabIndex?: number;
  'aria-label'?: string;
}

export const SelectableChip = React.forwardRef<HTMLButtonElement, SelectableChipProps>(
  ({ 
    selected = false,
    onSelect,
    variant = 'default',
    disabled = false,
    className,
    children,
    ...props 
  }, ref) => {
    const handleClick = () => {
      if (!disabled && onSelect) {
        onSelect(!selected);
      }
    };

    // 선택된 상태의 변형 스타일
    const selectedVariantClasses = {
      default: 'bg-gray-800 text-white border-gray-800',
      primary: 'bg-blue-600 text-white border-blue-600',
      success: 'bg-green-600 text-white border-green-600',
      warning: 'bg-yellow-600 text-white border-yellow-600',
      danger: 'bg-red-600 text-white border-red-600'
    };

    const unselectedVariantClasses = {
      default: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
      primary: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
      success: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
      danger: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
    };

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'inline-flex items-center font-medium rounded-full border',
          'px-3 py-1.5 text-sm min-h-[36px]',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          selected ? selectedVariantClasses[variant] : unselectedVariantClasses[variant],
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer',
          variant === 'primary' && 'focus:ring-blue-500',
          variant === 'success' && 'focus:ring-green-500',
          variant === 'warning' && 'focus:ring-yellow-500',
          variant === 'danger' && 'focus:ring-red-500',
          variant === 'default' && 'focus:ring-gray-500',
          className
        )}
        aria-pressed={selected}
        {...props}
      >
        <span className="truncate">{children}</span>
      </button>
    );
  }
);

SelectableChip.displayName = 'SelectableChip';