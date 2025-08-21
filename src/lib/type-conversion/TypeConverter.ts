// [SRP] Rule: DB 스키마와 TypeScript 타입 간 변환만을 담당
// [OCP] Rule: 새로운 타입 변환 추가 시 기존 코드 수정 없이 확장 가능

import { Equipment, EquipmentStatusInfo } from '@/types/equipment'
import { BreakdownReport } from '@/types/breakdown'

/**
 * 데이터베이스 테이블 스키마 인터페이스들
 * DB의 실제 컬럼명과 일치하는 타입 정의
 */
export interface EquipmentInfoDB {
  id: string
  equipment_number: string
  equipment_name: string
  category: string
  location: string | null
  manufacturer: string | null
  model: string | null
  installation_date: string | null
  specifications: string | null
  created_at: string
  updated_at: string
}

export interface EquipmentStatusDB {
  id: string
  equipment_id: string
  status: 'running' | 'breakdown' | 'standby' | 'maintenance' | 'stopped'
  status_reason: string | null
  updated_by: string | null
  status_changed_at: string
  last_maintenance_date: string | null
  next_maintenance_date: string | null
  operating_hours: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface BreakdownReportDB {
  id: string
  equipment_id: string
  breakdown_title: string
  breakdown_description: string
  breakdown_type: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  occurred_at: string
  status: 'reported' | 'assigned' | 'in_progress' | 'completed'
  assigned_to: string
  symptoms: string | null
  images_urls: string[] | null
  estimated_repair_time: number | null
  created_at: string
  updated_at: string
}

/**
 * [ISP] Rule: 변환 기능별로 인터페이스 분리
 */
export interface TypeConverter<TDb, TApp> {
  fromDb(dbRecord: TDb): TApp
  toDb(appRecord: Partial<TApp>): Partial<TDb>
  validateDbRecord(record: any): record is TDb
  validateAppRecord(record: any): record is TApp
}

/**
 * [DIP] Rule: 추상화된 기본 변환기 클래스
 */
export abstract class BaseTypeConverter<TDb, TApp> implements TypeConverter<TDb, TApp> {
  abstract fromDb(dbRecord: TDb): TApp
  abstract toDb(appRecord: Partial<TApp>): Partial<TDb>
  abstract validateDbRecord(record: any): record is TDb
  abstract validateAppRecord(record: any): record is TApp

  // 공통 필드 변환 헬퍼
  protected convertTimestamp(timestamp: string | null): string | null {
    if (!timestamp) return null
    return new Date(timestamp).toISOString()
  }

  protected convertStringArray(arr: string[] | null): string[] {
    return arr || []
  }

  protected convertNumber(num: number | null): number | null {
    return num
  }
}

/**
 * [LSP] Rule: 설비 정보 변환기 - 상위 클래스를 완벽히 대체
 */
export class EquipmentConverter extends BaseTypeConverter<EquipmentInfoDB, Equipment> {
  fromDb(dbRecord: EquipmentInfoDB): Equipment {
    return {
      id: dbRecord.id,
      equipmentNumber: dbRecord.equipment_number,
      equipmentName: dbRecord.equipment_name,
      category: dbRecord.category,
      location: dbRecord.location,
      manufacturer: dbRecord.manufacturer,
      model: dbRecord.model,
      installationDate: dbRecord.installation_date,
      specifications: dbRecord.specifications,
      createdAt: this.convertTimestamp(dbRecord.created_at)!,
      updatedAt: this.convertTimestamp(dbRecord.updated_at)!
    }
  }

