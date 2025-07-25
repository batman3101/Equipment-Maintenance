// Equipment 도메인 타입 정의
// 설비 관리 관련 모든 타입을 정의

/**
 * 설비 상태 열거형
 */
export enum EquipmentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  BROKEN = 'broken'
}

/**
 * 설비 종류 열거형
 */
export enum EquipmentType {
  CNC_MACHINE = 'cnc_machine',
  LATHE = 'lathe',
  MILLING_MACHINE = 'milling_machine',
  DRILL_PRESS = 'drill_press',
  GRINDER = 'grinder',
  PRESS = 'press',
  CONVEYOR = 'conveyor',
  ROBOT = 'robot',
  OTHER = 'other'
}

/**
 * 설비 우선순위 열거형
 */
export enum EquipmentPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 설비 기본 정보 인터페이스 (DB 스키마에 맞게 수정)
 */
export interface Equipment {
  id: string;
  equipment_number: string;
  equipment_type: string;
  plant_id: string;
  status: EquipmentStatus;
  created_at: string;
  updated_at: string;
}

/**
 * 설비 생성 요청 인터페이스 (DB 스키마에 맞게 수정)
 */
export interface CreateEquipmentRequest {
  equipment_number: string;
  equipment_type: string;
  plant_id: string;
  status?: EquipmentStatus;
}

/**
 * 설비 업데이트 요청 인터페이스
 */
export interface UpdateEquipmentRequest extends Partial<CreateEquipmentRequest> {
  status?: EquipmentStatus;
  last_maintenance_date?: string;
}

/**
 * 설비 검색 필터 인터페이스 (DB 스키마에 맞게 수정)
 */
export interface EquipmentFilter {
  search?: string;
  equipment_type?: string[];
  status?: string[];
  plant_id?: string;
}

/**
 * 설비 정렬 옵션 인터페이스 (DB 스키마에 맞게 수정)
 */
export interface EquipmentSort {
  field: 'equipment_number' | 'equipment_type' | 'status' | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

/**
 * 설비 목록 조회 옵션 인터페이스
 */
export interface EquipmentListOptions {
  filter?: EquipmentFilter;
  sort?: EquipmentSort;
  page?: number;
  limit?: number;
}

/**
 * 설비 목록 응답 인터페이스
 */
export interface EquipmentListResponse {
  data: Equipment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * 설비 통계 인터페이스
 */
export interface EquipmentStats {
  total: number;
  active: number;
  inactive: number;
  maintenance: number;
  broken: number;
  maintenanceDue: number;
  byType: Record<EquipmentType, number>;
  byPriority: Record<EquipmentPriority, number>;
}

/**
 * 설비 유효성 검사 에러 인터페이스
 */
export interface EquipmentValidationError {
  field: keyof CreateEquipmentRequest | keyof UpdateEquipmentRequest;
  message: string;
}

/**
 * 설비 서비스 에러 인터페이스
 */
export interface EquipmentServiceError {
  code: string;
  message: string;
  details?: any;
}

/**
 * 설비 타입 라벨 매핑
 */
export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  [EquipmentType.CNC_MACHINE]: 'CNC 머신',
  [EquipmentType.LATHE]: '선반',
  [EquipmentType.MILLING_MACHINE]: '밀링머신',
  [EquipmentType.DRILL_PRESS]: '드릴프레스',
  [EquipmentType.GRINDER]: '그라인더',
  [EquipmentType.PRESS]: '프레스',
  [EquipmentType.CONVEYOR]: '컨베이어',
  [EquipmentType.ROBOT]: '로봇',
  [EquipmentType.OTHER]: '기타'
};

/**
 * 설비 상태 라벨 매핑
 */
export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  [EquipmentStatus.ACTIVE]: '정상',
  [EquipmentStatus.INACTIVE]: '비활성',
  [EquipmentStatus.MAINTENANCE]: '정비중',
  [EquipmentStatus.BROKEN]: '고장'
};

/**
 * 설비 우선순위 라벨 매핑
 */
export const EQUIPMENT_PRIORITY_LABELS: Record<EquipmentPriority, string> = {
  [EquipmentPriority.LOW]: '낮음',
  [EquipmentPriority.MEDIUM]: '보통',
  [EquipmentPriority.HIGH]: '높음',
  [EquipmentPriority.CRITICAL]: '긴급'
};