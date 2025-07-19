import { useState, useEffect, useCallback } from 'react';
import { repairService } from '../services/RepairService';
import type { Repair, RepairFilters, RepairListResponse } from '../types';

interface UseRepairListOptions {
  initialFilters?: RepairFilters;
  initialPage?: number;
  initialLimit?: number;
  autoFetch?: boolean;
}

interface UseRepairListReturn {
  repairs: Repair[];
  loading: boolean;
  error: string | null;
  filters: RepairFilters;
  pagination: {
    page: number;
    limit: number;
    total_pages: number;
    count: number;
  };
  fetchRepairs: () => Promise<void>;
  setFilters: (filters: RepairFilters) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  refreshRepairs: () => Promise<void>;
  clearError: () => void;
}

/**
 * 수리 기록 목록 관리를 위한 커스텀 훅
 */
export function useRepairList(options: UseRepairListOptions = {}): UseRepairListReturn {
  const {
    initialFilters = {},
    initialPage = 1,
    initialLimit = 20,
    autoFetch = true
  } = options;

  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<RepairFilters>(initialFilters);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total_pages: 0,
    count: 0
  });

  const fetchRepairs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response: RepairListResponse = await repairService.getRepairList(
        filters,
        pagination.page,
        pagination.limit
      );

      setRepairs(response.data);
      setPagination(prev => ({
        ...prev,
        total_pages: response.total_pages,
        count: response.count
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '수리 기록 목록 조회 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('수리 기록 목록 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  const setFilters = useCallback((newFilters: RepairFilters) => {
    setFiltersState(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // 필터 변경 시 첫 페이지로 이동
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 })); // 페이지 크기 변경 시 첫 페이지로 이동
  }, []);

  const refreshRepairs = useCallback(async () => {
    await fetchRepairs();
  }, [fetchRepairs]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 필터나 페이지네이션이 변경될 때 자동으로 데이터 로드
  useEffect(() => {
    if (autoFetch) {
      fetchRepairs();
    }
  }, [fetchRepairs, autoFetch]);

  return {
    repairs,
    loading,
    error,
    filters,
    pagination,
    fetchRepairs,
    setFilters,
    setPage,
    setLimit,
    refreshRepairs,
    clearError
  };
}