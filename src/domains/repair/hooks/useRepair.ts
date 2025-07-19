import { useState, useEffect, useCallback } from 'react';
import { repairService } from '../services/RepairService';
import type { Repair, CreateRepairRequest, UpdateRepairRequest } from '../types';

interface UseRepairOptions {
  id?: string;
  autoFetch?: boolean;
}

interface UseRepairReturn {
  repair: Repair | null;
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: boolean;
  fetchRepair: (id: string) => Promise<void>;
  createRepair: (request: CreateRepairRequest) => Promise<Repair>;
  updateRepair: (id: string, request: UpdateRepairRequest) => Promise<Repair>;
  deleteRepair: (id: string) => Promise<void>;
  clearError: () => void;
}

/**
 * 개별 수리 기록 관리를 위한 커스텀 훅
 */
export function useRepair(options: UseRepairOptions = {}): UseRepairReturn {
  const { id, autoFetch = true } = options;

  const [repair, setRepair] = useState<Repair | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchRepair = useCallback(async (repairId: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await repairService.getRepair(repairId);
      setRepair(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '수리 기록 조회 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('수리 기록 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createRepair = useCallback(async (request: CreateRepairRequest): Promise<Repair> => {
    try {
      setCreating(true);
      setError(null);

      const newRepair = await repairService.createRepair(request);
      setRepair(newRepair);
      
      return newRepair;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '수리 기록 생성 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('수리 기록 생성 오류:', err);
      throw err;
    } finally {
      setCreating(false);
    }
  }, []);

  const updateRepair = useCallback(async (repairId: string, request: UpdateRepairRequest): Promise<Repair> => {
    try {
      setUpdating(true);
      setError(null);

      const updatedRepair = await repairService.updateRepair(repairId, request);
      setRepair(updatedRepair);
      
      return updatedRepair;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '수리 기록 수정 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('수리 기록 수정 오류:', err);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  const deleteRepair = useCallback(async (repairId: string): Promise<void> => {
    try {
      setUpdating(true);
      setError(null);

      await repairService.deleteRepair(repairId);
      setRepair(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '수리 기록 삭제 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('수리 기록 삭제 오류:', err);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ID가 제공되고 autoFetch가 true인 경우 자동으로 데이터 로드
  useEffect(() => {
    if (id && autoFetch) {
      fetchRepair(id);
    }
  }, [id, autoFetch, fetchRepair]);

  return {
    repair,
    loading,
    error,
    creating,
    updating,
    fetchRepair,
    createRepair,
    updateRepair,
    deleteRepair,
    clearError
  };
}