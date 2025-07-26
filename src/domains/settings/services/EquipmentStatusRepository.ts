import { supabase } from '@/lib/supabase';
import {
  EquipmentStatus,
  CreateEquipmentStatusRequest,
  UpdateEquipmentStatusRequest,
  SettingsListOptions,
  SETTINGS_CONSTANTS,
} from '../types';

export class EquipmentStatusRepository {
  private tableName = 'equipment_statuses';

  async findAll(options?: SettingsListOptions): Promise<EquipmentStatus[]> {
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
        throw new Error(`설비 상태 목록 조회 실패: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Equipment statuses fetch error:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<EquipmentStatus | null> {
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
        throw new Error(`설비 상태 조회 실패: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Equipment status fetch error:', error);
      throw error;
    }
  }

  async create(data: CreateEquipmentStatusRequest): Promise<EquipmentStatus> {
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

      // 색상이 없으면 기본 색상 중 하나를 설정
      if (!data.color) {
        const { data: existingColors } = await supabase
          .from(this.tableName)
          .select('color');

        const usedColors = new Set(existingColors?.map(item => item.color) || []);
        const availableColor = SETTINGS_CONSTANTS.DEFAULT_COLORS.find(
          color => !usedColors.has(color)
        ) || SETTINGS_CONSTANTS.DEFAULT_COLORS[0];
        
        data.color = availableColor;
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
        throw new Error(`설비 상태 생성 실패: ${error.message}`);
      }

      return result;
    } catch (error) {
      console.error('Equipment status create error:', error);
      throw error;
    }
  }

  async update(data: UpdateEquipmentStatusRequest): Promise<EquipmentStatus> {
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
        throw new Error(`설비 상태 수정 실패: ${error.message}`);
      }

      return result;
    } catch (error) {
      console.error('Equipment status update error:', error);
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
        throw new Error(`설비 상태 삭제 실패: ${error.message}`);
      }
    } catch (error) {
      console.error('Equipment status delete error:', error);
      throw error;
    }
  }

  async toggleActive(id: string): Promise<EquipmentStatus> {
    try {
      // 현재 상태 조회
      const current = await this.findById(id);
      if (!current) {
        throw new Error('설비 상태를 찾을 수 없습니다.');
      }

      // 상태 토글
      return await this.update({
        id,
        is_active: !current.is_active,
      });
    } catch (error) {
      console.error('Equipment status toggle error:', error);
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
      console.error('Equipment status reorder error:', error);
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
        throw new Error(`설비 상태 개수 조회 실패: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error('Equipment status count error:', error);
      throw error;
    }
  }

  async findByName(name: string): Promise<EquipmentStatus | null> {
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
        throw new Error(`설비 상태 조회 실패: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Equipment status find by name error:', error);
      throw error;
    }
  }

  async getUsedColors(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('color');

      if (error) {
        throw new Error(`사용된 색상 조회 실패: ${error.message}`);
      }

      return data?.map(item => item.color) || [];
    } catch (error) {
      console.error('Equipment status get used colors error:', error);
      throw error;
    }
  }

  async getAvailableColors(): Promise<string[]> {
    try {
      const usedColors = await this.getUsedColors();
      const usedColorSet = new Set(usedColors);
      
      return SETTINGS_CONSTANTS.DEFAULT_COLORS.filter(
        color => !usedColorSet.has(color)
      );
    } catch (error) {
      console.error('Equipment status get available colors error:', error);
      throw error;
    }
  }
}