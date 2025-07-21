/**
 * 대시보드 도메인 내보내기
 */

export { Dashboard } from './components/dashboard';
export { KPICard, KPICardSkeleton } from './components/kpi-card';
export { RecentActivities } from './components/recent-activities';
export { useDashboardStats, useRecentActivities, calculateTrend } from './hooks/use-dashboard';
export { dashboardService } from './services/dashboard-service';
export type { 
  DashboardStats, 
  DashboardTrend, 
  RecentActivity, 
  KPICardProps 
} from './types';