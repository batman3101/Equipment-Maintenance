import { supabase } from '@/lib/supabase';
import type { 
  Breakdown, 
  CreateBreakdownRequest, 
  UpdateBreakdownRequest, 
  BreakdownFilter,
  BreakdownListResponse 
} from '../types';

/**
 * 고장 데이터 접근을 담당하는 Repository 클래스
 * Single Responsibility Principle: 데이터 접근 로직만 담당
 */
export class BreakdownRepository {
  private readonly tableName = 'breakdowns';

  /**
   * 고장 목록 조회
   */
  async findAll(
    filter: BreakdownFilter = {},
    page: number = 1,
    limit: number = 20
  ): Promise<BreakdownListResponse> {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        equipment:equipment_id(id, equipment_type, equipment_number),
        reporter:reporter_id(id, name),
        attachments:breakdown_attachments(*)
      `, { count: 'exact' });

    // 필터 적용
    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    if (filter.equipment_type) {
      query = query.eq('equipment_type', filter.equipment_type);
    }
    if (filter.equipment_number) {
      query = query.ilike('equipment_number', `%${filter.equipment_number}%`);
    }
    if (filter.date_from) {
      query = query.gte('occurred_at', filter.date_from);
    }
    if (filter.date_to) {
      query = query.lte('occurred_at', filter.date_to);
    }

    // 페이지네이션 및 정렬
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query
      .order('occurred_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`고장 목록 조회 실패: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      limit
    };
  }

  /**
   * 고장 상세 조회
   */
  async findById(id: string): Promise<Breakdown | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        equipment:equipment_id(id, equipment_type, equipment_number),
        reporter:reporter_id(id, name),
        attachments:breakdown_attachments(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 데이터 없음
      }
      throw new Error(`고장 상세 조회 실패: ${error.message}`);
    }

    return data;
  }

  /**
   * 고장 등록
   */
  async create(breakdown: Omit<Breakdown, 'id' | 'created_at' | 'updated_at'>): Promise<Breakdown> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert({
        ...breakdown,
        status: 'in_progress' // 기본 상태
      })
      .select()
      .single();

    if (error) {
      throw new Error(`고장 등록 실패: ${error.message}`);
    }

    return data;
  }

  /**
   * 고장 정보 수정
   */
  async update(id: string, updates: Partial<Breakdown>): Promise<Breakdown> {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`고장 정보 수정 실패: ${error.message}`);
    }

    return data;
  }

  /**
   * 고장 삭제
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`고장 삭제 실패: ${error.message}`);
    }
  }

  /**
   * 설비별 고장 이력 조회
   */
  async findByEquipment(equipmentId: string): Promise<Breakdown[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        attachments:breakdown_attachments(*)
      `)
      .eq('equipment_id', equipmentId)
      .order('occurred_at', { ascending: false });

    if (error) {
      throw new Error(`설비별 고장 이력 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 고장 상태 업데이트
   */
  async updateStatus(id: string, status: Breakdown['status']): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(`고장 상태 업데이트 실패: ${error.message}`);
    }
  }
}