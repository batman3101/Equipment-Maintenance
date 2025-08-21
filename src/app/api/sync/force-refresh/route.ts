import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

// [SRP] Rule: 강제 데이터 동기화만 담당
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient<Database>({ 
      cookies: () => cookies() 
    })

    // 사용자 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false, 
          error: '인증이 필요합니다', 
          timestamp: new Date().toISOString() 
        }, 
        { status: 401 }
      )
    }

    console.log('Force refresh initiated by user:', user.id)

    // 동시에 모든 데이터 조회
    const [equipmentResult, statusResult, breakdownResult] = await Promise.allSettled([
      // 설비 정보 조회
      supabase
        .from('equipment_info')
        .select('*')
        .order('created_at', { ascending: false }),
      
      // 설비 상태 조회
      supabase
        .from('equipment_status')
        .select('*')
        .order('status_changed_at', { ascending: false }),
      
      // 고장 신고 조회
      supabase
        .from('breakdown_reports')
        .select(`
          *,
          equipment_info:equipment_id (
            id,
            equipment_name,
            equipment_number,
            category
          )
        `)
        .order('created_at', { ascending: false })
    ])

    const result = {
      equipments: [],
      statuses: [],
      breakdowns: [],
      errors: [] as string[],
      stats: {
        total_equipments: 0,
        active_breakdowns: 0,
        equipment_status_breakdown: {} as Record<string, number>
      }
    }

    // 설비 정보 처리
    if (equipmentResult.status === 'fulfilled' && !equipmentResult.value.error) {
      result.equipments = equipmentResult.value.data || []
      result.stats.total_equipments = result.equipments.length
    } else {
      result.errors.push('설비 정보 조회 실패')
    }

    // 설비 상태 처리
    if (statusResult.status === 'fulfilled' && !statusResult.value.error) {
      result.statuses = statusResult.value.data || []
      
      // 상태별 통계 계산
      result.statuses.forEach((status: any) => {
        const statusKey = status.status || 'unknown'
        result.stats.equipment_status_breakdown[statusKey] = 
          (result.stats.equipment_status_breakdown[statusKey] || 0) + 1
      })
    } else {
      result.errors.push('설비 상태 조회 실패')
    }

    // 고장 신고 처리
    if (breakdownResult.status === 'fulfilled' && !breakdownResult.value.error) {
      result.breakdowns = breakdownResult.value.data || []
      
      // 활성 고장 신고 계산
      result.stats.active_breakdowns = result.breakdowns.filter((breakdown: any) => 
        ['reported', 'assigned', 'in_progress'].includes(breakdown.status)
      ).length
    } else {
      result.errors.push('고장 신고 조회 실패')
    }

    // 데이터 일관성 검증
    const inconsistencies = []
    
    // 고장 신고가 있는데 설비 상태가 정상인 경우 찾기
    const activeBreakdownEquipmentIds = new Set(
      result.breakdowns
        .filter((breakdown: any) => ['reported', 'assigned', 'in_progress'].includes(breakdown.status))
        .map((breakdown: any) => breakdown.equipment_id)
    )
    
    const runningEquipmentIds = new Set(
      result.statuses
        .filter((status: any) => status.status === 'running')
        .map((status: any) => status.equipment_id)
    )
    
    // 고장 신고가 있는데 running 상태인 설비들
    const inconsistentEquipments = Array.from(activeBreakdownEquipmentIds)
      .filter(id => runningEquipmentIds.has(id))
    
    if (inconsistentEquipments.length > 0) {
      inconsistencies.push(`${inconsistentEquipments.length}개 설비에 상태 불일치 발견 (고장 신고 있음 but 상태=정상)`)
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: '데이터 동기화 및 검증 완료',
      inconsistencies,
      timestamp: new Date().toISOString(),
      metadata: {
        version: '1.0',
        executionTime: Date.now(),
        user_id: user.id,
        data_integrity: {
          has_inconsistencies: inconsistencies.length > 0,
          inconsistency_count: inconsistencies.length
        }
      }
    })

  } catch (error) {
    console.error('Force refresh error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다', 
        timestamp: new Date().toISOString() 
      }, 
      { status: 500 }
    )
  }
}