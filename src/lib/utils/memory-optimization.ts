/**
 * 메모리 최적화 유틸리티
 * 메모리 누수 방지 및 사용량 최적화를 위한 함수
 */

/**
 * 이벤트 리스너 정리를 위한 유틸리티
 * 컴포넌트 언마운트 시 이벤트 리스너를 정리하여 메모리 누수 방지
 */
export class EventListenerManager {
  private listeners: Array<{
    target: EventTarget;
    type: string;
    listener: EventListenerOrEventListenerObject;
    options?: boolean | AddEventListenerOptions;
  }> = [];

  /**
   * 이벤트 리스너 추가
   */
  public add(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    target.addEventListener(type, listener, options);
    this.listeners.push({ target, type, listener, options });
  }

  /**
   * 모든 이벤트 리스너 정리
   */
  public removeAll(): void {
    this.listeners.forEach(({ target, type, listener, options }) => {
      target.removeEventListener(type, listener, options);
    });
    this.listeners = [];
  }
}

/**
 * 이미지 캐시 관리 유틸리티
 * 메모리 사용량 최적화를 위한 이미지 캐시 관리
 */
export class ImageCacheManager {
  private static instance: ImageCacheManager;
  private cache: Map<string, { url: string; timestamp: number }> = new Map();
  private maxSize: number;
  private maxAge: number; // 밀리초 단위

  private constructor(maxSize = 50, maxAge = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  public static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager();
    }
    return ImageCacheManager.instance;
  }

  /**
   * 이미지 URL을 캐시에 추가
   */
  public addToCache(key: string, url: string): void {
    // 캐시가 최대 크기에 도달하면 가장 오래된 항목 제거
    if (this.cache.size >= this.maxSize) {
      this.removeOldestItem();
    }

    this.cache.set(key, { url, timestamp: Date.now() });
  }

  /**
   * 캐시에서 이미지 URL 가져오기
   */
  public getFromCache(key: string): string | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // 캐시 항목이 만료되었는지 확인
    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return item.url;
  }

  /**
   * 가장 오래된 캐시 항목 제거
   */
  private removeOldestItem(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;
    
    this.cache.forEach((item, key) => {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        oldestKey = key;
      }
    });
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 만료된 캐시 항목 정리
   */
  public cleanExpiredItems(): void {
    const now = Date.now();
    
    this.cache.forEach((item, key) => {
      if (now - item.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * 캐시 크기 가져오기
   */
  public getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * 캐시 비우기
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

/**
 * 주기적으로 메모리 최적화 작업 실행
 * 브라우저 idle 시간에 실행하여 사용자 경험에 영향 최소화
 */
export function setupMemoryOptimization(): () => void {
  const imageCacheManager = ImageCacheManager.getInstance();
  
  // 주기적으로 만료된 캐시 항목 정리
  const intervalId = setInterval(() => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        imageCacheManager.cleanExpiredItems();
      });
    } else {
      imageCacheManager.cleanExpiredItems();
    }
  }, 60000); // 1분마다 실행
  
  // 정리 함수 반환
  return () => {
    clearInterval(intervalId);
  };
}