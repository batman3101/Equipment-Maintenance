// IndexedDB를 이용한 오프라인 데이터 저장

export interface OfflineData {
  id: string;
  type: 'breakdown' | 'repair' | 'user' | 'equipment';
  data: any;
  timestamp: number;
  action: 'create' | 'update' | 'delete';
  synced: boolean;
  retryCount: number;
}

export interface SyncQueueItem {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

class OfflineStorageManager {
  private dbName = 'cnc-maintenance-offline';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  // 데이터베이스 초기화
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('IndexedDB 열기 실패'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB 초기화 완료');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 오프라인 데이터 저장소
        if (!db.objectStoreNames.contains('offline-data')) {
          const offlineStore = db.createObjectStore('offline-data', { keyPath: 'id' });
          offlineStore.createIndex('type', 'type', { unique: false });
          offlineStore.createIndex('synced', 'synced', { unique: false });
          offlineStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 동기화 대기열
        if (!db.objectStoreNames.contains('sync-queue')) {
          const syncStore = db.createObjectStore('sync-queue', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('retryCount', 'retryCount', { unique: false });
        }

        // 캐시된 API 응답
        if (!db.objectStoreNames.contains('api-cache')) {
          const cacheStore = db.createObjectStore('api-cache', { keyPath: 'url' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
          cacheStore.createIndex('expiry', 'expiry', { unique: false });
        }

        console.log('IndexedDB 스키마 업그레이드 완료');
      };
    });
  }

  // 데이터베이스 연결 확인
  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다. init()을 먼저 호출하세요.');
    }
    return this.db;
  }

