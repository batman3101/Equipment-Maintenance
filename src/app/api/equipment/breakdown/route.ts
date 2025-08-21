import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// [SRP] Rule: 고장 중인 설비 목록 조회만 담당
export async function GET(request: NextRequest) {
  try {
    // 임시로 인증 우회 (개발 중)
    console.log('Fetching breakdown equipment...')

    // 고장 중인 설비 조회 (breakdown_reports에서 활성 상태인 것들)
    const { data: breakdownReports, error: breakdownError } = await supabase
      .from('breakdown_reports')
      .select(`
        id,
        equipment_id,
        breakdown_title,
        breakdown_description,
        status,
        urgency_level,
        occurred_at,
        equipment_info:equipment_id (
          id,
          equipment_name,
          equipment_number,
          category,
          location
        )
      `)
      .in('status', ['reported', 'assigned', 'in_progress'])
      .order('occurred_at', { ascending: false })

    if (breakdownError) {
      console.error('Database error:', breakdownError)
      return NextResponse.json(
        { 
          success: false, 
          error: `데이터베이스 오류: ${breakdownError.message}`, 
          timestamp: new Date().toISOString() 
        }, 
        { status: 500 }
      )
    }

    // 중복 제거 및 포맷팅
    const uniqueEquipment = new Map()
    
    breakdownReports?.forEach(report => {
      const equipmentInfo = Array.isArray(report.equipment_info) ? report.equipment_info[0] : report.equipment_info
      if (equipmentInfo && !uniqueEquipment.has(report.equipment_id)) {
        uniqueEquipment.set(report.equipment_id, {
          id: report.equipment_id,
          equipment_name: equipmentInfo.equipment_name,
          equipment_number: equipmentInfo.equipment_number,
          category: equipmentInfo.category,
          location: equipmentInfo.location,
          breakdown_report_id: report.id,
          breakdown_title: report.breakdown_title,
          breakdown_status: report.status,
          urgency_level: report.urgency_level,
          occurred_at: report.occurred_at,
          display_text: `${equipmentInfo.equipment_number} - ${equipmentInfo.equipment_name} (${report.status})`
        })
      }
    })

    const breakdownEquipmentList = Array.from(uniqueEquipment.values())

    return NextResponse.json({
      success: true,
      data: breakdownEquipmentList,
      count: breakdownEquipmentList.length,
      message: '고장 중인 설비 목록을 성공적으로 조회했습니다',
      timestamp: new Date().toISOString(),
      metadata: {
        version: '1.0',
        executionTime: Date.now()
      }
    })

  } catch (error) {
    console.error('Breakdown equipment API error:', error)
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