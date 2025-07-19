// useEquipment 훅 구현
// 단일 설비 관리를 위한 React 훅

'use client';

import { useState, useEffect, useCallback } from 'react';
import { equipmentService } from '../services/EquipmentService';
import type { 
  Equipment, 
  CreateEquipmentRequest, 
  UpdateEquipmentRequest,
  EquipmentServiceError,
  EquipmentStatus
} from '../types';

/**
 * useEquipment 훅 인터페이스
 */
export interface UseEquipmentResult {
  equipment: Equipment | null;
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  fetchEquipment: (id: string) => Promise<void>;
  fetchEquipmentByNumber: (equipmentNumber: string) => Promise<void>;
  createEquipment: (data: CreateEquipmentRequest) => Promise<Equipment | null>;
  updateEquipment: (id: string, data: UpdateEquipmentRequest) => Promise<Equipment | null>;
  deleteEquipment: (id: string) => Promise<boolean>;
  updateStatus: (id: string, status: EquipmentStatus) => Promise<Equipment | null>;
  clearError: () => void;
  reset: () => void;
}

/**
 * 단일 설비 관리 훅
 * - 설비 CRUD 작업 관리
 * - 로딩 상태 및 에러 처리
 * - 최적화된 상태 관리
 */
export const useEquipment = (): UseEquipmentResult => {
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /**
   * 에러 처리 헬퍼
   */
  const handleError = useCallback((error: any, defaultMessage: string) => {
    console.error('Equipment operation error:', error);
    
    if (error?.code) {
      switch (error.code) {
        case 'EQUIPMENT_NOT_FOUND':
          setError('설비를 찾을 수 없습니다.');
          break;
        case 'DUPLICATE_EQUIPMENT_NUMBER':
          setError('이미 존재하는 설비 번호입니다.');
          break;
        case 'VALIDATION_FAILED':
          setError('입력 데이터가 유효하지 않습니다.');
          break;
        default:
          setError(error.message || defaultMessage);
      }
    } else {
      setError(error?.message || defaultMessage);
    }
  }, []);

  /**
   * ID로 설비 조회
   */
  const fetchEquipment = useCallback(async (id: string) => {
    if (!id) {
      setError('유효하지 않은 설비 ID입니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await equipmentService.getEquipmentById(id);
      setEquipment(result);
    } catch (error) {
      handleError(error, '설비 조회에 실패했습니다.');
      setEquipment(null);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  /**
   * 설비 번호로 설비 조회
   */
  const fetchEquipmentByNumber = useCallback(async (equipmentNumber: string) => {
    if (!equipmentNumber) {
      setError('유효하지 않은 설비 번호입니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await equipmentService.getEquipmentByNumber(equipmentNumber);
      setEquipment(result);
    } catch (error) {
      handleError(error, '설비 조회에 실패했습니다.');
      setEquipment(null);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  /**
   * 설비 생성
   */
  const createEquipment = useCallback(async (data: CreateEquipmentRequest): Promise<Equipment | null> => {
    setCreating(true);
    setError(null);

    try {
      const result = await equipmentService.createEquipment(data);
      setEquipment(result);
      return result;
    } catch (error) {
      handleError(error, '설비 생성에 실패했습니다.');
      return null;
    } finally {
      setCreating(false);
    }
  }, [handleError]);

  /**
   * 설비 업데이트
   */
  const updateEquipment = useCallback(async (id: string, data: UpdateEquipmentRequest): Promise<Equipment | null> => {
    if (!id) {
      setError('유효하지 않은 설비 ID입니다.');
      return null;
    }

    setUpdating(true);
    setError(null);

    try {
      const result = await equipmentService.updateEquipment(id, data);
      setEquipment(result);
      return result;
    } catch (error) {
      handleError(error, '설비 업데이트에 실패했습니다.');
      return null;
    } finally {
      setUpdating(false);
    }
  }, [handleError]);

  /**
   * 설비 삭제
   */
  const deleteEquipment = useCallback(async (id: string): Promise<boolean> => {
    if (!id) {
      setError('유효하지 않은 설비 ID입니다.');
      return false;
    }

    setDeleting(true);
    setError(null);

    try {
      await equipmentService.deleteEquipment(id);
      setEquipment(null);
      return true;
    } catch (error) {
      handleError(error, '설비 삭제에 실패했습니다.');
      return false;
    } finally {
      setDeleting(false);
    }
  }, [handleError]);

  /**
   * 설비 상태 업데이트
   */
  const updateStatus = useCallback(async (id: string, status: EquipmentStatus): Promise<Equipment | null> => {
    if (!id) {
      setError('유효하지 않은 설비 ID입니다.');
      return null;
    }

    setUpdating(true);
    setError(null);

    try {
      const result = await equipmentService.updateEquipmentStatus(id, status);
      setEquipment(result);
      return result;
    } catch (error) {
      handleError(error, '설비 상태 업데이트에 실패했습니다.');
      return null;
    } finally {
      setUpdating(false);
    }
  }, [handleError]);

  /**
   * 에러 초기화
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    setEquipment(null);
    setLoading(false);
    setError(null);
    setCreating(false);
    setUpdating(false);
    setDeleting(false);
  }, []);

  return {
    equipment,
    loading,
    error,
    creating,
    updating,
    deleting,
    fetchEquipment,
    fetchEquipmentByNumber,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    updateStatus,
    clearError,
    reset
  };
};