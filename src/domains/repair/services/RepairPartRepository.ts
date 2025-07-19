import { supabase } from '@/lib/supabase';
import type { RepairPart, CreateRepairPartRequest } from '../types';

/**
 * 수리 부품 데이터 접근을 담당하는 Repository 클래스
 * Interface Segregation Principle: 부품 관련 기능만 담당
 */
export class RepairPartRepository {
  /**
   * 수리 ID로 부품 목록 조회
   */
  async findByRepairId(repairId: string): Promise<RepairPart[]> {
    const { data, error } = await supabase
      .from('repair_parts')
      .select('*')
      .eq('repair_id', repairId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`수리 부품 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 부품 정보 생성
   */
  async create(repairId: string, parts: CreateRepairPartRequest[]): Promise<RepairPart[]> {
    const partsData = parts.map(part => ({
      repair_id: repairId,
      part_name: part.part_name,
      quantity: part.quantity,
      unit_price: part.unit_price,
      total_price: part.quantity * part.unit_price
    }));

    const { data, error } = await supabase
      .from('repair_parts')
      .insert(partsData)
      .select('*');

    if (error) {
      throw new Error(`수리 부품 생성 실패: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 부품 정보 수정
   */
  async update(id: string, partData: Partial<CreateRepairPartRequest>): Promise<RepairPart> {
    const updateData: any = { ...partData };
    
    // 수량이나 단가가 변경되면 총 가격 재계산
    if (partData.quantity !== undefined || partData.unit_price !== undefined) {
      const currentPart = await this.findById(id);
      const quantity = partData.quantity ?? currentPart.quantity;
      const unitPrice = partData.unit_price ?? currentPart.unit_price;
      updateData.total_price = quantity * unitPrice;
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('repair_parts')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`수리 부품 수정 실패: ${error.message}`);
    }

    return data;
  }

  /**
   * 부품 정보 삭제
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('repair_parts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`수리 부품 삭제 실패: ${error.message}`);
    }
  }

  /**
   * 수리의 모든 부품 삭제
   */
  async deleteByRepairId(repairId: string): Promise<void> {
    const { error } = await supabase
      .from('repair_parts')
      .delete()
      .eq('repair_id', repairId);

    if (error) {
      throw new Error(`수리 부품 일괄 삭제 실패: ${error.message}`);
    }
  }

  /**
   * ID로 부품 정보 조회 (private 메서드)
   */
  private async findById(id: string): Promise<RepairPart> {
    const { data, error } = await supabase
      .from('repair_parts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`수리 부품 조회 실패: ${error.message}`);
    }

    return data;
  }

  /**
   * 부품별 사용 통계 조회
   */
  async getPartUsageStats(limit: number = 10): Promise<Array<{
    part_name: string;
    usage_count: number;
    avg_price: number;
    total_quantity: number;
  }>> {
    const { data, error } = await supabase
      .from('repair_parts')
      .select('part_name, quantity, unit_price')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`부품 사용 통계 조회 실패: ${error.message}`);
    }

    // 부품별 통계 계산
    const statsMap = new Map<string, {
      count: number;
      totalQuantity: number;
      prices: number[];
    }>();

    data?.forEach(part => {
      const existing = statsMap.get(part.part_name) || {
        count: 0,
        totalQuantity: 0,
        prices: []
      };
      
      existing.count += 1;
      existing.totalQuantity += part.quantity;
      existing.prices.push(part.unit_price);
      
      statsMap.set(part.part_name, existing);
    });

    // 통계 결과 변환 및 정렬
    return Array.from(statsMap.entries())
      .map(([partName, stats]) => ({
        part_name: partName,
        usage_count: stats.count,
        avg_price: stats.prices.reduce((sum, price) => sum + price, 0) / stats.prices.length,
        total_quantity: stats.totalQuantity
      }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit);
  }
}