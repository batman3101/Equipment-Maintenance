// Equipment 관련 타입 정의

export type EquipmentStatus = 'running' | 'breakdown' | 'standby' | 'maintenance' | 'stopped'

export interface Equipment {
  id: string
  equipmentNumber: string
  equipmentName: string
  category: string
  location: string | null
  manufacturer: string | null
  model: string | null
  installationDate: string | null
  specifications: string | null
  createdAt: string
  updatedAt: string
}

export interface EquipmentStatusInfo {
  id: string
  equipmentId: string
  status: EquipmentStatus
  statusReason: string | null
  updatedBy: string | null
  statusChangedAt: string
  lastMaintenanceDate: string | null
  nextMaintenanceDate: string | null
  operatingHours: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface EquipmentWithStatus extends Equipment {
  status?: EquipmentStatusInfo
}