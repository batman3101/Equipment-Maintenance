'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { triggerHapticFeedback, HapticFeedbackType } from '@/lib/utils/haptic';

interface TouchAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  hapticFeedback?: HapticFeedbackType;
  rippleEffect?: boolean;
  rippleColor?: string;
  disabled?: boolean;
  minTouchSize?: boolean; // 최소 44px 터치 영역 보장
}

/**
 * 터치 최적화 영역 컴포넌트
 * - 44px 이상의 터치 영역 보장
 * - 햅틱 피드백 지원
 * - 물결 효과 애니메이션 (선택적)
 */
export function TouchArea({
  children,
  className,
  hapticFeedback,
  rippleEffect = false,
  rippleColor = 'rgba(0, 0, 0, 0.1)',
  disabled = false,
  minTouchSize = true,
  onClick,
  ...props
}: TouchAreaProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);
  const [isPressed, setIsPressed] = useState(false);

  // 터치 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    setIsPressed(true);
    
    if (hapticFeedback) {
      triggerHapticFeedback(hapticFeedback);
    }
    
    if (rippleEffect) {
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2;
      
      const ripple = {
        id: Date.now(),
        x,
        y,
        size,
      };
      
      setRipples((prev) => [...prev, ripple]);
      
      // 애니메이션 완료 후 ripple 제거
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
      }, 600);
    }
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    setIsPressed(false);
  };

  // 클릭 이벤트 핸들러
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !onClick) return;
    onClick(e);
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        minTouchSize && 'min-h-[44px] min-w-[44px]',
        disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer',
        isPressed ? 'scale-[0.98]' : '',
        'transition-transform duration-100',
        className
      )}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      {...props}
    >
      {children}
      
      {/* 물결 효과 */}
      {rippleEffect && ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-ripple pointer-events-none"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: rippleColor,
          }}
        />
      ))}
    </div>
  );
}