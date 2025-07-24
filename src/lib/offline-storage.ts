// 오프라인 데이터 타입 정의
export interface OfflineData {
  id: string;
  type: 'breakdown' | 'repair' | 'equipment' | 'user';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  synced: boolean;
  retryCount: number;
}

// 동기화 큐 데이터 타입 정의
export interface SyncQueueItem {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  maxRetries: number;
  retryCount: number;
  timestamp: number;
  lastAttempt?: number;
}

// 캐시된 API 응답 타입 정의
export interface CachedApiResponse {
  url: string;
  data: any;
  timestamp: number;
  ttl: number;
}

// IndexedDB 데이터베이스 이름과 버전
const DB_NAME = 'cnc-maintenance-offline';
const DB_VERSION = 1;
const OFFLINE_DATA_STORE = 'offline-data';
const SYNC_QUEUE_STORE = 'sync-queue';
const API_CACHE_STORE = 'api-cache';

class OfflineStorageManager {
  private db: IDBDatabase | null = null;

  /**
   * IndexedDB 초기화
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('IndexedDB를 열 수 없습니다.'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 오프라인 데이터 스토어
        if (!db.objectStoreNames.contains(OFFLINE_DATA_STORE)) {
          const store = db.createObjectStore(OFFLINE_DATA_STORE, { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 동기화 큐 스토어
        if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
          const store = db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('retryCount', 'retryCount', { unique: false });
        }

        // API 캐시 스토어
        if (!db.objectStoreNames.contains(API_CACHE_STORE)) {
          const store = db.createObjectStore(API_CACHE_STORE, { keyPath: 'url' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * 데이터베이스 연결 확인
   */
  private async ensureConnection(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }

