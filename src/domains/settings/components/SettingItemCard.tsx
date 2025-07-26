'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { ActionSheet } from '@/shared/components/ui/ActionSheet';
import { ConfirmModal } from '@/shared/components/ui/Modal';
import { 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff,
  GripVertical 
} from 'lucide-react';
import type { BaseSettingItem } from '../types';

export interface SettingItemCardProps<T extends BaseSettingItem> {
  item: T;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onToggleActive: (item: T) => void;
  showColor?: boolean;
  colorValue?: string;
  showIcon?: boolean;
  iconValue?: string;
  customContent?: React.ReactNode;
  isDragging?: boolean;
}

/**
 * 설정 항목 카드 컴포넌트
 * 공통 CRUD 액션과 모바일 친화적 인터페이스를 제공
 */
export function SettingItemCard<T extends BaseSettingItem>({
  item,
  onEdit,
  onDelete,
  onToggleActive,
  showColor = false,
  colorValue,
  showIcon = false,
  iconValue,
  customContent,
  isDragging = false
}: SettingItemCardProps<T>) {
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 액션 시트 옵션
  const actionOptions = [
    {
      id: 'edit',
      label: '수정',
      icon: Edit2,
      onClick: () => {
        setShowActionSheet(false);
        onEdit(item);
      }
    },
    {
      id: 'toggle',
      label: item.is_active ? '비활성화' : '활성화',
      icon: item.is_active ? EyeOff : Eye,
      onClick: () => {
        setShowActionSheet(false);
        onToggleActive(item);
      }
    },
    {
      id: 'delete',
      label: '삭제',
      icon: Trash2,
      onClick: () => {
        setShowActionSheet(false);
        setShowDeleteConfirm(true);
      },
      variant: 'danger' as const
    }
  ];

  // 삭제 확인
  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    onDelete(item);
  };

  return (
    <>
      <Card 
        className={`hover:shadow-lg hover:scale-[1.02] dark:hover:shadow-2xl dark:hover:shadow-black/25 transition-all duration-300 ease-in-out ${
          isDragging ? 'shadow-lg scale-105' : ''
        } ${!item.is_active ? 'opacity-60' : ''}`}
      >
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            {/* 드래그 핸들 (순서 변경용) */}
            <div className="cursor-move text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400">
              <GripVertical className="h-4 w-4" />
            </div>

            {/* 색상 표시 */}
            {showColor && colorValue && (
              <div 
                className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
                style={{ backgroundColor: colorValue }}
                aria-label={`색상: ${colorValue}`}
              />
            )}

            {/* 아이콘 표시 (TODO: 실제 아이콘 렌더링) */}
            {showIcon && iconValue && (
              <div className="w-4 h-4 text-gray-600 flex-shrink-0">
                {/* 아이콘 컴포넌트 렌더링 로직 */}
                <div className="w-full h-full bg-gray-300 rounded" />
              </div>
            )}

            {/* 메인 콘텐츠 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {item.name}
                </h3>
                <Badge 
                  variant={item.is_active ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {item.is_active ? '활성' : '비활성'}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                {'code' in item && (
                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {(item as any).code}
                  </span>
                )}
                <span>순서: {item.display_order}</span>
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
              
              {item.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                  {item.description}
                </p>
              )}

              {/* 커스텀 콘텐츠 */}
              {customContent && (
                <div className="mt-2">
                  {customContent}
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center space-x-2">
              {/* 데스크톱용 빠른 액션 버튼 */}
              <div className="hidden sm:flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(item)}
                  className="p-2"
                  aria-label="수정"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleActive(item)}
                  className="p-2"
                  aria-label={item.is_active ? '비활성화' : '활성화'}
                >
                  {item.is_active ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* 더보기 메뉴 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowActionSheet(true)}
                className="p-2"
                aria-label="더보기"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 모바일 액션 시트 */}
      <ActionSheet
        isOpen={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        title={`"${item.name}" 관리`}
        options={actionOptions}
      />

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="항목 삭제"
        message={`"${item.name}" 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
      />
    </>
  );
}