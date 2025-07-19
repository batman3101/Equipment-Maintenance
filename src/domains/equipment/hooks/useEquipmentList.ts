// useEquipmentList 훅 구현
// 설비 목록 관리를 위한 React 훅

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { equipmentService } from '../services/EquipmentService';
import type { 
  Equipment, 
  EquipmentFilter,
  EquipmentSort,
  EquipmentListOptions,
  EquipmentListResponse,
  EquipmentStats
} from '../types';

/**
 * useEquipmentList 훅 인터페이스
 */
export interface UseEquipmentListResult {
  equipment: Equipment[];
  stats: EquipmentStats | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  page: number;
  filter: EquipmentFilter;
  sort: EquipmentSort;
  fetchEquipment: (options?: EquipmentListOptions) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  setFilter: (filter: EquipmentFilter) => void;
  setSort: (sort: EquipmentSort) => void;
  searchEquipment: (query: string) => Promise<Equipment[]>;
  clearError: () => void;
  reset: () => void;
}

/**
 * 기본 정렬 옵션
 */
const DEFAULT_SORT: EquipmentSort = {
  field: 'created_at',
  direction: 'desc'
};

/**
 * 설비 목록 관리 훅
 * - 페이지네이션 지원
 * - 필터링 및 정렬 기능
 * - 검색 기능
 * - 통계 정보 제공
 */
export const useEquipmentList = (initialOptions?: EquipmentListOptions): UseEquipmentListResult => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [stats, setStats] = useState<EquipmentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilterState] = useState<EquipmentFilter>(initialOptions?.filter || {});
  const [sort, setSortState] = useState<EquipmentSort>(initialOptions?.sort || DEFAULT_SORT);

  /**
   * 현재 옵션 메모이제이션
   */
  const currentOptions = useMemo((): EquipmentListOptions => ({
    filter,
    sort,
    page,
    limit: 20
  }), [filter, sort, page]);

  /**
   * 에러 처리 헬퍼
   */
  const handleError = useCallback((error: any, defaultMessage: string) => {
    console.error('Equipment list operation error:', error);
    setError(error?.message || defaultMessage);
  }, []);

  /**
   * 설비 목록 조회
   */
  const fetchEquipment = useCallback(async (options?: EquipmentListOptions) => {
    setLoading(true);
    setError(null);

    try {
      const fetchOptions = options || currentOptions;
      const result = await equipmentService.getEquipmentList(fetchOptions);
      
      if (fetchOptions.page === 1) {
        // 첫 페이지인 경우 기존 데이터 교체
        setEquipment(result.data);
      } else {
        // 추가 페이지인 경우 기존 데이터에 추가
        setEquipment(prev => [...prev, ...result.data]);
      }
      
      setHasMore(result.hasMore);
      setTotal(result.total);
      setPage(result.page);
    } catch (error) {
      handleError(error, '설비 목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentOptions, handleError]);

  /**
   * 더 많은 데이터 로드 (무한 스크롤)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;

    const nextPage = page + 1;
    const options: EquipmentListOptions = {
      ...currentOptions,
      page: nextPage
    };

    await fetchEquipment(options);
  }, [hasMore, loading, page, currentOptions, fetchEquipment]);

  /**
   * 데이터 새로고침
   */
  const refresh = useCallback(async () => {
    const options: EquipmentListOptions = {
      ...currentOptions,
      page: 1
    };
    
    setPage(1);
    await fetchEquipment(options);
  }, [currentOptions, fetchEquipment]);

  /**
   * 필터 설정
   */
  const setFilter = useCallback((newFilter: EquipmentFilter) => {
    setFilterState(newFilter);
    setPage(1);
  }, []);

  /**
   * 정렬 설정
   */
  const setSort = useCallback((newSort: EquipmentSort) => {
    setSortState(newSort);
    setPage(1);
  }, []);

  /**
   * 설비 검색
   */
  const searchEquipment = useCallback(async (query: string): Promise<Equipment[]> => {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      return await equipmentService.searchEquipment(query.trim());
    } catch (error) {
      handleError(error, '설비 검색에 실패했습니다.');
      return [];
    }
  }, [handleError]);

  /**
   * 통계 정보 조회
   */
  const fetchStats = useCallback(async () => {
    try {
      const result = await equipmentService.getEquipmentStats();
      setStats(result);
    } catch (error) {
      console.error('Equipment stats fetch error:', error);
      // 통계 조회 실패는 전체 에러로 처리하지 않음
    }
  }, []);

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
    setEquipment([]);
    setStats(null);
    setLoading(false);
    setError(null);
    setHasMore(false);
    setTotal(0);
    setPage(1);
    setFilterState({});
    setSortState(DEFAULT_SORT);
  }, []);

  /**
   * 필터나 정렬이 변경될 때 데이터 새로고침
   */
  useEffect(() => {
    const options: EquipmentListOptions = {
      filter,
      sort,
      page: 1,
      limit: 20
    };
    
    fetchEquipment(options);
  }, [filter, sort]); // fetchEquipment은 의존성에서 제외 (무한 루프 방지)

  /**
   * 컴포넌트 마운트 시 통계 정보 조회
   */
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    equipment,
    stats,
    loading,
    error,
    hasMore,
    total,
    page,
    filter,
    sort,
    fetchEquipment,
    loadMore,
    refresh,
    setFilter,
    setSort,
    searchEquipment,
    clearError,
    reset
  };
};