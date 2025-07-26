/**
 * KPI 카드 컴포넌트
 * 대시보드의 주요 지표를 표시하는 카드
 */

import React from 'react';
import { KPICardProps } from '../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    text: 'text-blue-900',
    trend: 'text-blue-600',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: 'text-orange-600',
    text: 'text-orange-900',
    trend: 'text-orange-600',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-600',
    text: 'text-green-900',
    trend: 'text-green-600',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    text: 'text-red-900',
    trend: 'text-red-600',
  },
};

export function KPICard({ title, value, trend, icon, color }: KPICardProps) {
  const classes = colorClasses[color];

  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.changeType) {
      case 'increase':
        return <TrendingUp className="h-4 w-4" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    
    switch (trend.changeType) {
      case 'increase':
        return 'text-red-600'; // 증가는 일반적으로 부정적 (고장 증가)
      case 'decrease':
        return 'text-green-600'; // 감소는 일반적으로 긍정적 (고장 감소)
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={`rounded-lg border p-6 hover:shadow-lg hover:scale-[1.02] dark:hover:shadow-2xl dark:hover:shadow-black/25 transition-all duration-300 ease-in-out ${classes.bg} ${classes.border}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${classes.text}`}>{title}</p>
          <div className="mt-2 flex items-baseline">
            <p className={`text-3xl font-bold ${classes.text}`}>
              {value.toLocaleString()}
            </p>
            {trend && (
              <div className={`ml-2 flex items-center text-sm ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="ml-1">
                  {trend.change > 0 ? trend.change.toLocaleString() : '0'}
                </span>
              </div>
            )}
          </div>
          {trend && (
            <p className="mt-1 text-xs text-gray-600">
              전일 대비
            </p>
          )}
        </div>
        <div className={`${classes.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/**
 * KPI 카드 스켈레톤 로딩 컴포넌트
 */
export function KPICardSkeleton() {
  return (
    <div className="rounded-lg border bg-gray-50 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
          <div className="mt-2 flex items-baseline">
            <div className="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
            <div className="ml-2 h-4 w-8 animate-pulse rounded bg-gray-200"></div>
          </div>
          <div className="mt-1 h-3 w-16 animate-pulse rounded bg-gray-200"></div>
        </div>
        <div className="h-8 w-8 animate-pulse rounded bg-gray-200"></div>
      </div>
    </div>
  );
}