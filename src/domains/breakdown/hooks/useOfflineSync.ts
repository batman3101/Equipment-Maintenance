import { useState, useEffect, useCallback } from 'react';
import { breakdownService } from '../services/BreakdownService';
import type { CreateBreakdownRequest } from '../types';

interface OfflineBreakdown {
  id: string;
  request: CreateBreakdownRequest;
  timestamp: number;
  synced: boolean;
}

interface UseOfflineSyncReturn {
  isOnline: boolean;
  pendingCount: number;
  syncPending: () => Promise<void>;
  saveOffline: (request: CreateBreakdownRequest) => Promise<string>;
  clearSynced: () => void;
  getPendingBreakdowns: () => OfflineBreakdown[];
}

/**
 * 오프라인 동기화 관리를 위한 커스텀 훅
 */
export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  // 온라인 상태 감지
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 대기 중인 고장 등록 개수 업데이트
  const updatePendingCount = useCallback(() => {
    const pending = getPendingBreakdowns();
    setPendingCount(pending.filter(item => !item.synced).length);
  }, []);

  // 컴포넌트 마운트 시 대기 중인 항목 개수 확인
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  // 온라인 상태가 되면 자동 동기화
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncPending().catch(console.error);
    }
  }, [isOnline, pendingCount]);

  // 오프라인 고장 등록 저장
  const saveOffline = useCallback(async (request: CreateBreakdownRequest): Promise<string> => {
    const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const offlineBreakdown: OfflineBreakdown = {
      id: offlineId,
      request,
      timestamp: Date.now(),
      synced: false
    };

    try {
      const existingData = localStorage.getItem('offline_breakdowns');
      const offlineBreakdowns: OfflineBreakdown[] = existingData ? JSON.parse(existingData) : [];
      
      offlineBreakdowns.push(offlineBreakdown);
      localStorage.setItem('offline_breakdowns', JSON.stringify(offlineBreakdowns));
      
      updatePendingCount();
      return offlineId;
    } catch (error) {
      throw new Error('오프라인 데이터 저장 실패');
    }
  }, [updatePendingCount]);

  // 대기 중인 고장 등록 동기화
  const syncPending = useCallback(async (): Promise<void> => {
    if (!isOnline) {
      throw new Error('오프라인 상태에서는 동기화할 수 없습니다.');
    }

    const pending = getPendingBreakdowns().filter(item => !item.synced);
    if (pending.length === 0) return;

    const results = await Promise.allSettled(
      pending.map(async (item) => {
        try {
          const breakdown = await breakdownService.createBreakdown(item.request);
          
          // 동기화 완료 표시
          markAsSynced(item.id);
          
          return { success: true, id: item.id, breakdownId: breakdown.id };
        } catch (error) {
          console.error(`고장 등록 동기화 실패 (${item.id}):`, error);
          return { success: false, id: item.id, error };
        }
      })
    );

    // 성공한 항목들 정리
    const successCount = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;

    if (successCount > 0) {
      updatePendingCount();
    }

    // 실패한 항목이 있으면 에러 발생
    const failedCount = results.length - successCount;
    if (failedCount > 0) {
      throw new Error(`${failedCount}개의 고장 등록 동기화에 실패했습니다.`);
    }
  }, [isOnline, updatePendingCount]);

  // 동기화 완료 표시
  const markAsSynced = (offlineId: string) => {
    try {
      const existingData = localStorage.getItem('offline_breakdowns');
      if (!existingData) return;

      const offlineBreakdowns: OfflineBreakdown[] = JSON.parse(existingData);
      const updatedBreakdowns = offlineBreakdowns.map(item =>
        item.id === offlineId ? { ...item, synced: true } : item
      );

      localStorage.setItem('offline_breakdowns', JSON.stringify(updatedBreakdowns));
    } catch (error) {
      console.error('동기화 상태 업데이트 실패:', error);
    }
  };

  // 동기화된 항목들 정리
  const clearSynced = useCallback(() => {
    try {
      const existingData = localStorage.getItem('offline_breakdowns');
      if (!existingData) return;

      const offlineBreakdowns: OfflineBreakdown[] = JSON.parse(existingData);
      const pendingBreakdowns = offlineBreakdowns.filter(item => !item.synced);

      localStorage.setItem('offline_breakdowns', JSON.stringify(pendingBreakdowns));
      updatePendingCount();
    } catch (error) {
      console.error('동기화된 항목 정리 실패:', error);
    }
  }, [updatePendingCount]);

  // 대기 중인 고장 등록 목록 조회
  const getPendingBreakdowns = useCallback((): OfflineBreakdown[] => {
    try {
      const existingData = localStorage.getItem('offline_breakdowns');
      return existingData ? JSON.parse(existingData) : [];
    } catch (error) {
      console.error('오프라인 데이터 조회 실패:', error);
      return [];
    }
  }, []);

  return {
    isOnline,
    pendingCount,
    syncPending,
    saveOffline,
    clearSynced,
    getPendingBreakdowns
  };
}