// [SRP] Rule: 통합 상태 정의 - 모든 상태값을 중앙 집중 관리
// [DIP] Rule: 구체적인 상태 값이 아닌 추상화된 상태 시스템

/**
 * 시스템 전체 상태 통합 관리
 * 설비, 고장 신고, 수리 등 모든 상태를 표준화
 */

// [OCP] Rule: 새로운 상태 추가 시 기존 코드 수정 없이 확장 가능
export enum SystemStatus {
  // 설비 상태
  EQUIPMENT_RUNNING = 'running',
  EQUIPMENT_BREAKDOWN = 'breakdown', 
  EQUIPMENT_STANDBY = 'standby',
  EQUIPMENT_MAINTENANCE = 'maintenance',
  EQUIPMENT_STOPPED = 'stopped',
  
  // 고장 신고 상태
  BREAKDOWN_REPORTED = 'breakdown_reported',
  BREAKDOWN_IN_PROGRESS = 'breakdown_in_progress', 
  BREAKDOWN_COMPLETED = 'breakdown_completed',
  
  // 수리 상태
  REPAIR_PENDING = 'repair_pending',
  REPAIR_IN_PROGRESS = 'repair_in_progress',
  REPAIR_COMPLETED = 'repair_completed',
  REPAIR_FAILED = 'repair_failed',
  
  // 일반 상태
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending'
}

// 상태 카테고리별 그룹핑
export const STATUS_GROUPS = {
  EQUIPMENT: [
    SystemStatus.EQUIPMENT_RUNNING,
    SystemStatus.EQUIPMENT_BREAKDOWN,
    SystemStatus.EQUIPMENT_STANDBY,
    SystemStatus.EQUIPMENT_MAINTENANCE,
    SystemStatus.EQUIPMENT_STOPPED
  ] as const,
  
  BREAKDOWN: [
    SystemStatus.BREAKDOWN_REPORTED,
    SystemStatus.BREAKDOWN_IN_PROGRESS,
    SystemStatus.BREAKDOWN_COMPLETED
  ] as const,
  
  REPAIR: [
    SystemStatus.REPAIR_PENDING,
    SystemStatus.REPAIR_IN_PROGRESS,
    SystemStatus.REPAIR_COMPLETED,
    SystemStatus.REPAIR_FAILED
  ] as const
} as const

// [ISP] Rule: 각 도메인별 상태 타입 분리
export type EquipmentStatus = typeof STATUS_GROUPS.EQUIPMENT[number]
export type BreakdownStatus = typeof STATUS_GROUPS.BREAKDOWN[number]
export type RepairStatus = typeof STATUS_GROUPS.REPAIR[number]

// 상태별 한국어 라벨 (i18n 대응)
export const STATUS_LABELS: Record<SystemStatus, { ko: string; vi?: string }> = {
  // 설비 상태
  [SystemStatus.EQUIPMENT_RUNNING]: { ko: '운영 중', vi: 'Đang hoạt động' },
  [SystemStatus.EQUIPMENT_BREAKDOWN]: { ko: '고장', vi: 'Hỏng hóc' },
  [SystemStatus.EQUIPMENT_STANDBY]: { ko: '대기', vi: 'Chờ' },
  [SystemStatus.EQUIPMENT_MAINTENANCE]: { ko: '정비 중', vi: 'Bảo trì' },
  [SystemStatus.EQUIPMENT_STOPPED]: { ko: '중지', vi: 'Dừng' },
  
  // 고장 신고 상태
  [SystemStatus.BREAKDOWN_REPORTED]: { ko: '신고 접수', vi: 'Đã báo cáo' },
  [SystemStatus.BREAKDOWN_IN_PROGRESS]: { ko: '수리 중', vi: 'Đang sửa chữa' },
  [SystemStatus.BREAKDOWN_COMPLETED]: { ko: '수리 완료', vi: 'Hoàn thành sửa chữa' },
  
  // 수리 상태
  [SystemStatus.REPAIR_PENDING]: { ko: '수리 대기', vi: 'Chờ sửa chữa' },
  [SystemStatus.REPAIR_IN_PROGRESS]: { ko: '수리 진행', vi: 'Đang sửa chữa' },
  [SystemStatus.REPAIR_COMPLETED]: { ko: '수리 완료', vi: 'Hoàn thành' },
  [SystemStatus.REPAIR_FAILED]: { ko: '수리 실패', vi: 'Sửa chữa thất bại' },
  
  // 일반 상태
  [SystemStatus.ACTIVE]: { ko: '활성', vi: 'Hoạt động' },
  [SystemStatus.INACTIVE]: { ko: '비활성', vi: 'Không hoạt động' },
  [SystemStatus.PENDING]: { ko: '대기', vi: 'Chờ' }
}

