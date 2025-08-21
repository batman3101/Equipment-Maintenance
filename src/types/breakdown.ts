// 고장 신고 관련 타입 정의

// 고장 신고 상태 enum
export enum BreakdownStatus {
  REPORTED = 'reported',        // 신고 접수
  IN_PROGRESS = 'in_progress',  // 수리중 
  COMPLETED = 'completed',      // 수리완료
}

// 상태값 레이블 매핑
export const BREAKDOWN_STATUS_LABELS = {
  [BreakdownStatus.REPORTED]: '신고 접수',
  [BreakdownStatus.IN_PROGRESS]: '수리중',
  [BreakdownStatus.COMPLETED]: '수리완료'
} as const

// 컴포넌트에서 사용되는 고장 신고 인터페이스 (완전한 데이터)
export interface BreakdownReport {
  id: string
  equipmentId: string
  equipmentCategory: string
  equipmentNumber: string
  assignedTo: string
  assignedToId: string
  reporterName?: string
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  issueType: 'mechanical' | 'electrical' | 'software' | 'safety' | 'other'
  description: string
  symptoms: string
  status: 'reported' | 'in_progress' | 'completed'
  occurredAt?: string
  resolutionDate?: string
  notes?: string
  breakdownTitle?: string
  breakdownDescription?: string
  breakdownType?: 'mechanical' | 'electrical' | 'software' | 'safety' | 'other'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  createdAt: string
  updatedAt: string
}

// 폼 전용 인터페이스 (사용자 입력 데이터)
export interface BreakdownReportForm {
  equipmentCategory: string
  equipmentNumber: string
  assignee?: string
  reporterName?: string
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  issueType: 'mechanical' | 'electrical' | 'software' | 'safety' | 'other'
  description: string
  symptoms: string
  status?: BreakdownStatus
}

// 데이터베이스 저장용 인터페이스
export interface BreakdownReportDB {
  equipment_id: string
  assigned_to: string
  breakdown_title: string
  description: string
  symptoms: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  issue_type: 'mechanical' | 'electrical' | 'software' | 'safety' | 'other'
  status: BreakdownStatus
  occurred_at: string
  created_at: string
  updated_at: string
}

// 리스트 컴포넌트 Props 인터페이스
export interface BreakdownListProps {
  onReportClick?: (report: BreakdownReport) => void
  filters?: BreakdownFilters
  refreshTrigger?: number
}

// 리스트 컴포넌트 Ref 인터페이스  
export interface BreakdownListRef {
  refreshData: () => Promise<void>
  getSelectedReports?: () => BreakdownReport[] // 선택적으로 변경
}

// 필터 인터페이스
export interface BreakdownFilters {
  status?: BreakdownStatus[]
  priority?: ('low' | 'medium' | 'high' | 'critical')[]
  dateRange?: {
    start: string
    end: string
  }
}