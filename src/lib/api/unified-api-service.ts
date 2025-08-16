// [SRP] Rule: API 호출 및 응답 처리만을 담당하는 서비스
// [DIP] Rule: 구체적인 HTTP 클라이언트에 의존하지 않는 추상화

import { Equipment, EquipmentStatusInfo } from '@/types/equipment'
import { BreakdownReport } from '@/types/breakdown'
import { DashboardData } from '@/types/dashboard'

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
    const timeout = options?.timeout || 30000

    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
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

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
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
  DashboardApiService {
  
  private httpClient: HttpClient
  private cache: Map<string, { data: any; expiry: number }> = new Map()

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
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

    const response = await this.httpClient.get<ApiResponse<Equipment[]>>('/api/equipment/paginated')
    
    if (response.success && response.data) {
      this.setCache(cacheKey, response.data, 5 * 60 * 1000) // 5분 캐시
    }

    return response
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
    return this.httpClient.get<ApiResponse<EquipmentStatusInfo[]>>('/api/equipment/bulk-status')
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
    return this.httpClient.get<ApiResponse<BreakdownReport[]>>('/api/breakdown-reports')
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

    // 통합된 대시보드 API 사용 (중복 제거)
    const response = await this.httpClient.get<ApiResponse<DashboardData>>('/api/analytics/dashboard')
    
    if (response.success && response.data) {
      this.setCache(cacheKey, response.data, 4 * 60 * 1000) // 4분 캐시
    }

    return response
  }

  async refreshDashboardData(): Promise<ApiResponse<DashboardData>> {
    // 캐시 무효화
    this.cache.delete('dashboard-data')
    
    // POST 요청으로 강제 새로고침
    return this.httpClient.post<ApiResponse<DashboardData>>('/api/analytics/dashboard', {})
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