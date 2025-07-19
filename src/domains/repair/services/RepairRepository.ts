import { supabase } from '@/lib/supabase';
import type { 
  Repair, 
  CreateRepairRequest, 
  UpdateRepairRequest, 
  RepairFilters,
  RepairListResponse,
  PartSuggestion
} from '../types';

/**
 * 수리 데이터 접근을 담당하는 Repository 클래스
 * Single Responsibility Principle: 데이터 접근만 담당
 */
export class RepairRepository {
  /**
   * 수리 기록 생성
   */
  async create(repairData: CreateRepairRequest): Promise<Repair> {
    const { data, error } = await supabase
      .from('repairs')
      .insert({
        breakdown_id: repairData.breakdown_id,
        action_taken: repairData.action_taken,
        technician_id: repairData.technician_id,
        completed_at: repairData.completed_at,
        total_cost: this.calculateTotalCost(repairData.parts_used || [])
      })
      .select(`
        *,
        technician:users!repairs_technician_id_fkey(id, name, email),
        breakdown:breakdowns(id, equipment_type, equipment_number, symptoms)
      `)
      .single();

    if (error) {
      throw new Error(`수리 기록 생성 실패: ${error.message}`);
    }

    // 부품 정보가 있으면 별도로 저장
    if (repairData.parts_used && repairData.parts_used.length > 0) {
      await this.createRepairParts(data.id, repairData.parts_used);
      // 부품 정보를 포함하여 다시 조회
      return this.findById(data.id);
    }

    return data;
  }

  /**
   * ID로 수리 기록 조회
   */
  async findById(id: string): Promise<Repair> {
    const { data, error } = await supabase
      .from('repairs')
      .select(`
        *,
        technician:users!repairs_technician_id_fkey(id, name, email),
        breakdown:breakdowns(id, equipment_type, equipment_number, symptoms),
        parts_used:repair_parts(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`수리 기록 조회 실패: ${error.message}`);
    }

    return data;
  }

  /**
   * 수리 기록 목록 조회 (필터링 및 페이지네이션 지원)
   */
  async findMany(
    filters: RepairFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<RepairListResponse> {
    let query = supabase
      .from('repairs')
      .select(`
        *,
        technician:users!repairs_technician_id_fkey(id, name, email),
        breakdown:breakdowns(id, equipment_type, equipment_number, symptoms),
        parts_used:repair_parts(*)
      `, { count: 'exact' });

    // 필터 적용
    if (filters.breakdown_id) {
      query = query.eq('breakdown_id', filters.breakdown_id);
    }

    if (filters.technician_id) {
      query = query.eq('technician_id', filters.technician_id);
    }

    if (filters.date_from) {
      query = query.gte('completed_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('completed_at', filters.date_to);
    }

    if (filters.search) {
      query = query.or(`action_taken.ilike.%${filters.search}%`);
    }

    // 페이지네이션 및 정렬
    const offset = (page - 1) * limit;
    query = query
      .order('completed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`수리 기록 목록 조회 실패: ${error.message}`);
    }

    return {
      data: data || [],
      count: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit)
    };
  }

  /**
   * 고장 ID로 관련 수리 기록 조회
   */
  async findByBreakdownId(breakdownId: string): Promise<Repair[]> {
    const { data, error } = await supabase
      .from('repairs')
      .select(`
        *,
        technician:users!repairs_technician_id_fkey(id, name, email),
        parts_used:repair_parts(*)
      `)
      .eq('breakdown_id', breakdownId)
      .order('completed_at', { ascending: false });

    if (error) {
      throw new Error(`고장별 수리 기록 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 수리 기록 수정
   */
  async update(id: string, updateData: UpdateRepairRequest): Promise<Repair> {
    const updatePayload: any = {
      ...updateData,
      updated_at: new Date().toISOString()
    };

    // 부품 정보가 있으면 총 비용 재계산
    if (updateData.parts_used) {
      updatePayload.total_cost = this.calculateTotalCost(updateData.parts_used);
    }

    const { data, error } = await supabase
      .from('repairs')
      .update(updatePayload)
      .eq('id', id)
      .select(`
        *,
        technician:users!repairs_technician_id_fkey(id, name, email),
        breakdown:breakdowns(id, equipment_type, equipment_number, symptoms)
      `)
      .single();

    if (error) {
      throw new Error(`수리 기록 수정 실패: ${error.message}`);
    }

    // 부품 정보 업데이트
    if (updateData.parts_used) {
      await this.updateRepairParts(id, updateData.parts_used);
    }

    return this.findById(id);
  }

  /**
   * 수리 기록 삭제
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('repairs')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`수리 기록 삭제 실패: ${error.message}`);
    }
  }

  /**
   * 부품 자동완성을 위한 제안 목록 조회
   */
  async getPartSuggestions(query: string): Promise<PartSuggestion[]> {
    const { data, error } = await supabase
      .from('repair_parts')
      .select('part_name, unit_price')
      .ilike('part_name', `%${query}%`)
      .order('part_name');

    if (error) {
      throw new Error(`부품 제안 조회 실패: ${error.message}`);
    }

    // 부품별 평균 가격과 사용 횟수 계산
    const partMap = new Map<string, { prices: number[]; count: number }>();
    
    data?.forEach(part => {
      const existing = partMap.get(part.part_name) || { prices: [], count: 0 };
      existing.prices.push(part.unit_price);
      existing.count += 1;
      partMap.set(part.part_name, existing);
    });

    return Array.from(partMap.entries()).map(([name, info]) => ({
      name,
      average_price: info.prices.reduce((sum, price) => sum + price, 0) / info.prices.length,
      usage_count: info.count
    }));
  }

  /**
   * 수리 부품 생성 (private 메서드)
   */
  private async createRepairParts(repairId: string, parts: any[]): Promise<void> {
    const partsData = parts.map(part => ({
      repair_id: repairId,
      part_name: part.part_name,
      quantity: part.quantity,
      unit_price: part.unit_price,
      total_price: part.quantity * part.unit_price
    }));

    const { error } = await supabase
      .from('repair_parts')
      .insert(partsData);

    if (error) {
      throw new Error(`수리 부품 정보 저장 실패: ${error.message}`);
    }
  }

  /**
   * 수리 부품 업데이트 (private 메서드)
   */
  private async updateRepairParts(repairId: string, parts: any[]): Promise<void> {
    // 기존 부품 정보 삭제
    await supabase
      .from('repair_parts')
      .delete()
      .eq('repair_id', repairId);

    // 새로운 부품 정보 생성
    if (parts.length > 0) {
      await this.createRepairParts(repairId, parts);
    }
  }

  /**
   * 총 비용 계산 (private 메서드)
   */
  private calculateTotalCost(parts: any[]): number {
    return parts.reduce((total, part) => {
      return total + (part.quantity * part.unit_price);
    }, 0);
  }
}