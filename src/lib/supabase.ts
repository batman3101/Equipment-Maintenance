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

// Database types will be generated later
export type Database = {
  public: {
    Tables: {
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
    };
  };
};
