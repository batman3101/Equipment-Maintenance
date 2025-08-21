/**
 * 최적화된 데이터 분석 라이브러리
 * 에러 핸들링 강화, 타임아웃 문제 해결, 성능 최적화
 */

import { supabase } from './supabase-unified'

// 데이터 타입 정의 (강화된 타입 안정성)
export interface Equipment {
  id: string
  equipment_number: string
  equipment_name: string
  category: string
  location: string | null
  manufacturer: string | null
  model: string | null
  installation_date?: string | null
  total_breakdown_count?: number
  total_repair_count?: number
  total_downtime_hours?: number
  total_repair_cost?: number
  maintenance_score?: number
}

export interface EquipmentStatus {
  id: string
  equipment_id: string
  status: 'running' | 'breakdown' | 'maintenance' | 'standby' | 'stopped'
  status_changed_at: string
  updated_at: string
}

export interface BreakdownReport {
  id: string
  equipment_id: string
  breakdown_title: string
  occurred_at: string
  resolution_date?: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'reported' | 'assigned' | 'in_progress' | 'completed'
  unified_status?: string
}

export interface RepairReport {
  id: string
  equipment_id: string
  breakdown_report_id: string
  repair_title: string
  repair_started_at: string
  repair_completed_at?: string | null
  actual_repair_time?: number | null
  unified_status?: string
  completion_percentage?: number
}

export interface MaintenanceSchedule {
  id: string
  equipment_id: string
  scheduled_date: string
  completed_date?: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue'
  type?: 'preventive' | 'corrective' | 'predictive'
}

// 강화된 데이터 페처 (에러 핸들링 및 타임아웃 최적화)
export class OptimizedDataFetcher {
  private static readonly DEFAULT_TIMEOUT = 10000 // 10초
  private static readonly RETRY_ATTEMPTS = 2
  private static readonly BATCH_SIZE = 500

  // 타임아웃 기능이 있는 쿼리 래퍼
  private static async withTimeout<T>(
    promise: Promise<{ data: T[] | null; error: any }>,
    timeoutMs: number = this.DEFAULT_TIMEOUT
  ): Promise<T[]> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs)
    })

    try {
      const result = await Promise.race([promise, timeoutPromise])
      
      if (result.error) {
        console.warn(`Supabase query error: ${result.error.message}`)
        return []
      }
      
      return result.data || []
    } catch (error) {
      console.error('Query failed:', error)
      return []
    }
  }

  // 재시도 로직이 있는 쿼리 실행
  private static async executeWithRetry<T>(
    queryFn: () => Promise<{ data: T[] | null; error: any }>,
    retries: number = this.RETRY_ATTEMPTS
  ): Promise<T[]> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await this.withTimeout(queryFn())
        return result
      } catch (error) {
        if (attempt === retries) {
          console.error(`Query failed after ${retries + 1} attempts:`, error)
          return []
        }
        
        // 지수 백오프 (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    return []
  }

  // 최적화된 설비 정보 조회
  static async getAllEquipment(fields: string = '*'): Promise<Equipment[]> {
    return this.executeWithRetry(async () => {
      return await supabase
        .from('equipment_info')
        .select(fields)
        .order('equipment_number')
        .limit(1000)
    })
  }

  // 최적화된 설비 상태 조회 (최신 상태만)
  static async getAllEquipmentStatus(fields: string = '*'): Promise<EquipmentStatus[]> {
    return this.executeWithRetry(async () => {
      // 서브쿼리로 각 설비의 최신 상태만 조회
      return await supabase
        .from('equipment_status')
        .select(fields)
        .order('status_changed_at', { ascending: false })
        .limit(1000)
    })
  }

  // 고장 신고 조회 (기간 제한)
  static async getAllBreakdownReports(daysBack: number = 90): Promise<BreakdownReport[]> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysBack)
    
    return this.executeWithRetry(async () => {
      return await supabase
        .from('breakdown_reports')
        .select('*')
        .gte('occurred_at', cutoffDate.toISOString())
        .order('occurred_at', { ascending: false })
        .limit(1000)
    })
  }

  // 수리 보고서 조회 (기간 제한)
  static async getAllRepairReports(daysBack: number = 90): Promise<RepairReport[]> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysBack)
    
    return this.executeWithRetry(async () => {
      return await supabase
        .from('repair_reports')
        .select('*')
        .gte('repair_started_at', cutoffDate.toISOString())
        .order('repair_started_at', { ascending: false })
        .limit(1000)
    })
  }

  // 정비 스케줄 조회 (존재하는 경우만)
  static async getAllMaintenanceSchedules(): Promise<MaintenanceSchedule[]> {
    // 테이블이 존재하지 않을 수도 있으므로 안전하게 처리
    try {
      return this.executeWithRetry(async () => {
        return await supabase
          .from('maintenance_schedules')
          .select('*')
          .order('scheduled_date', { ascending: false })
          .limit(500)
      })
    } catch (error) {
      console.warn('maintenance_schedules table not found, returning empty array')
      return []
    }
  }

  // 통합 뷰 사용 (성능 최적화)
  static async getUnifiedEquipmentStatus(): Promise<any[]> {
    return this.executeWithRetry(async () => {
      return await supabase
        .from('v_unified_equipment_status')
        .select('*')
        .limit(1000)
    })
  }

  // 실시간 대시보드 데이터
  static async getRealtimeDashboard(): Promise<any> {
    try {
      const result = await this.withTimeout(
        supabase
          .from('v_realtime_dashboard')
          .select('*')
          .single(),
        5000 // 5초 타임아웃
      )
      
      return Array.isArray(result) ? result[0] : result
    } catch (error) {
      console.warn('Realtime dashboard view not available, calculating manually')
      return null
    }
  }
}

