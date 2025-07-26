/**
 * 고장 도메인 타입 정의
 */

export interface Breakdown {
  id: string;
  equipment_id: string;
  equipment_type: string;
  equipment_number: string;
  occurred_at: string;
  symptoms: string;
  cause?: string;
  status: BreakdownStatus;
  reporter_id: string;
  plant_id: string;
  breakdown_main_category_id?: string;
  breakdown_sub_category_id?: string;
  attachments?: BreakdownAttachment[];
  created_at: string;
  updated_at: string;
}

export type BreakdownStatus = 'in_progress' | 'under_repair' | 'completed';

export interface BreakdownAttachment {
  id: string;
  breakdown_id: string;
  file_name: string;
  file_path: string;
  file_type: 'image' | 'video';
  file_size: number;
  uploaded_at: string;
}

export interface CreateBreakdownRequest {
  equipment_type: string;
  equipment_number: string;
  occurred_at: string;
  symptoms: string;
  cause?: string;
  breakdown_main_category_id?: string;
  breakdown_sub_category_id?: string;
  attachments?: File[];
}

export interface UpdateBreakdownRequest {
  id: string;
  symptoms?: string;
  cause?: string;
  status?: BreakdownStatus;
  breakdown_main_category_id?: string;
  breakdown_sub_category_id?: string;
}

export interface BreakdownFilter {
  status?: BreakdownStatus;
  equipment_type?: string;
  equipment_number?: string;
  date_from?: string;
  date_to?: string;
}

export interface BreakdownListResponse {
  data: Breakdown[];
  total: number;
  page: number;
  limit: number;
}

// 파일 업로드 관련 타입
export interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface UploadedFile {
  file_name: string;
  file_path: string;
  file_type: 'image' | 'video';
  file_size: number;
}