  // 오프라인 데이터 저장
  async saveOfflineData(data: Omit<OfflineData, 'timestamp' | 'synced' | 'retryCount'>): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['offline-data'], 'readwrite');
    const store = transaction.objectStore('offline-data');

    const offlineData: OfflineData = {
      ...data,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const request = store.put(offlineData);
      
      request.onsuccess = () => {
        console.log('오프라인 데이터 저장 완료:', data.id);
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error('오프라인 데이터 저장 실패'));
      };
    });
  }

  // 오프라인 데이터 조회
  async getOfflineData(type?: string): Promise<OfflineData[]> {
    const db = this.ensureDB();
    const transaction = db.transaction(['offline-data'], 'readonly');
    const store = transaction.objectStore('offline-data');

    return new Promise((resolve, reject) => {
      let request: IDBRequest;
      
      if (type) {
        const index = store.index('type');
        request = index.getAll(type);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('오프라인 데이터 조회 실패'));
      };
    });
  }

  // 동기화되지 않은 데이터 조회
  async getUnsyncedData(): Promise<OfflineData[]> {
    const db = this.ensureDB();
    const transaction = db.transaction(['offline-data'], 'readonly');
    const store = transaction.objectStore('offline-data');
    const index = store.index('synced');

    return new Promise((resolve, reject) => {
      const unsyncedData: OfflineData[] = [];
      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const data = cursor.value as OfflineData;
          if (!data.synced) {
            unsyncedData.push(data);
          }
          cursor.continue();
        } else {
          resolve(unsyncedData);
        }
      };

      request.onerror = () => {
        reject(new Error('동기화되지 않은 데이터 조회 실패'));
      };
    });
  }

  // 데이터 동기화 완료 표시
  async markAsSynced(id: string): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['offline-data'], 'readwrite');
    const store = transaction.objectStore('offline-data');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.synced = true;
          const putRequest = store.put(data);
          
          putRequest.onsuccess = () => {
            console.log('데이터 동기화 완료 표시:', id);
            resolve();
          };
          
          putRequest.onerror = () => {
            reject(new Error('동기화 상태 업데이트 실패'));
          };
        } else {
          reject(new Error('데이터를 찾을 수 없습니다'));
        }
      };

      getRequest.onerror = () => {
        reject(new Error('데이터 조회 실패'));
      };
    });
  }

  // 동기화 대기열에 추가
  async addToSyncQueue(item: Omit<SyncQueueItem, 'timestamp' | 'retryCount'>): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['sync-queue'], 'readwrite');
    const store = transaction.objectStore('sync-queue');

    const syncItem: SyncQueueItem = {
      ...item,
      timestamp: Date.now(),
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const request = store.put(syncItem);
      
      request.onsuccess = () => {
        console.log('동기화 대기열에 추가:', item.id);
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error('동기화 대기열 추가 실패'));
      };
    });
  }

  // 동기화 대기열 조회
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = this.ensureDB();
    const transaction = db.transaction(['sync-queue'], 'readonly');
    const store = transaction.objectStore('sync-queue');

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('동기화 대기열 조회 실패'));
      };
    });
  }

  // 동기화 대기열에서 제거
  async removeFromSyncQueue(id: string): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['sync-queue'], 'readwrite');
    const store = transaction.objectStore('sync-queue');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      
      request.onsuccess = () => {
        console.log('동기화 대기열에서 제거:', id);
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error('동기화 대기열 제거 실패'));
      };
    });
  }

  // 재시도 횟수 증가
  async incrementRetryCount(id: string): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['sync-queue'], 'readwrite');
    const store = transaction.objectStore('sync-queue');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.retryCount += 1;
          const putRequest = store.put(item);
          
          putRequest.onsuccess = () => {
            resolve();
          };
          
          putRequest.onerror = () => {
            reject(new Error('재시도 횟수 업데이트 실패'));
          };
        } else {
          reject(new Error('동기화 항목을 찾을 수 없습니다'));
        }
      };

      getRequest.onerror = () => {
        reject(new Error('동기화 항목 조회 실패'));
      };
    });
  }

  // API 응답 캐시
  async cacheApiResponse(url: string, response: any, ttl: number = 300000): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['api-cache'], 'readwrite');
    const store = transaction.objectStore('api-cache');

    const cacheItem = {
      url,
      data: response,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    };

    return new Promise((resolve, reject) => {
      const request = store.put(cacheItem);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error('API 응답 캐시 실패'));
      };
    });
  }

  // 캐시된 API 응답 조회
  async getCachedApiResponse(url: string): Promise<any | null> {
    const db = this.ensureDB();
    const transaction = db.transaction(['api-cache'], 'readonly');
    const store = transaction.objectStore('api-cache');

    return new Promise((resolve, reject) => {
      const request = store.get(url);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.expiry > Date.now()) {
          resolve(result.data);
        } else {
          // 만료된 캐시 삭제
          if (result) {
            this.deleteCachedApiResponse(url);
          }
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(new Error('캐시된 API 응답 조회 실패'));
      };
    });
  }

  // 캐시된 API 응답 삭제
  async deleteCachedApiResponse(url: string): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['api-cache'], 'readwrite');
    const store = transaction.objectStore('api-cache');

    return new Promise((resolve, reject) => {
      const request = store.delete(url);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error('캐시된 API 응답 삭제 실패'));
      };
    });
  }

  // 만료된 캐시 정리
  async cleanExpiredCache(): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['api-cache'], 'readwrite');
    const store = transaction.objectStore('api-cache');
    const index = store.index('expiry');

    return new Promise((resolve, reject) => {
      const range = IDBKeyRange.upperBound(Date.now());
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        reject(new Error('만료된 캐시 정리 실패'));
      };
    });
  }

  // 저장소 통계
  async getStorageStats(): Promise<{
    offlineDataCount: number;
    syncQueueCount: number;
    cacheCount: number;
  }> {
    const db = this.ensureDB();
    
    const [offlineData, syncQueue, cache] = await Promise.all([
      this.getOfflineData(),
      this.getSyncQueue(),
      this.getAllCachedResponses()
    ]);

    return {
      offlineDataCount: offlineData.length,
      syncQueueCount: syncQueue.length,
      cacheCount: cache.length
    };
  }

  // 모든 캐시된 응답 조회 (내부 사용)
  private async getAllCachedResponses(): Promise<any[]> {
    const db = this.ensureDB();
    const transaction = db.transaction(['api-cache'], 'readonly');
    const store = transaction.objectStore('api-cache');

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('캐시된 응답 조회 실패'));
      };
    });
  }

  // 데이터베이스 정리
  async clearAll(): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['offline-data', 'sync-queue', 'api-cache'], 'readwrite');

    const promises = [
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('offline-data').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('sync-queue').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('api-cache').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
      })
    ];

    await Promise.all(promises);
    console.log('오프라인 저장소 정리 완료');
  }
}

// 싱글톤 인스턴스
export const offlineStorage = new OfflineStorageManager();