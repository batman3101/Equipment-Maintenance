import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'manager' | 'user'
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
          role?: 'admin' | 'manager' | 'user'
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
          role?: 'admin' | 'manager' | 'user'
          full_name?: string | null
          phone?: string | null
          department?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
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
          reported_by: string
          status: 'reported' | 'assigned' | 'in_progress' | 'completed'
          assigned_to: string | null
          symptoms: string | null
          images_urls: string[] | null
          estimated_repair_time: number | null
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
          reported_by: string
          status?: 'reported' | 'assigned' | 'in_progress' | 'completed'
          assigned_to?: string | null
          symptoms?: string | null
          images_urls?: string[] | null
          estimated_repair_time?: number | null
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
          reported_by?: string
          status?: 'reported' | 'assigned' | 'in_progress' | 'completed'
          assigned_to?: string | null
          symptoms?: string | null
          images_urls?: string[] | null
          estimated_repair_time?: number | null
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
          repair_completed_at: string
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
          repair_started_at: string
          repair_completed_at?: string
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
          repair_completed_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}