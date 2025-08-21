// [SRP] Rule: API 스키마 정의만을 담당하는 모듈
// [OCP] Rule: 새로운 API 타입 추가 시 기존 코드 수정 없이 확장

/**
 * 기본 데이터 타입 검증 함수들
 */
export const DataTypes = {
  string: (value: any): value is string => typeof value === 'string',
  number: (value: any): value is number => typeof value === 'number' && !isNaN(value),
  boolean: (value: any): value is boolean => typeof value === 'boolean',
  date: (value: any): value is string => {
    if (typeof value !== 'string') return false
    const date = new Date(value)
    return !isNaN(date.getTime())
  },
  uuid: (value: any): value is string => {
    if (typeof value !== 'string') return false
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(value)
  },
  email: (value: any): value is string => {
    if (typeof value !== 'string') return false
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  },
  url: (value: any): value is string => {
    if (typeof value !== 'string') return false
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }
}

/**
 * 스키마 필드 정의 타입
 */
export interface SchemaField {
  type: keyof typeof DataTypes | 'array' | 'object'
  required?: boolean
  nullable?: boolean
  arrayOf?: SchemaField
  objectSchema?: Schema
  validation?: (value: any) => boolean
  transform?: (value: any) => any
  defaultValue?: any
}

/**
 * 스키마 정의 타입
 */
export interface Schema {
  [key: string]: SchemaField
}

/**
 * 유효성 검증 결과 타입
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  data?: any
}

/**
 * [SRP] Rule: 스키마 기반 데이터 유효성 검증만 담당
 */
export class SchemaValidator {
  /**
   * [SRP] Rule: 단일 필드 유효성 검증만 담당
   */
  private validateField(value: any, field: SchemaField, fieldName: string): ValidationResult {
    const errors: string[] = []
    let processedValue = value

    // null/undefined 체크
    if (value === null || value === undefined) {
      if (field.required && !field.nullable) {
        errors.push(`${fieldName}: 필수 필드입니다`)
        return { valid: false, errors }
      }
      if (field.nullable || !field.required) {
        return { valid: true, errors: [], data: field.defaultValue ?? value }
      }
    }

    // 기본값 적용
    if ((value === null || value === undefined) && field.defaultValue !== undefined) {
      processedValue = field.defaultValue
    }

    // 타입별 검증
    switch (field.type) {
      case 'array':
        if (!Array.isArray(processedValue)) {
          errors.push(`${fieldName}: 배열 타입이어야 합니다`)
          break
        }
        if (field.arrayOf) {
          const arrayErrors: string[] = []
          const validatedArray = processedValue.map((item, index) => {
            const itemResult = this.validateField(item, field.arrayOf!, `${fieldName}[${index}]`)
            if (!itemResult.valid) {
              arrayErrors.push(...itemResult.errors)
            }
            return itemResult.data
          })
          if (arrayErrors.length > 0) {
            errors.push(...arrayErrors)
          } else {
            processedValue = validatedArray
          }
        }
        break

      case 'object':
        if (typeof processedValue !== 'object' || processedValue === null) {
          errors.push(`${fieldName}: 객체 타입이어야 합니다`)
          break
        }
        if (field.objectSchema) {
          const objectResult = this.validate(processedValue, field.objectSchema)
          if (!objectResult.valid) {
            errors.push(...objectResult.errors.map(err => `${fieldName}.${err}`))
          } else {
            processedValue = objectResult.data
          }
        }
        break

      default:
        // 기본 데이터 타입 검증
        if (field.type in DataTypes) {
          const typeValidator = DataTypes[field.type as keyof typeof DataTypes]
          if (!typeValidator(processedValue)) {
            errors.push(`${fieldName}: ${field.type} 타입이어야 합니다`)
          }
        }
        break
    }

    // 커스텀 유효성 검증
    if (field.validation && !field.validation(processedValue)) {
      errors.push(`${fieldName}: 유효성 검증에 실패했습니다`)
    }

    // 데이터 변환
    if (field.transform && errors.length === 0) {
      processedValue = field.transform(processedValue)
    }

    return {
      valid: errors.length === 0,
      errors,
      data: processedValue
    }
  }

