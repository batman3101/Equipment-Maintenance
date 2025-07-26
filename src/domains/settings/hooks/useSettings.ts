import { useState, useEffect, useCallback } from 'react';
import { SettingsService } from '../services/SettingsService';
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

const settingsService = new SettingsService();

export const useEquipmentTypes = (options?: SettingsListOptions) => {
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipmentTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsService.getEquipmentTypes(options);
      setEquipmentTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '설비 종류 조회 실패');
    } finally {
      setLoading(false);
    }
  }, [options]);

  const createEquipmentType = useCallback(async (data: CreateEquipmentTypeRequest) => {
    try {
      setError(null);
      const newEquipmentType = await settingsService.createEquipmentType(data);
      setEquipmentTypes(prev => [...prev, newEquipmentType]);
      return newEquipmentType;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '설비 종류 생성 실패';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateEquipmentType = useCallback(async (data: UpdateEquipmentTypeRequest) => {
    try {
      setError(null);
      const updatedEquipmentType = await settingsService.updateEquipmentType(data);
      setEquipmentTypes(prev =>
        prev.map(item => item.id === data.id ? updatedEquipmentType : item)
      );
      return updatedEquipmentType;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '설비 종류 수정 실패';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteEquipmentType = useCallback(async (id: string) => {
    try {
      setError(null);
      await settingsService.deleteEquipmentType(id);
      setEquipmentTypes(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '설비 종류 삭제 실패';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const toggleEquipmentTypeActive = useCallback(async (id: string) => {
    try {
      setError(null);
      const updatedEquipmentType = await settingsService.toggleEquipmentTypeActive(id);
      setEquipmentTypes(prev =>
        prev.map(item => item.id === id ? updatedEquipmentType : item)
      );
      return updatedEquipmentType;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '설비 종류 상태 변경 실패';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const reorderEquipmentTypes = useCallback(async (items: Array<{ id: string; display_order: number }>) => {
    try {
      setError(null);
      await settingsService.reorderEquipmentTypes(items);
      await fetchEquipmentTypes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '설비 종류 순서 변경 실패';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchEquipmentTypes]);

  useEffect(() => {
    fetchEquipmentTypes();
  }, [fetchEquipmentTypes]);

  return {
    equipmentTypes,
    loading,
    error,
    refetch: fetchEquipmentTypes,
    createEquipmentType,
    updateEquipmentType,
    deleteEquipmentType,
    toggleEquipmentTypeActive,
    reorderEquipmentTypes,
  };
};

export const useEquipmentStatuses = (options?: SettingsListOptions) => {
  const [equipmentStatuses, setEquipmentStatuses] = useState<EquipmentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableColors, setAvailableColors] = useState<string[]>([]);

  const fetchEquipmentStatuses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, colors] = await Promise.all([
        settingsService.getEquipmentStatuses(options),
        settingsService.getAvailableStatusColors(),
      ]);
      setEquipmentStatuses(data);
      setAvailableColors(colors);
    } catch (err) {
      setError(err instanceof Error ? err.message : '설비 상태 조회 실패');
    } finally {
      setLoading(false);
    }
  }, [options]);

  const createEquipmentStatus = useCallback(async (data: CreateEquipmentStatusRequest) => {
    try {
      setError(null);
      const newEquipmentStatus = await settingsService.createEquipmentStatus(data);
      setEquipmentStatuses(prev => [...prev, newEquipmentStatus]);
      // 사용 가능한 색상 업데이트
      const colors = await settingsService.getAvailableStatusColors();
      setAvailableColors(colors);
      return newEquipmentStatus;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '설비 상태 생성 실패';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateEquipmentStatus = useCallback(async (data: UpdateEquipmentStatusRequest) => {
    try {
      setError(null);
      const updatedEquipmentStatus = await settingsService.updateEquipmentStatus(data);
      setEquipmentStatuses(prev =>
        prev.map(item => item.id === data.id ? updatedEquipmentStatus : item)
      );
      return updatedEquipmentStatus;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '설비 상태 수정 실패';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteEquipmentStatus = useCallback(async (id: string) => {
    try {
      setError(null);
      await settingsService.deleteEquipmentStatus(id);
      setEquipmentStatuses(prev => prev.filter(item => item.id !== id));
      // 사용 가능한 색상 업데이트
      const colors = await settingsService.getAvailableStatusColors();
      setAvailableColors(colors);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '설비 상태 삭제 실패';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const toggleEquipmentStatusActive = useCallback(async (id: string) => {
    try {
      setError(null);
      const updatedEquipmentStatus = await settingsService.toggleEquipmentStatusActive(id);
      setEquipmentStatuses(prev =>
        prev.map(item => item.id === id ? updatedEquipmentStatus : item)
      );
      return updatedEquipmentStatus;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '설비 상태 변경 실패';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const reorderEquipmentStatuses = useCallback(async (items: Array<{ id: string; display_order: number }>) => {
    try {
      setError(null);
      await settingsService.reorderEquipmentStatuses(items);
      await fetchEquipmentStatuses();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '설비 상태 순서 변경 실패';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchEquipmentStatuses]);

  useEffect(() => {
    fetchEquipmentStatuses();
  }, [fetchEquipmentStatuses]);

  return {
    equipmentStatuses,
    availableColors,
    loading,
    error,
    refetch: fetchEquipmentStatuses,
    createEquipmentStatus,
    updateEquipmentStatus,
    deleteEquipmentStatus,
    toggleEquipmentStatusActive,
    reorderEquipmentStatuses,
  };
};

export const useBreakdownCategories = (options?: SettingsListOptions) => {
  const [mainCategories, setMainCategories] = useState<BreakdownMainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<BreakdownSubCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [mainData, subData] = await Promise.all([
        settingsService.getBreakdownMainCategories(options),
        settingsService.getBreakdownSubCategories(options),
      ]);
      setMainCategories(mainData);
      setSubCategories(subData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '고장 분류 조회 실패');
    } finally {
      setLoading(false);
    }
  }, [options]);

  // 대분류 관련 함수들
  const createMainCategory = useCallback(async (data: CreateBreakdownMainCategoryRequest) => {
    try {
      setError(null);
      const newMainCategory = await settingsService.createBreakdownMainCategory(data);
      setMainCategories(prev => [...prev, newMainCategory]);
      return newMainCategory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '고장 대분류 생성 실패';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateMainCategory = useCallback(async (data: UpdateBreakdownMainCategoryRequest) => {
    try {
      setError(null);
      const updatedMainCategory = await settingsService.updateBreakdownMainCategory(data);
      setMainCategories(prev =>
        prev.map(item => item.id === data.id ? updatedMainCategory : item)
      );
      return updatedMainCategory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '고장 대분류 수정 실패';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteMainCategory = useCallback(async (id: string) => {
    try {
      setError(null);
      await settingsService.deleteBreakdownMainCategory(id);
      setMainCategories(prev => prev.filter(item => item.id !== id));
      // 해당 대분류의 소분류들도 제거
      setSubCategories(prev => prev.filter(item => item.main_category_id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '고장 대분류 삭제 실패';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // 소분류 관련 함수들
  const createSubCategory = useCallback(async (data: CreateBreakdownSubCategoryRequest) => {
    try {
      setError(null);
      const newSubCategory = await settingsService.createBreakdownSubCategory(data);
      setSubCategories(prev => [...prev, newSubCategory]);
      return newSubCategory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '고장 소분류 생성 실패';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateSubCategory = useCallback(async (data: UpdateBreakdownSubCategoryRequest) => {
    try {
      setError(null);
      const updatedSubCategory = await settingsService.updateBreakdownSubCategory(data);
      setSubCategories(prev =>
        prev.map(item => item.id === data.id ? updatedSubCategory : item)
      );
      return updatedSubCategory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '고장 소분류 수정 실패';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteSubCategory = useCallback(async (id: string) => {
    try {
      setError(null);
      await settingsService.deleteBreakdownSubCategory(id);
      setSubCategories(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '고장 소분류 삭제 실패';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const getSubCategoriesByMainCategory = useCallback((mainCategoryId: string) => {
    return subCategories.filter(sub => sub.main_category_id === mainCategoryId);
  }, [subCategories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    mainCategories,
    subCategories,
    loading,
    error,
    refetch: fetchCategories,
    createMainCategory,
    updateMainCategory,
    deleteMainCategory,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory,
    getSubCategoriesByMainCategory,
  };
};

export const useSettingsStats = () => {
  const [stats, setStats] = useState<SettingsStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsService.getSettingsStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '설정 통계 조회 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};