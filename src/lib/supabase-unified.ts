/**
 * 통합 Supabase 클라이언트 - 중복 제거 및 최적화
 * Unified Supabase Client - Deduplicated and Optimized
 */

import { createClient } from '@supabase/supabase-js'
import { validateEnvironmentVariables } from '@/utils/env-validator'

// 환경 변수 검증 (서버 사이드에서만 실행)
if (typeof window === 'undefined') {
  const envValidation = validateEnvironmentVariables()

  if (!envValidation.isValid) {
    console.error('❌ Missing required environment variables:', envValidation.missingVars)
    throw new Error(`Missing required environment variables: ${envValidation.missingVars.join(', ')}`)
  }

  // 프로덕션 환경에서 추가 보안 검증
  if (envValidation.warnings.length > 0) {
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
      console.error('❌ Production security warnings:', envValidation.warnings)
      throw new Error(`Production security issues detected: ${envValidation.warnings.join(', ')}`)
    } else {
      console.warn('⚠️ Environment warnings:', envValidation.warnings)
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// URL 형식 검증
if (!supabaseUrl.startsWith('https://') && process.env.NODE_ENV === 'production') {
  throw new Error('Supabase URL must use HTTPS in production')
}

// 키 길이 검증
if (supabaseAnonKey.length < 100) {
  throw new Error('Invalid Supabase anon key format')
}

// 최적화된 Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: typeof window !== 'undefined',
    persistSession: typeof window !== 'undefined',
    detectSessionInUrl: typeof window !== 'undefined',
    flowType: 'pkce'
  },
  // 연결 풀 및 타임아웃 최적화
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'cnc-maintenance-system@1.0.0'
    }
  },
  // realtime 설정 최적화
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// JSON 타입 정의
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// 통합 데이터베이스 스키마 정의 (최신 버전)
export interface Database {
  public: {
    Tables: {
      equipment_info: {
        Row: {
          id: string
          equipment_number: string
          equipment_name: string
          category: string
          location: string | null
          manufacturer: string | null
          model: string | null
          installation_date: string | null
          specifications: string | null
          asset_tag: string | null
          serial_number: string | null
          custom_fields: Json
          equipment_tags: string[] | null
          qr_code: string | null
          iot_device_id: string | null
          iot_last_signal: string | null
          energy_rating: string | null
          environmental_requirements: Json
          total_breakdown_count: number
          total_repair_count: number
          total_downtime_hours: number
          total_repair_cost: number
          maintenance_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          equipment_number: string
          equipment_name: string
          category: string
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          installation_date?: string | null
          specifications?: string | null
          asset_tag?: string | null
          serial_number?: string | null
          custom_fields?: Json
          equipment_tags?: string[] | null
          qr_code?: string | null
          iot_device_id?: string | null
          iot_last_signal?: string | null
          energy_rating?: string | null
          environmental_requirements?: Json
          total_breakdown_count?: number
          total_repair_count?: number
          total_downtime_hours?: number
          total_repair_cost?: number
          maintenance_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          equipment_number?: string
          equipment_name?: string
          category?: string
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          installation_date?: string | null
          specifications?: string | null
          asset_tag?: string | null
          serial_number?: string | null
          custom_fields?: Json
          equipment_tags?: string[] | null
          qr_code?: string | null
          iot_device_id?: string | null
          iot_last_signal?: string | null
          energy_rating?: string | null
          environmental_requirements?: Json
          total_breakdown_count?: number
          total_repair_count?: number
          total_downtime_hours?: number
          total_repair_cost?: number
          maintenance_score?: number
          created_at?: string
          updated_at?: string
        }
      }
      equipment_status: {
        Row: {
          id: string
          equipment_id: string
          status: 'running' | 'breakdown' | 'standby' | 'maintenance' | 'stopped'
          status_reason: string | null
          updated_by: string | null
          status_changed_at: string
          last_maintenance_date: string | null
          next_maintenance_date: string | null
          operating_hours: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          equipment_id: string
          status: 'running' | 'breakdown' | 'standby' | 'maintenance' | 'stopped'
          status_reason?: string | null
          updated_by?: string | null
          status_changed_at?: string
          last_maintenance_date?: string | null
          next_maintenance_date?: string | null
          operating_hours?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          equipment_id?: string
          status?: 'running' | 'breakdown' | 'standby' | 'maintenance' | 'stopped'
          status_reason?: string | null
          updated_by?: string | null
          status_changed_at?: string
          last_maintenance_date?: string | null
          next_maintenance_date?: string | null
          operating_hours?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      breakdown_reports: {
        Row: {
          id: string
          equipment_id: string
          breakdown_title: string
          breakdown_description: string
          breakdown_type: string | null
          priority: 'low' | 'medium' | 'high' | 'urgent'
          occurred_at: string
          status: 'reported' | 'assigned' | 'in_progress' | 'completed'
          assigned_to: string
          symptoms: string | null
          images_urls: string[] | null
          estimated_repair_time: number | null
          resolution_date: string | null
          unified_status: string
          parent_breakdown_id: string | null
          is_emergency: boolean
          impact_level: 'low' | 'medium' | 'high' | 'critical'
          affected_operations: string[] | null
          external_contractor_required: boolean
          warranty_claim_possible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          equipment_id: string
          breakdown_title: string
          breakdown_description: string
          breakdown_type?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          occurred_at?: string
          status?: 'reported' | 'assigned' | 'in_progress' | 'completed'
          assigned_to: string
          symptoms?: string | null
          images_urls?: string[] | null
          estimated_repair_time?: number | null
          resolution_date?: string | null
          unified_status?: string
          parent_breakdown_id?: string | null
          is_emergency?: boolean
          impact_level?: 'low' | 'medium' | 'high' | 'critical'
          affected_operations?: string[] | null
          external_contractor_required?: boolean
          warranty_claim_possible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          equipment_id?: string
          breakdown_title?: string
          breakdown_description?: string
          breakdown_type?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          occurred_at?: string
          status?: 'reported' | 'assigned' | 'in_progress' | 'completed'
          assigned_to?: string
          symptoms?: string | null
          images_urls?: string[] | null
          estimated_repair_time?: number | null
          resolution_date?: string | null
          unified_status?: string
          parent_breakdown_id?: string | null
          is_emergency?: boolean
          impact_level?: 'low' | 'medium' | 'high' | 'critical'
          affected_operations?: string[] | null
          external_contractor_required?: boolean
          warranty_claim_possible?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      repair_reports: {
        Row: {
          id: string
          breakdown_report_id: string
          equipment_id: string
          repair_title: string
          repair_description: string
          repair_method: string | null
          technician_id: string
          repair_started_at: string
          repair_completed_at: string | null
          actual_repair_time: number | null
          parts_used: string | null
          parts_cost: number | null
          labor_cost: number | null
          total_cost: number | null
          repair_result: string
          test_result: string | null
          quality_check: boolean
          root_cause: string | null
          prevention_measures: string | null
          before_images_urls: string[] | null
          after_images_urls: string[] | null
          notes: string | null
          unified_status: string
          repair_category: string | null
          complexity_level: 'simple' | 'medium' | 'complex' | 'critical'
          required_skills: string[] | null
          certification_required: boolean
          safety_requirements: string[] | null
          environmental_impact: string | null
          completion_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          breakdown_report_id: string
          equipment_id: string
          repair_title: string
          repair_description: string
          repair_method?: string | null
          technician_id: string
          repair_started_at?: string
          repair_completed_at?: string | null
          actual_repair_time?: number | null
          parts_used?: string | null
          parts_cost?: number | null
          labor_cost?: number | null
          total_cost?: number | null
          repair_result: string
          test_result?: string | null
          quality_check?: boolean
          root_cause?: string | null
          prevention_measures?: string | null
          before_images_urls?: string[] | null
          after_images_urls?: string[] | null
          notes?: string | null
          unified_status?: string
          repair_category?: string | null
          complexity_level?: 'simple' | 'medium' | 'complex' | 'critical'
          required_skills?: string[] | null
          certification_required?: boolean
          safety_requirements?: string[] | null
          environmental_impact?: string | null
          completion_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          breakdown_report_id?: string
          equipment_id?: string
          repair_title?: string
          repair_description?: string
          repair_method?: string | null
          technician_id?: string
          repair_started_at?: string
          repair_completed_at?: string | null
          actual_repair_time?: number | null
          parts_used?: string | null
          parts_cost?: number | null
          labor_cost?: number | null
          total_cost?: number | null
          repair_result?: string
          test_result?: string | null
          quality_check?: boolean
          root_cause?: string | null
          prevention_measures?: string | null
          before_images_urls?: string[] | null
          after_images_urls?: string[] | null
          notes?: string | null
          unified_status?: string
          repair_category?: string | null
          complexity_level?: 'simple' | 'medium' | 'complex' | 'critical'
          required_skills?: string[] | null
          certification_required?: boolean
          safety_requirements?: string[] | null
          environmental_impact?: string | null
          completion_percentage?: number
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          role: 'system_admin' | 'manager' | 'user'
          full_name: string | null
          phone: string | null
          department: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: 'system_admin' | 'manager' | 'user'
          full_name?: string | null
          phone?: string | null
          department?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'system_admin' | 'manager' | 'user'
          full_name?: string | null
          phone?: string | null
          department?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      system_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          setting_type: 'string' | 'number' | 'boolean' | 'json'
          description: string | null
          category: string | null
          is_public: boolean
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: string
          setting_type?: 'string' | 'number' | 'boolean' | 'json'
          description?: string | null
          category?: string | null
          is_public?: boolean
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string
          setting_type?: 'string' | 'number' | 'boolean' | 'json'
          description?: string | null
          category?: string | null
          is_public?: boolean
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      system_status_definitions: {
        Row: {
          id: string
          status_code: string
          status_group: 'equipment' | 'breakdown' | 'repair' | 'general'
          label_ko: string
          label_vi: string | null
          label_en: string | null
          color_class: string
          icon_name: string | null
          sort_order: number
          valid_transitions: string[]
          is_active: boolean
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          status_code: string
          status_group: 'equipment' | 'breakdown' | 'repair' | 'general'
          label_ko: string
          label_vi?: string | null
          label_en?: string | null
          color_class: string
          icon_name?: string | null
          sort_order?: number
          valid_transitions?: string[]
          is_active?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          status_code?: string
          status_group?: 'equipment' | 'breakdown' | 'repair' | 'general'
          label_ko?: string
          label_vi?: string | null
          label_en?: string | null
          color_class?: string
          icon_name?: string | null
          sort_order?: number
          valid_transitions?: string[]
          is_active?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      status_transition_log: {
        Row: {
          id: string
          entity_type: 'equipment' | 'breakdown' | 'repair'
          entity_id: string
          from_status: string | null
          to_status: string
          transition_reason: string | null
          transition_metadata: Json
          triggered_by: string | null
          triggered_at: string
          is_automated: boolean
          automation_rule: string | null
          created_at: string
        }
        Insert: {
          id?: string
          entity_type: 'equipment' | 'breakdown' | 'repair'
          entity_id: string
          from_status?: string | null
          to_status: string
          transition_reason?: string | null
          transition_metadata?: Json
          triggered_by?: string | null
          triggered_at?: string
          is_automated?: boolean
          automation_rule?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          entity_type?: 'equipment' | 'breakdown' | 'repair'
          entity_id?: string
          from_status?: string | null
          to_status?: string
          transition_reason?: string | null
          transition_metadata?: Json
          triggered_by?: string | null
          triggered_at?: string
          is_automated?: boolean
          automation_rule?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      v_unified_equipment_status: {
        Row: {
          id: string
          equipment_number: string
          equipment_name: string
          category: string
          location: string | null
          manufacturer: string | null
          model: string | null
          qr_code: string | null
          iot_device_id: string | null
          iot_last_signal: string | null
          current_equipment_status: string | null
          status_last_updated: string | null
          status_reason: string | null
          status_label_ko: string | null
          status_label_vi: string | null
          status_color: string | null
          active_breakdown_id: string | null
          breakdown_title: string | null
          breakdown_priority: string | null
          breakdown_occurred_at: string | null
          breakdown_status: string | null
          active_repair_id: string | null
          repair_title: string | null
          repair_status: string | null
          completion_percentage: number | null
          total_breakdown_count: number | null
          total_repair_count: number | null
          total_downtime_hours: number | null
          total_repair_cost: number | null
          maintenance_score: number | null
          next_maintenance_date: string | null
          created_at: string
          updated_at: string
        }
      }
      v_realtime_dashboard: {
        Row: {
          total_equipment: number
          running_equipment: number
          breakdown_equipment: number
          maintenance_equipment: number
          standby_equipment: number
          stopped_equipment: number
          active_breakdowns: number
          urgent_breakdowns: number
          pending_repairs: number
          in_progress_repairs: number
          avg_maintenance_score: number
          avg_downtime_hours: number
          last_updated: string
        }
      }
    }
    Functions: {
      transition_unified_status: {
        Args: {
          p_entity_type: 'equipment' | 'breakdown' | 'repair'
          p_entity_id: string
          p_new_status: string
          p_reason?: string
          p_triggered_by?: string
          p_metadata?: Json
        }
        Returns: boolean
      }
    }
    Enums: {
      entity_type: 'equipment' | 'breakdown' | 'repair'
      status_group: 'equipment' | 'breakdown' | 'repair' | 'general'
      equipment_status: 'running' | 'breakdown' | 'standby' | 'maintenance' | 'stopped'
      breakdown_status: 'reported' | 'assigned' | 'in_progress' | 'completed'
      repair_status: 'repair_pending' | 'repair_in_progress' | 'repair_completed' | 'repair_failed'
      user_role: 'system_admin' | 'manager' | 'user'
      breakdown_priority: 'low' | 'medium' | 'high' | 'urgent'
      impact_level: 'low' | 'medium' | 'high' | 'critical'
      complexity_level: 'simple' | 'medium' | 'complex' | 'critical'
      setting_type: 'string' | 'number' | 'boolean' | 'json'
    }
  }
}

// 연결 상태 확인 함수
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection error:', error.message)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Supabase connection failed:', error)
    return false
  }
}

// 타입 안전성을 위한 타입 가드
export function isSupabaseError(error: unknown): error is { message: string; code?: string } {
  return typeof error === 'object' && error !== null && 'message' in error
}

// 기본 내보내기
export default supabase