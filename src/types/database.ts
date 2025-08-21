// [SRP] Rule: 데이터베이스 타입 정의만 담당
// Supabase database types

export interface Database {
  public: {
    Tables: {
      equipment_info: {
        Row: {
          id: string
          equipment_name: string
          equipment_number: string
          category: string
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          installation_date?: string | null
          specifications?: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          equipment_name: string
          equipment_number: string
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
          equipment_name?: string
          equipment_number?: string
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
          status: 'running' | 'breakdown' | 'maintenance' | 'standby' | 'stopped'
          status_reason?: string | null
          updated_by?: string | null
          status_changed_at: string
          last_repair_date?: string | null
          next_maintenance_date?: string | null
          breakdown_start_time?: string | null
          maintenance_start_time?: string | null
          operating_hours?: number | null
          notes?: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          equipment_id: string
          status: 'running' | 'breakdown' | 'maintenance' | 'standby' | 'stopped'
          status_reason?: string | null
          updated_by?: string | null
          status_changed_at?: string
          last_repair_date?: string | null
          next_maintenance_date?: string | null
          breakdown_start_time?: string | null
          maintenance_start_time?: string | null
          operating_hours?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          equipment_id?: string
          status?: 'running' | 'breakdown' | 'maintenance' | 'standby' | 'stopped'
          status_reason?: string | null
          updated_by?: string | null
          status_changed_at?: string
          last_repair_date?: string | null
          next_maintenance_date?: string | null
          breakdown_start_time?: string | null
          maintenance_start_time?: string | null
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
          equipment_category?: string | null
          equipment_number: string
          reporter_name: string
          reporter_id?: string | null
          urgency_level: 'low' | 'medium' | 'high' | 'critical'
          issue_type: 'mechanical' | 'electrical' | 'software' | 'safety' | 'other'
          description: string
          symptoms?: string | null
          status: 'reported' | 'assigned' | 'in_progress' | 'resolved' | 'completed' | 'rejected' | 'cancelled'
          assigned_to?: string | null
          occurred_at?: string | null
          resolution_date?: string | null
          notes?: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          equipment_id: string
          equipment_category?: string | null
          equipment_number: string
          reporter_name: string
          reporter_id?: string | null
          urgency_level: 'low' | 'medium' | 'high' | 'critical'
          issue_type: 'mechanical' | 'electrical' | 'software' | 'safety' | 'other'
          description: string
          symptoms?: string | null
          status?: 'reported' | 'assigned' | 'in_progress' | 'resolved' | 'completed' | 'rejected' | 'cancelled'
          assigned_to?: string | null
          occurred_at?: string | null
          resolution_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          equipment_id?: string
          equipment_category?: string | null
          equipment_number?: string
          reporter_name?: string
          reporter_id?: string | null
          urgency_level?: 'low' | 'medium' | 'high' | 'critical'
          issue_type?: 'mechanical' | 'electrical' | 'software' | 'safety' | 'other'
          description?: string
          symptoms?: string | null
          status?: 'reported' | 'assigned' | 'in_progress' | 'resolved' | 'completed' | 'rejected' | 'cancelled'
          assigned_to?: string | null
          occurred_at?: string | null
          resolution_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username?: string | null
          email?: string | null
          role: 'system_admin' | 'manager' | 'user'
          department?: string | null
          phone?: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          email?: string | null
          role?: 'system_admin' | 'manager' | 'user'
          department?: string | null
          phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          email?: string | null
          role?: 'system_admin' | 'manager' | 'user'
          department?: string | null
          phone?: string | null
          is_active?: boolean
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