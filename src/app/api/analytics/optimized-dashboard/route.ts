import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * [OCP] Rule: 기존 API를 수정하지 않고 새로운 최적화된 엔드포인트 추가
 * 데이터베이스 쿼리 최적화 - JOIN을 사용한 단일 쿼리로 성능 개선
 */

interface OptimizedDashboardData {
  equipment: {
    id: string
    equipment_number: string
    equipment_name: string
    category: string
    location: string | null
    status: string
    last_maintenance_date: string | null
    operating_hours: number | null
    breakdown_count: number
    repair_count: number
  }[]
  dailyStats: {
    totalEquipment: number
    operationalEquipment: number
    breakdownCount: number
    repairCount: number
    maintenanceCount: number
  }
  categoryBreakdown: Record<string, number>
  statusDistribution: Record<string, number>
  lastUpdated: string
}

/**
 * 최적화된 대시보드 데이터 API
 * 개별 쿼리들을 JOIN으로 통합하여 네트워크 라운드트립 감소
 */
export async function GET(_request: NextRequest) {
  try {
    const startTime = Date.now()

    // 1. 설비 정보와 상태를 JOIN으로 한 번에 조회
    const { data: equipmentWithStatus, error: equipmentError } = await supabase
      .from('equipment_info')
      .select(`
        id,
        equipment_number,
        equipment_name,
        category,
        location,
        equipment_status (
          status,
          status_changed_at,
          last_maintenance_date,
          operating_hours
        )
      `)
      .order('created_at', { ascending: false })

    if (equipmentError) {
      throw new Error(`Equipment query failed: ${equipmentError.message}`)
    }

    // 2. 고장 및 수리 통계를 한 번에 조회 (서브쿼리 사용)
    const { data: breakdownStats, error: breakdownError } = await supabase
      .rpc('get_equipment_breakdown_stats')

    if (breakdownError) {
      console.warn('Breakdown stats query failed:', breakdownError)
    }

    // 3. 오늘 날짜 기준 통계 조회 (단일 쿼리)
    const today = new Date().toISOString().split('T')[0]
    const { data: dailyBreakdowns, error: dailyError } = await supabase
      .from('breakdown_reports')
      .select('equipment_id, created_at, priority')
      .gte('created_at', today)

    if (dailyError) {
      console.warn('Daily breakdowns query failed:', dailyError)
    }

    // 4. 수리 완료 통계 (오늘 기준)
    const { data: dailyRepairs, error: repairError } = await supabase
      .from('repair_reports')
      .select('equipment_id, completion_date, status')
      .gte('completion_date', today)
      .eq('status', 'completed')

    if (repairError) {
      console.warn('Daily repairs query failed:', repairError)
    }

    // 데이터 변환 및 통계 계산
    const processedData = processEquipmentData({
      equipmentWithStatus: equipmentWithStatus || [],
      breakdownStats: breakdownStats || [],
      dailyBreakdowns: dailyBreakdowns || [],
      dailyRepairs: dailyRepairs || []
    })

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: {
        ...processedData,
        lastUpdated: new Date().toISOString(),
        performanceMetrics: {
          queryTime: processingTime,
          optimizationType: 'JOIN_QUERIES',
          recordCount: {
            equipment: equipmentWithStatus?.length || 0,
            breakdowns: dailyBreakdowns?.length || 0,
            repairs: dailyRepairs?.length || 0
          }
        }
      }
    })

  } catch (error) {
    console.error('Optimized dashboard analytics error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch optimized dashboard analytics'
      },
      { status: 500 }
    )
  }
}

/**
 * [SRP] Rule: 데이터 처리만을 담당하는 순수 함수
 */
function processEquipmentData({
  equipmentWithStatus,
  breakdownStats,
  dailyBreakdowns,
  dailyRepairs
}: {
  equipmentWithStatus: any[]
  breakdownStats: any[]
  dailyBreakdowns: any[]
  dailyRepairs: any[]
}): Omit<OptimizedDashboardData, 'lastUpdated'> {
  
  // 설비별 고장/수리 횟수 맵 생성
  const breakdownCountMap = new Map<string, number>()
  const repairCountMap = new Map<string, number>()

  breakdownStats.forEach(stat => {
    breakdownCountMap.set(stat.equipment_id, stat.breakdown_count || 0)
    repairCountMap.set(stat.equipment_id, stat.repair_count || 0)
  })

  // 처리된 설비 데이터
  const equipment = equipmentWithStatus.map(eq => ({
    id: eq.id,
    equipment_number: eq.equipment_number,
    equipment_name: eq.equipment_name,
    category: eq.category,
    location: eq.location,
    status: eq.equipment_status?.[0]?.status || 'unknown',
    last_maintenance_date: eq.equipment_status?.[0]?.last_maintenance_date,
    operating_hours: eq.equipment_status?.[0]?.operating_hours || 0,
    breakdown_count: breakdownCountMap.get(eq.id) || 0,
    repair_count: repairCountMap.get(eq.id) || 0
  }))

  // 상태별 분포 계산
  const statusDistribution = equipment.reduce((acc, eq) => {
    acc[eq.status] = (acc[eq.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // 카테고리별 분포 계산
  const categoryBreakdown = equipment.reduce((acc, eq) => {
    acc[eq.category] = (acc[eq.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // 일일 통계 계산
  const dailyStats = {
    totalEquipment: equipment.length,
    operationalEquipment: statusDistribution.running || 0,
    breakdownCount: dailyBreakdowns.length,
    repairCount: dailyRepairs.length,
    maintenanceCount: statusDistribution.maintenance || 0
  }

  return {
    equipment,
    dailyStats,
    categoryBreakdown,
    statusDistribution
  }
}

/**
 * POST 요청으로 캐시 강제 새로고침
 */
export async function POST(_request: NextRequest) {
  try {
    // 캐시 무효화 헤더와 함께 GET 요청과 동일한 로직 실행
    const response = await GET(_request)
    
    return NextResponse.json({
      ...await response.json(),
      cached: false,
      refreshedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Optimized dashboard refresh error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh optimized dashboard data'
      },
      { status: 500 }
    )
  }
}