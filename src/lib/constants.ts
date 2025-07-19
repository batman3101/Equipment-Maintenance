// Application constants
export const APP_NAME = 'CNC 설비 고장 관리';
export const APP_DESCRIPTION = 'CNC 현장 설비 고장 관리 웹앱';

// Equipment types
export const EQUIPMENT_TYPES = [
  'CNC 밀링머신',
  'CNC 선반',
  '머시닝센터',
  '연삭기',
  '드릴링머신',
  '기타',
] as const;

// Breakdown status
export const BREAKDOWN_STATUS = {
  IN_PROGRESS: 'in_progress',
  UNDER_REPAIR: 'under_repair',
  COMPLETED: 'completed',
} as const;

export const BREAKDOWN_STATUS_LABELS = {
  [BREAKDOWN_STATUS.IN_PROGRESS]: '진행 중',
  [BREAKDOWN_STATUS.UNDER_REPAIR]: '수리 중',
  [BREAKDOWN_STATUS.COMPLETED]: '완료',
} as const;

// User roles
export const USER_ROLES = {
  ENGINEER: 'engineer',
  MANAGER: 'manager',
  ADMIN: 'admin',
} as const;

export const USER_ROLE_LABELS = {
  [USER_ROLES.ENGINEER]: '엔지니어',
  [USER_ROLES.MANAGER]: '매니저',
  [USER_ROLES.ADMIN]: '관리자',
} as const;

// File upload limits
export const FILE_UPLOAD_LIMITS = {
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  VIDEO_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm'],
} as const;

// Touch target minimum size for mobile accessibility
export const TOUCH_TARGET_SIZE = 44; // 44px minimum