  toDb(appRecord: Partial<Equipment>): Partial<EquipmentInfoDB> {
    const dbRecord: Partial<EquipmentInfoDB> = {}

    if (appRecord.id) dbRecord.id = appRecord.id
    if (appRecord.equipmentNumber) dbRecord.equipment_number = appRecord.equipmentNumber
    if (appRecord.equipmentName) dbRecord.equipment_name = appRecord.equipmentName
    if (appRecord.category) dbRecord.category = appRecord.category
    if (appRecord.location !== undefined) dbRecord.location = appRecord.location
    if (appRecord.manufacturer !== undefined) dbRecord.manufacturer = appRecord.manufacturer
    if (appRecord.model !== undefined) dbRecord.model = appRecord.model
    if (appRecord.installationDate !== undefined) dbRecord.installation_date = appRecord.installationDate
    if (appRecord.specifications !== undefined) dbRecord.specifications = appRecord.specifications

    return dbRecord
  }

  validateDbRecord(record: any): record is EquipmentInfoDB {
    return (
      typeof record === 'object' &&
      typeof record.id === 'string' &&
      typeof record.equipment_number === 'string' &&
      typeof record.equipment_name === 'string' &&
      typeof record.category === 'string' &&
      typeof record.created_at === 'string' &&
      typeof record.updated_at === 'string'
    )
  }

  validateAppRecord(record: any): record is Equipment {
    return (
      typeof record === 'object' &&
      typeof record.id === 'string' &&
      typeof record.equipmentNumber === 'string' &&
      typeof record.equipmentName === 'string' &&
      typeof record.category === 'string' &&
      typeof record.createdAt === 'string' &&
      typeof record.updatedAt === 'string'
    )
  }
}

/**
 * [LSP] Rule: 설비 상태 변환기 - 상위 클래스를 완벽히 대체
 */
export class EquipmentStatusConverter extends BaseTypeConverter<EquipmentStatusDB, EquipmentStatusInfo> {
  fromDb(dbRecord: EquipmentStatusDB): EquipmentStatusInfo {
    return {
      id: dbRecord.id,
      equipmentId: dbRecord.equipment_id,
      status: dbRecord.status,
      statusReason: dbRecord.status_reason,
      updatedBy: dbRecord.updated_by,
      statusChangedAt: this.convertTimestamp(dbRecord.status_changed_at)!,
      lastMaintenanceDate: dbRecord.last_maintenance_date,
      nextMaintenanceDate: dbRecord.next_maintenance_date,
      operatingHours: this.convertNumber(dbRecord.operating_hours),
      notes: dbRecord.notes,
      createdAt: this.convertTimestamp(dbRecord.created_at)!,
      updatedAt: this.convertTimestamp(dbRecord.updated_at)!
    }
  }

  toDb(appRecord: Partial<EquipmentStatusInfo>): Partial<EquipmentStatusDB> {
    const dbRecord: Partial<EquipmentStatusDB> = {}

    if (appRecord.id) dbRecord.id = appRecord.id
    if (appRecord.equipmentId) dbRecord.equipment_id = appRecord.equipmentId
    if (appRecord.status) dbRecord.status = appRecord.status
    if (appRecord.statusReason !== undefined) dbRecord.status_reason = appRecord.statusReason
    if (appRecord.updatedBy !== undefined) dbRecord.updated_by = appRecord.updatedBy
    if (appRecord.statusChangedAt) dbRecord.status_changed_at = appRecord.statusChangedAt
    if (appRecord.lastMaintenanceDate !== undefined) dbRecord.last_maintenance_date = appRecord.lastMaintenanceDate
    if (appRecord.nextMaintenanceDate !== undefined) dbRecord.next_maintenance_date = appRecord.nextMaintenanceDate
    if (appRecord.operatingHours !== undefined) dbRecord.operating_hours = appRecord.operatingHours
    if (appRecord.notes !== undefined) dbRecord.notes = appRecord.notes

    return dbRecord
  }

  validateDbRecord(record: any): record is EquipmentStatusDB {
    return (
      typeof record === 'object' &&
      typeof record.id === 'string' &&
      typeof record.equipment_id === 'string' &&
      ['running', 'breakdown', 'standby', 'maintenance', 'stopped'].includes(record.status) &&
      typeof record.status_changed_at === 'string' &&
      typeof record.created_at === 'string' &&
      typeof record.updated_at === 'string'
    )
  }