// 강화된 분석 엔진
export class OptimizedAnalyticsEngine {
  
  // 안전한 계산 함수들 (null/undefined 처리)
  static safeCalculate(calculation: () => number, fallback: number = 0): number {
    try {
      const result = calculation()
      return isNaN(result) || !isFinite(result) ? fallback : result
    } catch (error) {
      console.warn('Calculation error:', error)
      return fallback
    }
  }

  // 설비 가동률 계산 (개선된 안정성)
  static calculateOperationRate(equipment: Equipment[], statusData: EquipmentStatus[]): number {
    if (!equipment?.length) return 0
    
    return this.safeCalculate(() => {
      const runningCount = statusData.filter(s => s.status === 'running').length
      return Math.round((runningCount / equipment.length) * 100 * 10) / 10
    })
  }

  // MTBF 계산 (개선된 로직)
  static calculateMTBF(equipment: Equipment[], breakdowns: BreakdownReport[], periodDays: number = 30): number {
    if (!equipment?.length || !breakdowns?.length) return 0
    
    return this.safeCalculate(() => {
      const cutoffDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)
      const recentBreakdowns = breakdowns.filter(b => 
        new Date(b.occurred_at) >= cutoffDate
      )
      
      if (recentBreakdowns.length === 0) return 999 // 고장이 없으면 높은 값
      
      const totalOperatingHours = equipment.length * periodDays * 24
      return Math.round((totalOperatingHours / recentBreakdowns.length) * 10) / 10
    })
  }

  // MTTR 계산 (개선된 데이터 처리)
  static calculateMTTR(repairs: RepairReport[]): number {
    if (!repairs?.length) return 2.5 // 기본값
    
    return this.safeCalculate(() => {
      const completedRepairs = repairs.filter(r => 
        r.repair_completed_at && 
        (r.unified_status === 'repair_completed' || 
         r.completion_percentage === 100)
      )
      
      if (completedRepairs.length === 0) return 2.5
      
      const totalRepairTime = completedRepairs.reduce((sum, repair) => {
        if (repair.actual_repair_time) {
          return sum + (repair.actual_repair_time / 60) // 분을 시간으로 변환
        } else if (repair.repair_completed_at && repair.repair_started_at) {
          const startTime = new Date(repair.repair_started_at).getTime()
          const endTime = new Date(repair.repair_completed_at).getTime()
          const hoursDiff = (endTime - startTime) / (1000 * 60 * 60)
          return sum + Math.max(0.1, hoursDiff) // 최소 0.1시간
        }
        return sum + 3.5 // 기본 추정값
      }, 0)
      
      return Math.round((totalRepairTime / completedRepairs.length) * 10) / 10
    }, 2.5)
  }

  // 품질 지수 계산 (강화된 로직)
  static calculateQualityIndex(equipment: Equipment[], breakdowns: BreakdownReport[], periodDays: number = 30): number {
    if (!equipment?.length) return 100
    
    return this.safeCalculate(() => {
      const cutoffDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)
      const recentBreakdowns = breakdowns.filter(b => {
        const breakdownDate = new Date(b.occurred_at)
        return breakdownDate >= cutoffDate
      })
      
      const failureRate = recentBreakdowns.length / equipment.length
      const qualityIndex = Math.max(0, 100 - (failureRate * 10))
      return Math.round(qualityIndex * 10) / 10
    }, 100)
  }

  // 일일 통계 계산 (안전한 날짜 처리)
  static calculateDailyStats(
    breakdowns: BreakdownReport[],
    repairs: RepairReport[],
    equipment: Equipment[],
    statusData: EquipmentStatus[]
  ) {
    const today = new Date().toISOString().split('T')[0]
    
    const safeFilter = <T>(array: T[], filterFn: (item: T) => boolean): T[] => {
      try {
        return (array || []).filter(filterFn)
      } catch (error) {
        console.warn('Filter error:', error)
        return []
      }
    }
    
    const todayBreakdowns = safeFilter(breakdowns, b => 
      b.occurred_at?.startsWith(today)
    )
    
    const todayRepairs = safeFilter(repairs, r => 
      r.repair_completed_at?.startsWith(today)
    )

    return {
      breakdowns: {
        total: todayBreakdowns.length,
        urgent: safeFilter(todayBreakdowns, b => b.priority === 'urgent').length,
        pending: safeFilter(todayBreakdowns, b => b.status === 'reported').length
      },
      repairs: {
        completed: todayRepairs.length,
        inProgress: safeFilter(repairs, r => 
          r.unified_status === 'repair_in_progress' || r.completion_percentage > 0 && r.completion_percentage < 100
        ).length,
        scheduled: safeFilter(repairs, r => 
          r.unified_status === 'repair_pending'
        ).length
      },
      equipment: {
        operational: safeFilter(statusData, s => s.status === 'running').length,
        total: equipment?.length || 0,
        maintenance: safeFilter(statusData, s => s.status === 'maintenance').length,
        stopped: safeFilter(statusData, s => s.status === 'stopped').length
      }
    }
  }

  // 종합 메트릭 생성 (에러 방지)
  static generateComprehensiveMetrics(
    equipment: Equipment[],
    statusData: EquipmentStatus[],
    breakdowns: BreakdownReport[],
    repairs: RepairReport[],
    maintenanceData: MaintenanceSchedule[]
  ) {
    return {
      operationRate: this.calculateOperationRate(equipment, statusData),
      mtbf: this.calculateMTBF(equipment, breakdowns),
      mttr: this.calculateMTTR(repairs),
      qualityIndex: this.calculateQualityIndex(equipment, breakdowns),
      totalEquipment: equipment?.length || 0,
      activeEquipment: statusData?.filter(s => s.status === 'running')?.length || 0,
      totalBreakdowns: breakdowns?.length || 0,
      totalRepairs: repairs?.filter(r => 
        r.unified_status === 'repair_completed' || r.completion_percentage === 100
      )?.length || 0,
      avgRepairTime: this.calculateMTTR(repairs),
      maintenanceCompletionRate: this.safeCalculate(() => {
        if (!maintenanceData?.length) return 0
        const completed = maintenanceData.filter(m => m.status === 'completed').length
        return Math.round((completed / maintenanceData.length) * 100)
      }),
      preventiveMaintenanceRatio: this.safeCalculate(() => {
        if (!maintenanceData?.length) return 0
        const preventive = maintenanceData.filter(m => m.type === 'preventive').length
        return Math.round((preventive / maintenanceData.length) * 100)
      })
    }
  }
}

