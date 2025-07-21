// 오프라인 데이터 동기화 매니저

import { offlineStorage, type SyncQueueItem, type OfflineData } from './offline-storage';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

export interface SyncStatus {
  isRunning: boolean;
  lastSyncTime: number | null;
  pendingCount: number;
  failedCount: number;
}

class SyncManager {
  private isRunning = false;
  private lastSyncTime: number | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;

  // 자동 동기화 시작
  startAutoSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      this.stopAutoSync();
    }

    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isRunning) {
        this.syncPendingData();
      }
    }, intervalMs);

    console.log('자동 동기화 시작됨 (간격:', intervalMs, 'ms)');
  }

  // 자동 동기화 중지
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('자동 동기화 중지됨');
    }
  }

  // 수동 동기화 실행
  async syncNow(): Promise<SyncResult> {
    if (this.isRunning) {
      throw new Error('동기화가 이미 실행 중입니다.');
    }

    if (!navigator.onLine) {
      throw new Error('오프라인 상태에서는 동기화할 수 없습니다.');
    }

    return await this.syncPendingData();
  }

  // 대기 중인 데이터 동기화
  private async syncPendingData(): Promise<SyncResult> {
    this.isRunning = true;
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: []
    };

    try {
      console.log('데이터 동기화 시작...');

      // 동기화 대기열 처리
      const syncQueue = await offlineStorage.getSyncQueue();
      console.log('동기화 대기열 항목 수:', syncQueue.length);

      for (const item of syncQueue) {
        try {
          await this.processSyncItem(item);
          await offlineStorage.removeFromSyncQueue(item.id);
          result.syncedCount++;
          console.log('동기화 성공:', item.id);
        } catch (error) {
          console.error('동기화 실패:', item.id, error);
          result.failedCount++;
          result.errors.push(`${item.id}: ${error}`);

          // 재시도 횟수 증가
          await offlineStorage.incrementRetryCount(item.id);

          // 최대 재시도 횟수 초과 시 대기열에서 제거
          if (item.retryCount >= item.maxRetries) {
            await offlineStorage.removeFromSyncQueue(item.id);
            console.log('최대 재시도 횟수 초과로 대기열에서 제거:', item.id);
          }
        }
      }

      // 오프라인 데이터 동기화
      const unsyncedData = await offlineStorage.getUnsyncedData();
      console.log('동기화되지 않은 데이터 수:', unsyncedData.length);

      for (const data of unsyncedData) {
        try {
          await this.syncOfflineData(data);
          await offlineStorage.markAsSynced(data.id);
          result.syncedCount++;
          console.log('오프라인 데이터 동기화 성공:', data.id);
        } catch (error) {
          console.error('오프라인 데이터 동기화 실패:', data.id, error);
          result.failedCount++;
          result.errors.push(`${data.id}: ${error}`);
        }
      }

      this.lastSyncTime = Date.now();
      
      if (result.failedCount > 0) {
        result.success = false;
        // 실패한 항목이 있으면 재시도 스케줄링
        this.scheduleRetry();
      }

      console.log('데이터 동기화 완료:', result);
      return result;

    } catch (error) {
      console.error('동기화 프로세스 오류:', error);
      result.success = false;
      result.errors.push(`동기화 프로세스 오류: ${error}`);
      return result;
    } finally {
      this.isRunning = false;
    }
  }

  // 동기화 항목 처리
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    const response = await fetch(item.url, {
      method: item.method,
      headers: item.headers,
      body: item.body
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // 오프라인 데이터 동기화
  private async syncOfflineData(data: OfflineData): Promise<void> {
    let url: string;
    let method: string;
    let body: any;

    // 데이터 타입과 액션에 따라 API 엔드포인트 결정
    switch (data.type) {
      case 'breakdown':
        url = data.action === 'create' ? '/api/breakdowns' : `/api/breakdowns/${data.data.id}`;
        method = data.action === 'create' ? 'POST' : data.action === 'update' ? 'PUT' : 'DELETE';
        body = data.action !== 'delete' ? data.data : undefined;
        break;

      case 'repair':
        url = data.action === 'create' ? '/api/repairs' : `/api/repairs/${data.data.id}`;
        method = data.action === 'create' ? 'POST' : data.action === 'update' ? 'PUT' : 'DELETE';
        body = data.action !== 'delete' ? data.data : undefined;
        break;

      case 'equipment':
        url = data.action === 'create' ? '/api/equipment' : `/api/equipment/${data.data.id}`;
        method = data.action === 'create' ? 'POST' : data.action === 'update' ? 'PUT' : 'DELETE';
        body = data.action !== 'delete' ? data.data : undefined;
        break;

      default:
        throw new Error(`지원하지 않는 데이터 타입: ${data.type}`);
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        // 인증 헤더 추가 필요 시
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  // 재시도 스케줄링
  private scheduleRetry(delayMs: number = 60000): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.retryTimeout = setTimeout(() => {
      if (navigator.onLine && !this.isRunning) {
        console.log('재시도 동기화 실행...');
        this.syncPendingData();
      }
    }, delayMs);
  }

  // 동기화 상태 조회
  async getSyncStatus(): Promise<SyncStatus> {
    const [syncQueue, unsyncedData] = await Promise.all([
      offlineStorage.getSyncQueue(),
      offlineStorage.getUnsyncedData()
    ]);

    const failedItems = syncQueue.filter(item => item.retryCount > 0);

    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      pendingCount: syncQueue.length + unsyncedData.length,
      failedCount: failedItems.length
    };
  }

  // 동기화 충돌 해결
  async resolveConflict(localData: any, serverData: any, strategy: 'local' | 'server' | 'merge'): Promise<any> {
    switch (strategy) {
      case 'local':
        console.log('충돌 해결: 로컬 데이터 우선');
        return localData;

      case 'server':
        console.log('충돌 해결: 서버 데이터 우선');
        return serverData;

      case 'merge':
        console.log('충돌 해결: 데이터 병합');
        return {
          ...serverData,
          ...localData,
          // 타임스탬프가 더 최신인 것 우선
          updated_at: localData.updated_at > serverData.updated_at ? localData.updated_at : serverData.updated_at
        };

      default:
        throw new Error(`지원하지 않는 충돌 해결 전략: ${strategy}`);
    }
  }

  // 정리
  cleanup(): void {
    this.stopAutoSync();
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }
}

// 싱글톤 인스턴스
export const syncManager = new SyncManager();

// 네트워크 상태 변경 시 자동 동기화
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('온라인 상태로 변경됨 - 동기화 시작');
    syncManager.syncNow().catch(error => {
      console.error('온라인 복구 시 동기화 실패:', error);
    });
  });

  window.addEventListener('offline', () => {
    console.log('오프라인 상태로 변경됨');
  });
}