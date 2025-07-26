// EquipmentCard 컴포넌트
// 설비 정보를 카드 형태로 표시하는 컴포넌트

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, Badge, Button } from '@/shared/components/ui';
import { Equipment, EquipmentStatus } from '../types';

export interface EquipmentCardProps {
  equipment: Equipment;
  onEdit?: (equipment: Equipment) => void;
  onDelete?: (equipment: Equipment) => void;
  onStatusChange?: (equipment: Equipment, status: string) => void;
  onView?: (equipment: Equipment) => void;
  className?: string;
  showActions?: boolean;
  compact?: boolean;
}

/**
 * 설비 카드 컴포넌트 (DB 스키마에 맞게 단순화)
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
        case EquipmentStatus.MAINTENANCE:
          return 'warning';
        case EquipmentStatus.TEST:
          return 'default';
        default:
          return 'default';
      }
    };

    // 상태 라벨 매핑
    const getStatusLabel = (status: EquipmentStatus) => {
      switch (status) {
        case EquipmentStatus.ACTIVE:
          return '정상';
        case EquipmentStatus.MAINTENANCE:
          return '정비중';
        case EquipmentStatus.TEST:
          return '테스트';
        default:
          return status;
      }
    };

    // 설비 타입 라벨 매핑
    const getEquipmentTypeLabel = (type: string) => {
      switch (type) {
        case 'cnc_machine':
          return 'CNC 머신';
        case 'lathe':
          return '선반';
        case 'milling_machine':
          return '밀링머신';
        case 'drill_press':
          return '드릴프레스';
        case 'grinder':
          return '그라인더';
        case 'press':
          return '프레스';
        case 'conveyor':
          return '컨베이어';
        case 'robot':
          return '로봇';
        case 'other':
          return '기타';
        default:
          return type;
      }
    };

    const handleCardClick = () => {
      onView?.(equipment);
    };

    return (
      <Card
        ref={ref}
        className={cn(
          'cursor-pointer hover:shadow-lg hover:scale-[1.02] dark:hover:shadow-2xl dark:hover:shadow-black/25 transition-all duration-300 ease-in-out',
          compact && 'p-3',
          className
        )}
        onClick={handleCardClick}
        {...props}
      >
        <div className="space-y-3">
          {/* 헤더 */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {equipment.equipment_number}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {getEquipmentTypeLabel(equipment.equipment_type)}
              </p>
            </div>
            <Badge 
              variant={getStatusBadgeVariant(equipment.status)}
              size="sm"
            >
              {getStatusLabel(equipment.status)}
            </Badge>
          </div>

          {/* 메타 정보 */}
          {!compact && (
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <div>생성일: {new Date(equipment.created_at).toLocaleDateString()}</div>
              <div>수정일: {new Date(equipment.updated_at).toLocaleDateString()}</div>
            </div>
          )}

          {/* 액션 버튼들 */}
          {showActions && (
            <div className="flex space-x-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              {onEdit && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(equipment);
                  }}
                  className="flex-1"
                >
                  수정
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(equipment);
                  }}
                  className="flex-1"
                >
                  삭제
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }
);

EquipmentCard.displayName = 'EquipmentCard';