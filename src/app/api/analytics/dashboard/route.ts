import { NextRequest, NextResponse } from 'next/server'
import { DataFetcher, AnalyticsEngine, DataManager } from '@/lib/analytics'

// 전역 캠시 변수 (서버 인스턴스 범위)
// const lastDataFetch: number = 0
// const CACHE_DURATION = 4 * 60 * 1000 // 4분

/**
 * 대시보드 분석 데이터 API
 * GET /api/analytics/dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // 캐시된 데이터 사용 (최적화된 4분 TTL)
    const dashboardData = await DataManager.getCachedData(
      'dashboard-analytics',
      async () => {
        const startTime = Date.now()
        
        // 기본 데이터 조회 (필수 필드만 선택하여 성능 개선)
        const [equipment, statusData, breakdowns, repairs, maintenance] = await Promise.all([
          DataFetcher.getAllEquipment('id, equipment_number, equipment_name, category, location'),
          DataFetcher.getAllEquipmentStatus('id, equipment_id, status, updated_at'),
          DataFetcher.getAllBreakdownReports(),
          DataFetcher.getAllRepairReports(),
          DataFetcher.getAllMaintenanceSchedules()
        ])
        
        console.log(`Data fetch completed in ${Date.now() - startTime}ms`)

        // 일일 통계 계산
        const dailyStats = AnalyticsEngine.calculateDailyStats(
          breakdowns,
          repairs,
          equipment,
          statusData
        )

        // 종합 메트릭 계산
        const comprehensiveMetrics = AnalyticsEngine.generateComprehensiveMetrics(
          equipment,
          statusData,
          breakdowns,
          repairs,
          maintenance
        )

        // 트렌드 데이터 생성
        const trendData = AnalyticsEngine.generateTrendData(breakdowns, repairs, 'monthly')

        // 설비별 점수 계산
        const equipmentScores = equipment.map(eq => {
          const status = statusData.find(s => s.equipment_id === eq.id)
          const equipmentBreakdowns = breakdowns.filter(b => b.equipment_id === eq.id)
          const equipmentMaintenance = maintenance.filter(m => m.equipment_id === eq.id)
          
          const scoreData = AnalyticsEngine.calculateEquipmentScore(
            eq,
            status,
            equipmentBreakdowns,
            equipmentMaintenance
          )

          return {
            id: eq.id,
            name: eq.equipment_number,
            score: scoreData.score,
            grade: scoreData.grade,
            status: status?.status || 'unknown'
          }
        }).sort((a, b) => b.score - a.score)

        const processingTime = Date.now() - startTime
        console.log(`Dashboard data processing completed in ${processingTime}ms`)
        
        return {
          dailyStats,
          comprehensiveMetrics,
          trendData,
          equipmentScores: equipmentScores.slice(0, 20), // 상위 20개만 반환다 (대용량 데이터 방지)
          lastUpdated: new Date().toISOString(),
          performanceMetrics: {
            dataFetchTime: processingTime,
            recordCount: {
              equipment: equipment.length,
              breakdowns: breakdowns.length,
              repairs: repairs.length
            }
          }
        }
      },
      4 // 4분 캐시 (성능 및 실시간성 균형)
    )

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('Dashboard analytics error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard analytics'
      },
      { status: 500 }
    )
  }
}

/**
 * 대시보드 데이터 강제 새로고침
 * POST /api/analytics/dashboard
 */
export async function POST(request: NextRequest) {
  try {
    // 캐시 클리어
    DataManager.clearCacheKey('dashboard-analytics')
    
    // 새 데이터 가져오기
    const response = await GET(request)
    return response

  } catch (error) {
    console.error('Dashboard refresh error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh dashboard data'
      },
      { status: 500 }
    )
  }
}