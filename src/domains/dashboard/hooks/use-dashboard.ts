/**
 * 대시보드 데이터 관리 훅
 */

import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboard-service';
import { DashboardStats, RecentActivity, DashboardTrend } from '../types';

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '통계 데이터 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // 실시간 업데이트 구독
    const unsubscribe = dashboardService.subscribeToDashboardUpdates(() => {
      fetchStats();
    });

    return unsubscribe;
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

export function useRecentActivities(limit: number = 10) {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getRecentActivities(limit);
      setActivities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '최근 활동 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

    // 실시간 업데이트 구독
    const unsubscribe = dashboardService.subscribeToDashboardUpdates(() => {
      fetchActivities();
    });

    return unsubscribe;
  }, [limit]);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities,
  };
}

/**
 * 트렌드 계산 유틸리티 함수
 */
export function calculateTrend(current: number, previous: number): DashboardTrend {
  const change = current - previous;
  const changeType = change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral';
  
  return {
    value: current,
    change: Math.abs(change),
    changeType,
  };
}