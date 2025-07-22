// 오프라인 데이터 타입 정의
export interface OfflineData {
  id: string;
  type: 'breakdown' | 'repair' | 'equipment';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  synced: boolean;
  retryCount: number;
}

// IndexedDB 데이터베이스 이름과 버전
const DB_NAME = 'cnc-maintenance-offline';
const DB_VERSION = 1;
const STORE_NAME = 'offline-data';

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
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
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
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(offlineData);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('오프라인 데이터 저장에 실패했습니다.'));
    });
  }

  /**
   * 동기화되지 않은 오프라인 데이터 조회
   */
  async getOfflineData(): Promise<OfflineData[]> {
    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('synced');
      const request = index.getAll(false);

      request.onsuccess = () => {
        const data = request.result.sort((a, b) => a.timestamp - b.timestamp);
        resolve(data);
      };
      request.onerror = () => reject(new Error('오프라인 데이터 조회에 실패했습니다.'));
    });
  }

  /**
   * 특정 오프라인 데이터 삭제
   */
  async deleteOfflineData(id: string): Promise<void> {
    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
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
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
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
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
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
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('오프라인 데이터 삭제에 실패했습니다.'));
    });
  }
}

// 싱글톤 인스턴스 생성
export const offlineStorage = new OfflineStorageManager();