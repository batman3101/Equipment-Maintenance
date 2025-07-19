'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastProps extends Omit<Toast, 'id'> {
  onClose: () => void;
}

export interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

/**
 * 토스트 알림 컴포넌트
 * - 접근성 준수 (role="alert")
 * - 자동 사라짐 기능
 * - 다양한 타입 지원
 */
export const ToastComponent = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ 
    type,
    title,
    message,
    duration = 5000,
    action,
    onClose,
    ...props 
  }, ref) => {
    // 자동 사라짐 타이머
    React.useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
      }
    }, [duration, onClose]);

    // 타입별 스타일
    const typeStyles = {
      success: {
        bg: 'bg-green-50 border-green-200',
        icon: 'text-green-400',
        title: 'text-green-800',
        message: 'text-green-700'
      },
      error: {
        bg: 'bg-red-50 border-red-200',
        icon: 'text-red-400',
        title: 'text-red-800',
        message: 'text-red-700'
      },
      warning: {
        bg: 'bg-yellow-50 border-yellow-200',
        icon: 'text-yellow-400',
        title: 'text-yellow-800',
        message: 'text-yellow-700'
      },
      info: {
        bg: 'bg-blue-50 border-blue-200',
        icon: 'text-blue-400',
        title: 'text-blue-800',
        message: 'text-blue-700'
      }
    };

    // 타입별 아이콘
    const icons = {
      success: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      error: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
      warning: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
      info: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      )
    };

    const styles = typeStyles[type];

    return (
      <div
        ref={ref}
        className={cn(
          'max-w-sm w-full shadow-lg rounded-lg pointer-events-auto border',
          'transform transition-all duration-300 ease-in-out',
          styles.bg
        )}
        role="alert"
        aria-live="assertive"
        {...props}
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className={cn('flex-shrink-0', styles.icon)}>
              {icons[type]}
            </div>
            <div className="ml-3 w-0 flex-1">
              <p className={cn('text-sm font-medium', styles.title)}>
                {title}
              </p>
              {message && (
                <p className={cn('mt-1 text-sm', styles.message)}>
                  {message}
                </p>
              )}
              {action && (
                <div className="mt-3">
                  <button
                    onClick={action.onClick}
                    className={cn(
                      'text-sm font-medium underline hover:no-underline',
                      'min-h-[44px] px-2 py-1',
                      styles.title
                    )}
                  >
                    {action.label}
                  </button>
                </div>
              )}
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={onClose}
                className={cn(
                  'rounded-md inline-flex text-gray-400 hover:text-gray-500',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
                  'min-h-[44px] min-w-[44px] flex items-center justify-center'
                )}
                aria-label="알림 닫기"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ToastComponent.displayName = 'ToastComponent';

/**
 * 토스트 컨테이너 컴포넌트
 */
export const ToastContainer = ({ 
  position = 'top-right' 
}: ToastContainerProps) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  // 위치별 스타일
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // 전역 토스트 관리를 위한 이벤트 리스너
  React.useEffect(() => {
    const handleAddToast = (event: CustomEvent<Toast>) => {
      setToasts(prev => [...prev, event.detail]);
    };

    window.addEventListener('add-toast', handleAddToast as EventListener);
    return () => {
      window.removeEventListener('add-toast', handleAddToast as EventListener);
    };
  }, []);

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col space-y-2 pointer-events-none',
        positionClasses[position]
      )}
    >
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          action={toast.action}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

/**
 * 토스트 유틸리티 함수들
 */
export const toast = {
  success: (title: string, message?: string, options?: Partial<Toast>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toastData: Toast = {
      id,
      type: 'success',
      title,
      message,
      ...options
    };
    window.dispatchEvent(new CustomEvent('add-toast', { detail: toastData }));
  },

  error: (title: string, message?: string, options?: Partial<Toast>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toastData: Toast = {
      id,
      type: 'error',
      title,
      message,
      ...options
    };
    window.dispatchEvent(new CustomEvent('add-toast', { detail: toastData }));
  },

  warning: (title: string, message?: string, options?: Partial<Toast>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toastData: Toast = {
      id,
      type: 'warning',
      title,
      message,
      ...options
    };
    window.dispatchEvent(new CustomEvent('add-toast', { detail: toastData }));
  },

  info: (title: string, message?: string, options?: Partial<Toast>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toastData: Toast = {
      id,
      type: 'info',
      title,
      message,
      ...options
    };
    window.dispatchEvent(new CustomEvent('add-toast', { detail: toastData }));
  }
};