import { useState, useEffect, useCallback } from 'react';
import { breakdownService } from '../services/BreakdownService';
import type { Breakdown, BreakdownFilter, BreakdownListResponse } from '../types';

interface UseBreakdownListOptions {
  filter?: BreakdownFilter;
  page?: number;
  limit?: number;
  autoFetch?: boolean;
}

interface UseBreakdownListReturn {
  breakdowns: Breakdown[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  fetchBreakdowns: () => Promise<void>;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  updateFilter: (newFilter: BreakdownFilter) => void;
}

/**
 * 고장 목록 관리를 위한 커스텀 훅
 */
export function useBreakdownList(options: UseBreakdownListOptions = {}): UseBreakdownListReturn {
  const {
    filter: initialFilter = {},
    page: initialPage = 1,
    limit: initialLimit = 20,
    autoFetch = true
  } = options;

  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [filter, setFilter] = useState<BreakdownFilter>(initialFilter);

  const fetchBreakdowns = useCallback(async (resetData = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentPage = resetData ? 1 : page;
      const response: BreakdownListResponse = await breakdownService.getBreakdowns(
        filter,
        currentPage,
        limit
      );

      if (resetData) {
        setBreakdowns(response.data);
        setPage(1);
      } else {
        setBreakdowns(prev => 
          currentPage === 1 ? response.data : [...prev, ...response.data]
        );
      }

      setTotal(response.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '고장 목록 조회 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('고장 목록 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, page, limit]);

  const refetch = useCallback(async () => {
    await fetchBreakdowns(true);
  }, [fetchBreakdowns]);

  const loadMore = useCallback(async () => {
    if (loading || breakdowns.length >= total) return;
    
    setPage(prev => prev + 1);
  }, [loading, breakdowns.length, total]);

  const updateFilter = useCallback((newFilter: BreakdownFilter) => {
    setFilter(newFilter);
    setPage(1);
  }, []);

  // 페이지가 변경되면 데이터 로드
  useEffect(() => {
    if (page > 1) {
      fetchBreakdowns(false);
    }
  }, [page, fetchBreakdowns]);

  // 필터가 변경되면 데이터 리셋 후 로드
  useEffect(() => {
    if (page === 1) {
      fetchBreakdowns(true);
    }
  }, [filter, fetchBreakdowns, page]);

  // 초기 데이터 로드
  useEffect(() => {
    if (autoFetch) {
      fetchBreakdowns(true);
    }
  }, [autoFetch, fetchBreakdowns]);

  const hasMore = breakdowns.length < total;

  return {
    breakdowns,
    loading,
    error,
    total,
    page,
    limit,
    hasMore,
    fetchBreakdowns: () => fetchBreakdowns(true),
    refetch,
    loadMore,
    updateFilter
  };
}