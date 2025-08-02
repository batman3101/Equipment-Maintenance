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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: 'admin' | 'manager' | 'user'
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'manager' | 'user'
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      equipment: {
        Row: {
          id: string
          equipment_number: string
          equipment_type: string
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          equipment_number: string
          equipment_type: string
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          equipment_number?: string
          equipment_type?: string
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      breakdowns: {
        Row: {
          id: string
          equipment_id: string
          title: string
          description: string
          status: 'reported' | 'in_progress' | 'under_repair' | 'completed'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          reporter_id: string
          breakdown_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          equipment_id: string
          title: string
          description: string
          status?: 'reported' | 'in_progress' | 'under_repair' | 'completed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          reporter_id: string
          breakdown_time?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          equipment_id?: string
          title?: string
          description?: string
          status?: 'reported' | 'in_progress' | 'under_repair' | 'completed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          reporter_id?: string
          breakdown_time?: string
          created_at?: string
          updated_at?: string
        }
      }
      repairs: {
        Row: {
          id: string
          breakdown_id: string
          technician_id: string
          repair_description: string
          parts_used: string | null
          repair_cost: number | null
          repair_time: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          breakdown_id: string
          technician_id: string
          repair_description: string
          parts_used?: string | null
          repair_cost?: number | null
          repair_time?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          breakdown_id?: string
          technician_id?: string
          repair_description?: string
          parts_used?: string | null
          repair_cost?: number | null
          repair_time?: string | null
          completed_at?: string | null
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