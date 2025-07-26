import { supabase } from '@/lib/supabase';
import {
  EquipmentType,
  CreateEquipmentTypeRequest,
  UpdateEquipmentTypeRequest,
  SettingsListOptions,
} from '../types';

export class EquipmentTypeRepository {
  private tableName = 'equipment_types';

  async findAll(options?: SettingsListOptions): Promise<EquipmentType[]> {
    try {
      let query = supabase.from(this.tableName).select('*');

      // 필터 적용
      if (options?.filter?.is_active !== undefined) {
        query = query.eq('is_active', options.filter.is_active);
      }

      if (options?.filter?.search) {
        query = query.or(`name.ilike.%${options.filter.search}%,description.ilike.%${options.filter.search}%`);
      }

      // 정렬 적용
      const sortBy = options?.sort_by || 'display_order';
      const sortOrder = options?.sort_order || 'asc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // 페이징 적용
      if (options?.limit) {
        query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`설비 종류 목록 조회 실패: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Equipment types fetch error:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<EquipmentType | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`설비 종류 조회 실패: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Equipment type fetch error:', error);
      throw error;
    }
  }

  async create(data: CreateEquipmentTypeRequest): Promise<EquipmentType> {
    try {
      // display_order가 없으면 자동으로 마지막 순서로 설정
      if (!data.display_order) {
        const { data: maxOrderData } = await supabase
          .from(this.tableName)
          .select('display_order')
          .order('display_order', { ascending: false })
          .limit(1);

        const maxOrder = maxOrderData?.[0]?.display_order || 0;
        data.display_order = maxOrder + 1;
      }

      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert([{
          ...data,
          is_active: data.is_active ?? true,
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`설비 종류 생성 실패: ${error.message}`);
      }

      return result;
    } catch (error) {
      console.error('Equipment type create error:', error);
      throw error;
    }
  }

  async update(data: UpdateEquipmentTypeRequest): Promise<EquipmentType> {
    try {
      const { id, ...updateData } = data;
      
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`설비 종류 수정 실패: ${error.message}`);
      }

      return result;
    } catch (error) {
      console.error('Equipment type update error:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`설비 종류 삭제 실패: ${error.message}`);
      }
    } catch (error) {
      console.error('Equipment type delete error:', error);
      throw error;
    }
  }

  async toggleActive(id: string): Promise<EquipmentType> {
    try {
      // 현재 상태 조회
      const current = await this.findById(id);
      if (!current) {
        throw new Error('설비 종류를 찾을 수 없습니다.');
      }

      // 상태 토글
      return await this.update({
        id,
        is_active: !current.is_active,
      });
    } catch (error) {
      console.error('Equipment type toggle error:', error);
      throw error;
    }
  }

  async reorder(items: Array<{ id: string; display_order: number }>): Promise<void> {
    try {
      // 트랜잭션으로 모든 순서 업데이트
      const updates = items.map(item => 
        supabase
          .from(this.tableName)
          .update({ 
            display_order: item.display_order,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id)
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Equipment type reorder error:', error);
      throw error;
    }
  }

  async getCount(options?: { is_active?: boolean }): Promise<number> {
    try {
      let query = supabase.from(this.tableName).select('id', { count: 'exact', head: true });

      if (options?.is_active !== undefined) {
        query = query.eq('is_active', options.is_active);
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`설비 종류 개수 조회 실패: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error('Equipment type count error:', error);
      throw error;
    }
  }

  async findByName(name: string): Promise<EquipmentType | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('name', name)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`설비 종류 조회 실패: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Equipment type find by name error:', error);
      throw error;
    }
  }
}