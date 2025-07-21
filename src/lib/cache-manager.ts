// 캐시 관리 유틸리티

export interface CacheConfig {
  name: string;
  version: string;
  maxAge?: number; // 밀리초
  maxEntries?: number;
}

export class CacheManager {
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  // 캐시 이름 생성
  private getCacheName(): string {
    return `${this.config.name}-${this.config.version}`;
  }

  // 캐시 열기
  async openCache(): Promise<Cache> {
    return await caches.open(this.getCacheName());
  }

  // 캐시에 추가
  async put(request: RequestInfo | URL, response: Response): Promise<void> {
    const cache = await this.openCache();
    
    // 응답이 유효한지 확인
    if (response.ok) {
      // 만료 시간 헤더 추가
      const responseWithExpiry = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'cache-timestamp': Date.now().toString(),
          'cache-max-age': (this.config.maxAge || 86400000).toString() // 기본 24시간
        }
      });
      
      await cache.put(request, responseWithExpiry);
      
      // 캐시 크기 제한 확인
      if (this.config.maxEntries) {
        await this.enforceMaxEntries();
      }
    }
  }

  // 캐시에서 조회
  async match(request: RequestInfo | URL): Promise<Response | undefined> {
    const cache = await this.openCache();
    const response = await cache.match(request);
    
    if (!response) {
      return undefined;
    }

    // 만료 시간 확인
    const timestamp = response.headers.get('cache-timestamp');
    const maxAge = response.headers.get('cache-max-age');
    
    if (timestamp && maxAge) {
      const cacheTime = parseInt(timestamp);
      const maxAgeMs = parseInt(maxAge);
      const now = Date.now();
      
      if (now - cacheTime > maxAgeMs) {
        // 만료된 캐시 삭제
        await cache.delete(request);
        return undefined;
      }
    }

    return response;
  }

  // 캐시에서 삭제
  async delete(request: RequestInfo | URL): Promise<boolean> {
    const cache = await this.openCache();
    return await cache.delete(request);
  }

  // 캐시 항목 수 제한
  private async enforceMaxEntries(): Promise<void> {
    if (!this.config.maxEntries) return;

    const cache = await this.openCache();
    const keys = await cache.keys();
    
    if (keys.length > this.config.maxEntries) {
      // 오래된 항목부터 삭제 (FIFO)
      const keysToDelete = keys.slice(0, keys.length - this.config.maxEntries);
      await Promise.all(keysToDelete.map(key => cache.delete(key)));
    }
  }

  // 캐시 정리
  async clear(): Promise<void> {
    const cache = await this.openCache();
    const keys = await cache.keys();
    await Promise.all(keys.map(key => cache.delete(key)));
  }

  // 캐시 통계
  async getStats(): Promise<{
    name: string;
    version: string;
    entryCount: number;
    totalSize: number;
  }> {
    const cache = await this.openCache();
    const keys = await cache.keys();
    let totalSize = 0;

    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }

    return {
      name: this.config.name,
      version: this.config.version,
      entryCount: keys.length,
      totalSize
    };
  }
}

// 사전 정의된 캐시 매니저들
export const staticCacheManager = new CacheManager({
  name: 'cnc-maintenance-static',
  version: 'v1',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
  maxEntries: 100
});

export const dynamicCacheManager = new CacheManager({
  name: 'cnc-maintenance-dynamic',
  version: 'v1',
  maxAge: 24 * 60 * 60 * 1000, // 1일
  maxEntries: 50
});

export const apiCacheManager = new CacheManager({
  name: 'cnc-maintenance-api',
  version: 'v1',
  maxAge: 5 * 60 * 1000, // 5분
  maxEntries: 100
});

// 캐시 전략 함수들
export async function cacheFirst(request: Request, cacheManager: CacheManager): Promise<Response> {
  // 캐시 우선 전략
  const cachedResponse = await cacheManager.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cacheManager.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    throw new Error(`네트워크 요청 실패: ${error}`);
  }
}

export async function networkFirst(request: Request, cacheManager: CacheManager): Promise<Response> {
  // 네트워크 우선 전략
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cacheManager.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cacheManager.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

export async function staleWhileRevalidate(request: Request, cacheManager: CacheManager): Promise<Response> {
  // Stale While Revalidate 전략
  const cachedResponse = await cacheManager.match(request);
  
  // 백그라운드에서 네트워크 요청
  const networkPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      await cacheManager.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // 네트워크 실패 시 무시
  });

  // 캐시된 응답이 있으면 즉시 반환
  if (cachedResponse) {
    return cachedResponse;
  }

  // 캐시된 응답이 없으면 네트워크 응답 대기
  return await networkPromise || new Response('Service Unavailable', { status: 503 });
}