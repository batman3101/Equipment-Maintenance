import { EquipmentTypeRepository } from './EquipmentTypeRepository';
import { EquipmentStatusRepository } from './EquipmentStatusRepository';
import { 
  BreakdownMainCategoryRepository, 
  BreakdownSubCategoryRepository 
} from './BreakdownCategoryRepository';
import {
  EquipmentType,
  EquipmentStatus,
  BreakdownMainCategory,
  BreakdownSubCategory,
  CreateEquipmentTypeRequest,
  UpdateEquipmentTypeRequest,
  CreateEquipmentStatusRequest,
  UpdateEquipmentStatusRequest,
  CreateBreakdownMainCategoryRequest,
  UpdateBreakdownMainCategoryRequest,
  CreateBreakdownSubCategoryRequest,
  UpdateBreakdownSubCategoryRequest,
  SettingsListOptions,
  SettingsStats,
} from '../types';

export class SettingsService {
  private equipmentTypeRepo: EquipmentTypeRepository;
  private equipmentStatusRepo: EquipmentStatusRepository;
  private breakdownMainCategoryRepo: BreakdownMainCategoryRepository;
  private breakdownSubCategoryRepo: BreakdownSubCategoryRepository;

  constructor() {
    this.equipmentTypeRepo = new EquipmentTypeRepository();
    this.equipmentStatusRepo = new EquipmentStatusRepository();
    this.breakdownMainCategoryRepo = new BreakdownMainCategoryRepository();
    this.breakdownSubCategoryRepo = new BreakdownSubCategoryRepository();
  }

  // 설비 종류 관리
  async getEquipmentTypes(options?: SettingsListOptions): Promise<EquipmentType[]> {
    return this.equipmentTypeRepo.findAll(options);
  }

  async getEquipmentType(id: string): Promise<EquipmentType | null> {
    return this.equipmentTypeRepo.findById(id);
  }

  async createEquipmentType(data: CreateEquipmentTypeRequest): Promise<EquipmentType> {
    // 중복 이름 확인
    const existing = await this.equipmentTypeRepo.findByName(data.name);
    if (existing) {
      throw new Error('이미 존재하는 설비 종류 이름입니다.');
    }

    return this.equipmentTypeRepo.create(data);
  }

  async updateEquipmentType(data: UpdateEquipmentTypeRequest): Promise<EquipmentType> {
    // 이름 변경 시 중복 확인
    if (data.name) {
      const existing = await this.equipmentTypeRepo.findByName(data.name);
      if (existing && existing.id !== data.id) {
        throw new Error('이미 존재하는 설비 종류 이름입니다.');
      }
    }

    return this.equipmentTypeRepo.update(data);
  }

  async deleteEquipmentType(id: string): Promise<void> {
    return this.equipmentTypeRepo.delete(id);
  }

  async toggleEquipmentTypeActive(id: string): Promise<EquipmentType> {
    return this.equipmentTypeRepo.toggleActive(id);
  }

  async reorderEquipmentTypes(items: Array<{ id: string; display_order: number }>): Promise<void> {
    return this.equipmentTypeRepo.reorder(items);
  }

  // 설비 상태 관리
  async getEquipmentStatuses(options?: SettingsListOptions): Promise<EquipmentStatus[]> {
    return this.equipmentStatusRepo.findAll(options);
  }

  async getEquipmentStatus(id: string): Promise<EquipmentStatus | null> {
    return this.equipmentStatusRepo.findById(id);
  }

  async createEquipmentStatus(data: CreateEquipmentStatusRequest): Promise<EquipmentStatus> {
    // 중복 이름 확인
    const existing = await this.equipmentStatusRepo.findByName(data.name);
    if (existing) {
      throw new Error('이미 존재하는 설비 상태 이름입니다.');
    }

    return this.equipmentStatusRepo.create(data);
  }

  async updateEquipmentStatus(data: UpdateEquipmentStatusRequest): Promise<EquipmentStatus> {
    // 이름 변경 시 중복 확인
    if (data.name) {
      const existing = await this.equipmentStatusRepo.findByName(data.name);
      if (existing && existing.id !== data.id) {
        throw new Error('이미 존재하는 설비 상태 이름입니다.');
      }
    }

    return this.equipmentStatusRepo.update(data);
  }

  async deleteEquipmentStatus(id: string): Promise<void> {
    return this.equipmentStatusRepo.delete(id);
  }

  async toggleEquipmentStatusActive(id: string): Promise<EquipmentStatus> {
    return this.equipmentStatusRepo.toggleActive(id);
  }

  async reorderEquipmentStatuses(items: Array<{ id: string; display_order: number }>): Promise<void> {
    return this.equipmentStatusRepo.reorder(items);
  }

  async getAvailableStatusColors(): Promise<string[]> {
    return this.equipmentStatusRepo.getAvailableColors();
  }

  // 고장 대분류 관리
  async getBreakdownMainCategories(options?: SettingsListOptions): Promise<BreakdownMainCategory[]> {
    return this.breakdownMainCategoryRepo.findAll(options);
  }

  async getBreakdownMainCategory(id: string): Promise<BreakdownMainCategory | null> {
    return this.breakdownMainCategoryRepo.findById(id);
  }

