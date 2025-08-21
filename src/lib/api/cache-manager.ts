/**
 * [SRP] Rule: 캐시 관리만을 담당하는 클래스
 * API 응답 캐싱 및 무효화 전략 구현
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time To Live in milliseconds
}

export class CacheManager {
  private static instance: CacheManager
  private cache: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL = 5 * 60 * 1000 // 5분 기본 캐시 시간
  
  private constructor() {
    // 주기적으로 만료된 캐시 정리
    setInterval(() => this.cleanExpiredCache(), 60000) // 1분마다 실행
  }
  
  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }
  
  /**
   * 캐시에 데이터 저장
   */
  public set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
    
    console.log(`[CacheManager] Cached: ${key} (TTL: ${ttl || this.defaultTTL}ms)`)
  }
  
  /**
   * 캐시에서 데이터 가져오기
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }
    
    // 캐시 만료 확인
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      console.log(`[CacheManager] Cache expired: ${key}`)
      return null
    }
    
    console.log(`[CacheManager] Cache hit: ${key}`)
    return entry.data as T
  }
  
  /**
   * 특정 키의 캐시 무효화
   */
  public invalidate(key: string): void {
    const deleted = this.cache.delete(key)
    if (deleted) {
      console.log(`[CacheManager] Invalidated: ${key}`)
    }
  }
  
  /**
   * 패턴에 매칭되는 모든 캐시 무효화
   */
  public invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    const keysToDelete: string[] = []
    
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => {
      this.cache.delete(key)
      console.log(`[CacheManager] Invalidated by pattern: ${key}`)
    })
    
    if (keysToDelete.length > 0) {
      console.log(`[CacheManager] Invalidated ${keysToDelete.length} entries matching pattern: ${pattern}`)
    }
  }
  
  /**
   * 관련 캐시 무효화 - 데이터 변경 시 연관된 캐시 제거
   */
  public invalidateRelated(type: 'equipment' | 'status' | 'breakdown' | 'repair' | 'dashboard'): void {
    const patterns: Record<string, string[]> = {
      equipment: ['equipment.*', 'dashboard.*'],
      status: ['status.*', 'equipment.*', 'dashboard.*'],
      breakdown: ['breakdown.*', 'status.*', 'dashboard.*'],
      repair: ['repair.*', 'status.*', 'dashboard.*'],
      dashboard: ['dashboard.*']
    }
    
    const patternsToInvalidate = patterns[type] || []
    patternsToInvalidate.forEach(pattern => {
      this.invalidatePattern(pattern)
    })
    
    console.log(`[CacheManager] Invalidated related caches for type: ${type}`)
  }
  
  /**
   * 모든 캐시 삭제
   */
  public clear(): void {
    const size = this.cache.size
    this.cache.clear()
    console.log(`[CacheManager] Cleared all cache (${size} entries)`)
  }
  
  /**
   * 만료된 캐시 정리
   */
  private cleanExpiredCache(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => {
      this.cache.delete(key)
    })
    
    if (keysToDelete.length > 0) {
      console.log(`[CacheManager] Cleaned ${keysToDelete.length} expired entries`)
    }
  }
  
  /**
   * 캐시 상태 정보
   */
  public getStats(): {
    size: number
    entries: Array<{ key: string; age: number; ttl: number }>
  } {
    const now = Date.now()
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.ttl
    }))
    
    return {
      size: this.cache.size,
      entries
    }
  }
}

// 싱글톤 인스턴스 내보내기
export const cacheManager = CacheManager.getInstance()