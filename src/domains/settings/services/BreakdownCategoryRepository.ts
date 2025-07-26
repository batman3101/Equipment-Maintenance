import { supabase } from '@/lib/supabase';
import {
  BreakdownMainCategory,
  BreakdownSubCategory,
  CreateBreakdownMainCategoryRequest,
  UpdateBreakdownMainCategoryRequest,
  CreateBreakdownSubCategoryRequest,
  UpdateBreakdownSubCategoryRequest,
  SettingsListOptions,
} from '../types';

export class BreakdownMainCategoryRepository {
  private tableName = 'breakdown_main_categories';

  async findAll(options?: SettingsListOptions): Promise<BreakdownMainCategory[]> {
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
        throw new Error(`고장 대분류 목록 조회 실패: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Breakdown main categories fetch error:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<BreakdownMainCategory | null> {
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
        throw new Error(`고장 대분류 조회 실패: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Breakdown main category fetch error:', error);
      throw error;
    }
  }

  async create(data: CreateBreakdownMainCategoryRequest): Promise<BreakdownMainCategory> {
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
        throw new Error(`고장 대분류 생성 실패: ${error.message}`);
      }

      return result;
    } catch (error) {
      console.error('Breakdown main category create error:', error);
      throw error;
    }
  }

  async update(data: UpdateBreakdownMainCategoryRequest): Promise<BreakdownMainCategory> {
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
        throw new Error(`고장 대분류 수정 실패: ${error.message}`);
      }

      return result;
    } catch (error) {
      console.error('Breakdown main category update error:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // 소분류가 있는지 확인
      const { data: subCategories } = await supabase
        .from('breakdown_sub_categories')
        .select('id')
        .eq('main_category_id', id)
        .limit(1);

      if (subCategories && subCategories.length > 0) {
        throw new Error('소분류가 존재하는 대분류는 삭제할 수 없습니다. 먼저 소분류를 삭제해주세요.');
      }

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`고장 대분류 삭제 실패: ${error.message}`);
      }
    } catch (error) {
      console.error('Breakdown main category delete error:', error);
      throw error;
    }
  }

  async toggleActive(id: string): Promise<BreakdownMainCategory> {
    try {
      // 현재 상태 조회
      const current = await this.findById(id);
      if (!current) {
        throw new Error('고장 대분류를 찾을 수 없습니다.');
      }

      // 상태 토글
      return await this.update({
        id,
        is_active: !current.is_active,
      });
    } catch (error) {
      console.error('Breakdown main category toggle error:', error);
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
      console.error('Breakdown main category reorder error:', error);
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
        throw new Error(`고장 대분류 개수 조회 실패: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error('Breakdown main category count error:', error);
      throw error;
    }
  }
}

export class BreakdownSubCategoryRepository {
  private tableName = 'breakdown_sub_categories';

  async findAll(options?: SettingsListOptions & { main_category_id?: string }): Promise<BreakdownSubCategory[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          main_category:breakdown_main_categories(id, name, description)
        `);

      // 대분류별 필터
      if (options?.main_category_id) {
        query = query.eq('main_category_id', options.main_category_id);
      }

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
        throw new Error(`고장 소분류 목록 조회 실패: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Breakdown sub categories fetch error:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<BreakdownSubCategory | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          main_category:breakdown_main_categories(id, name, description)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`고장 소분류 조회 실패: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Breakdown sub category fetch error:', error);
      throw error;
    }
  }

  async findByMainCategory(mainCategoryId: string): Promise<BreakdownSubCategory[]> {
    return this.findAll({ main_category_id: mainCategoryId });
  }

  async create(data: CreateBreakdownSubCategoryRequest): Promise<BreakdownSubCategory> {
    try {
      // display_order가 없으면 해당 대분류 내에서 마지막 순서로 설정
      if (!data.display_order) {
        const { data: maxOrderData } = await supabase
          .from(this.tableName)
          .select('display_order')
          .eq('main_category_id', data.main_category_id)
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
        .select(`
          *,
          main_category:breakdown_main_categories(id, name, description)
        `)
        .single();

      if (error) {
        throw new Error(`고장 소분류 생성 실패: ${error.message}`);
      }

      return result;
    } catch (error) {
      console.error('Breakdown sub category create error:', error);
      throw error;
    }
  }

  async update(data: UpdateBreakdownSubCategoryRequest): Promise<BreakdownSubCategory> {
    try {
      const { id, ...updateData } = data;
      
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          main_category:breakdown_main_categories(id, name, description)
        `)
        .single();

      if (error) {
        throw new Error(`고장 소분류 수정 실패: ${error.message}`);
      }

      return result;
    } catch (error) {
      console.error('Breakdown sub category update error:', error);
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
        throw new Error(`고장 소분류 삭제 실패: ${error.message}`);
      }
    } catch (error) {
      console.error('Breakdown sub category delete error:', error);
      throw error;
    }
  }

  async toggleActive(id: string): Promise<BreakdownSubCategory> {
    try {
      // 현재 상태 조회
      const current = await this.findById(id);
      if (!current) {
        throw new Error('고장 소분류를 찾을 수 없습니다.');
      }

      // 상태 토글
      return await this.update({
        id,
        is_active: !current.is_active,
      });
    } catch (error) {
      console.error('Breakdown sub category toggle error:', error);
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
      console.error('Breakdown sub category reorder error:', error);
      throw error;
    }
  }

  async getCount(options?: { is_active?: boolean; main_category_id?: string }): Promise<number> {
    try {
      let query = supabase.from(this.tableName).select('id', { count: 'exact', head: true });

      if (options?.is_active !== undefined) {
        query = query.eq('is_active', options.is_active);
      }

      if (options?.main_category_id) {
        query = query.eq('main_category_id', options.main_category_id);
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`고장 소분류 개수 조회 실패: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error('Breakdown sub category count error:', error);
      throw error;
    }
  }
}