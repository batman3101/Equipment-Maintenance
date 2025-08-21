// [SRP] Rule: API 호출 및 응답 처리만을 담당하는 서비스
// [DIP] Rule: 구체적인 HTTP 클라이언트에 의존하지 않는 추상화

import { Equipment, EquipmentStatusInfo } from '@/types/equipment'
import { BreakdownReport } from '@/types/breakdown'
import { DashboardData } from '@/types/dashboard'
import { 
  validator, 
  EquipmentSchema, 
  EquipmentStatusSchema, 
  BreakdownReportSchema, 
  RepairReportSchema,
  DashboardDataSchema,
  BaseApiResponseSchema,
  ValidationResult 
} from '@/lib/validation/api-schemas'

// 수리 보고서 타입 정의
export interface RepairReport {
  id: string
  breakdown_report_id: string
  equipment_id: string
  repair_title: string
  repair_description: string
  technician_id: string
  technician?: { id: string; full_name: string; email?: string }
  equipment?: { id: string; equipment_name: string; equipment_number: string }
  breakdown?: { id: string; breakdown_title: string; priority: string }
  repair_started_at: string
  repair_completed_at?: string
  status: string
  repair_result: string
  parts_used?: string
  total_cost?: number
  quality_check: boolean
  notes?: string
  duration_hours: number
  created_at: string
  updated_at: string
}

/**
 * [ISP] Rule: 각 도메인별로 인터페이스 분리
 */
export interface EquipmentApiService {
  getEquipments(): Promise<ApiResponse<Equipment[]>>
  getEquipmentById(id: string): Promise<ApiResponse<Equipment>>
  createEquipment(equipment: Partial<Equipment>): Promise<ApiResponse<Equipment>>
  updateEquipment(id: string, equipment: Partial<Equipment>): Promise<ApiResponse<Equipment>>
  deleteEquipment(id: string): Promise<ApiResponse<void>>
}

export interface StatusApiService {
  getEquipmentStatuses(): Promise<ApiResponse<EquipmentStatusInfo[]>>
  updateEquipmentStatus(equipmentId: string, status: Partial<EquipmentStatusInfo>): Promise<ApiResponse<EquipmentStatusInfo>>
}

export interface BreakdownApiService {
  getBreakdownReports(): Promise<ApiResponse<BreakdownReport[]>>
  createBreakdownReport(report: Partial<BreakdownReport>): Promise<ApiResponse<BreakdownReport>>
  updateBreakdownReport(id: string, report: Partial<BreakdownReport>): Promise<ApiResponse<BreakdownReport>>
}

export interface DashboardApiService {
  getDashboardData(): Promise<ApiResponse<DashboardData>>
  refreshDashboardData(): Promise<ApiResponse<DashboardData>>
}

export interface RepairApiService {
  getRepairReports(): Promise<ApiResponse<RepairReport[]>>
  getRepairReportById(id: string): Promise<ApiResponse<RepairReport>>
  createRepairReport(report: Partial<RepairReport>): Promise<ApiResponse<RepairReport>>
  updateRepairReport(id: string, report: Partial<RepairReport>): Promise<ApiResponse<RepairReport>>
  deleteRepairReport(id: string): Promise<ApiResponse<void>>
}

/**
 * 통일된 API 응답 스키마
 * [OCP] Rule: 새로운 응답 형식 추가 시 기존 코드 수정 없이 확장 가능
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
  requestId?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  metadata?: {
    version: string
    executionTime: number
    cacheHit?: boolean
  }
}

/**
 * API 호출 옵션
 */
export interface ApiRequestOptions {
  timeout?: number
  retries?: number
  cache?: boolean
  cacheTtl?: number
  headers?: Record<string, string>
}

/**
 * [DIP] Rule: 추상화된 HTTP 클라이언트 인터페이스
 */
export interface HttpClient {
  get<T>(url: string, options?: ApiRequestOptions): Promise<T>
  post<T>(url: string, data: any, options?: ApiRequestOptions): Promise<T>
  put<T>(url: string, data: any, options?: ApiRequestOptions): Promise<T>
  delete<T>(url: string, options?: ApiRequestOptions): Promise<T>
}

/**
 * [LSP] Rule: 표준 HTTP 클라이언트 구현체
 */
