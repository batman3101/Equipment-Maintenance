import { useState, useEffect, useCallback, useRef } from 'react'

// API 응답 타입 정의
interface DashboardData {
  dailyStats: {
    breakdowns: { total: number; urgent: number; pending: number }
    repairs: { completed: number; inProgress: number; scheduled: number }
    equipment: { operational: number; total: number; maintenance: number; stopped: number }
  }
  comprehensiveMetrics: {
    operationRate: number
    mtbf: number
    mttr: number
    qualityIndex: number
    maintenanceCompletionRate: number
    totalEquipment: number
    activeEquipment: number
    totalBreakdowns: number
    totalRepairs: number
    avgRepairTime: number
    preventiveMaintenanceRatio: number
  }
  trendData: Array<{ period: string; breakdowns: number; repairs: number }>
  equipmentScores: Array<{ id: string; name: string; score: number; grade: string; status: string }>
  lastUpdated: string
}

interface StatisticsData {
  category: string
  period: string
  data: unknown
  lastUpdated: string
}

interface RealtimeData {
  equipment: unknown[]
  statusData: unknown[]
  breakdowns: unknown[]
  repairs: unknown[]
  maintenance: unknown[]
  lastUpdated: string
}

/**
 * [ISP] Rule: 캐시 관리만을 담당하는 분리된 인터페이스
 * 메모리 누수 방지와 효율적인 캐시 관리를 위한 LRU 캐시 구현
 */
class OptimizedCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; accessCount: number }>()
  private readonly maxSize: number
  private readonly ttl: number // Time to live in milliseconds

  constructor(maxSize = 10, ttlMinutes = 5) {
    this.maxSize = maxSize
    this.ttl = ttlMinutes * 60 * 1000
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // TTL 체크
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    // LRU 업데이트
    entry.accessCount++
    this.cache.delete(key)
    this.cache.set(key, entry)

    return entry.data
  }

  set(key: string, data: T): void {
    // 캐시 크기 제한 (LRU eviction)
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1
    })
  }

  private evictLeastRecentlyUsed(): void {
    let lruKey = ''
    let lruAccessCount = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < lruAccessCount) {
        lruAccessCount = entry.accessCount
        lruKey = key
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey)
    }
  }

  clear(): void {
    this.cache.clear()
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    }
  }
}

// 전역 캐시 인스턴스
const dashboardCache = new OptimizedCache<DashboardData>(5, 5) // 5개 항목, 5분 TTL
const statisticsCache = new OptimizedCache<StatisticsData>(10, 10) // 10개 항목, 10분 TTL
const realtimeCache = new OptimizedCache<RealtimeData>(3, 1) // 3개 항목, 1분 TTL

/**
 * [DIP] Rule: 추상화된 인터페이스에 의존하는 최적화된 대시보드 데이터 훅
 * 메모리 효율성과 네트워크 요청 최적화에 중점
 */
export function useOptimizedDashboardAnalytics(autoRefresh: boolean = true) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const retryCountRef = useRef(0)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const maxRetries = 3

  const fetchData = useCallback(async (useCache = true) => {
    const cacheKey = 'dashboard-analytics'

    // 캐시에서 먼저 확인
    if (useCache) {
      const cachedData = dashboardCache.get(cacheKey)
      if (cachedData) {
        setData(cachedData)
        setLoading(false)
        return
      }
    }

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/analytics/dashboard', {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'max-age=300', // 5분 브라우저 캐시
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
        dashboardCache.set(cacheKey, result.data) // 메모리 캐시에 저장
        retryCountRef.current = 0 // 성공 시 재시도 카운트 리셋
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return // 요청 취소는 에러로 처리하지 않음
      }
      
      // 자동 재시도 로직 (지수 백오프)
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++
        setTimeout(() => fetchData(false), 1000 * Math.pow(2, retryCountRef.current))
        return
      }
      
      console.error('Dashboard analytics error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshData = useCallback(async () => {
    dashboardCache.clear() // 캐시 클리어
    await fetchData(false) // 강제 새로고침
  }, [fetchData])

  // 페이지 가시성 API를 사용한 스마트 자동 새로고침
  const setupAutoRefresh = useCallback(() => {
    if (!autoRefresh) return

    // 페이지가 숨겨졌을 때 타이머 정지, 다시 보일 때 재시작
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current)
          refreshIntervalRef.current = null
        }
      } else {
        // 페이지가 다시 보일 때 즉시 새로고침 후 타이머 재시작
        fetchData(false)
        
        if (!refreshIntervalRef.current) {
          refreshIntervalRef.current = setInterval(() => {
            if (!document.hidden) {
              fetchData()
            }
          }, 5 * 60 * 1000) // 5분마다
        }
      }
    }

    // 초기 타이머 설정
    refreshIntervalRef.current = setInterval(() => {
      if (!document.hidden) {
        fetchData()
      }
    }, 5 * 60 * 1000) // 5분마다

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', () => {
      if (!document.hidden) {
        fetchData()
      }
    })

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [autoRefresh, fetchData])

  useEffect(() => {
    fetchData()
    
    const cleanup = setupAutoRefresh()
    
    return () => {
      cleanup?.()
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchData, setupAutoRefresh])

  return {
    data,
    loading,
    error,
    refresh: refreshData,
    refetch: () => fetchData(false),
    cacheStats: dashboardCache.getStats()
  }
}

