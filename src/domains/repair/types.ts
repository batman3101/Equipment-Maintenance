/**
 * 수리 도메인 타입 정의
 */

export interface RepairPart {
  id: string;
  repair_id: string;
  part_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface Repair {
  id: string;
  breakdown_id: string;
  action_taken: string;
  technician_id: string;
  completed_at: string;
  total_cost: number;
  parts_used?: RepairPart[];
  created_at: string;
  updated_at: string;
  // 조인된 데이터
  technician?: {
    id: string;
    name: string;
    email: string;
  };
  breakdown?: {
    id: string;
    equipment_type: string;
    equipment_number: string;
    symptoms: string;
  };
}

export interface CreateRepairRequest {
  breakdown_id: string;
  action_taken: string;
  technician_id: string;
  completed_at: string;
  parts_used?: CreateRepairPartRequest[];
}

export interface CreateRepairPartRequest {
  part_name: string;
  quantity: number;
  unit_price: number;
}

export interface UpdateRepairRequest {
  action_taken?: string;
  completed_at?: string;
  parts_used?: CreateRepairPartRequest[];
}

export interface RepairFilters {
  breakdown_id?: string;
  technician_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface RepairListResponse {
  data: Repair[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// 수리 상태 관련 타입
export type RepairStatus = 'pending' | 'in_progress' | 'completed';

// 부품 검색 자동완성을 위한 타입
export interface PartSuggestion {
  name: string;
  average_price: number;
  usage_count: number;
}