  /**
   * 오프라인 데이터 저장
   */
  async saveOfflineData(data: Omit<OfflineData, 'timestamp' | 'synced' | 'retryCount'>): Promise<void> {
    await this.ensureConnection();
    
    const offlineData: OfflineData = {
      ...data,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([OFFLINE_DATA_STORE], 'readwrite');
      const store = transaction.objectStore(OFFLINE_DATA_STORE);
      const request = store.put(offlineData);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('오프라인 데이터 저장에 실패했습니다.'));
    });
  }

  /**
   * 동기화되지 않은 오프라인 데이터 조회
   * @param type 선택적으로 특정 타입의 데이터만 조회
   */
  async getOfflineData(type?: string): Promise<OfflineData[]> {
    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([OFFLINE_DATA_STORE], 'readonly');
      const store = transaction.objectStore(OFFLINE_DATA_STORE);
      const index = store.index('synced');
      // IDBValidKey 타입 문제 해결을 위해 getAll() 사용 후 필터링
      const request = index.getAll();

      request.onsuccess = () => {
        // 동기화되지 않은 데이터만 필터링
        let data = request.result
          .filter(item => item.synced === false)
          .sort((a, b) => a.timestamp - b.timestamp);
        
        // 타입이 지정된 경우 해당 타입의 데이터만 필터링
        if (type) {
          data = data.filter(item => item.type === type);
        }
        
        resolve(data);
      };
      request.onerror = () => reject(new Error('오프라인 데이터 조회에 실패했습니다.'));
    });
  }
  
  /**
   * 동기화되지 않은 오프라인 데이터 조회 (getOfflineData와 동일한 기능)
   * sync-manager.ts와의 호환성을 위해 추가
   */
  async getUnsyncedData(): Promise<OfflineData[]> {
    return this.getOfflineData();
  }

  /**
   * 특정 오프라인 데이터 삭제
   */
  async deleteOfflineData(id: string): Promise<void> {
    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([OFFLINE_DATA_STORE], 'readwrite');
      const store = transaction.objectStore(OFFLINE_DATA_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('오프라인 데이터 삭제에 실패했습니다.'));
    });
  }

  /**
   * 오프라인 데이터를 동기화됨으로 표시
   */
  async markAsSynced(id: string): Promise<void> {
    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([OFFLINE_DATA_STORE], 'readwrite');
      const store = transaction.objectStore(OFFLINE_DATA_STORE);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.synced = true;
          const putRequest = store.put(data);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(new Error('동기화 상태 업데이트에 실패했습니다.'));
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(new Error('오프라인 데이터 조회에 실패했습니다.'));
    });
  }

  /**
   * 재시도 횟수 증가
   */
  async incrementRetryCount(id: string): Promise<void> {
    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([OFFLINE_DATA_STORE], 'readwrite');
      const store = transaction.objectStore(OFFLINE_DATA_STORE);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.retryCount += 1;
          const putRequest = store.put(data);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(new Error('재시도 횟수 업데이트에 실패했습니다.'));
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(new Error('오프라인 데이터 조회에 실패했습니다.'));
    });
  }

  /**
   * 모든 오프라인 데이터 삭제
   */
  async clearAllOfflineData(): Promise<void> {
    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([OFFLINE_DATA_STORE], 'readwrite');
      const store = transaction.objectStore(OFFLINE_DATA_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('오프라인 데이터 삭제에 실패했습니다.'));
    });
  }

  /**
   * 저장소 통계 정보 조회
   */
  async getStorageStats(): Promise<{
    offlineDataCount: number;
    syncQueueCount: number;
    cacheCount: number;
  }> {
    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([OFFLINE_DATA_STORE, SYNC_QUEUE_STORE, API_CACHE_STORE], 'readonly');
      
      const offlineDataStore = transaction.objectStore(OFFLINE_DATA_STORE);
      const syncQueueStore = transaction.objectStore(SYNC_QUEUE_STORE);
      const apiCacheStore = transaction.objectStore(API_CACHE_STORE);
      
      const offlineDataRequest = offlineDataStore.count();
      const syncQueueRequest = syncQueueStore.count();
      const apiCacheRequest = apiCacheStore.count();

      let completed = 0;
      const results = { offlineDataCount: 0, syncQueueCount: 0, cacheCount: 0 };

      const checkComplete = () => {
        completed++;
        if (completed === 3) {
          resolve(results);
        }
      };

      offlineDataRequest.onsuccess = () => {
        results.offlineDataCount = offlineDataRequest.result;
        checkComplete();
      };
      offlineDataRequest.onerror = () => reject(new Error('오프라인 데이터 카운트 조회에 실패했습니다.'));

      syncQueueRequest.onsuccess = () => {
        results.syncQueueCount = syncQueueRequest.result;
        checkComplete();
      };
      syncQueueRequest.onerror = () => reject(new Error('동기화 큐 카운트 조회에 실패했습니다.'));

      apiCacheRequest.onsuccess = () => {
        results.cacheCount = apiCacheRequest.result;
        checkComplete();
      };
      apiCacheRequest.onerror = () => reject(new Error('API 캐시 카운트 조회에 실패했습니다.'));
    });
  }

  /**
   * 동기화 큐에 항목 추가
   */
  async addToSyncQueue(item: Omit<SyncQueueItem, 'retryCount' | 'timestamp'>): Promise<void> {
    await this.ensureConnection();
    
    const syncItem: SyncQueueItem = {
      ...item,
      retryCount: 0,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SYNC_QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.put(syncItem);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('동기화 큐 추가에 실패했습니다.'));
    });
  }

  /**
   * 동기화 큐 항목 조회
   */
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SYNC_QUEUE_STORE], 'readonly');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const data = request.result.sort((a, b) => a.timestamp - b.timestamp);
        resolve(data);
      };
      request.onerror = () => reject(new Error('동기화 큐 조회에 실패했습니다.'));
    });
  }

  /**
   * 동기화 큐 항목 삭제
   */
  async removeSyncQueueItem(id: string): Promise<void> {
    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SYNC_QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('동기화 큐 항목 삭제에 실패했습니다.'));
    });
  }

  /**
   * API 응답 캐시
   */
  async cacheApiResponse(url: string, data: any, ttl: number = 300000): Promise<void> {
    await this.ensureConnection();
    
    const cachedResponse: CachedApiResponse = {
      url,
      data,
      timestamp: Date.now(),
      ttl,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([API_CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(API_CACHE_STORE);
      const request = store.put(cachedResponse);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('API 응답 캐시에 실패했습니다.'));
    });
  }

  /**
   * 캐시된 API 응답 조회
   */
  async getCachedApiResponse(url: string): Promise<any | null> {
    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([API_CACHE_STORE], 'readonly');
      const store = transaction.objectStore(API_CACHE_STORE);
      const request = store.get(url);

      request.onsuccess = () => {
        const cached = request.result;
        if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
          resolve(cached.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(new Error('캐시된 API 응답 조회에 실패했습니다.'));
    });
  }

  /**
   * 만료된 캐시 정리
   */
  async cleanExpiredCache(): Promise<void> {
    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([API_CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(API_CACHE_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const now = Date.now();
        const expired = request.result.filter(item => (now - item.timestamp) >= item.ttl);
        
        let deletedCount = 0;
        if (expired.length === 0) {
          resolve();
          return;
        }

        expired.forEach(item => {
          const deleteRequest = store.delete(item.url);
          deleteRequest.onsuccess = () => {
            deletedCount++;
            if (deletedCount === expired.length) {
              resolve();
            }
          };
          deleteRequest.onerror = () => reject(new Error('만료된 캐시 삭제에 실패했습니다.'));
        });
      };
      request.onerror = () => reject(new Error('캐시 조회에 실패했습니다.'));
    });
  }

  /**
   * 모든 저장소 정리
   */
  async clearAll(): Promise<void> {
    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([OFFLINE_DATA_STORE, SYNC_QUEUE_STORE, API_CACHE_STORE], 'readwrite');
      
      const offlineDataStore = transaction.objectStore(OFFLINE_DATA_STORE);
      const syncQueueStore = transaction.objectStore(SYNC_QUEUE_STORE);
      const apiCacheStore = transaction.objectStore(API_CACHE_STORE);
      
      const offlineDataRequest = offlineDataStore.clear();
      const syncQueueRequest = syncQueueStore.clear();
      const apiCacheRequest = apiCacheStore.clear();

      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 3) {
          resolve();
        }
      };

      offlineDataRequest.onsuccess = () => checkComplete();
      offlineDataRequest.onerror = () => reject(new Error('오프라인 데이터 정리에 실패했습니다.'));

      syncQueueRequest.onsuccess = () => checkComplete();
      syncQueueRequest.onerror = () => reject(new Error('동기화 큐 정리에 실패했습니다.'));

      apiCacheRequest.onsuccess = () => checkComplete();
      apiCacheRequest.onerror = () => reject(new Error('API 캐시 정리에 실패했습니다.'));
    });
  }
}

// 싱글톤 인스턴스 생성
export const offlineStorage = new OfflineStorageManager();