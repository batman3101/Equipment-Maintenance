'use client';

import React, { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { triggerHapticFeedback } from '@/lib/utils/haptic';

export interface TouchButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      icon,
      iconPosition = 'left',
      children,
      onClick,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = useState(false);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      
      triggerHapticFeedback('light');
      onClick?.(event);
    };

    const handleTouchStart = () => {
      if (disabled) return;
      
      triggerHapticFeedback('light');
      setIsPressed(true);
    };

    const handleTouchEnd = () => {
      setIsPressed(false);
    };

    const baseClasses = cn(
      // 기본 스타일
      'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'active:scale-95 select-none',
      
      // 터치 영역 최소 44px 보장
      'min-h-[44px] min-w-[44px]',
      
      // 크기별 스타일
      {
        'px-3 py-2 text-sm': size === 'sm',
        'px-4 py-2.5 text-base': size === 'md',
        'px-6 py-3 text-lg': size === 'lg',
      },
      
      // 변형별 스타일
      {
        'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500': variant === 'primary',
        'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500': variant === 'secondary',
        'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500': variant === 'outline',
        'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500': variant === 'ghost',
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500': variant === 'danger',
      },
      
      // 전체 너비
      {
        'w-full': fullWidth,
      },
      
      // 비활성화 상태
      {
        'opacity-50 cursor-not-allowed': disabled,
      },
      
      // 터치 상태
      {
        'scale-95': isPressed,
      },
      
      className
    );

    return (
      <button
        ref={ref}
        className={baseClasses}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        disabled={disabled}
        {...props}
      >
        {icon && iconPosition === 'left' && (
          <span className="mr-2">{icon}</span>
        )}
        {children}
        {icon && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
      </button>
    );
  }
);

TouchButton.displayName = 'TouchButton';

export { TouchButton };