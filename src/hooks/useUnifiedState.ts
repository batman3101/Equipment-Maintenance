// [SRP] Rule: 통합 상태 관리와 실시간 동기화만을 담당하는 Hook
// [DIP] Rule: 구체적인 상태 관리 구현에 의존하지 않는 추상화된 Hook

import { useState, useEffect, useCallback, useMemo } from 'react'
import { globalStateManager, StateChangeEvent } from '@/lib/state-management/StateManager'
import { dataSynchronizer } from '@/lib/state-management/DataSynchronizer'
import { apiService } from '@/lib/api/unified-api-service'
import { Equipment, EquipmentStatusInfo } from '@/types/equipment'
import { BreakdownReport } from '@/types/breakdown'
import { DashboardData } from '@/types/dashboard'

/**
 * 통합 상태 관리 Hook의 반환 타입
 * [ISP] Rule: 각 도메인별로 인터페이스 분리
 */
export interface UnifiedStateReturn {
  // 데이터 상태
  equipments: Equipment[]
  equipmentStatuses: EquipmentStatusInfo[]
  breakdownReports: BreakdownReport[]
  dashboardData: DashboardData | null

  // 로딩 상태
  loading: {
    equipments: boolean
    statuses: boolean
    breakdowns: boolean
    dashboard: boolean
    global: boolean
  }

  // 에러 상태
  errors: {
    equipments: string | null
    statuses: string | null
    breakdowns: string | null
    dashboard: string | null
  }

  // 동작 함수들
  actions: {
    refreshAll: () => Promise<void>
    refreshEquipments: () => Promise<void>
    refreshStatuses: () => Promise<void>
    refreshBreakdowns: () => Promise<void>
    refreshDashboard: () => Promise<void>
    createEquipment: (equipment: Partial<Equipment>) => Promise<Equipment | null>
    updateEquipmentStatus: (equipmentId: string, status: Partial<EquipmentStatusInfo>) => Promise<void>
    createBreakdownReport: (report: Partial<BreakdownReport>) => Promise<BreakdownReport | null>
  }

  // 관계형 데이터 접근자
  derived: {
    getEquipmentWithStatus: (equipmentId: string) => { equipment: Equipment; status?: EquipmentStatusInfo } | null
    getBreakdownsByEquipment: (equipmentId: string) => BreakdownReport[]
    getEquipmentsByStatus: (status: string) => Equipment[]
    getStatistics: () => {
      total: number
      running: number
      breakdown: number
      maintenance: number
      standby: number
      stopped: number
    }
  }

  // 메타 정보
  meta: {
    lastUpdated: {
      equipments: number
      statuses: number
      breakdowns: number
      dashboard: number
    }
    isRealTimeActive: boolean
    cacheStatus: {
      equipments: boolean
      dashboard: boolean
    }
  }
}

/**
 * [SRP] Rule: 통합 상태 관리만을 담당하는 Hook
 * 모든 페이지와 컴포넌트에서 동일한 상태를 공유하여 단일 상태 소스 구현
 */
