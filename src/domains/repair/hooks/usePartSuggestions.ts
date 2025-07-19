import { useState, useCallback, useRef } from 'react';
import { repairService } from '../services/RepairService';
import type { PartSuggestion } from '../types';

interface UsePartSuggestionsReturn {
  suggestions: PartSuggestion[];
  loading: boolean;
  error: string | null;
  searchParts: (query: string) => Promise<PartSuggestion[]>;
  clearSuggestions: () => void;
  clearError: () => void;
}

/**
 * 부품 자동완성 제안을 위한 커스텀 훅
 */
export function usePartSuggestions(): UsePartSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<PartSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const searchParts = useCallback(async (query: string): Promise<PartSuggestion[]> => {
    // 이전 검색 요청 취소
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // 빈 쿼리인 경우 빈 배열 반환
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      // 디바운스 적용
      return new Promise((resolve, reject) => {
        searchTimeoutRef.current = setTimeout(async () => {
          try {
            const results = await repairService.getPartSuggestions(query.trim());
            setSuggestions(results);
            resolve(results);
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '부품 검색 중 오류가 발생했습니다.';
            setError(errorMessage);
            console.error('부품 검색 오류:', err);
            reject(err);
          } finally {
            setLoading(false);
          }
        }, 300); // 300ms 디바운스
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '부품 검색 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('부품 검색 오류:', err);
      setLoading(false);
      throw err;
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    suggestions,
    loading,
    error,
    searchParts,
    clearSuggestions,
    clearError
  };
}