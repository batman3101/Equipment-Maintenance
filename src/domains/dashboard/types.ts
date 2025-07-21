/**
 * 대시보드 관련 타입 정의
 */

export interface DashboardStats {
  totalBreakdowns: number;
  inProgressBreakdowns: number;
  completedRepairs: number;
  previousDayStats?: {
    totalBreakdowns: number;
    inProgressBreakdowns: number;
    completedRepairs: number;
  };
}

export interface DashboardTrend {
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
}

export interface RecentActivity {
  id: string;
  type: 'breakdown' | 'repair';
  equipmentType: string;
  equipmentNumber: string;
  status: 'in_progress' | 'under_repair' | 'completed';
  reporterName: string;
  createdAt: string;
  symptoms?: string;
  actionTaken?: string;
}

export interface KPICardProps {
  title: string;
  value: number;
  trend?: DashboardTrend;
  icon: React.ReactNode;
  color: 'blue' | 'orange' | 'green' | 'red';
}