'use client';

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Clock, User, Wrench, CheckCircle, AlertCircle } from 'lucide-react';
import type { Breakdown } from '../types';

interface BreakdownCardProps {
  breakdown: Breakdown;
  onClick?: (breakdown: Breakdown) => void;
}

/**
 * 고장 카드 컴포넌트
 * 고장 정보를 카드 형태로 표시하며 상태별 색상 구분을 제공합니다.
 */
export function BreakdownCard({ breakdown, onClick }: BreakdownCardProps) {
  const getStatusConfig = (status: Breakdown['status']) => {
    switch (status) {
      case 'in_progress':
        return {
          icon: AlertCircle,
          label: '진행 중',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          iconColor: 'text-red-500'
        };
      case 'under_repair':
        return {
          icon: Wrench,
          label: '수리 중',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-700',
          iconColor: 'text-yellow-500'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          label: '완료',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          iconColor: 'text-green-500'
        };
      default:
        return {
          icon: AlertCircle,
          label: '알 수 없음',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
          iconColor: 'text-gray-500'
        };
    }
  };

  const statusConfig = getStatusConfig(breakdown.status);
  const StatusIcon = statusConfig.icon;

  const handleClick = () => {
    onClick?.(breakdown);
  };

  const formatOccurredAt = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: ko 
      });
    } catch {
      return '시간 정보 없음';
    }
  };

  return (
    <div
      className={`
        p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
        ${statusConfig.bgColor} ${statusConfig.borderColor}
        hover:shadow-md active:scale-[0.98]
        min-h-[120px] touch-manipulation
      `}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* 헤더: 설비 정보와 상태 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-lg truncate">
            {breakdown.equipment_type} - {breakdown.equipment_number}
          </h3>
        </div>
        <div className={`
          flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
          ${statusConfig.bgColor} ${statusConfig.textColor}
        `}>
          <StatusIcon className={`w-3 h-3 ${statusConfig.iconColor}`} />
          {statusConfig.label}
        </div>
      </div>

      {/* 증상 */}
      <div className="mb-3">
        <p className="text-gray-700 text-sm leading-relaxed overflow-hidden" 
           style={{
             display: '-webkit-box',
             WebkitLineClamp: 2,
             WebkitBoxOrient: 'vertical'
           }}>
          {breakdown.symptoms}
        </p>
      </div>

      {/* 메타 정보 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatOccurredAt(breakdown.occurred_at)}</span>
          </div>
          {breakdown.reporter_id && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>보고자</span>
            </div>
          )}
        </div>
        
        {/* 첨부파일 개수 */}
        {breakdown.attachments && breakdown.attachments.length > 0 && (
          <div className="flex items-center gap-1 text-blue-600">
            <span className="text-xs">📎 {breakdown.attachments.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}