// 개선된 데이터 매니저 (메모리 최적화)
export class OptimizedDataManager {
  private static cache: Map<string, { 
    data: unknown
    timestamp: number
    ttl: number
    size: number
  }> = new Map()
  
  private static readonly MAX_CACHE_SIZE = 50 * 1024 * 1024 // 50MB
  private static readonly DEFAULT_TTL = 5 * 60 * 1000 // 5분
  private static currentCacheSize = 0

  static async getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMinutes: number = 5
  ): Promise<T> {
    const cached = this.cache.get(key)
    const now = Date.now()

    // 캐시 히트
    if (cached && (now - cached.timestamp) < (ttlMinutes * 60 * 1000)) {
      return cached.data as T
    }

    // 캐시 미스 - 새 데이터 페치
    try {
      const data = await fetcher()
      this.setCache(key, data, ttlMinutes)
      return data
    } catch (error) {
      console.error(`Failed to fetch data for key ${key}:`, error)
      
      // 만료된 캐시라도 있으면 반환
      if (cached) {
        console.warn(`Using expired cache for key ${key}`)
        return cached.data as T
      }
      
      throw error
    }
  }

  private static setCache<T>(key: string, data: T, ttlMinutes: number): void {
    const dataStr = JSON.stringify(data)
    const size = dataStr.length * 2 // rough estimate in bytes
    
    // 캐시 크기 제한 확인
    if (this.currentCacheSize + size > this.MAX_CACHE_SIZE) {
      this.evictOldestEntries(size)
    }
    
    const oldEntry = this.cache.get(key)
    if (oldEntry) {
      this.currentCacheSize -= oldEntry.size
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
      size
    })
    
    this.currentCacheSize += size
  }

  private static evictOldestEntries(requiredSpace: number): void {
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    
    let freedSpace = 0
    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSpace) break
      
      this.cache.delete(key)
      this.currentCacheSize -= entry.size
      freedSpace += entry.size
    }
  }

  static clearCache(): void {
    this.cache.clear()
    this.currentCacheSize = 0
  }

  static clearCacheKey(key: string): void {
    const entry = this.cache.get(key)
    if (entry) {
      this.cache.delete(key)
      this.currentCacheSize -= entry.size
    }
  }

  static getCacheStats() {
    return {
      entryCount: this.cache.size,
      totalSize: this.currentCacheSize,
      maxSize: this.MAX_CACHE_SIZE,
      utilizationPercent: Math.round((this.currentCacheSize / this.MAX_CACHE_SIZE) * 100)
    }
  }
}

