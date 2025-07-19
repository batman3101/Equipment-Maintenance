/**
 * Breakdown 도메인 진입점
 */

// 타입 내보내기
export type {
  Breakdown,
  BreakdownStatus,
  BreakdownAttachment,
  CreateBreakdownRequest,
  UpdateBreakdownRequest,
  BreakdownFilter,
  BreakdownListResponse,
  FileUploadProgress,
  UploadedFile
} from './types';

// 서비스 내보내기
export { BreakdownRepository } from './services/BreakdownRepository';
export { FileUploadService } from './services/FileUploadService';
export { BreakdownService, breakdownService } from './services/BreakdownService';

// 훅 내보내기
export { 
  useBreakdownList, 
  useBreakdown, 
  useFileUpload, 
  useOfflineSync, 
  useRealtimeNotifications,
  sendBreakdownNotification,
  sendStatusChangeNotification
} from './hooks';

// 컴포넌트 내보내기
export {
  BreakdownForm,
  EquipmentTypeSelect,
  EquipmentNumberInput,
  SymptomsInput,
  OccurredAtInput,
  getEquipmentTypeOptions,
  getEquipmentTypeLabel,
  validateEquipmentNumber,
  getSymptomTemplates,
  getTemplatesByCategory,
  isoToDateTimeLocal,
  dateTimeLocalToIso,
  formatDateTime,
  getRelativeTime
} from './components';