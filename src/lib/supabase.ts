import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Complete database types for CNC Equipment Maintenance MVP
export type Database = {
  public: {
    Tables: {
      plants: {
        Row: {
          id: string;
          name: string;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'engineer' | 'manager' | 'admin';
          plant_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role: 'engineer' | 'manager' | 'admin';
          plant_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'engineer' | 'manager' | 'admin';
          plant_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      equipment: {
        Row: {
          id: string;
          equipment_type: string;
          equipment_number: string;
          plant_id: string;
          status: 'active' | 'inactive';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          equipment_type: string;
          equipment_number: string;
          plant_id: string;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          equipment_type?: string;
          equipment_number?: string;
          plant_id?: string;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
      };
      breakdowns: {
        Row: {
          id: string;
          equipment_id: string;
          equipment_type: string;
          equipment_number: string;
          occurred_at: string;
          symptoms: string;
          cause: string | null;
          status: 'in_progress' | 'under_repair' | 'completed';
          reporter_id: string;
          plant_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          equipment_id: string;
          equipment_type: string;
          equipment_number: string;
          occurred_at: string;
          symptoms: string;
          cause?: string | null;
          status?: 'in_progress' | 'under_repair' | 'completed';
          reporter_id: string;
          plant_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          equipment_id?: string;
          equipment_type?: string;
          equipment_number?: string;
          occurred_at?: string;
          symptoms?: string;
          cause?: string | null;
          status?: 'in_progress' | 'under_repair' | 'completed';
          reporter_id?: string;
          plant_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      breakdown_attachments: {
        Row: {
          id: string;
          breakdown_id: string;
          file_name: string;
          file_path: string;
          file_type: string;
          file_size: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          breakdown_id: string;
          file_name: string;
          file_path: string;
          file_type: string;
          file_size: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          breakdown_id?: string;
          file_name?: string;
          file_path?: string;
          file_type?: string;
          file_size?: number;
          created_at?: string;
        };
      };
      repairs: {
        Row: {
          id: string;
          breakdown_id: string;
          action_taken: string;
          technician_id: string;
          completed_at: string;
          total_cost: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          breakdown_id: string;
          action_taken: string;
          technician_id: string;
          completed_at: string;
          total_cost?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          breakdown_id?: string;
          action_taken?: string;
          technician_id?: string;
          completed_at?: string;
          total_cost?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      repair_parts: {
        Row: {
          id: string;
          repair_id: string;
          part_name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          repair_id: string;
          part_name: string;
          quantity: number;
          unit_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          repair_id?: string;
          part_name?: string;
          quantity?: number;
          unit_price?: number;
          created_at?: string;
        };
      };
      dashboard_stats: {
        Row: {
          plant_id: string;
          plant_name: string;
          total_equipment: number;
          active_equipment: number;
          total_breakdowns: number;
          in_progress_breakdowns: number;
          under_repair_breakdowns: number;
          completed_breakdowns: number;
          total_repairs: number;
          total_repair_cost: number;
          today_breakdowns: number;
          week_breakdowns: number;
          today_repairs: number;
          week_repairs: number;
        };
        Insert: never;
        Update: never;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      refresh_dashboard_stats: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