export class FetchHttpClient implements HttpClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>

  constructor(baseUrl: string = '', defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders
    }
  }

  async get<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('GET', url, undefined, options)
  }

  async post<T>(url: string, data: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('POST', url, data, options)
  }

  async put<T>(url: string, data: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('PUT', url, data, options)
  }

  async delete<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('DELETE', url, undefined, options)
  }

  private async request<T>(
    method: string,
    url: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<T> {
    const controller = new AbortController()
    const timeout = options?.timeout || 15000 // 15초로 단축하여 더 빠른 응답

    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const startTime = Date.now()
      const response = await fetch(`${this.baseUrl}${url}`, {
        method,
        headers: {
          ...this.defaultHeaders,
          ...options?.headers
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const executionTime = Date.now() - startTime

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const rawData = await response.json()
      
      // 기본 API 응답 스키마 검증
      const baseValidation = validator.validate(rawData, BaseApiResponseSchema)
      if (!baseValidation.valid) {
        console.warn('[HttpClient] API 응답 스키마 검증 실패:', {
          url: `${this.baseUrl}${url}`,
          method,
          errors: baseValidation.errors,
          executionTime
        })
        
        // 개발 모드에서만 에러 발생
        if (process.env.NODE_ENV === 'development') {
          throw new Error(`API 스키마 검증 실패: ${baseValidation.errors.join(', ')}`)
        }
      }

      // 성공적인 응답 메타데이터 추가
      if (baseValidation.valid && baseValidation.data.success) {
        baseValidation.data.metadata = {
          ...baseValidation.data.metadata,
          executionTime,
          validationPassed: true
        }
      }

      return baseValidation.valid ? baseValidation.data : rawData
    } catch (error) {
      clearTimeout(timeoutId)
      
      // 네트워크 오류 및 타임아웃 처리
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('요청 시간이 초과되었습니다')
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error('네트워크 연결에 실패했습니다')
        }
      }
      
      throw error
    }
  }
}

/**
 * [SRP] Rule: 통합 API 서비스 - 모든 도메인 API를 단일 인터페이스로 통합
 * [OCP] Rule: 새로운 도메인 API 추가 시 기존 코드 수정 없이 확장
 */
