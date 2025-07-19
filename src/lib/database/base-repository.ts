// Base repository implementation following SOLID principles
// Provides common database operations with proper error handling

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../supabase';
import { 
  PaginationOptions, 
  PaginatedResult, 
  DatabaseError, 
  NotFoundError 
} from './types';

export abstract class BaseRepository<
  T extends Record<string, unknown>,
  TInsert extends Record<string, unknown>,
  TUpdate extends Record<string, unknown>,
  TFilters extends Record<string, unknown> = Record<string, unknown>
> {
  protected constructor(
    protected supabase: SupabaseClient<Database>,
    protected tableName: string
  ) {}

  // Abstract method to be implemented by concrete repositories
  protected abstract applyFilters(
    query: any,
    filters?: TFilters
  ): any;

  async findById(id: string): Promise<T | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No rows found
        }
        throw new DatabaseError(`Failed to find ${this.tableName} by id`, error.code, error);
      }

      return data as T;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Unexpected error finding ${this.tableName} by id`, undefined, error);
    }
  }

  async findMany(
    filters?: TFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<T>> {
    try {
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const offset = (page - 1) * limit;

      // Build base query
      let query = this.supabase.from(this.tableName).select('*', { count: 'exact' });

      // Apply filters
      if (filters && Object.keys(filters).length > 0) {
        query = this.applyFilters(query, filters);
      }

      // Apply sorting
      if (pagination?.sort_by) {
        query = query.order(pagination.sort_by, { 
          ascending: pagination.sort_order === 'asc' 
        });
      } else {
        // Default sort by created_at desc
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new DatabaseError(`Failed to find ${this.tableName}`, error.code, error);
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: (data as T[]) || [],
        total,
        page,
        limit,
        total_pages: totalPages
      };
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Unexpected error finding ${this.tableName}`, undefined, error);
    }
  }

  async count(filters?: TFilters): Promise<number> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      if (filters && Object.keys(filters).length > 0) {
        query = this.applyFilters(query, filters);
      }

      const { count, error } = await query;

      if (error) {
        throw new DatabaseError(`Failed to count ${this.tableName}`, error.code, error);
      }

      return count || 0;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Unexpected error counting ${this.tableName}`, undefined, error);
    }
  }

  async create(data: TInsert): Promise<T> {
    try {
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to create ${this.tableName}`, error.code, error);
      }

      return result as T;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Unexpected error creating ${this.tableName}`, undefined, error);
    }
  }

  async update(id: string, data: TUpdate): Promise<T> {
    try {
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError(this.tableName, id);
        }
        throw new DatabaseError(`Failed to update ${this.tableName}`, error.code, error);
      }

      return result as T;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Unexpected error updating ${this.tableName}`, undefined, error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw new DatabaseError(`Failed to delete ${this.tableName}`, error.code, error);
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Unexpected error deleting ${this.tableName}`, undefined, error);
    }
  }

  // Utility method for bulk operations
  protected async bulkCreate(data: TInsert[]): Promise<T[]> {
    try {
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .insert(data)
        .select();

      if (error) {
        throw new DatabaseError(`Failed to bulk create ${this.tableName}`, error.code, error);
      }

      return (result as T[]) || [];
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Unexpected error bulk creating ${this.tableName}`, undefined, error);
    }
  }

  // Utility method for transactions
  protected async executeInTransaction<TResult>(
    operation: (client: SupabaseClient<Database>) => Promise<TResult>
  ): Promise<TResult> {
    try {
      // Note: Supabase doesn't support explicit transactions in the client
      // This is a placeholder for future transaction support
      return await operation(this.supabase);
    } catch (error) {
      throw new DatabaseError('Transaction failed', undefined, error);
    }
  }

  // Utility method for checking existence
  protected async exists(id: string): Promise<boolean> {
    try {
      const { count, error } = await this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('id', id);

      if (error) {
        throw new DatabaseError(`Failed to check existence of ${this.tableName}`, error.code, error);
      }

      return (count || 0) > 0;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Unexpected error checking existence of ${this.tableName}`, undefined, error);
    }
  }

  // Utility method for soft delete (if table has deleted_at column)
  protected async softDelete(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq('id', id);

      if (error) {
        throw new DatabaseError(`Failed to soft delete ${this.tableName}`, error.code, error);
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Unexpected error soft deleting ${this.tableName}`, undefined, error);
    }
  }
}