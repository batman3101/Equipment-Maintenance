/**
 * 설비 상태 동기화 유틸리티
 * 상태 변경 시 관련 데이터의 일관성을 자동으로 유지
 */

import { globalStateManager } from '@/lib/state-management/StateManager'
import { apiService } from '@/lib/api/unified-api-service'
import { EquipmentInfo, EquipmentStatusInfo } from '@/lib/supabase-unified'
import { BreakdownReport } from '@/types/breakdown'

/**
 * 설비 상태 변경 이벤트 타입
 */
export interface StatusChangeEvent {
  equipmentId: string
  oldStatus?: string
  newStatus: string
  reason: 'breakdown' | 'repair_complete' | 'manual' | 'maintenance'
  relatedId?: string // 고장 신고 ID 또는 수리 ID
  timestamp: number
}

/**
 * 상태 동기화 결과
 */
export interface SyncResult {
  success: boolean
  updatedEntities: {
    equipment: boolean
    status: boolean
    breakdown: boolean
    related: string[]
  }
  errors: string[]
}

/**
 * [SRP] Rule: 상태 동기화만을 담당하는 클래스
 * 설비 상태 변경 시 모든 관련 데이터의 일관성을 보장
 */
export class StatusSynchronizer {
  private static instance: StatusSynchronizer
  private syncInProgress = new Set<string>()

  public static getInstance(): StatusSynchronizer {
    if (!StatusSynchronizer.instance) {
      StatusSynchronizer.instance = new StatusSynchronizer()
    }
    return StatusSynchronizer.instance
  }

  /**
   * 설비 상태 변경 및 관련 데이터 동기화
   */
  public async changeEquipmentStatus(
    equipmentId: string,
    newStatus: string,
    reason: StatusChangeEvent['reason'],
    relatedId?: string
  ): Promise<SyncResult> {
    // 중복 동기화 방지
    if (this.syncInProgress.has(equipmentId)) {
      return {
        success: false,
        updatedEntities: { equipment: false, status: false, breakdown: false, related: [] },
        errors: ['동기화가 이미 진행 중입니다']
      }
    }

    this.syncInProgress.add(equipmentId)

    try {
      const result: SyncResult = {
        success: true,
        updatedEntities: { equipment: false, status: false, breakdown: false, related: [] },
        errors: []
      }

      // 1. 현재 상태 확인
      const currentEquipment = globalStateManager.getEquipments().get(equipmentId)
      const currentStatus = globalStateManager.getEquipmentStatuses().get(equipmentId)

      if (!currentEquipment) {
        throw new Error(`설비를 찾을 수 없습니다: ${equipmentId}`)
      }

      const oldStatus = currentStatus?.status

      // 2. 설비 상태 업데이트
      const statusUpdate: Partial<EquipmentStatusInfo> = {
        status: newStatus,
        last_status_change: new Date().toISOString(),
        notes: this.generateStatusChangeNote(reason, oldStatus, newStatus)
      }

      // 상태별 추가 필드 설정
      switch (newStatus) {
        case 'breakdown':
          statusUpdate.breakdown_start_time = new Date().toISOString()
          break
        case 'running':
          if (oldStatus === 'breakdown') {
            statusUpdate.last_repair_date = new Date().toISOString()
          }
          statusUpdate.breakdown_start_time = null
          break
        case 'maintenance':
          statusUpdate.maintenance_start_time = new Date().toISOString()
          break
      }

      // API 호출로 상태 업데이트
      const updateResponse = await apiService.updateEquipmentStatus(equipmentId, statusUpdate)
      if (updateResponse.success) {
        // 글로벌 상태 업데이트
        const updatedStatus = { ...currentStatus, ...statusUpdate, equipment_id: equipmentId }
        globalStateManager.updateEquipmentStatus(equipmentId, updatedStatus)
        result.updatedEntities.status = true
      } else {
        result.errors.push(`상태 업데이트 실패: ${updateResponse.error}`)
        result.success = false
      }

      // 3. 관련 데이터 동기화
      await this.syncRelatedData(reason, equipmentId, newStatus, oldStatus, relatedId, result)

      // 4. 상태 변경 이벤트 발생
      this.emitStatusChangeEvent({
        equipmentId,
        oldStatus,
        newStatus,
        reason,
        relatedId,
        timestamp: Date.now()
      })

      return result

    } catch (error) {
      return {
        success: false,
        updatedEntities: { equipment: false, status: false, breakdown: false, related: [] },
        errors: [error instanceof Error ? error.message : '알 수 없는 오류']
      }
    } finally {
      this.syncInProgress.delete(equipmentId)
    }
  }

