'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useUnifiedState, UnifiedStateReturn } from '@/hooks/useUnifiedState'

/**
 * [SRP] Rule: 전역 상태 제공만을 담당하는 Context
 * 모든 페이지와 컴포넌트에서 동일한 상태 인스턴스를 공유
 */
const GlobalStateContext = createContext<UnifiedStateReturn | undefined>(undefined)

interface GlobalStateProviderProps {
  children: ReactNode
}

/**
 * [DIP] Rule: 구체적인 상태 관리 구현에 의존하지 않는 Provider
 * useUnifiedState Hook을 통해 추상화된 인터페이스 사용
 */
export function GlobalStateProvider({ children }: GlobalStateProviderProps) {
  // useUnifiedState는 내부적으로 싱글톤 StateManager를 사용
  // 이 Provider는 한 번만 생성되어 앱 전체에서 재사용됨
  const unifiedState = useUnifiedState()

  return (
    <GlobalStateContext.Provider value={unifiedState}>
      {children}
    </GlobalStateContext.Provider>
  )
}

/**
 * [ISP] Rule: 필요한 상태만 선택적으로 사용할 수 있는 Hook
 * 전체 상태 또는 특정 부분만 선택하여 사용 가능
 */
export function useGlobalState(): UnifiedStateReturn {
  const context = useContext(GlobalStateContext)
  
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider')
  }
  
  return context
}

/**
 * 특정 데이터만 선택하는 커스텀 Hook들
 * [SRP] Rule: 각 Hook은 특정 도메인 데이터만 제공
 */
export function useEquipments() {
  const { equipments, loading, errors, actions } = useGlobalState()
  return {
    equipments,
    loading: loading.equipments,
    error: errors.equipments,
    refresh: actions.refreshEquipments
  }
}

export function useEquipmentStatuses() {
  const { equipmentStatuses, loading, errors, actions } = useGlobalState()
  return {
    statuses: equipmentStatuses,
    loading: loading.statuses,
    error: errors.statuses,
    refresh: actions.refreshStatuses,
    updateStatus: actions.updateEquipmentStatus,
    changeStatus: actions.changeEquipmentStatus
  }
}

export function useBreakdownReports() {
  const { breakdownReports, loading, errors, actions } = useGlobalState()
  return {
    breakdowns: breakdownReports,
    loading: loading.breakdowns,
    error: errors.breakdowns,
    refresh: actions.refreshBreakdowns,
    create: actions.createBreakdownReport
  }
}

export function useDashboard() {
  const { dashboardData, loading, errors, actions, derived } = useGlobalState()
  return {
    data: dashboardData,
    loading: loading.dashboard,
    error: errors.dashboard,
    refresh: actions.refreshDashboard,
    statistics: derived.getStatistics()
  }
}

/**
 * 디버깅용 Hook
 */
export function useGlobalStateDebug() {
  const state = useGlobalState()
  
  return {
    ...state,
    debugInfo: {
      equipmentCount: state.equipments.length,
      statusCount: state.equipmentStatuses.length,
      breakdownCount: state.breakdownReports.length,
      hasDashboard: !!state.dashboardData,
      loadingStates: state.loading,
      errors: state.errors,
      meta: state.meta
    }
  }
}