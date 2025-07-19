/**
 * 공통 타입 정의
 * - 애플리케이션 전반에서 사용되는 기본 타입들
 */

// API 응답 기본 구조
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  error?: string;
}

// 페이지네이션 정보
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 페이지네이션된 응답
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// 정렬 옵션
export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

// 필터 옵션
export interface FilterOption {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';
  value: any;
}

// 검색 파라미터
export interface SearchParams {
  query?: string;
  filters?: FilterOption[];
  sort?: SortOption;
  page?: number;
  limit?: number;
}

// 로딩 상태
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// 에러 정보
export interface ErrorInfo {
  message: string;
  code?: string;
  details?: any;
}

// 파일 정보
export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

// 첨부 파일
export interface Attachment extends FileInfo {
  description?: string;
  category?: 'image' | 'video' | 'document' | 'other';
}

// 사용자 역할
export type UserRole = 'engineer' | 'manager' | 'admin';

// 설비 상태
export type EquipmentStatus = 'active' | 'inactive' | 'maintenance';

// 고장 상태
export type BreakdownStatus = 'in_progress' | 'under_repair' | 'completed';

// 우선순위
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// 알림 타입
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

// 알림 정보
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

// 감사 로그 (Audit Log)
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

// 메타데이터
export interface Metadata {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  version?: number;
}

// 기본 엔티티 인터페이스
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// 소프트 삭제 지원 엔티티
export interface SoftDeletableEntity extends BaseEntity {
  deletedAt?: string;
  isDeleted: boolean;
}

// 사용자 추적 가능 엔티티
export interface TrackableEntity extends BaseEntity {
  createdBy: string;
  updatedBy: string;
}

// 폼 상태
export interface FormState<T = any> {
  data: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// 모달 상태
export interface ModalState {
  isOpen: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  data?: any;
}

// 테이블 컬럼 정의
export interface TableColumn<T = any> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

// 액션 버튼 정의
export interface ActionButton {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

// 네비게이션 메뉴 아이템
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  badge?: string | number;
  disabled?: boolean;
}

// 대시보드 위젯
export interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'stat' | 'list' | 'table';
  size: 'sm' | 'md' | 'lg' | 'xl';
  data: any;
  refreshInterval?: number;
}

// 통계 정보
export interface StatInfo {
  label: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  format?: 'number' | 'currency' | 'percentage';
}

// 차트 데이터 포인트
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

// 시계열 데이터 포인트
export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}