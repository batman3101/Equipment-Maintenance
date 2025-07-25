// Equipment Service 구현
// 비즈니스 로직 계층 - SOLID 원칙 적용

import { 
  Equipment, 
  CreateEquipmentRequest, 
  UpdateEquipmentRequest,
  EquipmentFilter,
  EquipmentSort,
  EquipmentListOptions,
  EquipmentListResponse,
  EquipmentStats,
  EquipmentValidationError,
  EquipmentServiceError,
  EquipmentType,
  EquipmentStatus,
  EquipmentPriority
} from '../types';
import type { IEquipmentRepository } from './EquipmentRepository';
import { equipmentRepository } from './EquipmentRepository';

/**
 * Equipment Service 인터페이스
 * - 의존성 역전 원칙(DIP) 적용
 * - 비즈니스 로직 추상화
 */
export interface IEquipmentService {
  getEquipmentList(options?: EquipmentListOptions): Promise<EquipmentListResponse>;
  getEquipmentById(id: string): Promise<Equipment>;
  getEquipmentByNumber(equipmentNumber: string): Promise<Equipment>;
  createEquipment(data: CreateEquipmentRequest): Promise<Equipment>;
  updateEquipment(id: string, data: UpdateEquipmentRequest): Promise<Equipment>;
  deleteEquipment(id: string): Promise<void>;
  getEquipmentStats(): Promise<EquipmentStats>;
  searchEquipment(query: string, limit?: number): Promise<Equipment[]>;
  validateEquipmentData(data: CreateEquipmentRequest | UpdateEquipmentRequest): EquipmentValidationError[];
  getMaintenanceDueEquipment(): Promise<Equipment[]>;
  updateEquipmentStatus(id: string, status: EquipmentStatus): Promise<Equipment>;
}

/**
 * Equipment Service 구현
 * - 단일 책임 원칙(SRP): 설비 비즈니스 로직만 담당
 * - 개방-폐쇄 원칙(OCP): 확장 가능한 구조
 * - 의존성 역전 원칙(DIP): Repository 인터페이스에 의존
 */
export class EquipmentService implements IEquipmentService {
  constructor(private readonly repository: IEquipmentRepository) {}

  /**
   * 설비 목록 조회
   */
  async getEquipmentList(options: EquipmentListOptions = {}): Promise<EquipmentListResponse> {
    try {
      return await this.repository.findAll(options);
    } catch (error) {
      throw this.handleError('EQUIPMENT_LIST_FETCH_FAILED', '설비 목록 조회에 실패했습니다.', error);
    }
  }

  /**
   * ID로 설비 조회
   */
  async getEquipmentById(id: string): Promise<Equipment> {
    if (!id) {
      throw this.handleError('INVALID_EQUIPMENT_ID', '유효하지 않은 설비 ID입니다.');
    }

    try {
      const equipment = await this.repository.findById(id);
      if (!equipment) {
        throw this.handleError('EQUIPMENT_NOT_FOUND', '설비를 찾을 수 없습니다.');
      }
      return equipment;
    } catch (error) {
      if (error instanceof Error && error.message.includes('EQUIPMENT_')) {
        throw error;
      }
      throw this.handleError('EQUIPMENT_FETCH_FAILED', '설비 조회에 실패했습니다.', error);
    }
  }

  /**
   * 설비 번호로 설비 조회
   */
  async getEquipmentByNumber(equipmentNumber: string): Promise<Equipment> {
    if (!equipmentNumber) {
      throw this.handleError('INVALID_EQUIPMENT_NUMBER', '유효하지 않은 설비 번호입니다.');
    }

    try {
      const equipment = await this.repository.findByEquipmentNumber(equipmentNumber);
      if (!equipment) {
        throw this.handleError('EQUIPMENT_NOT_FOUND', '설비를 찾을 수 없습니다.');
      }
      return equipment;
    } catch (error) {
      if (error instanceof Error && error.message.includes('EQUIPMENT_')) {
        throw error;
      }
      throw this.handleError('EQUIPMENT_FETCH_FAILED', '설비 조회에 실패했습니다.', error);
    }
  }