  validateAppRecord(record: any): record is EquipmentStatusInfo {
    return (
      typeof record === 'object' &&
      typeof record.id === 'string' &&
      typeof record.equipmentId === 'string' &&
      ['running', 'breakdown', 'standby', 'maintenance', 'stopped'].includes(record.status) &&
      typeof record.statusChangedAt === 'string' &&
      typeof record.createdAt === 'string' &&
      typeof record.updatedAt === 'string'
    )
  }
}

/**
 * [LSP] Rule: 고장 보고 변환기 - 상위 클래스를 완벽히 대체
 */
export class BreakdownReportConverter extends BaseTypeConverter<BreakdownReportDB, BreakdownReport> {
  fromDb(dbRecord: BreakdownReportDB & { equipment_info?: any }): BreakdownReport {
    return {
      id: dbRecord.id,
      equipmentId: dbRecord.equipment_id,
      equipmentCategory: dbRecord.equipment_info?.category || '',
      equipmentNumber: dbRecord.equipment_info?.equipment_number || '',
      breakdownTitle: dbRecord.breakdown_title,
      breakdownDescription: dbRecord.breakdown_description,
      breakdownType: dbRecord.breakdown_type as any || 'other',
      priority: dbRecord.priority === 'urgent' ? 'critical' : dbRecord.priority as 'low' | 'medium' | 'high' | 'critical',
      reporterName: '', // 별도 조회 필요
      reportedBy: '', // 제거된 필드
      assignee: dbRecord.assigned_to,
      assignedTo: dbRecord.assigned_to || undefined,
      assignedToId: dbRecord.assigned_to || undefined,
      urgencyLevel: dbRecord.priority === 'urgent' ? 'critical' : dbRecord.priority as 'low' | 'medium' | 'high' | 'critical',
      issueType: dbRecord.breakdown_type as any || 'other',
      description: dbRecord.breakdown_description,
      symptoms: dbRecord.symptoms || '',
      status: this.convertBreakdownStatus(dbRecord.status),
      occurredAt: this.convertTimestamp(dbRecord.occurred_at)!,
      createdAt: this.convertTimestamp(dbRecord.created_at)!,
      updatedAt: this.convertTimestamp(dbRecord.updated_at)!
    }
  }

  toDb(appRecord: Partial<BreakdownReport>): Partial<BreakdownReportDB> {
    const dbRecord: Partial<BreakdownReportDB> = {}

    if (appRecord.id) dbRecord.id = appRecord.id
    if (appRecord.equipmentId) dbRecord.equipment_id = appRecord.equipmentId
    if (appRecord.breakdownTitle) dbRecord.breakdown_title = appRecord.breakdownTitle
    if (appRecord.breakdownDescription) dbRecord.breakdown_description = appRecord.breakdownDescription
    if (appRecord.breakdownType) dbRecord.breakdown_type = appRecord.breakdownType
    if (appRecord.priority) dbRecord.priority = appRecord.priority === 'critical' ? 'urgent' : appRecord.priority as 'low' | 'medium' | 'high' | 'urgent'
    if (appRecord.occurredAt) dbRecord.occurred_at = appRecord.occurredAt
    // reported_by 필드는 더 이상 존재하지 않음
    if (appRecord.status) dbRecord.status = this.convertAppBreakdownStatus(appRecord.status)
    if (appRecord.assignedToId !== undefined) dbRecord.assigned_to = appRecord.assignedToId
    if (appRecord.symptoms !== undefined) dbRecord.symptoms = appRecord.symptoms

    return dbRecord
  }