  /**
   * 관련 데이터 동기화
   */
  private async syncRelatedData(
    reason: StatusChangeEvent['reason'],
    equipmentId: string,
    newStatus: string,
    oldStatus: string | undefined,
    relatedId: string | undefined,
    result: SyncResult
  ): Promise<void> {
    try {
      switch (reason) {
        case 'breakdown':
          await this.handleBreakdownSync(equipmentId, newStatus, relatedId, result)
          break

        case 'repair_complete':
          await this.handleRepairCompleteSync(equipmentId, newStatus, relatedId, result)
          break

        case 'maintenance':
          await this.handleMaintenanceSync(equipmentId, newStatus, result)
          break

        case 'manual':
          // 수동 변경의 경우 기본 동기화만 수행
          await this.handleManualSync(equipmentId, newStatus, oldStatus, result)
          break
      }
    } catch (error) {
      result.errors.push(`관련 데이터 동기화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }
  }

  /**
   * 고장 발생 시 동기화
   */
  private async handleBreakdownSync(
    equipmentId: string,
    newStatus: string,
    breakdownId: string | undefined,
    result: SyncResult
  ): Promise<void> {
    if (breakdownId) {
      // 기존 고장 신고가 있는 경우 상태 업데이트
      const breakdown = globalStateManager.getBreakdownReports().get(breakdownId)
      if (breakdown) {
        const updatedBreakdown = {
          ...breakdown,
          status: 'in_progress',
          equipment_status_at_breakdown: newStatus
        }
        globalStateManager.updateBreakdownReport(breakdownId, updatedBreakdown)
        result.updatedEntities.breakdown = true
        result.updatedEntities.related.push(`breakdown:${breakdownId}`)
      }
    }

    // 자동 알림 생성
    await this.createAutomaticNotification(
      equipmentId,
      'breakdown_detected',
      `설비 ${equipmentId}에서 고장이 감지되었습니다`
    )
  }

  /**
   * 수리 완료 시 동기화
   */
  private async handleRepairCompleteSync(
    equipmentId: string,
    newStatus: string,
    repairId: string | undefined,
    result: SyncResult
  ): Promise<void> {
    // 관련된 고장 신고 완료 처리
    const breakdownReports = Array.from(globalStateManager.getBreakdownReports().values())
    const relatedBreakdowns = breakdownReports.filter(br => 
      br.equipment_id === equipmentId && 
      (br.status === 'in_progress' || br.status === 'reported')
    )

    for (const breakdown of relatedBreakdowns) {
      const updatedBreakdown = {
        ...breakdown,
        status: 'completed',
        resolution_date: new Date().toISOString(),
        notes: `${breakdown.notes || ''}\n수리 완료로 인한 자동 완료 처리`
      }
      globalStateManager.updateBreakdownReport(breakdown.id, updatedBreakdown)
      result.updatedEntities.related.push(`breakdown:${breakdown.id}`)
    }

    result.updatedEntities.breakdown = relatedBreakdowns.length > 0

    // 수리 완료 알림
    await this.createAutomaticNotification(
      equipmentId,
      'repair_completed',
      `설비 ${equipmentId}의 수리가 완료되었습니다`
    )
  }

  /**
   * 정비 시작 시 동기화
   */
  private async handleMaintenanceSync(
    equipmentId: string,
    newStatus: string,
    result: SyncResult
  ): Promise<void> {
    // 정비 알림 생성
    await this.createAutomaticNotification(
      equipmentId,
      'maintenance_started',
      `설비 ${equipmentId}의 정비가 시작되었습니다`
    )
  }

  /**
   * 수동 변경 시 동기화
   */
  private async handleManualSync(
    equipmentId: string,
    newStatus: string,
    oldStatus: string | undefined,
    result: SyncResult
  ): Promise<void> {
    // 상태 변경에 따른 기본 정리 작업
    if (oldStatus === 'breakdown' && newStatus === 'running') {
      // 고장 상태에서 운영 상태로 변경 시 관련 고장 신고 완료 처리
      await this.handleRepairCompleteSync(equipmentId, newStatus, undefined, result)
    }
  }

  /**
   * 자동 알림 생성
   */
  private async createAutomaticNotification(
    equipmentId: string,
    type: string,
    message: string
  ): Promise<void> {
    try {
      // TODO: system_notifications 테이블에 알림 추가
      const notification = {
        equipment_id: equipmentId,
        notification_type: type,
        message,
        severity: type.includes('breakdown') ? 'high' : 'medium',
        created_at: new Date().toISOString(),
        is_read: false
      }

      // 글로벌 상태에 알림 추가 (API 호출은 나중에 구현)
      console.log('Auto notification created:', notification)
    } catch (error) {
      console.warn('Failed to create automatic notification:', error)
    }
  }

  /**
   * 상태 변경 노트 생성
   */
  private generateStatusChangeNote(
    reason: StatusChangeEvent['reason'],
    oldStatus: string | undefined,
    newStatus: string
  ): string {
    const timestamp = new Date().toLocaleString('ko-KR')
    const reasonText = {
      breakdown: '고장 발생',
      repair_complete: '수리 완료',
      manual: '수동 변경',
      maintenance: '정비 시작'
    }[reason]

    return `[${timestamp}] ${reasonText}: ${oldStatus || '알 수 없음'} → ${newStatus}`
  }

  /**
   * 상태 변경 이벤트 발생
   */
  private emitStatusChangeEvent(event: StatusChangeEvent): void {
    globalStateManager.emitStateChange({
      type: 'status_change',
      action: 'update',
      data: event,
      timestamp: event.timestamp
    })
  }

  /**
   * 일괄 상태 동기화 (시스템 초기화 시)
   */
  public async syncAllStatuses(): Promise<{
    synchronized: number
    errors: string[]
  }> {
    const result = { synchronized: 0, errors: [] }
    
    try {
      const equipments = Array.from(globalStateManager.getEquipments().values())
      const statuses = globalStateManager.getEquipmentStatuses()
      const breakdowns = Array.from(globalStateManager.getBreakdownReports().values())

      for (const equipment of equipments) {
        try {
          const status = statuses.get(equipment.id)
          
          // 고장 신고가 있는데 상태가 running인 경우 수정
          const activeBreakdowns = breakdowns.filter(br => 
            br.equipment_id === equipment.id && 
            (br.status === 'reported' || br.status === 'in_progress')
          )

          if (activeBreakdowns.length > 0 && status?.status === 'running') {
            await this.changeEquipmentStatus(
              equipment.id,
              'breakdown',
              'breakdown',
              activeBreakdowns[0].id
            )
            result.synchronized++
          }

          // 완료된 고장 신고가 있는데 상태가 breakdown인 경우 수정
          const completedBreakdowns = breakdowns.filter(br => 
            br.equipment_id === equipment.id && 
            br.status === 'completed'
          )

          if (completedBreakdowns.length > 0 && activeBreakdowns.length === 0 && status?.status === 'breakdown') {
            await this.changeEquipmentStatus(
              equipment.id,
              'running',
              'repair_complete'
            )
            result.synchronized++
          }

        } catch (error) {
          result.errors.push(`설비 ${equipment.id} 동기화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        }
      }

    } catch (error) {
      result.errors.push(`전체 동기화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }

    return result
  }
}

// 싱글톤 인스턴스 내보내기
export const statusSynchronizer = StatusSynchronizer.getInstance()