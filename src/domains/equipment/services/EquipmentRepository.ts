// Equipment Repository 구현
// SOLID 원칙을 적용한 데이터 액세스 계층

import { supabase } from '@/lib/supabase';
import type { 
  Equipment, 
  CreateEquipmentRequest, 
  UpdateEquipmentRequest,
  EquipmentFilter,
  EquipmentSort,
  EquipmentListOptions,
  EquipmentListResponse,
  EquipmentStats
} from '../types';

/**
 * Equipment Repository 인터페이스
 * - 의존성 역전 원칙(DIP) 적용
 * - 테스트 가능한 구조 제공
 */
export interface IEquipmentRepository {
  findAll(options?: EquipmentListOptions): Promise<EquipmentListResponse>;
  findById(id: string): Promise<Equipment | null>;
  findByEquipmentNumber(equipmentNumber: string): Promise<Equipment | null>;
  create(data: CreateEquipmentRequest): Promise<Equipment>;
  update(id: string, data: UpdateEquipmentRequest): Promise<Equipment>;
  delete(id: string): Promise<void>;
  getStats(): Promise<EquipmentStats>;
  search(query: string, limit?: number): Promise<Equipment[]>;
  checkEquipmentNumberExists(equipmentNumber: string, excludeId?: string): Promise<boolean>;
}

/**
 * Supabase Equipment Repository 구현
 * - 단일 책임 원칙(SRP) 적용: 설비 데이터 액세스만 담당
 * - 개방-폐쇄 원칙(OCP) 적용: 확장 가능한 구조
 */
export class SupabaseEquipmentRepository implements IEquipmentRepository {
  private readonly tableName = 'equipment';

  /**
   * 설비 목록 조회
   */
  async findAll(options: EquipmentListOptions = {}): Promise<EquipmentListResponse> {
    const { filter, sort, page = 1, limit = 20 } = options;
    
    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact' });

    // 필터 적용
    if (filter) {
      query = this.applyFilters(query, filter);
    }

    // 정렬 적용
    if (sort) {
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });
    } else {
      // 기본 정렬: 생성일 내림차순
      query = query.order('created_at', { ascending: false });
    }

    // 페이지네이션 적용
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`설비 목록 조회 실패: ${error.message}`);
    }

    const total = count || 0;
    const hasMore = from + limit < total;

    return {
      data: data || [],
      total,
      page,
      limit,
      hasMore
    };
  }

  /**
   * ID로 설비 조회
   */
  async findById(id: string): Promise<Equipment | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 데이터 없음
      }
      throw new Error(`설비 조회 실패: ${error.message}`);
    }

    return data;
  }

  /**
   * 설비 번호로 설비 조회
   */
  async findByEquipmentNumber(equipmentNumber: string): Promise<Equipment | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('equipment_number', equipmentNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 데이터 없음
      }
      throw new Error(`설비 조회 실패: ${error.message}`);
    }

    return data;
  }

  /**
   * 설비 생성
   */
  async create(data: CreateEquipmentRequest): Promise<Equipment> {
    // 설비 번호 중복 확인
    const exists = await this.checkEquipmentNumberExists(data.equipment_number);
    if (exists) {
      throw new Error('이미 존재하는 설비 번호입니다.');
    }

    const { data: equipment, error } = await supabase
      .from(this.tableName)
      .insert({
        ...data,
        status: 'active', // 기본 상태
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`설비 생성 실패: ${error.message}`);
    }

    return equipment;
  }

  /**
   * 설비 업데이트
   */
  async update(id: string, data: UpdateEquipmentRequest): Promise<Equipment> {
    // 설비 번호 변경 시 중복 확인
    if (data.equipment_number) {
      const exists = await this.checkEquipmentNumberExists(data.equipment_number, id);
      if (exists) {
        throw new Error('이미 존재하는 설비 번호입니다.');
      }
    }

    const { data: equipment, error } = await supabase
      .from(this.tableName)
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`설비 업데이트 실패: ${error.message}`);
    }

    return equipment;
  }

  /**
   * 설비 삭제
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`설비 삭제 실패: ${error.message}`);
    }
  }

  /**
   * 설비 통계 조회
   */
  async getStats(): Promise<EquipmentStats> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('status, type, priority, next_maintenance_date');

    if (error) {
      throw new Error(`설비 통계 조회 실패: ${error.message}`);
    }

    const equipment = data || [];
    const now = new Date();
    const maintenanceDue = equipment.filter(eq => 
      eq.next_maintenance_date && new Date(eq.next_maintenance_date) <= now
    ).length;

    // 상태별 집계
    const statusCounts = equipment.reduce((acc, eq) => {
      acc[eq.status] = (acc[eq.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 타입별 집계
    const typeCounts = equipment.reduce((acc, eq) => {
      acc[eq.type] = (acc[eq.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 우선순위별 집계
    const priorityCounts = equipment.reduce((acc, eq) => {
      acc[eq.priority] = (acc[eq.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: equipment.length,
      active: statusCounts.active || 0,
      inactive: statusCounts.inactive || 0,
      maintenance: statusCounts.maintenance || 0,
      broken: statusCounts.broken || 0,
      maintenanceDue,
      byType: typeCounts as any,
      byPriority: priorityCounts as any
    };
  }

  /**
   * 설비 검색
   */
  async search(query: string, limit: number = 10): Promise<Equipment[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .or(`equipment_number.ilike.%${query}%,name.ilike.%${query}%,location.ilike.%${query}%`)
      .limit(limit)
      .order('equipment_number');

    if (error) {
      throw new Error(`설비 검색 실패: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 설비 번호 중복 확인
   */
  async checkEquipmentNumberExists(equipmentNumber: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from(this.tableName)
      .select('id')
      .eq('equipment_number', equipmentNumber);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`설비 번호 중복 확인 실패: ${error.message}`);
    }

    return (data?.length || 0) > 0;
  }

  /**
   * 필터 적용 헬퍼 메서드
   */
  private applyFilters(query: any, filter: EquipmentFilter) {
    if (filter.search) {
      query = query.or(`equipment_number.ilike.%${filter.search}%,name.ilike.%${filter.search}%,location.ilike.%${filter.search}%`);
    }

    if (filter.type && filter.type.length > 0) {
      query = query.in('type', filter.type);
    }

    if (filter.status && filter.status.length > 0) {
      query = query.in('status', filter.status);
    }

    if (filter.priority && filter.priority.length > 0) {
      query = query.in('priority', filter.priority);
    }

    if (filter.location && filter.location.length > 0) {
      query = query.in('location', filter.location);
    }

    if (filter.manufacturer && filter.manufacturer.length > 0) {
      query = query.in('manufacturer', filter.manufacturer);
    }

    if (filter.maintenance_due) {
      const now = new Date().toISOString();
      query = query.lte('next_maintenance_date', now);
    }

    return query;
  }
}

/**
 * Equipment Repository 인스턴스
 * - 싱글톤 패턴 적용
 */
export const equipmentRepository = new SupabaseEquipmentRepository();