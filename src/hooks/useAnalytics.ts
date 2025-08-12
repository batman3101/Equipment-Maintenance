import { useState, useEffect, useCallback, useRef } from 'react'

// API 응답 타입 정의
interface DashboardData {
  dailyStats: {
    breakdowns: {
      total: number
      urgent: number
      pending: number
    }
    repairs: {
      completed: number
      inProgress: number
      scheduled: number
    }
    equipment: {
      operational: number
      total: number
      maintenance: number
      stopped: number
    }
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
  trendData: Array<{
    period: string
    breakdowns: number
    repairs: number
  }>
  equipmentScores: Array<{
    id: string
    name: string
    score: number
    grade: string
    status: string
  }>
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

// 대시보드 데이터 훅 (성능 최적화됨)
export function useDashboardAnalytics(autoRefresh: boolean = true) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  const fetchData = useCallback(async () => {
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
        retryCountRef.current = 0 // 성공 시 재시도 카운트 리셋
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return // 요청 취소는 에러로 처리하지 않음
      }
      
      // 자동 재시도 로직
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++
        setTimeout(() => fetchData(), 1000 * retryCountRef.current) // 지수 백오프
        return
      }
      
      console.error('Dashboard analytics error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshData = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/analytics/dashboard', {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || 'Failed to refresh dashboard data')
      }
    } catch (err) {
      console.error('Dashboard refresh error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

  useEffect(() => {
    fetchData()

    // 자동 새로고침 설정 (5분마다) - 페이지가 활성화되어 있을 때만
    if (autoRefresh) {
      const interval = setInterval(() => {
        if (!document.hidden) { // 페이지가 보일 때만 새로고침
          fetchData()
        }
      }, 5 * 60 * 1000)
      
      // 페이지 포커스 시 자동 새로고침
      const handleFocus = () => {
        if (!document.hidden) {
          fetchData()
        }
      }
      
      window.addEventListener('focus', handleFocus)
      document.addEventListener('visibilitychange', handleFocus)
      
      return () => {
        clearInterval(interval)
        window.removeEventListener('focus', handleFocus)
        document.removeEventListener('visibilitychange', handleFocus)
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
      }
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchData, autoRefresh])

  return {
    data,
    loading,
    error,
    refresh: refreshData,
    refetch: fetchData
  }
}

// 통계 분석 데이터 훅
export function useStatisticsAnalytics(
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
  category: 'performance' | 'maintenance' | 'comprehensive' = 'performance'
) {
  const [data, setData] = useState<StatisticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
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
    refetch: fetchData
  }
}

// 실시간 데이터 훅
export function useRealtimeData(enabled: boolean = true) {
  const [data, setData] = useState<RealtimeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
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
      } else {
        throw new Error(result.error || 'Failed to fetch realtime data')
      }
    } catch (err) {
      console.error('Realtime data error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const forceRefresh = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/analytics/realtime', {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
        setLastFetch(new Date())
      } else {
        throw new Error(result.error || 'Failed to refresh realtime data')
      }
    } catch (err) {
      console.error('Realtime refresh error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    fetchData()

    // 실시간 업데이트 (30초마다)
    const interval = setInterval(fetchData, 30 * 1000)
    return () => clearInterval(interval)
  }, [fetchData, enabled])

  return {
    data,
    loading,
    error,
    lastFetch,
    refresh: forceRefresh,
    refetch: fetchData
  }
}

// 차트 데이터 변환 유틸리티
type TrendItem = { period: string | number; breakdowns: number; repairs: number }
export function transformTrendDataForChart(trendData: TrendItem[]) {
  return trendData.map((item) => ({
    name: item.period,
    breakdowns: item.breakdowns,
    repairs: item.repairs,
    '고장 발생': item.breakdowns,
    '수리 완료': item.repairs
  }))
}

// 설비 상태 색상 유틸리티
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

// 점수 기반 색상 유틸리티
export function getScoreColor(score: number) {
  if (score >= 90) return 'green'
  if (score >= 80) return 'blue'
  if (score >= 70) return 'yellow'
  if (score >= 60) return 'orange'
  return 'red'
}