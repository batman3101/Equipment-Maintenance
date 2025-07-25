import { BaseEntity } from '@/shared/types/common';

// 공통 설정 인터페이스
export interface BaseSettingEntity extends BaseEntity {
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}

// 컴포넌트에서 사용하는 기본 설정 아이템 타입
export interface BaseSettingItem extends BaseSettingEntity {
  // 추가 필드가 필요할 경우 여기에 정의
}

// 설비 종류 설정
export interface EquipmentType extends BaseSettingEntity {
  // 추가 필드가 필요할 경우 여기에 정의
}

// 설비 상태 설정
export interface EquipmentStatus extends BaseSettingEntity {
  color: string; // 상태별 색상 코드 (예: #10B981)
}

// 고장 내용 대분류
export interface BreakdownMainCategory extends BaseSettingEntity {
  // 추가 필드가 필요할 경우 여기에 정의
}

// 고장 내용 소분류
export interface BreakdownSubCategory extends BaseSettingEntity {
  main_category_id: string;
  main_category?: BreakdownMainCategory; // 조인된 데이터
}

// 기본 설정 아이템 (컴포넌트에서 사용)
export interface BaseSettingItem extends BaseSettingEntity {
  // 추가 필드가 필요할 경우 여기에 정의
}


// 설비 종류 설정 (목록에서 사용)
export interface EquipmentTypeSetting extends BaseSettingEntity {
  code: string;
  color: string;
}

// 설비 상태 설정 (목록에서 사용)
export interface EquipmentStatusSetting extends BaseSettingEntity {
  code: string;
  color: string;
  icon?: string;
}

// 고장 분류 설정 (목록에서 사용)
export interface BreakdownCategory extends BaseSettingEntity {
  code: string;
  color: string;
}

// 고장 소분류 설정
export interface BreakdownSubcategory extends BaseSettingEntity {
  category_id: string;
  code: string;
}

// CRUD 작업을 위한 요청 타입들
export interface CreateEquipmentTypeRequest {
  name: string;
  code?: string;
  description?: string;
  color?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdateEquipmentTypeRequest extends Partial<CreateEquipmentTypeRequest> {
  id: string;
}

export interface CreateEquipmentStatusRequest {
  name: string;
  description?: string;
  color?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdateEquipmentStatusRequest extends Partial<CreateEquipmentStatusRequest> {
  id: string;
}

export interface CreateBreakdownMainCategoryRequest {
  name: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdateBreakdownMainCategoryRequest extends Partial<CreateBreakdownMainCategoryRequest> {
  id: string;
}

export interface CreateBreakdownSubCategoryRequest {
  main_category_id: string;
  name: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdateBreakdownSubCategoryRequest extends Partial<CreateBreakdownSubCategoryRequest> {
  id: string;
}

// 설정 목록 조회를 위한 필터 및 정렬 옵션
export interface SettingListFilter {
  is_active?: boolean;
  search?: string;
}

export interface SettingListSort {
  field: 'name' | 'display_order' | 'created_at';
  direction: 'asc' | 'desc';
}

export interface SettingsListFilter {
  is_active?: boolean;
  search?: string;
}

// 레거시 호환성을 위한 별칭
export interface SettingListFilter extends SettingsListFilter {}

export interface SettingsListOptions {
  filter?: SettingsListFilter;
  sort_by?: 'name' | 'display_order' | 'created_at';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// 설정 통계 정보
export interface SettingsStats {
  equipment_types_count: number;
  equipment_statuses_count: number;
  breakdown_main_categories_count: number;
  breakdown_sub_categories_count: number;
}

// 설정 관련 상수
export const SETTINGS_CONSTANTS = {
  DEFAULT_COLORS: [
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#6B7280', // gray
    '#3B82F6', // blue
    '#F97316', // orange
    '#EC4899', // pink
  ],
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_DISPLAY_ORDER: 9999,
} as const;

// 색상 옵션 (UI에서 사용)
export const COLOR_OPTIONS = [
  { value: '#10B981', label: '초록색' },
  { value: '#3B82F6', label: '파란색' },
  { value: '#F59E0B', label: '주황색' },
  { value: '#EF4444', label: '빨간색' },
  { value: '#8B5CF6', label: '보라색' },
  { value: '#6B7280', label: '회색' },
  { value: '#F97316', label: '오렌지' },
  { value: '#EC4899', label: '분홍색' },
] as const;

// 설정 유형 열거형
export enum SettingType {
  EQUIPMENT_TYPE = 'equipment_type',
  EQUIPMENT_STATUS = 'equipment_status',
  BREAKDOWN_MAIN_CATEGORY = 'breakdown_main_category',
  BREAKDOWN_SUB_CATEGORY = 'breakdown_sub_category',
}

// 설정 액션 타입
export enum SettingAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  TOGGLE_ACTIVE = 'toggle_active',
  REORDER = 'reorder',
}