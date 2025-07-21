/**
 * 메인 대시보드 컴포넌트
 * KPI 카드와 최근 활동을 통합하여 표시
 */

import React from 'react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  BarChart3,
  RefreshCw 
} from 'lucide-react';
import { KPICard, KPICardSkeleton } from './kpi-card';
import { RecentActivities } from './recent-activities';
import { useDashboardStats, useRecentActivities, calculateTrend } from '../hooks/use-dashboard';

export function Dashboard() {
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats();
  const { activities, loading: activitiesLoading, error: activitiesError, refetch: refetchActivities } = useRecentActivities(8);

  const handleRefresh = () => {
    refetchStats();
    refetchActivities();
  };

  // KPI 데이터 계산
  const kpiData = React.useMemo(() => {
    if (!stats) return null;

    const totalTrend = stats.previousDayStats 
      ? calculateTrend(stats.totalBreakdowns, stats.previousDayStats.totalBreakdowns)
      : undefined;

    const inProgressTrend = stats.previousDayStats
      ? calculateTrend(stats.inProgressBreakdowns, stats.previousDayStats.inProgressBreakdowns)
      : undefined;

    const completedTrend = stats.previousDayStats
      ? calculateTrend(stats.completedRepairs, stats.previousDayStats.completedRepairs)
      : undefined;

    return [
      {
        title: '총 고장 건수',
        value: stats.totalBreakdowns,
        trend: totalTrend,
        icon: <BarChart3 className="h-8 w-8" />,
        color: 'blue' as const,
      },
      {
        title: '진행 중인 고장',
        value: stats.inProgressBreakdowns,
        trend: inProgressTrend,
        icon: <Clock className="h-8 w-8" />,
        color: 'orange' as const,
      },
      {
        title: '완료된 수리',
        value: stats.completedRepairs,
        trend: completedTrend,
        icon: <CheckCircle className="h-8 w-8" />,
        color: 'green' as const,
      },
    ];
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="text-sm text-gray-600 mt-1">
            설비 현황을 한눈에 확인하세요
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={statsLoading || activitiesLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${(statsLoading || activitiesLoading) ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* 에러 표시 */}
      {(statsError || activitiesError) && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="text-sm font-medium text-red-800">데이터 로딩 오류</h3>
          </div>
          <div className="mt-2 text-sm text-red-700">
            {statsError && <p>통계 데이터: {statsError}</p>}
            {activitiesError && <p>활동 내역: {activitiesError}</p>}
          </div>
          <button
            onClick={handleRefresh}
            className="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* KPI 카드 그리드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statsLoading ? (
          <>
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
          </>
        ) : kpiData ? (
          kpiData.map((kpi, index) => (
            <KPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              trend={kpi.trend}
              icon={kpi.icon}
              color={kpi.color}
            />
          ))
        ) : null}
      </div>

      {/* 최근 활동 섹션 */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">최근 활동</h2>
          <p className="text-sm text-gray-600 mt-1">
            최근 등록된 고장과 수리 내역
          </p>
        </div>
        <div className="p-6">
          <RecentActivities 
            activities={activities} 
            loading={activitiesLoading} 
          />
        </div>
      </div>
    </div>
  );
}