// [SRP] Rule: 전역 상태 관리만을 담당하는 단일 책임 클래스
// [DIP] Rule: 구체적인 구현에 의존하지 않는 추상화된 상태 관리자

import { EventEmitter } from 'events'
import { Equipment, EquipmentStatusInfo } from '@/types/equipment'
import { BreakdownReport } from '@/types/breakdown'
import { DashboardData } from '@/types/dashboard'

/**
 * 단일 상태 소스(Single Source of Truth) 관리자
 * 설비-고장-수리 간의 관계형 데이터 상태를 통합 관리
 */
export interface GlobalState {
  equipments: Map<string, Equipment>
  equipmentStatuses: Map<string, EquipmentStatusInfo>
  breakdownReports: Map<string, BreakdownReport>
  repairReports: Map<string, any>
  dashboardCache: DashboardData | null
  lastUpdated: {
    equipments: number
    statuses: number
    breakdowns: number
    repairs: number
    dashboard: number
  }
}

export interface StateChangeEvent {
  type: 'equipment' | 'status' | 'breakdown' | 'repair' | 'dashboard'
  action: 'create' | 'update' | 'delete' | 'refresh'
  data: any
  timestamp: number
}

/**
 * [OCP] Rule: 확장에는 열리고 수정에는 닫힌 상태 관리자
 * 새로운 데이터 타입 추가 시 기존 코드 수정 없이 확장 가능
 */
export abstract class BaseStateManager extends EventEmitter {
  protected state: GlobalState

  constructor() {
    super()
    this.state = this.initializeState()
  }

  protected initializeState(): GlobalState {
    return {
      equipments: new Map(),
      equipmentStatuses: new Map(),
      breakdownReports: new Map(),
      repairReports: new Map(),
      dashboardCache: null,
      lastUpdated: {
        equipments: 0,
        statuses: 0,
        breakdowns: 0,
        repairs: 0,
        dashboard: 0
      }
    }
  }

  // [ISP] Rule: 인터페이스 분리 - 각 데이터 타입별 접근자
  abstract getEquipments(): Map<string, Equipment>
  abstract getEquipmentStatuses(): Map<string, EquipmentStatusInfo>
  abstract getBreakdownReports(): Map<string, BreakdownReport>
  abstract getDashboardData(): DashboardData | null

  // 상태 변경 이벤트 발행
  protected emitStateChange(event: StateChangeEvent): void {
    this.emit('stateChange', event)
    this.emit(`${event.type}Change`, event)
  }
}

/**
 * [LSP] Rule: 상위 클래스를 완벽히 대체 가능한 구현체
 */
export class StateManager extends BaseStateManager {
  private static instance: StateManager
  
