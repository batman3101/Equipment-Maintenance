'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './LoadingSpinner';

export interface FullScreenLoadingProps {
  isLoading: boolean;
  message?: string;
  progress?: number; // 0-100
  showProgress?: boolean;
  backdrop?: 'light' | 'dark' | 'blur';
  className?: string;
}

/**
 * 풀 스크린 로딩 컴포넌트
 * - 전체 화면 오버레이
 * - 진행률 표시 지원
 * - 다양한 배경 스타일
 * - 접근성 준수
 */
export const FullScreenLoading = React.forwardRef<HTMLDivElement, FullScreenLoadingProps>(
  ({ 
    isLoading,
    message = '로딩 중...',
    progress,
    showProgress = false,
    backdrop = 'light',
    className,
    ...props 
  }, ref) => {
    // 바디 스크롤 방지
    React.useEffect(() => {
      if (isLoading) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }

      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [isLoading]);

    if (!isLoading) return null;

    // 배경 스타일
    const backdropClasses = {
      light: 'bg-white bg-opacity-80',
      dark: 'bg-black bg-opacity-50',
      blur: 'bg-white bg-opacity-70 backdrop-blur-sm'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center',
          backdropClasses[backdrop],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="loading-message"
        {...props}
      >
        <div className="flex flex-col items-center space-y-4 p-6 max-w-sm w-full mx-4">
          {/* 로딩 스피너 */}
          <LoadingSpinner 
            size="lg" 
            color={backdrop === 'dark' ? 'white' : 'primary'} 
          />

          {/* 로딩 메시지 */}
          <div className="text-center space-y-2">
            <p 
              id="loading-message"
              className={cn(
                'text-base font-medium',
                backdrop === 'dark' ? 'text-white' : 'text-gray-900'
              )}
            >
              {message}
            </p>

            {/* 진행률 표시 */}
            {showProgress && progress !== undefined && (
              <div className="w-full space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
                <p className={cn(
                  'text-sm',
                  backdrop === 'dark' ? 'text-gray-300' : 'text-gray-600'
                )}>
                  {Math.round(progress)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

FullScreenLoading.displayName = 'FullScreenLoading';

/**
 * 풀 스크린 로딩 훅
 * - 상태 관리 간소화
 * - 진행률 업데이트 기능
 */
export const useFullScreenLoading = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [message, setMessage] = React.useState('로딩 중...');
  const [progress, setProgress] = React.useState<number | undefined>(undefined);

  const show = (loadingMessage?: string, initialProgress?: number) => {
    setMessage(loadingMessage || '로딩 중...');
    setProgress(initialProgress);
    setIsLoading(true);
  };

  const hide = () => {
    setIsLoading(false);
    setProgress(undefined);
  };

  const updateProgress = (newProgress: number) => {
    setProgress(newProgress);
  };

  const updateMessage = (newMessage: string) => {
    setMessage(newMessage);
  };

  return {
    isLoading,
    message,
    progress,
    show,
    hide,
    updateProgress,
    updateMessage,
    setProgress,
    setMessage
  };
};