import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * [OCP] Rule: 기존 equipment API를 확장하여 페이징 지원 추가
 * 대용량 데이터 처리를 위한 서버 사이드 페이징 API
 */

interface PaginatedQuery {
  page: number
  limit: number
  search?: string
  status?: string
  category?: string
  sortBy: string  // Required field with default value
  sortOrder: 'asc' | 'desc'  // Required field with default value
}

interface PaginatedResponse {
  equipment: any[]
  statuses: any[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    hasNextPage: boolean
    hasPrevPage: boolean
    limit: number
  }
}

/**
 * [SRP] Rule: 페이징된 설비 데이터 조회만을 담당
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // 쿼리 파라미터 파싱 및 검증
    const query: PaginatedQuery = {
      page: Math.max(1, parseInt(searchParams.get('page') || '1')),
      limit: Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50'))), // 10-100 사이로 제한
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    }

    const startTime = Date.now()

    // 1. 총 아이템 수 조회 (필터 적용)
    let countQuery = supabase
      .from('equipment_info')
      .select('id', { count: 'exact', head: true })

    // 필터 적용
    if (query.search) {
      countQuery = countQuery.or(
        `equipment_number.ilike.%${query.search}%,` +
        `equipment_name.ilike.%${query.search}%,` +
        `category.ilike.%${query.search}%,` +
        `manufacturer.ilike.%${query.search}%,` +
        `model.ilike.%${query.search}%,` +
        `location.ilike.%${query.search}%`
      )
    }

    if (query.category && query.category !== 'all') {
      countQuery = countQuery.eq('category', query.category)
    }

    const { count: totalItems, error: countError } = await countQuery

    if (countError) {
      throw new Error(`Count query failed: ${countError.message}`)
    }

    const totalPages = Math.ceil((totalItems || 0) / query.limit)
    const offset = (query.page - 1) * query.limit

    // 2. 페이징된 설비 데이터 조회 (JOIN으로 상태 정보 포함)
    let dataQuery = supabase
      .from('equipment_info')
      .select(`
        id,
        equipment_number,
        equipment_name,
        category,
        location,
        manufacturer,
        model,
        installation_date,
        specifications,
        created_at,
        updated_at,
        equipment_status (
          id,
          status,
          status_reason,
          status_changed_at,
          last_maintenance_date,
          operating_hours,
          updated_by
        )
      `)

    // 동일한 필터 적용
    if (query.search) {
      dataQuery = dataQuery.or(
        `equipment_number.ilike.%${query.search}%,` +
        `equipment_name.ilike.%${query.search}%,` +
        `category.ilike.%${query.search}%,` +
        `manufacturer.ilike.%${query.search}%,` +
        `model.ilike.%${query.search}%,` +
        `location.ilike.%${query.search}%`
      )
    }

    if (query.category && query.category !== 'all') {
      dataQuery = dataQuery.eq('category', query.category)
    }

    // 상태 필터링 (조인된 데이터에서)
    if (query.status && query.status !== 'all') {
      dataQuery = dataQuery.eq('equipment_status.status', query.status)
    }

    // 정렬 적용
    const sortColumn = getSortColumn(query.sortBy)
    dataQuery = dataQuery
      .order(sortColumn, { ascending: query.sortOrder === 'asc' })
      .range(offset, offset + query.limit - 1)

    const { data: equipmentData, error: dataError } = await dataQuery

    if (dataError) {
      throw new Error(`Data query failed: ${dataError.message}`)
    }

    // 3. 데이터 변환
    const equipment = (equipmentData || []).map(eq => ({
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

    // 4. 상태 정보 분리
    const statuses = (equipmentData || [])
      .filter(eq => eq.equipment_status && eq.equipment_status.length > 0)
      .map(eq => ({
        id: eq.equipment_status[0].id,
        equipmentId: eq.id,
        status: eq.equipment_status[0].status,
        statusReason: eq.equipment_status[0].status_reason,
        statusChangedAt: eq.equipment_status[0].status_changed_at,
        lastMaintenanceDate: eq.equipment_status[0].last_maintenance_date,
        operatingHours: eq.equipment_status[0].operating_hours,
        updatedBy: eq.equipment_status[0].updated_by
      }))

    const processingTime = Date.now() - startTime

    const response: PaginatedResponse = {
      equipment,
      statuses,
      pagination: {
        currentPage: query.page,
        totalPages,
        totalItems: totalItems || 0,
        hasNextPage: query.page < totalPages,
        hasPrevPage: query.page > 1,
        limit: query.limit
      }
    }

    return NextResponse.json({
      success: true,
      data: response,
      performance: {
        queryTime: processingTime,
        queriedItems: equipment.length,
        totalItems: totalItems || 0,
        cacheHeaders: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Total-Count': (totalItems || 0).toString(),
        'X-Page-Count': totalPages.toString(),
        'X-Current-Page': query.page.toString()
      }
    })

  } catch (error) {
    console.error('Paginated equipment API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch paginated equipment data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * [SRP] Rule: 정렬 컬럼 매핑만을 담당하는 순수 함수
 * [LSP] Rule: 정확한 타입 정의로 치환 가능성 보장
 */
type SortableColumn = 
  | 'equipmentNumber' 
  | 'equipmentName' 
  | 'category' 
  | 'location' 
  | 'manufacturer' 
  | 'model' 
  | 'installationDate' 
  | 'created_at' 
  | 'updated_at'

function getSortColumn(sortBy: string): string {
  const columnMap: Record<SortableColumn, string> = {
    'equipmentNumber': 'equipment_number',
    'equipmentName': 'equipment_name',
    'category': 'category',
    'location': 'location',
    'manufacturer': 'manufacturer',
    'model': 'model',
    'installationDate': 'installation_date',
    'created_at': 'created_at',
    'updated_at': 'updated_at'
  }

  // Type-safe column mapping with fallback
  return columnMap[sortBy as SortableColumn] || 'created_at'
}

/**
 * 검색 결과 미리보기 API (빠른 응답을 위한 제한된 필드)
 */
export async function POST(request: NextRequest) {
  try {
    const { searchTerm, limit = 10 } = await request.json()
    
    if (!searchTerm || searchTerm.length < 2) {
      return NextResponse.json({
        success: true,
        data: { equipment: [], totalMatches: 0 }
      })
    }

    // 빠른 검색을 위해 필수 필드만 조회
    const { data: searchResults, error } = await supabase
      .from('equipment_info')
      .select('id, equipment_number, equipment_name, category')
      .or(
        `equipment_number.ilike.%${searchTerm}%,` +
        `equipment_name.ilike.%${searchTerm}%,` +
        `category.ilike.%${searchTerm}%`
      )
      .limit(limit)

    if (error) {
      throw new Error(`Search query failed: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      data: {
        equipment: searchResults || [],
        totalMatches: (searchResults || []).length,
        searchTerm,
        isPartialResult: (searchResults || []).length === limit
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    })

  } catch (error) {
    console.error('Equipment search API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search equipment'
      },
      { status: 500 }
    )
  }
}