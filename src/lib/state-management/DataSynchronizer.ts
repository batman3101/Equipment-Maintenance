// [SRP] Rule: 실시간 데이터 동기화만을 담당하는 클래스
// [OCP] Rule: 새로운 동기화 전략 추가 시 기존 코드 수정 없이 확장 가능

import { globalStateManager, StateChangeEvent } from './StateManager'
import { supabase } from '@/lib/supabase'
import { Equipment, EquipmentStatusInfo } from '@/types/equipment'
import { BreakdownReport } from '@/types/breakdown'

/**
 * [ISP] Rule: 동기화 전략별로 인터페이스 분리
 */
export interface SyncStrategy {
  sync(): Promise<void>
  subscribe(): void
  unsubscribe(): void
}

export interface RealtimeEvent {
  table: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  record: any
  old_record?: any
}

/**
 * [DIP] Rule: 추상화에 의존하는 기본 동기화 클래스
 */
export abstract class BaseSynchronizer implements SyncStrategy {
  protected tableName: string
  protected subscription: any = null

  constructor(tableName: string) {
    this.tableName = tableName
  }

  abstract sync(): Promise<void>
  abstract handleRealtimeEvent(event: RealtimeEvent): void

  subscribe(): void {
    this.subscription = supabase
      .channel(`${this.tableName}_changes`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: this.tableName
      }, (payload) => {
        this.handleRealtimeEvent({
          table: this.tableName,
          action: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          record: payload.new,
          old_record: payload.old
        })
      })
      .subscribe()
  }

  unsubscribe(): void {
    if (this.subscription) {
      supabase.removeChannel(this.subscription)
      this.subscription = null
    }
  }
}

/**
 * [LSP] Rule: 설비 정보 동기화 - 상위 클래스를 완벽히 대체
 */
export class EquipmentSynchronizer extends BaseSynchronizer {
  constructor() {
    super('equipment_info')
  }

  async sync(): Promise<void> {
    try {
      const { data: equipments, error } = await supabase
        .from('equipment_info')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // 데이터 변환 (DB -> TypeScript 타입)
      const transformedEquipments: Equipment[] = equipments.map(eq => ({
        id: eq.id,
        equipmentNumber: eq.equipment_number,
        equipmentName: eq.equipment_name,
        category: eq.category,
        location: eq.location,
        manufacturer: eq.manufacturer,
        model: eq.model,
        installationDate: eq.installation_date,
        specifications: eq.specifications,
        createdAt: eq.created_at,
        updatedAt: eq.updated_at
      }))

      globalStateManager.setEquipments(transformedEquipments)
    } catch (error) {
      console.error('Equipment sync error:', error)
    }
  }

  handleRealtimeEvent(event: RealtimeEvent): void {
    switch (event.action) {
      case 'INSERT':
      case 'UPDATE':
        const equipment: Equipment = {
          id: event.record.id,
          equipmentNumber: event.record.equipment_number,
          equipmentName: event.record.equipment_name,
          category: event.record.category,
          location: event.record.location,
          manufacturer: event.record.manufacturer,
          model: event.record.model,
          installationDate: event.record.installation_date,
          specifications: event.record.specifications,
          createdAt: event.record.created_at,
          updatedAt: event.record.updated_at
        }
        globalStateManager.updateEquipment(equipment)
        break
      
      case 'DELETE':
        // 삭제 처리는 별도 메서드로 구현 필요
        break
    }
  }
}

/**
 * [LSP] Rule: 설비 상태 동기화 - 상위 클래스를 완벽히 대체
 */
export class EquipmentStatusSynchronizer extends BaseSynchronizer {
  constructor() {
    super('equipment_status')
  }

  async sync(): Promise<void> {
    try {
      const { data: statuses, error } = await supabase
        .from('equipment_status')
        .select('*')
        .order('status_changed_at', { ascending: false })

      if (error) throw error

      // 데이터 변환 (DB -> TypeScript 타입)
      const transformedStatuses: EquipmentStatusInfo[] = statuses.map(status => ({
        id: status.id,
        equipmentId: status.equipment_id,
        status: status.status,
        statusReason: status.status_reason,
        updatedBy: status.updated_by,
        statusChangedAt: status.status_changed_at,
        lastMaintenanceDate: status.last_maintenance_date,
        nextMaintenanceDate: status.next_maintenance_date,
        operatingHours: status.operating_hours,
        notes: status.notes,
        createdAt: status.created_at,
        updatedAt: status.updated_at
      }))

      globalStateManager.setEquipmentStatuses(transformedStatuses)
    } catch (error) {
      console.error('Equipment status sync error:', error)
    }
  }

  handleRealtimeEvent(event: RealtimeEvent): void {
    switch (event.action) {
      case 'INSERT':
      case 'UPDATE':
        const status: EquipmentStatusInfo = {
          id: event.record.id,
          equipmentId: event.record.equipment_id,
          status: event.record.status,
          statusReason: event.record.status_reason,
          updatedBy: event.record.updated_by,
          statusChangedAt: event.record.status_changed_at,
          lastMaintenanceDate: event.record.last_maintenance_date,
          nextMaintenanceDate: event.record.next_maintenance_date,
          operatingHours: event.record.operating_hours,
          notes: event.record.notes,
          createdAt: event.record.created_at,
          updatedAt: event.record.updated_at
        }
        globalStateManager.updateEquipmentStatus(status)
        break
    }
  }
}