export function useUnifiedState(): UnifiedStateReturn {
  // 로컬 상태 (리렌더링 트리거용)
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [equipmentStatuses, setEquipmentStatuses] = useState<EquipmentStatusInfo[]>([])
  const [breakdownReports, setBreakdownReports] = useState<BreakdownReport[]>([])
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  
  const [loading, setLoading] = useState({
    equipments: true,
    statuses: true,
    breakdowns: true,
    dashboard: true,
    global: true
  })

  const [errors, setErrors] = useState({
    equipments: null as string | null,
    statuses: null as string | null,
    breakdowns: null as string | null,
    dashboard: null as string | null
  })

  const [isRealTimeActive, setIsRealTimeActive] = useState(false)

  // [SRP] Rule: 상태 동기화만 담당하는 함수
  const syncStateFromGlobal = useCallback(() => {
    const globalEquipments = Array.from(globalStateManager.getEquipments().values())
    const globalStatuses = Array.from(globalStateManager.getEquipmentStatuses().values())
    const globalBreakdowns = Array.from(globalStateManager.getBreakdownReports().values())
    const globalDashboard = globalStateManager.getDashboardData()

    setEquipments(globalEquipments)
    setEquipmentStatuses(globalStatuses)
    setBreakdownReports(globalBreakdowns)
    setDashboardData(globalDashboard)
  }, [])

  // [SRP] Rule: 상태 변경 이벤트 처리만 담당
  const handleStateChange = useCallback((event: StateChangeEvent) => {
    switch (event.type) {
      case 'equipment':
        setEquipments(Array.from(globalStateManager.getEquipments().values()))
        setLoading(prev => ({ ...prev, equipments: false }))
        break
      case 'status':
        setEquipmentStatuses(Array.from(globalStateManager.getEquipmentStatuses().values()))
        setLoading(prev => ({ ...prev, statuses: false }))
        break
      case 'breakdown':
        setBreakdownReports(Array.from(globalStateManager.getBreakdownReports().values()))
        setLoading(prev => ({ ...prev, breakdowns: false }))
        break
      case 'dashboard':
        setDashboardData(globalStateManager.getDashboardData())
        setLoading(prev => ({ ...prev, dashboard: false }))
        break
    }

    // 전체 로딩 상태 업데이트
    setLoading(prev => ({
      ...prev,
      global: prev.equipments || prev.statuses || prev.breakdowns || prev.dashboard
    }))
  }, [])

  // 실시간 동기화 시작
  useEffect(() => {
    const startSynchronization = async () => {
      try {
        // 글로벌 상태 관리자 이벤트 구독
        globalStateManager.on('stateChange', handleStateChange)
        
        // 실시간 데이터 동기화 시작
        await dataSynchronizer.startSynchronization()
        setIsRealTimeActive(true)
        
        // 초기 상태 동기화
        syncStateFromGlobal()
        
        setLoading({
          equipments: false,
          statuses: false,
          breakdowns: false,
          dashboard: false,
          global: false
        })
      } catch (error) {
        console.error('Failed to start synchronization:', error)
        setErrors(prev => ({
          ...prev,
          equipments: 'Failed to load equipments',
          statuses: 'Failed to load statuses',
          breakdowns: 'Failed to load breakdowns',
          dashboard: 'Failed to load dashboard'
        }))
        setLoading({
          equipments: false,
          statuses: false,
          breakdowns: false,
          dashboard: false,
          global: false
        })
      }
    }

    startSynchronization()

    // 클린업
    return () => {
      globalStateManager.off('stateChange', handleStateChange)
      dataSynchronizer.stopSynchronization()
      setIsRealTimeActive(false)
    }
  }, [handleStateChange, syncStateFromGlobal])

  // [SRP] Rule: 개별 데이터 새로고침만 담당하는 액션들
  const refreshEquipments = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, equipments: true }))
      setErrors(prev => ({ ...prev, equipments: null }))
      
      const response = await apiService.getEquipments()
      if (response.success && response.data) {
        globalStateManager.setEquipments(response.data)
      } else {
        throw new Error(response.error || 'Failed to fetch equipments')
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, equipments: error instanceof Error ? error.message : 'Unknown error' }))
    } finally {
      setLoading(prev => ({ ...prev, equipments: false }))
    }
  }, [])

  const refreshStatuses = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, statuses: true }))
      setErrors(prev => ({ ...prev, statuses: null }))
      
      const response = await apiService.getEquipmentStatuses()
      if (response.success && response.data) {
        globalStateManager.setEquipmentStatuses(response.data)
      } else {
        throw new Error(response.error || 'Failed to fetch statuses')
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, statuses: error instanceof Error ? error.message : 'Unknown error' }))
    } finally {
      setLoading(prev => ({ ...prev, statuses: false }))
    }
  }, [])

  const refreshBreakdowns = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, breakdowns: true }))
      setErrors(prev => ({ ...prev, breakdowns: null }))
      
      const response = await apiService.getBreakdownReports()
      if (response.success && response.data) {
        globalStateManager.setBreakdownReports(response.data)
      } else {
        throw new Error(response.error || 'Failed to fetch breakdowns')
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, breakdowns: error instanceof Error ? error.message : 'Unknown error' }))
    } finally {
      setLoading(prev => ({ ...prev, breakdowns: false }))
    }
  }, [])

  const refreshDashboard = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, dashboard: true }))
      setErrors(prev => ({ ...prev, dashboard: null }))
      
      const response = await apiService.refreshDashboardData()
      if (response.success && response.data) {
        globalStateManager.setDashboardData(response.data)
      } else {
        throw new Error(response.error || 'Failed to refresh dashboard')
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, dashboard: error instanceof Error ? error.message : 'Unknown error' }))
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }))
    }
  }, [])

  const refreshAll = useCallback(async () => {
    try {
      setLoading({
        equipments: true,
        statuses: true,
        breakdowns: true,
        dashboard: true,
        global: true
      })
      
      await dataSynchronizer.forceSyncAll()
      await refreshDashboard()
      
      setLoading({
        equipments: false,
        statuses: false,
        breakdowns: false,
        dashboard: false,
        global: false
      })
    } catch (error) {
      console.error('Failed to refresh all data:', error)
    }
  }, [refreshDashboard])

  // [SRP] Rule: 데이터 생성/수정만 담당하는 액션들
  const createEquipment = useCallback(async (equipment: Partial<Equipment>): Promise<Equipment | null> => {
    try {
      const response = await apiService.createEquipment(equipment)
      if (response.success && response.data) {
        globalStateManager.updateEquipment(response.data)
        return response.data
      }
      return null
    } catch (error) {
      console.error('Failed to create equipment:', error)
      return null
    }
  }, [])

  const updateEquipmentStatus = useCallback(async (
    equipmentId: string, 
    status: Partial<EquipmentStatusInfo>
  ): Promise<void> => {
    try {
      const response = await apiService.updateEquipmentStatus(equipmentId, status)
      if (response.success && response.data) {
        globalStateManager.updateEquipmentStatus(response.data)
      }
    } catch (error) {
      console.error('Failed to update equipment status:', error)
    }
  }, [])

  const createBreakdownReport = useCallback(async (
    report: Partial<BreakdownReport>
  ): Promise<BreakdownReport | null> => {
    try {
      const response = await apiService.createBreakdownReport(report)
      if (response.success && response.data) {
        globalStateManager.addBreakdownReport(response.data)
        return response.data
      }
      return null
    } catch (error) {
      console.error('Failed to create breakdown report:', error)
      return null
    }
  }, [])

  // [SRP] Rule: 관계형 데이터 접근만 담당하는 파생 상태들
  const derived = useMemo(() => ({
    getEquipmentWithStatus: (equipmentId: string) => {
      return globalStateManager.getEquipmentWithStatus(equipmentId)
    },

    getBreakdownsByEquipment: (equipmentId: string) => {
      return globalStateManager.getBreakdownsByEquipment(equipmentId)
    },

    getEquipmentsByStatus: (status: string) => {
      return equipments.filter(equipment => {
        const statusInfo = equipmentStatuses.find(s => s.equipmentId === equipment.id)
        return statusInfo?.status === status
      })
    },

    getStatistics: () => {
      const total = equipments.length
      const statusCounts = equipmentStatuses.reduce((acc, status) => {
        acc[status.status] = (acc[status.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        total,
        running: statusCounts.running || 0,
        breakdown: statusCounts.breakdown || 0,
        maintenance: statusCounts.maintenance || 0,
        standby: statusCounts.standby || 0,
        stopped: statusCounts.stopped || 0
      }
    }
  }), [equipments, equipmentStatuses])

  // 메타 정보
  const meta = useMemo(() => ({
    lastUpdated: {
      equipments: globalStateManager.getLastUpdated('equipments'),
      statuses: globalStateManager.getLastUpdated('statuses'),
      breakdowns: globalStateManager.getLastUpdated('breakdowns'),
      dashboard: globalStateManager.getLastUpdated('dashboard')
    },
    isRealTimeActive,
    cacheStatus: {
      equipments: globalStateManager.getLastUpdated('equipments') > Date.now() - 5 * 60 * 1000, // 5분 이내
      dashboard: globalStateManager.getLastUpdated('dashboard') > Date.now() - 4 * 60 * 1000 // 4분 이내
    }
  }), [isRealTimeActive])

  return {
    // 데이터 상태
    equipments,
    equipmentStatuses,
    breakdownReports,
    dashboardData,

    // 로딩 상태
    loading,

    // 에러 상태
    errors,

    // 동작 함수들
    actions: {
      refreshAll,
      refreshEquipments,
      refreshStatuses,
      refreshBreakdowns,
      refreshDashboard,
      createEquipment,
      updateEquipmentStatus,
      createBreakdownReport
    },

    // 관계형 데이터 접근자
    derived,

    // 메타 정보
    meta
  }
}