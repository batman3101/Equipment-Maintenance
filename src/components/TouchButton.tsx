'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { triggerHapticFeedback, HapticFeedbackType } from '@/lib/utils/haptic';

interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  hapticFeedback?: HapticFeedbackType;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

/**
 * 터치 최적화 버튼 컴포넌트
 * - 44px 이상의 터치 영역 보장
 * - 햅틱 피드백 지원
 * - 터치 인터랙션 애니메이션
 * - 접근성 지원
 */
export function TouchButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  hapticFeedback = 'light',
  fullWidth = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  onClick,
  ...props
}: TouchButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  // 버튼 스타일 변형
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400',
    outline: 'bg-transparent border border-gray-300 text-gray-800 hover:bg-gray-100 active:bg-gray-200',
    ghost: 'bg-transparent text-gray-800 hover:bg-gray-100 active:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  };

  // 버튼 크기
  const sizeStyles = {
    sm: 'text-sm px-3 py-2 min-h-[40px] min-w-[40px]',
    md: 'text-base px-4 py-2 min-h-[44px] min-w-[44px]',
    lg: 'text-lg px-5 py-3 min-h-[48px] min-w-[48px]',
  };

  // 터치 이벤트 핸들러
  const handleTouchStart = () => {
    if (!disabled) {
      setIsPressed(true);
      triggerHapticFeedback(hapticFeedback);
    }
  };

  const handleTouchEnd = () => {
    if (!disabled) {
      setIsPressed(false);
    }
  };

  // 클릭 이벤트 핸들러
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && onClick) {
      triggerHapticFeedback(hapticFeedback);
      onClick(e);
    }
  };

  return (
    <button
      className={cn(
        'relative rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? 'w-full' : '',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        isPressed ? 'scale-95' : '',
        className
      )}
      disabled={disabled}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      {...props}
    >
      <span className="flex items-center justify-center gap-2">
        {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
        {children}
        {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
      </span>
    </button>
  );
}