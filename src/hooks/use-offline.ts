'use client';

import { useState, useEffect, useCallback } from 'react';
import { offlineStorage, type OfflineData } from '@/lib/offline-storage';
import { syncManager, type SyncStatus, type SyncResult } from '@/lib/sync-manager';
import { sendMessageToServiceWorker, registerBackgroundSync } from '@/lib/service-worker';

export interface OfflineState {
  isOnline: boolean;
  isInitialized: boolean;
  syncStatus: SyncStatus;
  storageStats: {
    offlineDataCount: number;
    syncQueueCount: number;
    cacheCount: number;
  };
}

export function useOffline() {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isInitialized: false,
    syncStatus: {
      isRunning: false,
      lastSyncTime: null,
      pendingCount: 0,
      failedCount: 0
    },
    storageStats: {
      offlineDataCount: 0,
      syncQueueCount: 0,
      cacheCount: 0
    }
  });

  // 상태 업데이트
  const updateStatus = useCallback(async () => {
    try {
      const [syncStatus, storageStats] = await Promise.all([
        syncManager.getSyncStatus(),
        offlineStorage.getStorageStats()
      ]);

      setState(prev => ({
        ...prev,
        syncStatus,
        storageStats
      }));
    } catch (error) {
      console.error('상태 업데이트 실패:', error);
    }
  }, []);

  // 초기화
  useEffect(() => {
    const initialize = async () => {
      try {
        await offlineStorage.init();
        
        // 자동 동기화 시작
        syncManager.startAutoSync(30000); // 30초마다
        
        // 백그라운드 동기화 등록 (Service Worker)
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          try {
            await registerBackgroundSync('background-sync');
            console.log('백그라운드 동기화 등록 완료');
          } catch (error) {
            console.error('백그라운드 동기화 등록 실패:', error);
          }
        }
        
        // 초기 상태 업데이트
        await updateStatus();
        
        setState(prev => ({ ...prev, isInitialized: true }));
        console.log('오프라인 기능 초기화 완료');
      } catch (error) {
        console.error('오프라인 기능 초기화 실패:', error);
        // 초기화 실패해도 앱이 동작하도록 설정
        setState(prev => ({ ...prev, isInitialized: true }));
      }
    };

    // 브라우저 환경에서만 초기화
    if (typeof window !== 'undefined') {
      initialize();
    }

    // 정리 함수
    return () => {
      if (typeof window !== 'undefined') {
        syncManager.cleanup();
      }
    };
  }, []);

  // 네트워크 상태 모니터링 및 Service Worker 메시지 처리
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      updateStatus();
      
      // 온라인 복구 시 백그라운드 동기화 등록
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        registerBackgroundSync('background-sync').catch(error => {
          console.error('백그라운드 동기화 등록 실패:', error);
        });
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      updateStatus();
    };

    // Service Worker 메시지 처리
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type, data } = event.data || {};
      
      if (!type) return;
      
      switch (type) {
        case 'SYNC_START':
          console.log('동기화 시작:', data);
          setState(prev => ({
            ...prev,
            syncStatus: {
              ...prev.syncStatus,
              isRunning: true
            }
          }));
          break;
          
        case 'SYNC_PROGRESS':
          console.log('동기화 진행 중:', data);
          if (data?.progress) {
            setState(prev => ({
              ...prev,
              syncStatus: {
                ...prev.syncStatus,
                isRunning: true,
                progress: data.progress
              }
            }));
          }
          break;
          
        case 'SYNC_COMPLETE':
          console.log('동기화 완료:', data);
          updateStatus();
          // 동기화 완료 알림 표시
          if (data?.syncedCount > 0) {
            showNotification('동기화 완료', `${data.syncedCount}개의 데이터가 동기화되었습니다.`);
          }
          break;
          
        case 'SYNC_ERROR':
          console.error('동기화 오류:', data);
          updateStatus();
          showNotification('동기화 오류', data?.error || '일부 데이터 동기화에 실패했습니다.');
          break;
          
        case 'SYNC_ITEM_FAILED':
          console.error('항목 동기화 실패:', data);
          updateStatus();
          break;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [updateStatus]);

  // 오프라인 데이터 저장
  const saveOfflineData = useCallback(async (
    type: 'breakdown' | 'repair' | 'user' | 'equipment',
    data: any,
    action: 'create' | 'update' | 'delete'
  ): Promise<void> => {
    const id = data.id || `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await offlineStorage.saveOfflineData({
      id,
      type,
      data,
      action
    });

    await updateStatus();
    console.log('오프라인 데이터 저장됨:', { type, action, id });
  }, [updateStatus]);

  // 동기화 대기열에 추가
  const addToSyncQueue = useCallback(async (
    url: string,
    method: string,
    headers: Record<string, string>,
    body?: string,
    maxRetries: number = 3
  ): Promise<void> => {
    const id = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await offlineStorage.addToSyncQueue({
      id,
      url,
      method,
      headers,
      body,
      maxRetries
    });

    await updateStatus();
    console.log('동기화 대기열에 추가됨:', { url, method });
  }, [updateStatus]);

  // 수동 동기화
  const syncNow = useCallback(async (): Promise<SyncResult> => {
    try {
      // Service Worker에 동기화 시작 알림
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
          await sendMessageToServiceWorker({ type: 'SYNC_NOW' });
        } catch (error) {
          console.error('Service Worker 동기화 요청 실패:', error);
          // Service Worker 요청 실패 시 직접 동기화 시도
        }
      }
      
      const result = await syncManager.syncNow();
      await updateStatus();
      return result;
    } catch (error) {
      console.error('수동 동기화 실패:', error);
      throw error;
    }
  }, [updateStatus]);

  // 오프라인 데이터 조회
  const getOfflineData = useCallback(async (type?: string): Promise<OfflineData[]> => {
    return await offlineStorage.getOfflineData(type);
  }, []);

  // 캐시된 API 응답 조회
  const getCachedResponse = useCallback(async (url: string): Promise<any | null> => {
    return await offlineStorage.getCachedApiResponse(url);
  }, []);

  // API 응답 캐시
  const cacheResponse = useCallback(async (url: string, response: any, ttl?: number): Promise<void> => {
    await offlineStorage.cacheApiResponse(url, response, ttl);
  }, []);

  // 저장소 정리
  const clearStorage = useCallback(async (): Promise<void> => {
    await offlineStorage.clearAll();
    await updateStatus();
    console.log('오프라인 저장소 정리 완료');
  }, [updateStatus]);

  // 만료된 캐시 정리
  const cleanExpiredCache = useCallback(async (): Promise<void> => {
    await offlineStorage.cleanExpiredCache();
    await updateStatus();
    console.log('만료된 캐시 정리 완료');
  }, [updateStatus]);

  // 알림 표시 함수
  const showNotification = useCallback((title: string, message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    // 브라우저 알림 권한 확인 및 표시
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/icon-192x192.png'
      });
    }
    
    // 커스텀 이벤트 발생 (UI 컴포넌트에서 처리)
    window.dispatchEvent(new CustomEvent('offline-notification', {
      detail: { title, message, type }
    }));
  }, []);
  
  // 백그라운드 동기화 요청
  const requestBackgroundSync = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
      console.log('백그라운드 동기화가 지원되지 않는 브라우저입니다.');
      return false;
    }
    
    try {
      await registerBackgroundSync('background-sync');
      return true;
    } catch (error) {
      console.error('백그라운드 동기화 등록 실패:', error);
      return false;
    }
  }, []);

  return {
    // 상태
    ...state,
    
    // 액션
    saveOfflineData,
    addToSyncQueue,
    syncNow,
    getOfflineData,
    getCachedResponse,
    cacheResponse,
    clearStorage,
    cleanExpiredCache,
    updateStatus,
    requestBackgroundSync,
    showNotification
  };
}

// 오프라인 API 래퍼
export function useOfflineApi() {
  const { isOnline, addToSyncQueue, getCachedResponse, cacheResponse } = useOffline();

  const apiCall = useCallback(async (
    url: string,
    options: RequestInit = {},
    cacheOptions?: { ttl?: number; useCache?: boolean }
  ): Promise<any> => {
    const { method = 'GET', headers = {}, body } = options;
    const { ttl = 300000, useCache = true } = cacheOptions || {};

    // GET 요청이고 캐시 사용이 활성화된 경우 캐시 확인
    if (method === 'GET' && useCache) {
      const cachedResponse = await getCachedResponse(url);
      if (cachedResponse) {
        console.log('캐시된 응답 반환:', url);
        return cachedResponse;
      }
    }

    if (isOnline) {
      try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // GET 요청 응답 캐시
        if (method === 'GET' && useCache) {
          await cacheResponse(url, data, ttl);
        }

        return data;
      } catch (error) {
        console.error('API 호출 실패:', error);
        
        // GET 요청인 경우 캐시된 응답 반환 시도
        if (method === 'GET') {
          const cachedResponse = await getCachedResponse(url);
          if (cachedResponse) {
            console.log('네트워크 실패 시 캐시된 응답 반환:', url);
            return cachedResponse;
          }
        }
        
        throw error;
      }
    } else {
      // 오프라인 상태
      if (method === 'GET') {
        // GET 요청은 캐시에서 조회
        const cachedResponse = await getCachedResponse(url);
        if (cachedResponse) {
          console.log('오프라인 상태에서 캐시된 응답 반환:', url);
          return cachedResponse;
        } else {
          throw new Error('오프라인 상태이며 캐시된 데이터가 없습니다.');
        }
      } else {
        // POST, PUT, DELETE 요청은 동기화 대기열에 추가
        await addToSyncQueue(
          url,
          method,
          headers as Record<string, string>,
          body as string
        );
        
        console.log('오프라인 상태에서 동기화 대기열에 추가:', { url, method });
        
        // 임시 응답 반환
        return {
          success: true,
          message: '오프라인 상태입니다. 온라인 복구 시 자동으로 동기화됩니다.',
          queued: true
        };
      }
    }
  }, [isOnline, addToSyncQueue, getCachedResponse, cacheResponse]);

  return { apiCall };
}