// 상태별 색상 정의 (Tailwind CSS 클래스)
export const STATUS_COLORS: Record<SystemStatus, string> = {
  // 설비 상태
  [SystemStatus.EQUIPMENT_RUNNING]: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
  [SystemStatus.EQUIPMENT_BREAKDOWN]: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200',
  [SystemStatus.EQUIPMENT_STANDBY]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
  [SystemStatus.EQUIPMENT_MAINTENANCE]: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
  [SystemStatus.EQUIPMENT_STOPPED]: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  
  // 고장 신고 상태
  [SystemStatus.BREAKDOWN_REPORTED]: 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200',
  [SystemStatus.BREAKDOWN_IN_PROGRESS]: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
  [SystemStatus.BREAKDOWN_COMPLETED]: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
  
  // 수리 상태
  [SystemStatus.REPAIR_PENDING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
  [SystemStatus.REPAIR_IN_PROGRESS]: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
  [SystemStatus.REPAIR_COMPLETED]: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
  [SystemStatus.REPAIR_FAILED]: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200',
  
  // 일반 상태
  [SystemStatus.ACTIVE]: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
  [SystemStatus.INACTIVE]: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  [SystemStatus.PENDING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
}

// [SRP] Rule: 상태 전환 규칙 관리
export class StatusTransitionRules {
  // 설비 상태 전환 규칙
  static getValidEquipmentTransitions(currentStatus: EquipmentStatus): EquipmentStatus[] {
    const transitions: Record<EquipmentStatus, EquipmentStatus[]> = {
      [SystemStatus.EQUIPMENT_RUNNING]: [
        SystemStatus.EQUIPMENT_BREAKDOWN,
        SystemStatus.EQUIPMENT_STANDBY,
        SystemStatus.EQUIPMENT_MAINTENANCE,
        SystemStatus.EQUIPMENT_STOPPED
      ],
      [SystemStatus.EQUIPMENT_BREAKDOWN]: [
        SystemStatus.EQUIPMENT_MAINTENANCE,
        SystemStatus.EQUIPMENT_STOPPED
      ],
      [SystemStatus.EQUIPMENT_STANDBY]: [
        SystemStatus.EQUIPMENT_RUNNING,
        SystemStatus.EQUIPMENT_MAINTENANCE,
        SystemStatus.EQUIPMENT_STOPPED
      ],
      [SystemStatus.EQUIPMENT_MAINTENANCE]: [
        SystemStatus.EQUIPMENT_RUNNING,
        SystemStatus.EQUIPMENT_STANDBY,
        SystemStatus.EQUIPMENT_STOPPED
      ],
      [SystemStatus.EQUIPMENT_STOPPED]: [
        SystemStatus.EQUIPMENT_RUNNING,
        SystemStatus.EQUIPMENT_STANDBY,
        SystemStatus.EQUIPMENT_MAINTENANCE
      ]
    }
    
    return transitions[currentStatus] || []
  }
  
  // 고장 신고 상태 전환 규칙
  static getValidBreakdownTransitions(currentStatus: BreakdownStatus): BreakdownStatus[] {
    const transitions: Record<BreakdownStatus, BreakdownStatus[]> = {
      [SystemStatus.BREAKDOWN_REPORTED]: [SystemStatus.BREAKDOWN_IN_PROGRESS],
      [SystemStatus.BREAKDOWN_IN_PROGRESS]: [SystemStatus.BREAKDOWN_COMPLETED],
      [SystemStatus.BREAKDOWN_COMPLETED]: [] // 완료 후 상태 변경 불가
    }
    
    return transitions[currentStatus] || []
  }
  
  // 수리 상태 전환 규칙
  static getValidRepairTransitions(currentStatus: RepairStatus): RepairStatus[] {
    const transitions: Record<RepairStatus, RepairStatus[]> = {
      [SystemStatus.REPAIR_PENDING]: [SystemStatus.REPAIR_IN_PROGRESS],
      [SystemStatus.REPAIR_IN_PROGRESS]: [
        SystemStatus.REPAIR_COMPLETED,
        SystemStatus.REPAIR_FAILED
      ],
      [SystemStatus.REPAIR_COMPLETED]: [], // 완료 후 상태 변경 불가
      [SystemStatus.REPAIR_FAILED]: [SystemStatus.REPAIR_PENDING] // 재시도 가능
    }
    
    return transitions[currentStatus] || []
  }
}

// [SRP] Rule: 상태 동기화 규칙 관리
export class StatusSyncRules {
  // 고장 신고 생성 시 설비 상태 자동 변경
  static getEquipmentStatusOnBreakdown(): EquipmentStatus {
    return SystemStatus.EQUIPMENT_BREAKDOWN
  }
  
  // 고장 수리 완료 시 설비 상태 자동 복구
  static getEquipmentStatusOnRepairComplete(): EquipmentStatus {
    return SystemStatus.EQUIPMENT_RUNNING
  }
  
  // 고장 신고 진행 시 설비 상태
  static getEquipmentStatusOnBreakdownInProgress(): EquipmentStatus {
    return SystemStatus.EQUIPMENT_MAINTENANCE
  }
}

// [SRP] Rule: 상태 유틸리티 함수들
export class StatusUtils {
  // 상태별 라벨 가져오기 (다국어 지원)
  static getStatusLabel(status: SystemStatus, language: 'ko' | 'vi' = 'ko'): string {
    return STATUS_LABELS[status]?.[language] || STATUS_LABELS[status]?.ko || status
  }
  
  // 상태별 색상 클래스 가져오기
  static getStatusColor(status: SystemStatus): string {
    return STATUS_COLORS[status] || STATUS_COLORS[SystemStatus.PENDING]
  }
  
  // 상태가 특정 그룹에 속하는지 확인
  static isEquipmentStatus(status: string): status is EquipmentStatus {
    return STATUS_GROUPS.EQUIPMENT.includes(status as EquipmentStatus)
  }
  
  static isBreakdownStatus(status: string): status is BreakdownStatus {
    return STATUS_GROUPS.BREAKDOWN.includes(status as BreakdownStatus)
  }
  
  static isRepairStatus(status: string): status is RepairStatus {
    return STATUS_GROUPS.REPAIR.includes(status as RepairStatus)
  }
  
  // 상태 전환 가능 여부 확인
  static canTransition(from: SystemStatus, to: SystemStatus): boolean {
    if (StatusUtils.isEquipmentStatus(from) && StatusUtils.isEquipmentStatus(to)) {
      return StatusTransitionRules.getValidEquipmentTransitions(from).includes(to)
    }
    
    if (StatusUtils.isBreakdownStatus(from) && StatusUtils.isBreakdownStatus(to)) {
      return StatusTransitionRules.getValidBreakdownTransitions(from).includes(to)
    }
    
    if (StatusUtils.isRepairStatus(from) && StatusUtils.isRepairStatus(to)) {
      return StatusTransitionRules.getValidRepairTransitions(from).includes(to)
    }
    
    return false
  }
}

// [LSP] Rule: 기존 타입과의 호환성을 위한 타입 별칭
export type EquipmentStatusLegacy = 'running' | 'breakdown' | 'standby' | 'maintenance' | 'stopped'
export type BreakdownStatusLegacy = 'reported' | 'in_progress' | 'completed'

// 호환성 변환 함수들
export const LegacyStatusConverter = {
  fromLegacyEquipmentStatus: (status: EquipmentStatusLegacy): EquipmentStatus => {
    const mapping: Record<EquipmentStatusLegacy, EquipmentStatus> = {
      'running': SystemStatus.EQUIPMENT_RUNNING,
      'breakdown': SystemStatus.EQUIPMENT_BREAKDOWN,
      'standby': SystemStatus.EQUIPMENT_STANDBY,
      'maintenance': SystemStatus.EQUIPMENT_MAINTENANCE,
      'stopped': SystemStatus.EQUIPMENT_STOPPED
    }
    return mapping[status]
  },
  
  toLegacyEquipmentStatus: (status: EquipmentStatus): EquipmentStatusLegacy => {
    const mapping: Record<EquipmentStatus, EquipmentStatusLegacy> = {
      [SystemStatus.EQUIPMENT_RUNNING]: 'running',
      [SystemStatus.EQUIPMENT_BREAKDOWN]: 'breakdown',
      [SystemStatus.EQUIPMENT_STANDBY]: 'standby',
      [SystemStatus.EQUIPMENT_MAINTENANCE]: 'maintenance',
      [SystemStatus.EQUIPMENT_STOPPED]: 'stopped'
    }
    return mapping[status]
  },
  
  fromLegacyBreakdownStatus: (status: BreakdownStatusLegacy): BreakdownStatus => {
    const mapping: Record<BreakdownStatusLegacy, BreakdownStatus> = {
      'reported': SystemStatus.BREAKDOWN_REPORTED,
      'in_progress': SystemStatus.BREAKDOWN_IN_PROGRESS,
      'completed': SystemStatus.BREAKDOWN_COMPLETED
    }
    return mapping[status]
  },
  
  toLegacyBreakdownStatus: (status: BreakdownStatus): BreakdownStatusLegacy => {
    const mapping: Record<BreakdownStatus, BreakdownStatusLegacy> = {
      [SystemStatus.BREAKDOWN_REPORTED]: 'reported',
      [SystemStatus.BREAKDOWN_IN_PROGRESS]: 'in_progress',
      [SystemStatus.BREAKDOWN_COMPLETED]: 'completed'
    }
    return mapping[status]
  }
}