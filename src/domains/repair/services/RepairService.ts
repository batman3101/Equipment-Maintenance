import { RepairRepository } from './RepairRepository';
import { RepairPartRepository } from './RepairPartRepository';
import type { 
  Repair, 
  CreateRepairRequest, 
  UpdateRepairRequest, 
  RepairFilters,
  RepairListResponse,
  PartSuggestion
} from '../types';

/**
 * 수리 비즈니스 로직을 담당하는 Service 클래스
 * Single Responsibility Principle: 수리 관련 비즈니스 로직만 담당
 * Dependency Inversion Principle: Repository 추상화에 의존
 */
export class RepairService {
  constructor(
    private repairRepository: RepairRepository,
    private repairPartRepository: RepairPartRepository
  ) {}

  /**
   * 수리 기록 생성
   * 비즈니스 규칙: 총 비용 자동 계산, 데이터 검증
   */
  async createRepair(repairData: CreateRepairRequest): Promise<Repair> {
    // 입력 데이터 검증
    this.validateRepairData(repairData);

    // 부품 데이터 검증 및 총 비용 계산
    if (repairData.parts_used && repairData.parts_used.length > 0) {
      this.validatePartsData(repairData.parts_used);
    }

    try {
      const repair = await this.repairRepository.create(repairData);
      return repair;
    } catch (error) {
      throw new Error(`수리 기록 생성 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 수리 기록 조회
   */
  async getRepair(id: string): Promise<Repair> {
    if (!id || id.trim() === '') {
      throw new Error('수리 ID가 필요합니다.');
    }

    try {
      return await this.repairRepository.findById(id);
    } catch (error) {
      throw new Error(`수리 기록 조회 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 수리 기록 목록 조회
   */
  async getRepairList(
    filters: RepairFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<RepairListResponse> {
    // 페이지네이션 파라미터 검증
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 20;

    try {
      return await this.repairRepository.findMany(filters, page, limit);
    } catch (error) {
      throw new Error(`수리 기록 목록 조회 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 고장별 수리 기록 조회
   */
  async getRepairsByBreakdown(breakdownId: string): Promise<Repair[]> {
    if (!breakdownId || breakdownId.trim() === '') {
      throw new Error('고장 ID가 필요합니다.');
    }

    try {
      return await this.repairRepository.findByBreakdownId(breakdownId);
    } catch (error) {
      throw new Error(`고장별 수리 기록 조회 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 수리 기록 수정
   */
  async updateRepair(id: string, updateData: UpdateRepairRequest): Promise<Repair> {
    if (!id || id.trim() === '') {
      throw new Error('수리 ID가 필요합니다.');
    }

    // 부품 데이터가 있으면 검증
    if (updateData.parts_used && updateData.parts_used.length > 0) {
      this.validatePartsData(updateData.parts_used);
    }

    try {
      return await this.repairRepository.update(id, updateData);
    } catch (error) {
      throw new Error(`수리 기록 수정 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 수리 기록 삭제
   */
  async deleteRepair(id: string): Promise<void> {
    if (!id || id.trim() === '') {
      throw new Error('수리 ID가 필요합니다.');
    }

    try {
      await this.repairRepository.delete(id);
    } catch (error) {
      throw new Error(`수리 기록 삭제 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 부품 자동완성 제안 조회
   */
  async getPartSuggestions(query: string): Promise<PartSuggestion[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      return await this.repairRepository.getPartSuggestions(query.trim());
    } catch (error) {
      throw new Error(`부품 제안 조회 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 수리 비용 통계 계산
   */
  async getRepairCostStats(filters: RepairFilters = {}): Promise<{
    total_cost: number;
    average_cost: number;
    repair_count: number;
    most_expensive_repair: number;
    least_expensive_repair: number;
  }> {
    try {
      const { data: repairs } = await this.repairRepository.findMany(filters, 1, 1000);
      
      if (repairs.length === 0) {
        return {
          total_cost: 0,
          average_cost: 0,
          repair_count: 0,
          most_expensive_repair: 0,
          least_expensive_repair: 0
        };
      }

      const costs = repairs.map(repair => repair.total_cost);
      const totalCost = costs.reduce((sum, cost) => sum + cost, 0);

      return {
        total_cost: totalCost,
        average_cost: totalCost / repairs.length,
        repair_count: repairs.length,
        most_expensive_repair: Math.max(...costs),
        least_expensive_repair: Math.min(...costs)
      };
    } catch (error) {
      throw new Error(`수리 비용 통계 계산 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 부품 사용 통계 조회
   */
  async getPartUsageStats(limit: number = 10): Promise<Array<{
    part_name: string;
    usage_count: number;
    avg_price: number;
    total_quantity: number;
  }>> {
    try {
      return await this.repairPartRepository.getPartUsageStats(limit);
    } catch (error) {
      throw new Error(`부품 사용 통계 조회 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 수리 데이터 검증 (private 메서드)
   */
  private validateRepairData(repairData: CreateRepairRequest): void {
    if (!repairData.breakdown_id || repairData.breakdown_id.trim() === '') {
      throw new Error('고장 ID가 필요합니다.');
    }

    if (!repairData.action_taken || repairData.action_taken.trim() === '') {
      throw new Error('조치 내용이 필요합니다.');
    }

    if (repairData.action_taken.length > 2000) {
      throw new Error('조치 내용은 2000자를 초과할 수 없습니다.');
    }

    if (!repairData.technician_id || repairData.technician_id.trim() === '') {
      throw new Error('담당자 ID가 필요합니다.');
    }

    if (!repairData.completed_at) {
      throw new Error('완료 시각이 필요합니다.');
    }

    // 완료 시각이 미래가 아닌지 확인
    const completedAt = new Date(repairData.completed_at);
    const now = new Date();
    if (completedAt > now) {
      throw new Error('완료 시각은 현재 시간보다 이후일 수 없습니다.');
    }
  }

  /**
   * 부품 데이터 검증 (private 메서드)
   */
  private validatePartsData(parts: any[]): void {
    for (const part of parts) {
      if (!part.part_name || part.part_name.trim() === '') {
        throw new Error('부품명이 필요합니다.');
      }

      if (part.part_name.length > 200) {
        throw new Error('부품명은 200자를 초과할 수 없습니다.');
      }

      if (!part.quantity || part.quantity <= 0) {
        throw new Error('부품 수량은 0보다 커야 합니다.');
      }

      if (part.quantity > 10000) {
        throw new Error('부품 수량은 10,000개를 초과할 수 없습니다.');
      }

      if (!part.unit_price || part.unit_price < 0) {
        throw new Error('부품 단가는 0 이상이어야 합니다.');
      }

      if (part.unit_price > 10000000) {
        throw new Error('부품 단가는 1,000만원을 초과할 수 없습니다.');
      }
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const repairRepository = new RepairRepository();
const repairPartRepository = new RepairPartRepository();
export const repairService = new RepairService(repairRepository, repairPartRepository);