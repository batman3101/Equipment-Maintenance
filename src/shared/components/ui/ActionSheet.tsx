'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ActionSheetAction {
  id: string;
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<any>;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

export interface ActionSheetOption {
  id: string;
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<any>;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

export interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  actions?: ActionSheetAction[];
  options?: ActionSheetOption[];
  showCancelButton?: boolean;
  cancelText?: string;
  className?: string;
}

/**
 * 액션 시트 컴포넌트
 * - 모바일 최적화된 바텀 시트
 * - 접근성 준수
 * - 스와이프로 닫기 지원
 * - 다양한 액션 타입 지원
 */
export const ActionSheet = React.forwardRef<HTMLDivElement, ActionSheetProps>(
  ({ 
    isOpen,
    onClose,
    title,
    description,
    actions = [],
    options = [],
    showCancelButton = true,
    cancelText = '취소',
    className,
    ...props 
  }, ref) => {
    const sheetRef = React.useRef<HTMLDivElement>(null);
    const [startY, setStartY] = React.useState(0);
    const [currentY, setCurrentY] = React.useState(0);
    const [isDragging, setIsDragging] = React.useState(false);

    // ESC 키로 닫기
    React.useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isOpen) {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        // 바디 스크롤 방지
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }, [isOpen, onClose]);

    // 터치 이벤트 처리 (스와이프로 닫기)
    const handleTouchStart = (event: React.TouchEvent) => {
      setStartY(event.touches[0].clientY);
      setIsDragging(true);
    };

    const handleTouchMove = (event: React.TouchEvent) => {
      if (!isDragging) return;
      
      const currentY = event.touches[0].clientY;
      const deltaY = currentY - startY;
      
      if (deltaY > 0) { // 아래로 드래그할 때만
        setCurrentY(deltaY);
        if (sheetRef.current) {
          sheetRef.current.style.transform = `translateY(${deltaY}px)`;
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      
      setIsDragging(false);
      
      // 일정 거리 이상 드래그하면 닫기
      if (currentY > 100) {
        onClose();
      } else {
        // 원래 위치로 복귀
        if (sheetRef.current) {
          sheetRef.current.style.transform = 'translateY(0)';
        }
      }
      
      setCurrentY(0);
    };

    // 오버레이 클릭으로 닫기
    const handleOverlayClick = (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    };

    // 액션 실행
    const handleActionClick = (action: ActionSheetAction) => {
      if (!action.disabled) {
        action.onClick();
        onClose();
      }
    };

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'actionsheet-title' : undefined}
        aria-describedby={description ? 'actionsheet-description' : undefined}
      >
        {/* 오버레이 */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />

        {/* 액션 시트 */}
        <div
          ref={sheetRef}
          className={cn(
            'relative bg-white rounded-t-xl shadow-xl w-full max-w-md mx-4 mb-4',
            'transform transition-transform duration-300 ease-out',
            isOpen ? 'translate-y-0' : 'translate-y-full',
            className
          )}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          {...props}
        >
          {/* 드래그 핸들 */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-8 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* 헤더 */}
          {(title || description) && (
            <div className="px-4 pb-4 text-center border-b border-gray-200">
              {title && (
                <h3 id="actionsheet-title" className="text-lg font-semibold text-gray-900 mb-1">
                  {title}
                </h3>
              )}
              {description && (
                <p id="actionsheet-description" className="text-sm text-gray-600">
                  {description}
                </p>
              )}
            </div>
          )}

          {/* 액션 목록 */}
          <div className="py-2">
            {[...actions, ...options].map((action) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled}
                  className={cn(
                    'w-full px-4 py-4 flex items-center space-x-3',
                    'text-left transition-colors min-h-[56px]',
                    'hover:bg-gray-50 active:bg-gray-100',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    action.variant === 'danger' 
                      ? 'text-red-600 hover:bg-red-50 active:bg-red-100' 
                      : 'text-gray-900'
                  )}
                >
                  {IconComponent && (
                    <div className="flex-shrink-0 w-5 h-5">
                      <IconComponent className="w-5 h-5" />
                    </div>
                  )}
                  <span className="font-medium">{action.label}</span>
                </button>
              );
            })}
          </div>

          {/* 취소 버튼 */}
          {showCancelButton && (
            <div className="border-t border-gray-200">
              <button
                onClick={onClose}
                className={cn(
                  'w-full px-4 py-4 text-center font-medium text-gray-600',
                  'hover:bg-gray-50 active:bg-gray-100 transition-colors',
                  'min-h-[56px] rounded-b-xl'
                )}
              >
                {cancelText}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ActionSheet.displayName = 'ActionSheet';

/**
 * 액션 시트 훅
 * - 상태 관리 간소화
 * - 타입 안전성 제공
 */
export const useActionSheet = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<Omit<ActionSheetProps, 'isOpen' | 'onClose'>>({
    actions: []
  });

  const open = (newConfig: Omit<ActionSheetProps, 'isOpen' | 'onClose'>) => {
    setConfig(newConfig);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  const ActionSheetComponent = () => (
    <ActionSheet
      {...config}
      isOpen={isOpen}
      onClose={close}
    />
  );

  return {
    open,
    close,
    isOpen,
    ActionSheet: ActionSheetComponent
  };
};