  // 싱글톤 패턴으로 단일 상태 소스 보장
  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager()
    }
    return StateManager.instance
  }

  // [SRP] Rule: 설비 정보 관리만 담당
  public setEquipments(equipments: Equipment[]): void {
    this.state.equipments.clear()
    equipments.forEach(equipment => {
      this.state.equipments.set(equipment.id, equipment)
    })
    this.state.lastUpdated.equipments = Date.now()
    
    this.emitStateChange({
      type: 'equipment',
      action: 'refresh',
      data: equipments,
      timestamp: Date.now()
    })
  }

  public updateEquipment(equipment: Equipment): void {
    this.state.equipments.set(equipment.id, equipment)
    this.state.lastUpdated.equipments = Date.now()
    
    this.emitStateChange({
      type: 'equipment',
      action: 'update',
      data: equipment,
      timestamp: Date.now()
    })
  }

  // [SRP] Rule: 설비 상태 관리만 담당
  public setEquipmentStatuses(statuses: EquipmentStatusInfo[]): void {
    this.state.equipmentStatuses.clear()
    statuses.forEach(status => {
      this.state.equipmentStatuses.set(status.equipmentId, status)
    })
    this.state.lastUpdated.statuses = Date.now()
    
    this.emitStateChange({
      type: 'status',
      action: 'refresh',
      data: statuses,
      timestamp: Date.now()
    })
  }

  public updateEquipmentStatus(status: EquipmentStatusInfo): void {
    this.state.equipmentStatuses.set(status.equipmentId, status)
    this.state.lastUpdated.statuses = Date.now()
    
    // 관련 설비 정보와 함께 동기화
    const equipment = this.state.equipments.get(status.equipmentId)
    if (equipment) {
      this.emitStateChange({
        type: 'status',
        action: 'update',
        data: { status, equipment },
        timestamp: Date.now()
      })
    }
  }

  // [SRP] Rule: 고장 보고 관리만 담당
  public setBreakdownReports(reports: BreakdownReport[]): void {
    this.state.breakdownReports.clear()
    reports.forEach(report => {
      this.state.breakdownReports.set(report.id, report)
    })
    this.state.lastUpdated.breakdowns = Date.now()
    
    this.emitStateChange({
      type: 'breakdown',
      action: 'refresh',
      data: reports,
      timestamp: Date.now()
    })
  }

  public addBreakdownReport(report: BreakdownReport): void {
    this.state.breakdownReports.set(report.id, report)
    this.state.lastUpdated.breakdowns = Date.now()
    
    // 관련 설비 상태 자동 업데이트
    this.updateEquipmentStatusFromBreakdown(report)
    
    this.emitStateChange({
      type: 'breakdown',
      action: 'create',
      data: report,
      timestamp: Date.now()
    })
  }

  // [SRP] Rule: 대시보드 캐시 관리만 담당
  public setDashboardData(data: DashboardData): void {
    this.state.dashboardCache = data
    this.state.lastUpdated.dashboard = Date.now()
    
    this.emitStateChange({
      type: 'dashboard',
      action: 'refresh',
      data,
      timestamp: Date.now()
    })
  }

  // [ISP] Rule: 읽기 전용 접근자들
  public getEquipments(): Map<string, Equipment> {
    return new Map(this.state.equipments)
  }

  public getEquipmentStatuses(): Map<string, EquipmentStatusInfo> {
    return new Map(this.state.equipmentStatuses)
  }

  public getBreakdownReports(): Map<string, BreakdownReport> {
    return new Map(this.state.breakdownReports)
  }

  public getDashboardData(): DashboardData | null {
    return this.state.dashboardCache
  }

  // 관계형 데이터 조회 메서드들
  public getEquipmentWithStatus(equipmentId: string): { equipment: Equipment; status?: EquipmentStatusInfo } | null {
    const equipment = this.state.equipments.get(equipmentId)
    if (!equipment) return null
    
    const status = this.state.equipmentStatuses.get(equipmentId)
    return { equipment, status }
  }

  public getBreakdownsByEquipment(equipmentId: string): BreakdownReport[] {
    return Array.from(this.state.breakdownReports.values())
      .filter(report => report.equipmentId === equipmentId)
  }

  // 워크플로우 기반 상태 전환
  private updateEquipmentStatusFromBreakdown(report: BreakdownReport): void {
    const currentStatus = this.state.equipmentStatuses.get(report.equipmentId)
    if (currentStatus && currentStatus.status !== 'breakdown') {
      const updatedStatus: EquipmentStatusInfo = {
        ...currentStatus,
        status: 'breakdown',
        statusReason: `고장 신고: ${report.breakdownTitle}`,
        statusChangedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      this.updateEquipmentStatus(updatedStatus)
    }
  }

  // 상태 동기화 상태 확인
  public getLastUpdated(type: keyof GlobalState['lastUpdated']): number {
    return this.state.lastUpdated[type]
  }

  // 전체 상태 리셋 (테스트 및 초기화용)
  public reset(): void {
    this.state = this.initializeState()
    this.emitStateChange({
      type: 'dashboard',
      action: 'refresh',
      data: null,
      timestamp: Date.now()
    })
  }
}

// 전역 상태 관리자 인스턴스 내보내기
export const globalStateManager = StateManager.getInstance()