export class UnifiedApiService implements 
  EquipmentApiService, 
  StatusApiService, 
  BreakdownApiService, 
  DashboardApiService,
  RepairApiService {
  
  private httpClient: HttpClient
  private cache: Map<string, { data: any; expiry: number }> = new Map()

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  /**
   * [SRP] Rule: 데이터 스키마 검증만 담당
   */
  private validateData<T>(data: any, schema: any, dataType: string): T {
    if (!data) {
      console.warn(`[UnifiedApiService] ${dataType} 데이터가 비어있습니다`)
      return data
    }

    if (Array.isArray(data)) {
      const validatedArray = data.map((item, index) => {
        const validation = validator.validate(item, schema)
        if (!validation.valid) {
          console.warn(`[UnifiedApiService] ${dataType}[${index}] 스키마 검증 실패:`, validation.errors)
          return item // 개발 모드가 아니면 원본 데이터 반환
        }
        return validation.data
      })
      return validatedArray as T
    } else {
      const validation = validator.validate(data, schema)
      if (!validation.valid) {
        console.warn(`[UnifiedApiService] ${dataType} 스키마 검증 실패:`, validation.errors)
        if (process.env.NODE_ENV === 'development') {
          throw new Error(`${dataType} 스키마 검증 실패: ${validation.errors.join(', ')}`)
        }
        return data // 프로덕션에서는 원본 데이터 반환
      }
      return validation.data as T
    }
  }

  // [SRP] Rule: 설비 관련 API만 담당
  async getEquipments(): Promise<ApiResponse<Equipment[]>> {
    const cacheKey = 'equipments'
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return {
        success: true,
        data: cached,
        timestamp: new Date().toISOString(),
        metadata: {
          version: '1.0',
          executionTime: 0,
          cacheHit: true
        }
      }
    }

    try {
      const response = await this.httpClient.get<any>('/api/equipment/paginated')
      
      // API 응답을 통일된 형식으로 변환 및 스키마 검증
      if (response.success && response.data) {
        const rawEquipmentData = response.data.equipment || []
        
        // 스키마 검증 적용
        const validatedEquipmentData = this.validateData<Equipment[]>(rawEquipmentData, EquipmentSchema, 'Equipment')
        
        this.setCache(cacheKey, validatedEquipmentData, 5 * 60 * 1000) // 5분 캐시
        
        return {
          success: true,
          data: validatedEquipmentData,
          timestamp: new Date().toISOString(),
          metadata: {
            version: '1.0',
            executionTime: response.performance?.queryTime || 0,
            cacheHit: false,
            validationPassed: true
          },
          pagination: response.data.pagination
        }
      }
      
      throw new Error(response.error || 'Failed to fetch equipment data')
    } catch (error) {
      console.error('Equipment API error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }

  async getEquipmentById(id: string): Promise<ApiResponse<Equipment>> {
    return this.httpClient.get<ApiResponse<Equipment>>(`/api/equipment/${id}`)
  }

  async createEquipment(equipment: Partial<Equipment>): Promise<ApiResponse<Equipment>> {
    const response = await this.httpClient.post<ApiResponse<Equipment>>('/api/equipment', equipment)
    
    // 캐시 무효화
    this.cache.delete('equipments')
    
    return response
  }

  async updateEquipment(id: string, equipment: Partial<Equipment>): Promise<ApiResponse<Equipment>> {
    const response = await this.httpClient.put<ApiResponse<Equipment>>(`/api/equipment/${id}`, equipment)
    
    // 캐시 무효화
    this.cache.delete('equipments')
    
    return response
  }

  async deleteEquipment(id: string): Promise<ApiResponse<void>> {
    const response = await this.httpClient.delete<ApiResponse<void>>(`/api/equipment/${id}`)
    
    // 캐시 무효화
    this.cache.delete('equipments')
    
    return response
  }

  // [SRP] Rule: 설비 상태 관련 API만 담당
  async getEquipmentStatuses(): Promise<ApiResponse<EquipmentStatusInfo[]>> {
    try {
      // 캐시 무시하고 강제 새로고침
      const timestamp = Date.now()
      const response = await this.httpClient.get<any>(`/api/equipment/bulk-status?_t=${timestamp}`)
      
      if (response.success && response.data) {
        // 스키마 검증 적용
        const validatedStatusData = this.validateData<EquipmentStatusInfo[]>(response.data, EquipmentStatusSchema, 'EquipmentStatus')
        
        return {
          success: true,
          data: validatedStatusData,
          timestamp: new Date().toISOString(),
          metadata: {
            version: '1.0',
            executionTime: 0,
            cacheHit: false,
            validationPassed: true
          }
        }
      }
      
      throw new Error(response.error || 'Failed to fetch equipment statuses')
    } catch (error) {
      console.error('Equipment status API error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }

  async updateEquipmentStatus(
    equipmentId: string, 
    status: Partial<EquipmentStatusInfo>
  ): Promise<ApiResponse<EquipmentStatusInfo>> {
    return this.httpClient.put<ApiResponse<EquipmentStatusInfo>>(
      `/api/equipment/${equipmentId}/status`,
      status
    )
  }

  // [SRP] Rule: 고장 보고 관련 API만 담당
  async getBreakdownReports(): Promise<ApiResponse<BreakdownReport[]>> {
    try {
      const response = await this.httpClient.get<any>('/api/breakdown-reports')
      
      if (response.success && response.data) {
        // 스키마 검증 적용
        const validatedBreakdownData = this.validateData<BreakdownReport[]>(response.data, BreakdownReportSchema, 'BreakdownReport')
        
        return {
          success: true,
          data: validatedBreakdownData,
          timestamp: new Date().toISOString(),
          metadata: {
            version: '1.0',
            executionTime: 0,
            cacheHit: false,
            validationPassed: true
          }
        }
      }
      
      throw new Error(response.error || 'Failed to fetch breakdown reports')
    } catch (error) {
      console.error('Breakdown reports API error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }

  async createBreakdownReport(report: Partial<BreakdownReport>): Promise<ApiResponse<BreakdownReport>> {
    return this.httpClient.post<ApiResponse<BreakdownReport>>('/api/breakdown-reports', report)
  }

  async updateBreakdownReport(
    id: string, 
    report: Partial<BreakdownReport>
  ): Promise<ApiResponse<BreakdownReport>> {
    return this.httpClient.put<ApiResponse<BreakdownReport>>(`/api/breakdown-reports/${id}`, report)
  }

  // [SRP] Rule: 대시보드 관련 API만 담당 (중복 제거)
  async getDashboardData(): Promise<ApiResponse<DashboardData>> {
    const cacheKey = 'dashboard-data'
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return {
        success: true,
        data: cached,
        timestamp: new Date().toISOString(),
        metadata: {
          version: '1.0',
          executionTime: 0,
          cacheHit: true
        }
      }
    }

    try {
      // 통합된 대시보드 API 사용 (중복 제거)
      const response = await this.httpClient.get<any>('/api/analytics/dashboard')
      
      if (response.success && response.data) {
        // 스키마 검증 적용
        const validatedDashboardData = this.validateData<DashboardData>(response.data, DashboardDataSchema, 'DashboardData')
        
        this.setCache(cacheKey, validatedDashboardData, 4 * 60 * 1000) // 4분 캐시
        
        return {
          success: true,
          data: validatedDashboardData,
          timestamp: new Date().toISOString(),
          metadata: {
            version: '1.0',
            executionTime: 0,
            cacheHit: false,
            validationPassed: true
          }
        }
      }
      
      throw new Error(response.error || 'Failed to fetch dashboard data')
    } catch (error) {
      console.error('Dashboard API error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }

  async refreshDashboardData(): Promise<ApiResponse<DashboardData>> {
    // 캐시 무효화
    this.cache.delete('dashboard-data')
    
    // POST 요청으로 강제 새로고침
    return this.httpClient.post<ApiResponse<DashboardData>>('/api/analytics/dashboard', {})
  }

  // [SRP] Rule: 수리 보고서 관련 API만 담당
  async getRepairReports(): Promise<ApiResponse<RepairReport[]>> {
    try {
      const response = await this.httpClient.get<any>('/api/repair-reports')
      
      if (response.success && response.data) {
        // 스키마 검증 적용
        const validatedRepairData = this.validateData<RepairReport[]>(response.data, RepairReportSchema, 'RepairReport')
        
        return {
          success: true,
          data: validatedRepairData,
          timestamp: new Date().toISOString(),
          metadata: {
            version: '1.0',
            executionTime: 0,
            cacheHit: false,
            validationPassed: true
          },
          pagination: response.pagination
        }
      }
      
      throw new Error(response.error || 'Failed to fetch repair reports')
    } catch (error) {
      console.error('Repair reports API error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }

  async getRepairReportById(id: string): Promise<ApiResponse<RepairReport>> {
    try {
      const response = await this.httpClient.get<any>(`/api/repair-reports/${id}`)
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          timestamp: new Date().toISOString(),
          metadata: {
            version: '1.0',
            executionTime: 0,
            cacheHit: false
          }
        }
      }
      
      throw new Error(response.error || 'Failed to fetch repair report')
    } catch (error) {
      console.error('Repair report API error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }

  async createRepairReport(report: Partial<RepairReport>): Promise<ApiResponse<RepairReport>> {
    try {
      const response = await this.httpClient.post<any>('/api/repair-reports', report)
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          timestamp: new Date().toISOString(),
          metadata: {
            version: '1.0',
            executionTime: 0,
            cacheHit: false
          }
        }
      }
      
      throw new Error(response.error || 'Failed to create repair report')
    } catch (error) {
      console.error('Create repair report API error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }

  async updateRepairReport(id: string, report: Partial<RepairReport>): Promise<ApiResponse<RepairReport>> {
    try {
      const response = await this.httpClient.put<any>(`/api/repair-reports/${id}`, report)
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          timestamp: new Date().toISOString(),
          metadata: {
            version: '1.0',
            executionTime: 0,
            cacheHit: false
          }
        }
      }
      
      throw new Error(response.error || 'Failed to update repair report')
    } catch (error) {
      console.error('Update repair report API error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }

  async deleteRepairReport(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.httpClient.delete<any>(`/api/repair-reports/${id}`)
      
      if (response.success) {
        return {
          success: true,
          timestamp: new Date().toISOString(),
          metadata: {
            version: '1.0',
            executionTime: 0,
            cacheHit: false
          }
        }
      }
      
      throw new Error(response.error || 'Failed to delete repair report')
    } catch (error) {
      console.error('Delete repair report API error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }

  // [SRP] Rule: 캐시 관리만 담당하는 private 메서드들
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && cached.expiry > Date.now()) {
      return cached.data
    }
    
    if (cached) {
      this.cache.delete(key)
    }
    
    return null
  }

  private setCache(key: string, data: any, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs
    })
  }

  // 캐시 전체 클리어
  public clearCache(): void {
    this.cache.clear()
  }

  // 특정 키 캐시 클리어
  public clearCacheKey(key: string): void {
    this.cache.delete(key)
  }
}

// [DIP] Rule: 의존성 주입을 통한 서비스 인스턴스 생성
export const createApiService = (
  baseUrl?: string,
  headers?: Record<string, string>
): UnifiedApiService => {
  const httpClient = new FetchHttpClient(baseUrl, headers)
  return new UnifiedApiService(httpClient)
}

// 기본 API 서비스 인스턴스
export const apiService = createApiService()