/**
 * [LSP] Rule: 고장 보고 동기화 - 상위 클래스를 완벽히 대체
 */
export class BreakdownSynchronizer extends BaseSynchronizer {
  constructor() {
    super('breakdown_reports')
  }

  async sync(): Promise<void> {
    try {
      // JOIN 쿼리로 관련 설비 정보도 함께 조회
      const { data: breakdowns, error } = await supabase
        .from('breakdown_reports')
        .select(`
          *,
          equipment_info:equipment_id (
            id,
            equipment_number,
            equipment_name,
            category
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // 데이터 변환 (DB -> TypeScript 타입)
      const transformedBreakdowns: BreakdownReport[] = (breakdowns || []).map(breakdown => {
        // equipment_info가 객체인지 배열인지 확인하고 안전하게 접근
        const equipmentInfo = Array.isArray(breakdown.equipment_info) 
          ? breakdown.equipment_info[0] 
          : breakdown.equipment_info
        
        return {
          id: breakdown.id,
          equipmentId: breakdown.equipment_id,
          equipmentCategory: breakdown.equipment_category || equipmentInfo?.category || '',
          equipmentNumber: breakdown.equipment_number || equipmentInfo?.equipment_number || 'N/A',
          reporterName: breakdown.reporter_name || breakdown.breakdown_title || '',
          reportedBy: '', // 제거된 필드
          assignedTo: breakdown.assigned_to,
          assignedToId: breakdown.assigned_to,
          urgencyLevel: (breakdown.urgency_level || breakdown.priority || 'medium') as 'low' | 'medium' | 'high' | 'critical',
          issueType: breakdown.issue_type as 'mechanical' | 'electrical' | 'software' | 'safety' | 'other',
          description: breakdown.description || '',
          symptoms: breakdown.symptoms || '',
          status: breakdown.status as 'reported' | 'assigned' | 'in_progress' | 'resolved' | 'completed' | 'rejected' | 'cancelled',
          occurredAt: breakdown.occurred_at || breakdown.created_at,
          resolutionDate: breakdown.resolution_date,
          notes: breakdown.notes,
          breakdownTitle: breakdown.breakdown_title || '',
          createdAt: breakdown.created_at,
          updatedAt: breakdown.updated_at
        }
      })

      globalStateManager.setBreakdownReports(transformedBreakdowns)
      console.log('Breakdown reports synchronized:', transformedBreakdowns.length)
    } catch (error) {
      console.error('Breakdown sync error:', error)
    }
  }

  handleRealtimeEvent(event: RealtimeEvent): void {
    // 실시간 이벤트 처리 시에는 추가 정보 조회가 필요할 수 있음
    if (event.action === 'INSERT') {
      // 새로운 고장 보고 생성 시 전체 데이터 다시 동기화
      this.sync()
    }
  }
}

/**
 * [SRP] Rule: 전체 데이터 동기화 조정만을 담당하는 클래스
 * [DIP] Rule: 구체적인 동기화 구현체들에 직접 의존하지 않음
 */
export class DataSynchronizationCoordinator {
  private synchronizers: Map<string, SyncStrategy> = new Map()
  private isActive: boolean = false

  constructor() {
    // [DIP] Rule: 의존성 주입을 통한 느슨한 결합
    this.synchronizers.set('equipment', new EquipmentSynchronizer())
    this.synchronizers.set('status', new EquipmentStatusSynchronizer())
    this.synchronizers.set('breakdown', new BreakdownSynchronizer())
  }

  /**
   * [OCP] Rule: 새로운 동기화 전략 추가 시 기존 코드 수정 없이 확장
   */
  addSynchronizer(key: string, synchronizer: SyncStrategy): void {
    this.synchronizers.set(key, synchronizer)
    if (this.isActive) {
      synchronizer.subscribe()
    }
  }

  async startSynchronization(): Promise<void> {
    if (this.isActive) return

    // 초기 데이터 동기화
    await this.syncAll()

    // 실시간 구독 시작
    this.synchronizers.forEach(sync => sync.subscribe())
    this.isActive = true

    console.log('Data synchronization started')
  }

  stopSynchronization(): void {
    if (!this.isActive) return

    this.synchronizers.forEach(sync => sync.unsubscribe())
    this.isActive = false

    console.log('Data synchronization stopped')
  }

  async syncAll(): Promise<void> {
    try {
      // 순차적 동기화 (의존성 순서 고려)
      await this.synchronizers.get('equipment')?.sync()
      await this.synchronizers.get('status')?.sync()
      await this.synchronizers.get('breakdown')?.sync()
      
      console.log('All data synchronized successfully')
    } catch (error) {
      console.error('Data synchronization error:', error)
    }
  }

  async forceSyncAll(): Promise<void> {
    await this.syncAll()
    
    // 강제 동기화 후 상태 변경 이벤트 발행
    globalStateManager.emit('forceSyncCompleted', {
      timestamp: Date.now()
    })
  }
}

// 전역 동기화 코디네이터 인스턴스
export const dataSynchronizer = new DataSynchronizationCoordinator()