// EquipmentCard 컴포넌트
// 설비 정보를 카드 형태로 표시하는 컴포넌트

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, Badge, Button, Chip } from '@/shared/components/ui';
import { Equipment, EquipmentStatus, EquipmentPriority } from '../types';
import { 
  EQUIPMENT_TYPE_LABELS, 
  EQUIPMENT_STATUS_LABELS, 
  EQUIPMENT_PRIORITY_LABELS 
} from '../types';

export interface EquipmentCardProps {
  equipment: Equipment;
  onEdit?: (equipment: Equipment) => void;
  onDelete?: (equipment: Equipment) => void;
  onStatusChange?: (equipment: Equipment, status: EquipmentStatus) => void;
  onView?: (equipment: Equipment) => void;
  className?: string;
  showActions?: boolean;
  compact?: boolean;
}

/**
 * 설비 카드 컴포넌트
 * - 설비 정보 요약 표시
 * - 상태별 색상 구분
 * - 액션 버튼 지원
 * - 모바일 최적화
 */
export const EquipmentCard = React.forwardRef<HTMLDivElement, EquipmentCardProps>(
  ({ 
    equipment,
    onEdit,
    onDelete,
    onStatusChange,
    onView,
    className,
    showActions = true,
    compact = false,
    ...props 
  }, ref) => {
    // 상태별 배지 변형
    const getStatusBadgeVariant = (status: EquipmentStatus) => {
      switch (status) {
        case EquipmentStatus.ACTIVE:
          return 'success';
        case EquipmentStatus.INACTIVE:
          return 'default';
        case EquipmentStatus.MAINTENANCE:
          return 'warning';
        case EquipmentStatus.BROKEN:
          return 'danger';
        default:
          return 'default';
      }
    };

    // 우선순위별 칩 변형
    const getPriorityChipVariant = (priority: EquipmentPriority) => {
      switch (priority) {
        case EquipmentPriority.LOW:
          return 'default';
        case EquipmentPriority.MEDIUM:
          return 'primary';
        case EquipmentPriority.HIGH:
          return 'warning';
        case EquipmentPriority.CRITICAL:
          return 'danger';
        default:
          return 'default';
      }
    };

    // 정비 예정 여부 확인
    const isMaintenanceDue = equipment.next_maintenance_date && 
      new Date(equipment.next_maintenance_date) <= new Date();

    // 카드 클릭 핸들러
    const handleCardClick = () => {
      onView?.(equipment);
    };

    // 액션 버튼 클릭 시 이벤트 전파 방지
    const handleActionClick = (event: React.MouseEvent, action: () => void) => {
      event.stopPropagation();
      action();
    };

    return (
      <Card
        ref={ref}
        className={cn(
          'transition-all duration-200 hover:shadow-md',
          onView && 'cursor-pointer',
          className
        )}
        onClick={onView ? handleCardClick : undefined}
        {...props}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {equipment.equipment_number}
              </h3>
              <Badge 
                variant={getStatusBadgeVariant(equipment.status)}
                size="sm"
              >
                {EQUIPMENT_STATUS_LABELS[equipment.status]}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 truncate">
              {equipment.name}
            </p>
          </div>
          
          {/* 우선순위 칩 */}
          <Chip
            variant={getPriorityChipVariant(equipment.priority)}
            size="sm"
          >
            {EQUIPMENT_PRIORITY_LABELS[equipment.priority]}
          </Chip>
        </div>

        {/* 설비 정보 */}
        {!compact && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span className="truncate">{EQUIPMENT_TYPE_LABELS[equipment.type]}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{equipment.location}</span>
            </div>

            {equipment.manufacturer && (
              <div className="flex items-center text-sm text-gray-600">
                <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="truncate">{equipment.manufacturer}</span>
              </div>
            )}

            {/* 정비 예정 알림 */}
            {isMaintenanceDue && (
              <div className="flex items-center text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>정비 예정</span>
              </div>
            )}
          </div>
        )}

        {/* 액션 버튼 */}
        {showActions && (
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleActionClick(e, () => onEdit(equipment))}
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                수정
              </Button>
            )}
            
            {onStatusChange && (
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => handleActionClick(e, () => {
                  // 상태 변경 로직 (간단한 토글 예시)
                  const newStatus = equipment.status === EquipmentStatus.ACTIVE ? EquipmentStatus.INACTIVE : EquipmentStatus.ACTIVE;
                  onStatusChange(equipment, newStatus);
                })}
              >
                {equipment.status === EquipmentStatus.ACTIVE ? '비활성화' : '활성화'}
              </Button>
            )}

            {onDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={(e) => handleActionClick(e, () => onDelete(equipment))}
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                삭제
              </Button>
            )}
          </div>
        )}
      </Card>
    );
  }
);

EquipmentCard.displayName = 'EquipmentCard';