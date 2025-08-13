// Dashboard 관련 타입 정의

export interface DashboardStats {
  breakdowns: {
    total: number
    urgent: number
    pending: number
  }
  repairs: {
    completed: number
    inProgress: number
    scheduled: number
  }
  equipment: {
    operational: number
    total: number
    maintenance: number
    stopped: number
  }
}

export interface EquipmentPerformance {
  id: number
  name: string
  status: string
  uptime: number
  efficiency: number
}

export interface MaintenanceSchedule {
  id: number
  equipment: string
  type: string
  dueDate: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export interface WeeklyTrend {
  labels: string[]
  breakdowns: number[]
  repairs: number[]
  uptime: number[]
}

export interface RealTimeStats {
  totalCost: number
  avgRepairTime: number
  equipmentAvailability: number
  topProblematicEquipment: unknown[]
}

export interface DashboardData {
  dailyStats: DashboardStats
  weeklyTrend: WeeklyTrend
  equipmentPerformance: EquipmentPerformance[]
  maintenanceSchedule: MaintenanceSchedule[]
  realTimeStats?: RealTimeStats
  error?: string
}