  async createBreakdownMainCategory(data: CreateBreakdownMainCategoryRequest): Promise<BreakdownMainCategory> {
    return this.breakdownMainCategoryRepo.create(data);
  }

  async updateBreakdownMainCategory(data: UpdateBreakdownMainCategoryRequest): Promise<BreakdownMainCategory> {
    return this.breakdownMainCategoryRepo.update(data);
  }

  async deleteBreakdownMainCategory(id: string): Promise<void> {
    return this.breakdownMainCategoryRepo.delete(id);
  }

  async toggleBreakdownMainCategoryActive(id: string): Promise<BreakdownMainCategory> {
    return this.breakdownMainCategoryRepo.toggleActive(id);
  }

  async reorderBreakdownMainCategories(items: Array<{ id: string; display_order: number }>): Promise<void> {
    return this.breakdownMainCategoryRepo.reorder(items);
  }

  // 고장 소분류 관리
  async getBreakdownSubCategories(options?: SettingsListOptions & { main_category_id?: string }): Promise<BreakdownSubCategory[]> {
    return this.breakdownSubCategoryRepo.findAll(options);
  }

  async getBreakdownSubCategory(id: string): Promise<BreakdownSubCategory | null> {
    return this.breakdownSubCategoryRepo.findById(id);
  }

  async getBreakdownSubCategoriesByMainCategory(mainCategoryId: string): Promise<BreakdownSubCategory[]> {
    return this.breakdownSubCategoryRepo.findByMainCategory(mainCategoryId);
  }

  async createBreakdownSubCategory(data: CreateBreakdownSubCategoryRequest): Promise<BreakdownSubCategory> {
    return this.breakdownSubCategoryRepo.create(data);
  }

  async updateBreakdownSubCategory(data: UpdateBreakdownSubCategoryRequest): Promise<BreakdownSubCategory> {
    return this.breakdownSubCategoryRepo.update(data);
  }

  async deleteBreakdownSubCategory(id: string): Promise<void> {
    return this.breakdownSubCategoryRepo.delete(id);
  }

  async toggleBreakdownSubCategoryActive(id: string): Promise<BreakdownSubCategory> {
    return this.breakdownSubCategoryRepo.toggleActive(id);
  }

  async reorderBreakdownSubCategories(items: Array<{ id: string; display_order: number }>): Promise<void> {
    return this.breakdownSubCategoryRepo.reorder(items);
  }

  // 통계 정보
  async getSettingsStats(): Promise<SettingsStats> {
    const [
      equipmentTypesCount,
      equipmentStatusesCount,
      breakdownMainCategoriesCount,
      breakdownSubCategoriesCount,
    ] = await Promise.all([
      this.equipmentTypeRepo.getCount({ is_active: true }),
      this.equipmentStatusRepo.getCount({ is_active: true }),
      this.breakdownMainCategoryRepo.getCount({ is_active: true }),
      this.breakdownSubCategoryRepo.getCount({ is_active: true }),
    ]);

    return {
      equipment_types_count: equipmentTypesCount,
      equipment_statuses_count: equipmentStatusesCount,
      breakdown_main_categories_count: breakdownMainCategoriesCount,
      breakdown_sub_categories_count: breakdownSubCategoriesCount,
    };
  }

  // 설정 데이터 유효성 검증
  async validateSettingsData(): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // 기본 설정 데이터 존재 확인
      const [equipmentTypes, equipmentStatuses, mainCategories] = await Promise.all([
        this.getEquipmentTypes({ filter: { is_active: true }, limit: 1 }),
        this.getEquipmentStatuses({ filter: { is_active: true }, limit: 1 }),
        this.getBreakdownMainCategories({ filter: { is_active: true }, limit: 1 }),
      ]);

      if (equipmentTypes.length === 0) {
        issues.push('활성화된 설비 종류가 없습니다.');
      }

      if (equipmentStatuses.length === 0) {
        issues.push('활성화된 설비 상태가 없습니다.');
      }

      if (mainCategories.length === 0) {
        issues.push('활성화된 고장 대분류가 없습니다.');
      }

      // 소분류가 없는 대분류 확인
      const allMainCategories = await this.getBreakdownMainCategories({ filter: { is_active: true } });
      for (const mainCategory of allMainCategories) {
        const subCategories = await this.getBreakdownSubCategoriesByMainCategory(mainCategory.id);
        const activeSubCategories = subCategories.filter(sub => sub.is_active);
        
        if (activeSubCategories.length === 0) {
          issues.push(`'${mainCategory.name}' 대분류에 활성화된 소분류가 없습니다.`);
        }
      }

    } catch (error) {
      issues.push('설정 데이터 검증 중 오류가 발생했습니다.');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  // 설정 초기화 (기본 데이터 생성)
  async initializeDefaultSettings(): Promise<void> {
    // 마이그레이션에서 기본 데이터가 이미 생성되므로,
    // 필요시 추가 기본 데이터를 생성하는 로직을 여기에 구현
    console.log('기본 설정 데이터는 데이터베이스 마이그레이션을 통해 생성됩니다.');
  }
}