  /**
   * 설비 일괄 생성
   */
  async createEquipmentBatch(dataList: CreateEquipmentRequest[]): Promise<{ 
    success: Equipment[], 
    failed: { data: CreateEquipmentRequest, error: string }[] 
  }> {
    const results = {
      success: [] as Equipment[],
      failed: [] as { data: CreateEquipmentRequest, error: string }[]
    };

    // 병렬 처리를 위해 배치 크기 제한 (한 번에 최대 10개)
    const batchSize = 10;
    for (let i = 0; i < dataList.length; i += batchSize) {
      const batch = dataList.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (data) => {
        try {
          // 개별 검증
          const validationErrors = this.validateEquipmentData(data);
          if (validationErrors.length > 0) {
            throw new Error(validationErrors.map(e => e.message).join(', '));
          }

          // 비즈니스 규칙 적용
          const processedData = this.applyBusinessRules(data);
          const equipment = await this.repository.create(processedData);
          
          return { success: true, equipment, data };
        } catch (error) {
          return { 
            success: false, 
            data, 
            error: error instanceof Error ? error.message : '알 수 없는 오류' 
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        if (result.success) {
          results.success.push(result.equipment);
        } else {
          results.failed.push({ data: result.data, error: result.error });
        }
      });
    }

    return results;
  }

  /**
   * 설비 생성
   */
  async createEquipment(data: CreateEquipmentRequest): Promise<Equipment> {
    // 데이터 유효성 검사
    const validationErrors = this.validateEquipmentData(data);
    if (validationErrors.length > 0) {
      throw this.handleError('VALIDATION_FAILED', '입력 데이터가 유효하지 않습니다.', validationErrors);
    }

    try {
      // 비즈니스 규칙 적용
      const processedData = this.applyBusinessRules(data);
      return await this.repository.create(processedData);
    } catch (error) {
      if (error instanceof Error && error.message.includes('이미 존재하는')) {
        throw this.handleError('DUPLICATE_EQUIPMENT_NUMBER', error.message);
      }
      throw this.handleError('EQUIPMENT_CREATE_FAILED', '설비 생성에 실패했습니다.', error);
    }
  }

  /**
   * 설비 업데이트
   */
  async updateEquipment(id: string, data: UpdateEquipmentRequest): Promise<Equipment> {
    if (!id) {
      throw this.handleError('INVALID_EQUIPMENT_ID', '유효하지 않은 설비 ID입니다.');
    }

    // 데이터 유효성 검사
    const validationErrors = this.validateEquipmentData(data);
    if (validationErrors.length > 0) {
      throw this.handleError('VALIDATION_FAILED', '입력 데이터가 유효하지 않습니다.', validationErrors);
    }

    try {
      // 설비 존재 확인
      await this.getEquipmentById(id);
      
      // 비즈니스 규칙 적용
      const processedData = this.applyBusinessRules(data);
      return await this.repository.update(id, processedData);
    } catch (error) {
      if (error instanceof Error && error.message.includes('EQUIPMENT_')) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('이미 존재하는')) {
        throw this.handleError('DUPLICATE_EQUIPMENT_NUMBER', error.message);
      }
      throw this.handleError('EQUIPMENT_UPDATE_FAILED', '설비 업데이트에 실패했습니다.', error);
    }
  }

  /**
   * 설비 삭제
   */
  async deleteEquipment(id: string): Promise<void> {
    if (!id) {
      throw this.handleError('INVALID_EQUIPMENT_ID', '유효하지 않은 설비 ID입니다.');
    }

    try {
      // 설비 존재 확인
      await this.getEquipmentById(id);
      
      // 삭제 전 비즈니스 규칙 확인
      await this.validateEquipmentDeletion(id);
      
      await this.repository.delete(id);
    } catch (error) {
      if (error instanceof Error && error.message.includes('EQUIPMENT_')) {
        throw error;
      }
      throw this.handleError('EQUIPMENT_DELETE_FAILED', '설비 삭제에 실패했습니다.', error);
    }
  }

  /**
   * 설비 통계 조회
   */
  async getEquipmentStats(): Promise<EquipmentStats> {
    try {
      return await this.repository.getStats();
    } catch (error) {
      throw this.handleError('EQUIPMENT_STATS_FETCH_FAILED', '설비 통계 조회에 실패했습니다.', error);
    }
  }

