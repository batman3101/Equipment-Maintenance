import { useState, useEffect, useCallback } from 'react';
import { breakdownService } from '../services/BreakdownService';
import type { Breakdown, CreateBreakdownRequest, UpdateBreakdownRequest } from '../types';

interface UseBreakdownOptions {
  id?: string;
  autoFetch?: boolean;
}

interface UseBreakdownReturn {
  breakdown: Breakdown | null;
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: boolean;
  fetchBreakdown: (id: string) => Promise<void>;
  createBreakdown: (request: CreateBreakdownRequest) => Promise<Breakdown>;
  updateBreakdown: (request: UpdateBreakdownRequest) => Promise<Breakdown>;
  deleteBreakdown: (id: string) => Promise<void>;
  updateStatus: (id: string, status: Breakdown['status']) => Promise<void>;
  clearError: () => void;
}

/**
 * 개별 고장 관리를 위한 커스텀 훅
 */
export function useBreakdown(options: UseBreakdownOptions = {}): UseBreakdownReturn {
  const { id, autoFetch = true } = options;

  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchBreakdown = useCallback(async (breakdownId: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await breakdownService.getBreakdown(breakdownId);
      setBreakdown(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '고장 정보 조회 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('고장 정보 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBreakdown = useCallback(async (request: CreateBreakdownRequest): Promise<Breakdown> => {
    try {
      setCreating(true);
      setError(null);

      const newBreakdown = await breakdownService.createBreakdown(request);
      setBreakdown(newBreakdown);
      
      return newBreakdown;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '고장 등록 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('고장 등록 오류:', err);
      throw err;
    } finally {
      setCreating(false);
    }
  }, []);

  const updateBreakdown = useCallback(async (request: UpdateBreakdownRequest): Promise<Breakdown> => {
    try {
      setUpdating(true);
      setError(null);

      const updatedBreakdown = await breakdownService.updateBreakdown(request);
      setBreakdown(updatedBreakdown);
      
      return updatedBreakdown;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '고장 정보 수정 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('고장 정보 수정 오류:', err);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  const deleteBreakdown = useCallback(async (breakdownId: string): Promise<void> => {
    try {
      setUpdating(true);
      setError(null);

      await breakdownService.deleteBreakdown(breakdownId);
      setBreakdown(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '고장 삭제 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('고장 삭제 오류:', err);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  const updateStatus = useCallback(async (breakdownId: string, status: Breakdown['status']): Promise<void> => {
    try {
      setUpdating(true);
      setError(null);

      await breakdownService.updateBreakdownStatus(breakdownId, status);
      
      // 로컬 상태 업데이트
      if (breakdown && breakdown.id === breakdownId) {
        setBreakdown(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '고장 상태 변경 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('고장 상태 변경 오류:', err);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [breakdown]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ID가 제공되고 autoFetch가 true인 경우 자동으로 데이터 로드
  useEffect(() => {
    if (id && autoFetch) {
      fetchBreakdown(id);
    }
  }, [id, autoFetch, fetchBreakdown]);

  return {
    breakdown,
    loading,
    error,
    creating,
    updating,
    fetchBreakdown,
    createBreakdown,
    updateBreakdown,
    deleteBreakdown,
    updateStatus,
    clearError
  };
}