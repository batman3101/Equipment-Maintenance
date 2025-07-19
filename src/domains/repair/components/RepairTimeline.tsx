'use client';

import { formatDistanceToNow, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { User, Wrench, Clock, DollarSign } from 'lucide-react';
import type { Repair } from '../types';

interface RepairTimelineProps {
  repairs: Repair[];
  loading?: boolean;
}

/**
 * 수리 내역 타임라인 컴포넌트
 * 고장에 대한 수리 기록들을 시간순으로 표시합니다.
 */
export function RepairTimeline({ repairs, loading }: RepairTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (repairs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Wrench className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-sm">아직 수리 기록이 없습니다.</p>
      </div>
    );
  }

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        absolute: format(date, 'yyyy년 M월 d일 HH:mm', { locale: ko }),
        relative: formatDistanceToNow(date, { addSuffix: true, locale: ko })
      };
    } catch {
      return {
        absolute: '날짜 정보 없음',
        relative: ''
      };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {repairs.map((repair, index) => {
        const dateTime = formatDateTime(repair.completed_at);
        const isLast = index === repairs.length - 1;

        return (
          <div key={repair.id} className="relative">
            {/* 타임라인 라인 */}
            {!isLast && (
              <div className="absolute left-5 top-12 w-0.5 h-full bg-gray-200"></div>
            )}

            <div className="flex items-start gap-4">
              {/* 타임라인 아이콘 */}
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Wrench className="w-5 h-5 text-green-600" />
              </div>

              {/* 수리 내용 */}
              <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4">
                {/* 헤더 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">
                        {repair.technician?.name || '담당자 정보 없음'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span title={dateTime.absolute}>
                        {dateTime.relative}
                      </span>
                    </div>
                  </div>
                  
                  {repair.total_cost > 0 && (
                    <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                      <DollarSign className="w-4 h-4" />
                      {formatCurrency(repair.total_cost)}
                    </div>
                  )}
                </div>

                {/* 조치 내용 */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">조치 내용</h4>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {repair.action_taken}
                  </p>
                </div>

                {/* 사용 부품 */}
                {repair.parts_used && repair.parts_used.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">사용 부품</h4>
                    <div className="space-y-2">
                      {repair.parts_used.map((part) => (
                        <div 
                          key={part.id} 
                          className="flex items-center justify-between text-sm bg-gray-50 rounded p-2"
                        >
                          <div className="flex-1">
                            <span className="font-medium">{part.part_name}</span>
                            <span className="text-gray-500 ml-2">
                              × {part.quantity}개
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatCurrency(part.total_price)}
                            </div>
                            <div className="text-xs text-gray-500">
                              단가: {formatCurrency(part.unit_price)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}