/**
 * 최적화된 실시간 데이터 훅
 * 폴링 간격을 적응적으로 조정하여 네트워크 부하 감소
 */
export function useOptimizedRealtimeData(enabled: boolean = true) {
  const [data, setData] = useState<RealtimeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const errorCountRef = useRef(0)

  // 적응적 폴링 간격 (에러 시 점진적 증가)
  const getPollingInterval = useCallback(() => {
    const baseInterval = 60 * 1000 // 기본 1분 (30초에서 1분으로 변경)
    const maxInterval = 5 * 60 * 1000 // 최대 5분
    
    if (errorCountRef.current === 0) return baseInterval
    
    // 에러 횟수에 따라 지수적으로 증가
    return Math.min(baseInterval * Math.pow(2, errorCountRef.current), maxInterval)
  }, [])

  const fetchData = useCallback(async () => {
    const cacheKey = `realtime-${Date.now()}`

    try {
      setError(null)

      const response = await fetch('/api/analytics/realtime')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
        setLastFetch(new Date())
        realtimeCache.set(cacheKey, result.data)
        errorCountRef.current = 0 // 성공 시 에러 카운트 리셋
      } else {
        throw new Error(result.error || 'Failed to fetch realtime data')
      }
    } catch (err) {
      console.error('Realtime data error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      errorCountRef.current++
    } finally {
      setLoading(false)
    }
  }, [])

  const forceRefresh = useCallback(async () => {
    realtimeCache.clear()
    errorCountRef.current = 0
    await fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!enabled) return

    fetchData()

    // 적응적 폴링 설정
    const setupPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      intervalRef.current = setInterval(() => {
        if (!document.hidden) {
          fetchData()
        }
      }, getPollingInterval())
    }

    setupPolling()

    // 에러 발생 시 폴링 간격 재조정
    const errorHandler = () => setupPolling()
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchData, enabled, getPollingInterval])

  return {
    data,
    loading,
    error,
    lastFetch,
    refresh: forceRefresh,
    refetch: fetchData,
    pollingInterval: getPollingInterval(),
    cacheStats: realtimeCache.getStats()
  }
}

/**
 * 최적화된 통계 분석 데이터 훅
 */
export function useOptimizedStatisticsAnalytics(
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
  category: 'performance' | 'maintenance' | 'comprehensive' = 'performance'
) {
  const [data, setData] = useState<StatisticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const cacheKey = `statistics-${period}-${category}`

    // 캐시 확인
    const cachedData = statisticsCache.get(cacheKey)
    if (cachedData) {
      setData(cachedData)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/analytics/statistics?period=${period}&category=${category}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
        statisticsCache.set(cacheKey, result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch statistics data')
      }
    } catch (err) {
      console.error('Statistics analytics error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [period, category])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    cacheStats: statisticsCache.getStats()
  }
}

// 기존 유틸리티 함수들은 유지
export function transformTrendDataForChart(trendData: Array<{ period: string | number; breakdowns: number; repairs: number }>) {
  return trendData.map((item) => ({
    name: item.period,
    breakdowns: item.breakdowns,
    repairs: item.repairs,
    '고장 발생': item.breakdowns,
    '수리 완료': item.repairs
  }))
}

export function getEquipmentStatusColor(status: string) {
  const colorMap = {
    running: 'green',
    breakdown: 'red',
    maintenance: 'yellow',
    standby: 'blue',
    stopped: 'gray'
  }
  return colorMap[status as keyof typeof colorMap] || 'gray'
}

export function getScoreColor(score: number) {
  if (score >= 90) return 'green'
  if (score >= 80) return 'blue'
  if (score >= 70) return 'yellow'
  if (score >= 60) return 'orange'
  return 'red'
}