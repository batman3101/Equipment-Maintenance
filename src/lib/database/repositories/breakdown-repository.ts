// Breakdown repository implementation following SOLID principles
// Handles all database operations for breakdowns with proper error handling

import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository } from '../base-repository';
import {
  Breakdown,
  BreakdownInsert,
  BreakdownUpdate,
  BreakdownFilters,
  BreakdownWithDetails,
  IBreakdownRepository,
  PaginationOptions,
  PaginatedResult,
  DatabaseError,
  NotFoundError
} from '../types';

export class BreakdownRepository 
  extends BaseRepository<Breakdown, BreakdownInsert, BreakdownUpdate, BreakdownFilters>
  implements IBreakdownRepository {

  constructor(supabase: SupabaseClient<any>) {
    super(supabase, 'breakdowns');
  }

  protected applyFilters(
    query: any,
    filters?: BreakdownFilters
  ) {
    if (!filters) return query;

    if (filters.plant_id) {
      query = query.eq('plant_id', filters.plant_id);
    }

    if (filters.equipment_id) {
      query = query.eq('equipment_id', filters.equipment_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.reporter_id) {
      query = query.eq('reporter_id', filters.reporter_id);
    }

    if (filters.date_from) {
      query = query.gte('occurred_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('occurred_at', filters.date_to);
    }

    if (filters.search) {
      query = query.or(`symptoms.ilike.%${filters.search}%,equipment_number.ilike.%${filters.search}%,equipment_type.ilike.%${filters.search}%`);
    }

    return query;
  }

  async findWithDetails(id: string): Promise<BreakdownWithDetails | null> {
    try {
      const { data, error } = await this.supabase
        .from('breakdowns')
        .select(`
          *,
          equipment:equipment_id (
            id,
            equipment_type,
            equipment_number,
            status
          ),
          reporter:reporter_id (
            id,
            name,
            email,
            role
          ),
          attachments:breakdown_attachments (
            id,
            file_name,
            file_path,
            file_type,
            file_size,
            created_at
          ),
          repairs (
            id,
            action_taken,
            completed_at,
            total_cost,
            created_at,
            updated_at,
            technician:technician_id (
              id,
              name,
              email,
              role
            ),
            parts:repair_parts (
              id,
              part_name,
              quantity,
              unit_price,
              total_price,
              created_at
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError('Failed to find breakdown with details', error.code, error);
      }

      return data as BreakdownWithDetails;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding breakdown with details', undefined, error);
    }
  }

  async findManyWithDetails(
    filters?: BreakdownFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<BreakdownWithDetails>> {
    try {
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const offset = (page - 1) * limit;

      // Build base query with joins
      let query = this.supabase
        .from('breakdowns')
        .select(`
          *,
          equipment:equipment_id (
            id,
            equipment_type,
            equipment_number,
            status
          ),
          reporter:reporter_id (
            id,
            name,
            email,
            role
          ),
          attachments:breakdown_attachments (
            id,
            file_name,
            file_path,
            file_type,
            file_size,
            created_at
          ),
          repairs (
            id,
            action_taken,
            completed_at,
            total_cost,
            created_at,
            updated_at,
            technician:technician_id (
              id,
              name,
              email,
              role
            ),
            parts:repair_parts (
              id,
              part_name,
              quantity,
              unit_price,
              total_price,
              created_at
            )
          )
        `, { count: 'exact' });

      // Apply filters
      query = this.applyFilters(query, filters);

      // Apply sorting
      if (pagination?.sort_by) {
        query = query.order(pagination.sort_by, { 
          ascending: pagination.sort_order === 'asc' 
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new DatabaseError('Failed to find breakdowns with details', error.code, error);
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: (data as BreakdownWithDetails[]) || [],
        total,
        page,
        limit,
        total_pages: totalPages
      };
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding breakdowns with details', undefined, error);
    }
  }

  async findByEquipmentId(equipmentId: string): Promise<Breakdown[]> {
    try {
      const { data, error } = await this.supabase
        .from('breakdowns')
        .select('*')
        .eq('equipment_id', equipmentId)
        .order('occurred_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to find breakdowns by equipment id', error.code, error);
      }

      return (data as Breakdown[]) || [];
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding breakdowns by equipment id', undefined, error);
    }
  }

  async updateStatus(id: string, status: Breakdown['status']): Promise<Breakdown> {
    try {
      const { data, error } = await this.supabase
        .from('breakdowns')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('breakdown', id);
        }
        throw new DatabaseError('Failed to update breakdown status', error.code, error);
      }

      return data as Breakdown;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error updating breakdown status', undefined, error);
    }
  }

  // Additional methods specific to breakdowns
  async findRecentByPlantId(plantId: string, limit: number = 10): Promise<BreakdownWithDetails[]> {
    try {
      const { data, error } = await this.supabase
        .from('breakdowns')
        .select(`
          *,
          equipment:equipment_id (
            id,
            equipment_type,
            equipment_number,
            status
          ),
          reporter:reporter_id (
            id,
            name,
            email,
            role
          )
        `)
        .eq('plant_id', plantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new DatabaseError('Failed to find recent breakdowns', error.code, error);
      }

      return (data as BreakdownWithDetails[]) || [];
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding recent breakdowns', undefined, error);
    }
  }

  async findByStatusAndPlantId(
    status: Breakdown['status'], 
    plantId: string
  ): Promise<Breakdown[]> {
    try {
      const { data, error } = await this.supabase
        .from('breakdowns')
        .select('*')
        .eq('status', status)
        .eq('plant_id', plantId)
        .order('occurred_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to find breakdowns by status and plant', error.code, error);
      }

      return (data as Breakdown[]) || [];
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding breakdowns by status and plant', undefined, error);
    }
  }

  async getBreakdownStats(plantId: string): Promise<{
    total: number;
    in_progress: number;
    under_repair: number;
    completed: number;
    today: number;
    this_week: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data, error } = await this.supabase
        .from('breakdowns')
        .select('status, created_at')
        .eq('plant_id', plantId);

      if (error) {
        throw new DatabaseError('Failed to get breakdown stats', error.code, error);
      }

      const breakdowns = data || [];
      const stats = {
        total: breakdowns.length,
        in_progress: breakdowns.filter(b => b.status === 'in_progress').length,
        under_repair: breakdowns.filter(b => b.status === 'under_repair').length,
        completed: breakdowns.filter(b => b.status === 'completed').length,
        today: breakdowns.filter(b => new Date(b.created_at) >= today).length,
        this_week: breakdowns.filter(b => new Date(b.created_at) >= weekAgo).length
      };

      return stats;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error getting breakdown stats', undefined, error);
    }
  }
}