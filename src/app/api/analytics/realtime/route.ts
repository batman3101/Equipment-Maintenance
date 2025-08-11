import { NextRequest, NextResponse } from 'next/server'
import { RealtimeHelper, DataManager } from '@/lib/analytics'

/**
 * 실시간 데이터 업데이트 API (성능 최적화됨)
 * GET /api/analytics/realtime - 최신 데이터 조회 (30초 캐시)
 * POST /api/analytics/realtime - 실시간 데이터 강제 새로고침
 */

export async function GET(_request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // 실시간 데이터 가져오기 (캐시 TTL: 30초 - 성능 개선)
    const realtimeData = await DataManager.getCachedData(
      'realtime-data',
      async () => {
        const fetchStartTime = Date.now()
        const data = await RealtimeHelper.getLatestData()
        console.log(`Realtime data fetch: ${Date.now() - fetchStartTime}ms`)
        return data
      },
      0.5 // 30초 캐시
    )

    const processingTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      data: realtimeData,
      timestamp: new Date().toISOString(),
      performanceMetrics: {
        responseTime: processingTime,
        cacheHit: processingTime < 50 // 50ms 내면 캐시 히트로 추정
      }
    })

  } catch (error) {
    console.error('Realtime data error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch realtime data'
      },
      { status: 500 }
    )
  }
}

export async function POST(_request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // 실시간 데이터 캐시만 클리어 (선택적 캐시 클리어)
    DataManager.clearCacheKey('realtime-data')
    
    // 새 데이터 가져오기
    const freshData = await RealtimeHelper.getLatestData()
    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: freshData,
      message: 'Realtime cache cleared and data refreshed',
      timestamp: new Date().toISOString(),
      performanceMetrics: {
        refreshTime: processingTime
      }
    })

  } catch (error) {
    console.error('Realtime refresh error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh realtime data'
      },
      { status: 500 }
    )
  }
}