  /**
   * 설비 검색
   */
  async searchEquipment(query: string, limit: number = 10): Promise<Equipment[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      return await this.repository.search(query.trim(), limit);
    } catch (error) {
      throw this.handleError('EQUIPMENT_SEARCH_FAILED', '설비 검색에 실패했습니다.', error);
    }
  }

  /**
   * 정비 예정 설비 조회
   */
  async getMaintenanceDueEquipment(): Promise<Equipment[]> {
    try {
      const options: EquipmentListOptions = {
        filter: { maintenance_due: true },
        sort: { field: 'next_maintenance_date', direction: 'asc' }
      };
      const result = await this.repository.findAll(options);
      return result.data;
    } catch (error) {
      throw this.handleError('MAINTENANCE_DUE_FETCH_FAILED', '정비 예정 설비 조회에 실패했습니다.', error);
    }
  }

  /**
   * 설비 상태 업데이트
   */
  async updateEquipmentStatus(id: string, status: EquipmentStatus): Promise<Equipment> {
    if (!id) {
      throw this.handleError('INVALID_EQUIPMENT_ID', '유효하지 않은 설비 ID입니다.');
    }

    try {
      const updateData: UpdateEquipmentRequest = { status };
      
      // 상태 변경에 따른 추가 로직
      if (status === EquipmentStatus.MAINTENANCE) {
        updateData.last_maintenance_date = new Date().toISOString();
      }

      return await this.repository.update(id, updateData);
    } catch (error) {
      throw this.handleError('EQUIPMENT_STATUS_UPDATE_FAILED', '설비 상태 업데이트에 실패했습니다.', error);
    }
  }

  /**
   * 설비 데이터 유효성 검사 (DB 스키마에 맞게 수정)
   */
  validateEquipmentData(data: CreateEquipmentRequest | UpdateEquipmentRequest): EquipmentValidationError[] {
    const errors: EquipmentValidationError[] = [];

    // 설비 번호 검사
    if ('equipment_number' in data && data.equipment_number !== undefined) {
      if (!data.equipment_number.trim()) {
        errors.push({ field: 'equipment_number', message: '설비 번호는 필수입니다.' });
      } else if (data.equipment_number.length > 50) {
        errors.push({ field: 'equipment_number', message: '설비 번호는 50자 이하여야 합니다.' });
      }
    }

    // 설비 종류 검사
    if ('equipment_type' in data && data.equipment_type !== undefined) {
      if (!data.equipment_type.trim()) {
        errors.push({ field: 'equipment_type', message: '설비 종류는 필수입니다.' });
      }
    }

    // 공장 ID 검사
    if ('plant_id' in data && data.plant_id !== undefined) {
      if (!data.plant_id.trim()) {
        errors.push({ field: 'plant_id', message: '공장 ID는 필수입니다.' });
      }
    }

    return errors;
  }

  /**
   * 비즈니스 규칙 적용 (DB 스키마에 맞게 수정)
   */
  private applyBusinessRules<T extends CreateEquipmentRequest | UpdateEquipmentRequest>(data: T): T {
    const processedData = { ...data };

    // 설비 번호 정규화 (대문자 변환, 공백 제거)
    if ('equipment_number' in processedData && processedData.equipment_number) {
      processedData.equipment_number = processedData.equipment_number.trim().toUpperCase();
    }

    // 설비 종류 정규화 (소문자 변환, 공백 제거)
    if ('equipment_type' in processedData && processedData.equipment_type) {
      processedData.equipment_type = processedData.equipment_type.trim().toLowerCase();
    }

    return processedData;
  }

  /**
   * 설비 삭제 유효성 검사
   */
  private async validateEquipmentDeletion(id: string): Promise<void> {
    // TODO: 고장 이력이 있는 설비는 삭제 불가 등의 비즈니스 규칙 구현
    // 현재는 기본 구현으로 모든 삭제 허용
  }

  /**
   * 에러 처리 헬퍼
   */
  private handleError(code: string, message: string, details?: any): EquipmentServiceError {
    const error = new Error(message) as any;
    error.code = code;
    error.details = details;
    return error;
  }
}

/**
 * Equipment Service 인스턴스
 * - 의존성 주입을 통한 Repository 연결
 */
export const equipmentService = new EquipmentService(equipmentRepository);