  /**
   * [SRP] Rule: 전체 스키마 유효성 검증만 담당
   */
  validate(data: any, schema: Schema): ValidationResult {
    if (typeof data !== 'object' || data === null) {
      return {
        valid: false,
        errors: ['데이터는 객체여야 합니다'],
      }
    }

    const errors: string[] = []
    const validatedData: any = {}

    // 스키마에 정의된 필드들 검증
    for (const [fieldName, fieldSchema] of Object.entries(schema)) {
      const fieldResult = this.validateField(data[fieldName], fieldSchema, fieldName)
      
      if (!fieldResult.valid) {
        errors.push(...fieldResult.errors)
      } else {
        validatedData[fieldName] = fieldResult.data
      }
    }

    // 정의되지 않은 필드들 처리 (개발 모드에서는 경고)
    if (process.env.NODE_ENV === 'development') {
      for (const key of Object.keys(data)) {
        if (!(key in schema)) {
          console.warn(`[SchemaValidator] 정의되지 않은 필드: ${key}`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      data: validatedData
    }
  }
}

/**
 * 공통 API 응답 스키마
 */
export const BaseApiResponseSchema: Schema = {
  success: {
    type: 'boolean',
    required: true
  },
  data: {
    type: 'object',
    required: false,
    nullable: true
  },
  error: {
    type: 'string',
    required: false,
    nullable: true
  },
  message: {
    type: 'string',
    required: false,
    nullable: true
  },
  timestamp: {
    type: 'date',
    required: true
  },
  requestId: {
    type: 'string',
    required: false,
    nullable: true
  }
}

/**
 * 설비 정보 스키마
 */
export const EquipmentSchema: Schema = {
  id: {
    type: 'uuid',
    required: true
  },
  equipmentNumber: {
    type: 'string',
    required: true,
    validation: (value) => value.length > 0 && value.length <= 50
  },
  equipmentName: {
    type: 'string',
    required: true,
    validation: (value) => value.length > 0 && value.length <= 200
  },
  category: {
    type: 'string',
    required: true,
    validation: (value) => ['CNC', 'LATHE', 'MILL', 'DRILL', 'GRINDER', 'OTHER'].includes(value)
  },
  location: {
    type: 'string',
    required: false,
    nullable: true
  },
  manufacturer: {
    type: 'string',
    required: false,
    nullable: true
  },
  model: {
    type: 'string',
    required: false,
    nullable: true
  },
  installationDate: {
    type: 'date',
    required: false,
    nullable: true
  },
  specifications: {
    type: 'string',
    required: false,
    nullable: true
  },
  createdAt: {
    type: 'date',
    required: true
  },
  updatedAt: {
    type: 'date',
    required: true
  }
}

/**
 * 설비 상태 스키마
 */
export const EquipmentStatusSchema: Schema = {
  id: {
    type: 'uuid',
    required: true
  },
  equipmentId: {
    type: 'uuid',
    required: true
  },
  status: {
    type: 'string',
    required: true,
    validation: (value) => ['running', 'breakdown', 'standby', 'maintenance', 'stopped'].includes(value)
  },
  statusReason: {
    type: 'string',
    required: false,
    nullable: true
  },
  statusChangedAt: {
    type: 'date',
    required: true
  },
  lastMaintenanceDate: {
    type: 'date',
    required: false,
    nullable: true
  },
  operatingHours: {
    type: 'number',
    required: false,
    nullable: true,
    validation: (value) => value >= 0
  },
  updatedBy: {
    type: 'uuid',
    required: false,
    nullable: true
  }
}

/**
 * 고장 신고 스키마
 */
export const BreakdownReportSchema: Schema = {
  id: {
    type: 'uuid',
    required: true
  },
  equipmentId: {
    type: 'uuid',
    required: true
  },
  equipmentNumber: {
    type: 'string',
    required: false,
    nullable: true
  },
  breakdownTitle: {
    type: 'string',
    required: true,
    validation: (value) => value.length > 0 && value.length <= 200
  },
  breakdownDescription: {
    type: 'string',
    required: true,
    validation: (value) => value.length > 0
  },
  breakdownType: {
    type: 'string',
    required: true,
    validation: (value) => ['mechanical', 'electrical', 'software', 'safety', 'other'].includes(value)
  },
  priority: {
    type: 'string',
    required: true,
    validation: (value) => ['low', 'medium', 'high', 'critical'].includes(value)
  },
  status: {
    type: 'string',
    required: true,
    validation: (value) => ['reported', 'assigned', 'in_progress', 'completed'].includes(value)
  },
  assignedToId: {
    type: 'uuid',
    required: false,
    nullable: true
  },
  assignedTo: {
    type: 'string',
    required: false,
    nullable: true
  },
  symptoms: {
    type: 'string',
    required: false,
    nullable: true
  },
  occurredAt: {
    type: 'date',
    required: true
  },
  createdAt: {
    type: 'date',
    required: true
  },
  updatedAt: {
    type: 'date',
    required: true
  }
}

/**
 * 수리 보고서 스키마
 */
export const RepairReportSchema: Schema = {
  id: {
    type: 'uuid',
    required: true
  },
  breakdown_report_id: {
    type: 'uuid',
    required: true
  },
  equipment_id: {
    type: 'uuid',
    required: true
  },
  repair_title: {
    type: 'string',
    required: true,
    validation: (value) => value.length > 0 && value.length <= 200
  },
  repair_description: {
    type: 'string',
    required: true
  },
  technician_id: {
    type: 'uuid',
    required: true
  },
  repair_started_at: {
    type: 'date',
    required: true
  },
  repair_completed_at: {
    type: 'date',
    required: false,
    nullable: true
  },
  status: {
    type: 'string',
    required: true,
    validation: (value) => ['repair_pending', 'repair_in_progress', 'repair_completed', 'repair_failed'].includes(value)
  },
  repair_result: {
    type: 'string',
    required: true
  },
  parts_used: {
    type: 'string',
    required: false,
    nullable: true
  },
  total_cost: {
    type: 'number',
    required: false,
    nullable: true,
    validation: (value) => value >= 0
  },
  quality_check: {
    type: 'boolean',
    required: true,
    defaultValue: true
  },
  notes: {
    type: 'string',
    required: false,
    nullable: true
  },
  duration_hours: {
    type: 'number',
    required: true,
    defaultValue: 0,
    validation: (value) => value >= 0
  },
  created_at: {
    type: 'date',
    required: true
  },
  updated_at: {
    type: 'date',
    required: true
  }
}

/**
 * 대시보드 데이터 스키마
 */
export const DashboardDataSchema: Schema = {
  totalEquipment: {
    type: 'number',
    required: true,
    validation: (value) => value >= 0
  },
  runningEquipment: {
    type: 'number',
    required: true,
    validation: (value) => value >= 0
  },
  breakdownEquipment: {
    type: 'number',
    required: true,
    validation: (value) => value >= 0
  },
  maintenanceEquipment: {
    type: 'number',
    required: true,
    validation: (value) => value >= 0
  },
  standbyEquipment: {
    type: 'number',
    required: true,
    validation: (value) => value >= 0
  },
  stoppedEquipment: {
    type: 'number',
    required: true,
    validation: (value) => value >= 0
  },
  activeBreakdowns: {
    type: 'number',
    required: true,
    validation: (value) => value >= 0
  },
  urgentBreakdowns: {
    type: 'number',
    required: true,
    validation: (value) => value >= 0
  },
  pendingRepairs: {
    type: 'number',
    required: true,
    validation: (value) => value >= 0
  },
  inProgressRepairs: {
    type: 'number',
    required: true,
    validation: (value) => value >= 0
  },
  lastUpdated: {
    type: 'date',
    required: true
  }
}

/**
 * 페이지네이션 스키마
 */
export const PaginationSchema: Schema = {
  page: {
    type: 'number',
    required: true,
    validation: (value) => value >= 1
  },
  limit: {
    type: 'number',
    required: true,
    validation: (value) => value >= 1 && value <= 100
  },
  total: {
    type: 'number',
    required: true,
    validation: (value) => value >= 0
  },
  totalPages: {
    type: 'number',
    required: true,
    validation: (value) => value >= 0
  },
  hasNext: {
    type: 'boolean',
    required: false,
    defaultValue: false
  },
  hasPrev: {
    type: 'boolean',
    required: false,
    defaultValue: false
  }
}

// 전역 스키마 검증자 인스턴스
export const validator = new SchemaValidator()