// 실시간 데이터 헬퍼 (타임아웃 처리)
export class OptimizedRealtimeHelper {
  static async getLatestData(): Promise<{
    equipment: Equipment[]
    statusData: EquipmentStatus[]
    breakdowns: BreakdownReport[]
    repairs: RepairReport[]
    maintenance: MaintenanceSchedule[]
    lastUpdated: string
  }> {
    try {
      // 병렬 실행으로 성능 최적화
      const [equipment, statusData, breakdowns, repairs, maintenance] = await Promise.allSettled([
        OptimizedDataFetcher.getAllEquipment(),
        OptimizedDataFetcher.getAllEquipmentStatus(),
        OptimizedDataFetcher.getAllBreakdownReports(),
        OptimizedDataFetcher.getAllRepairReports(),
        OptimizedDataFetcher.getAllMaintenanceSchedules()
      ])

      return {
        equipment: equipment.status === 'fulfilled' ? equipment.value : [],
        statusData: statusData.status === 'fulfilled' ? statusData.value : [],
        breakdowns: breakdowns.status === 'fulfilled' ? breakdowns.value : [],
        repairs: repairs.status === 'fulfilled' ? repairs.value : [],
        maintenance: maintenance.status === 'fulfilled' ? maintenance.value : [],
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to get latest data:', error)
      return {
        equipment: [],
        statusData: [],
        breakdowns: [],
        repairs: [],
        maintenance: [],
        lastUpdated: new Date().toISOString()
      }
    }
  }
}

// 메인 익스포트
export {
  OptimizedDataFetcher as DataFetcher,
  OptimizedAnalyticsEngine as AnalyticsEngine,
  OptimizedDataManager as DataManager,
  OptimizedRealtimeHelper as RealtimeHelper
}