  private convertBreakdownStatus(dbStatus: string): import('@/types/breakdown').BreakdownStatus {
    const { BreakdownStatus } = require('@/types/breakdown')
    switch (dbStatus) {
      case 'reported':
        return BreakdownStatus.REPORTED
      case 'assigned':
      case 'in_progress':
        return BreakdownStatus.IN_PROGRESS
      case 'completed':
        return BreakdownStatus.COMPLETED
      default:
        return BreakdownStatus.REPORTED
    }
  }

  private convertAppBreakdownStatus(appStatus: import('@/types/breakdown').BreakdownStatus): 'reported' | 'in_progress' | 'completed' | 'assigned' {
    const { BreakdownStatus } = require('@/types/breakdown')
    switch (appStatus) {
      case BreakdownStatus.REPORTED:
        return 'reported'
      case BreakdownStatus.IN_PROGRESS:
        return 'in_progress'
      case BreakdownStatus.COMPLETED:
        return 'completed'
      default:
        return 'reported'
    }
  }

  validateDbRecord(record: any): record is BreakdownReportDB {
    return (
      typeof record === 'object' &&
      typeof record.id === 'string' &&
      typeof record.equipment_id === 'string' &&
      typeof record.breakdown_title === 'string' &&
      typeof record.breakdown_description === 'string' &&
      ['low', 'medium', 'high', 'urgent'].includes(record.priority) &&
      typeof record.occurred_at === 'string' &&
      typeof record.assigned_to === 'string' &&
      ['reported', 'assigned', 'in_progress', 'completed'].includes(record.status) &&
      typeof record.created_at === 'string' &&
      typeof record.updated_at === 'string'
    )
  }

  validateAppRecord(record: any): record is BreakdownReport {
    return (
      typeof record === 'object' &&
      typeof record.id === 'string' &&
      typeof record.equipmentId === 'string' &&
      typeof record.breakdownTitle === 'string' &&
      typeof record.breakdownDescription === 'string' &&
      ['low', 'medium', 'high', 'critical'].includes(record.priority) &&
      typeof record.occurredAt === 'string' &&
      typeof record.assignedToId === 'string' &&
      ['reported', 'in_progress', 'completed'].includes(record.status) &&
      typeof record.createdAt === 'string' &&
      typeof record.updatedAt === 'string'
    )
  }
}

/**
 * [SRP] Rule: 타입 변환 팩토리 - 변환기 인스턴스 생성만 담당
 * [OCP] Rule: 새로운 변환기 추가 시 기존 코드 수정 없이 확장
 */
export class TypeConverterFactory {
  private static converters: Map<string, TypeConverter<any, any>> = new Map()

  static register<TDb, TApp>(
    key: string, 
    converter: TypeConverter<TDb, TApp>
  ): void {
    this.converters.set(key, converter)
  }

  static get<TDb, TApp>(key: string): TypeConverter<TDb, TApp> | null {
    return this.converters.get(key) || null
  }

  static getEquipmentConverter(): EquipmentConverter {
    return this.get<EquipmentInfoDB, Equipment>('equipment') as EquipmentConverter
  }

  static getStatusConverter(): EquipmentStatusConverter {
    return this.get<EquipmentStatusDB, EquipmentStatusInfo>('status') as EquipmentStatusConverter
  }

  static getBreakdownConverter(): BreakdownReportConverter {
    return this.get<BreakdownReportDB, BreakdownReport>('breakdown') as BreakdownReportConverter
  }
}

// 기본 변환기들 등록
TypeConverterFactory.register('equipment', new EquipmentConverter())
TypeConverterFactory.register('status', new EquipmentStatusConverter())
TypeConverterFactory.register('breakdown', new BreakdownReportConverter())

// 편의성을 위한 전역 변환기 인스턴스들
export const equipmentConverter = TypeConverterFactory.getEquipmentConverter()
export const statusConverter = TypeConverterFactory.getStatusConverter()
export const breakdownConverter = TypeConverterFactory.getBreakdownConverter()