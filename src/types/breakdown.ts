// Breakdown 관련 타입 정의

export type BreakdownPriority = 'low' | 'medium' | 'high' | 'urgent'
export type BreakdownStatus = 'reported' | 'assigned' | 'in_progress' | 'completed'

export interface BreakdownReport {
  id: string
  equipmentId: string
  breakdownTitle: string
  breakdownDescription: string
  breakdownType?: string
  priority: BreakdownPriority
  occurredAt: string
  reportedBy: string
  status: BreakdownStatus
  assignedTo?: string
  symptoms?: string
  createdAt: string
  updatedAt: string
}

export interface BreakdownListProps {
  onReportClick?: (report: BreakdownReport) => void
}

export interface BreakdownListRef {
  refreshData: () => void
}