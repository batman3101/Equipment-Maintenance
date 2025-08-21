import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// [SRP] Rule: 수리 보고서 API만 담당
export async function GET(request: NextRequest) {
  try {
    console.log('Fetching repair reports...')

    // URL 파라미터 파싱
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const status = url.searchParams.get('status')
    const equipmentId = url.searchParams.get('equipment_id')
    const technicianId = url.searchParams.get('technician_id')

    // 쿼리 구성
    let query = supabase
      .from('repair_reports')
      .select(`
        *,
        equipment_info:equipment_id (
          id,
          equipment_name,
          equipment_number,
          category
        ),
        profiles:technician_id (
          id,
          full_name,
          email,
          role
        ),
        breakdown_reports:breakdown_report_id (
          id,
          breakdown_title,
          priority
        )
      `)
      .order('created_at', { ascending: false })

    // 필터 적용
    if (status && status !== 'all') {
      // 통합 상태 시스템 또는 legacy 상태 필터링
      query = query.or(`unified_status.eq.${status},repair_completed_at.is.null`)
    }

    if (equipmentId) {
      query = query.eq('equipment_id', equipmentId)
    }

    if (technicianId) {
      query = query.eq('technician_id', technicianId)
    }

    // 페이지네이션 적용
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: `데이터베이스 오류: ${error.message}`, 
          timestamp: new Date().toISOString() 
        }, 
        { status: 500 }
      )
    }

    // 총 개수 조회 (페이지네이션용)
    const { count: totalCount, error: countError } = await supabase
      .from('repair_reports')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.warn('Count query error:', countError)
    }

    const totalPages = Math.ceil((totalCount || 0) / limit)

    // 데이터 정규화
    const normalizedData = (data || []).map(report => ({
      ...report,
      // 담당자 정보 정규화
      technician: report.profiles || null,
      // 설비 정보 정규화  
      equipment: report.equipment_info || null,
      // 고장신고 정보 정규화
      breakdown: report.breakdown_reports || null,
      // 상태 정규화 (통합 상태 시스템 우선)
      status: report.unified_status || 
             (report.repair_completed_at ? 'completed' : 'in_progress'),
      // 완료일 정규화
      completed_at: report.repair_completed_at,
      // 소요시간 정규화
      duration_hours: report.actual_repair_time || 0
    }))

    return NextResponse.json({
      success: true,
      data: normalizedData,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      message: '수리 보고서 목록을 성공적으로 조회했습니다',
      timestamp: new Date().toISOString(),
      metadata: {
        version: '1.0',
        executionTime: Date.now(),
        source: 'repair_reports_table'
      }
    })

  } catch (error) {
    console.error('Repair reports API error:', error)
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

// [SRP] Rule: 수리 보고서 생성만 담당
export async function POST(request: NextRequest) {
  try {
    console.log('Creating repair report...')

    const body = await request.json()
    const {
      breakdown_report_id,
      equipment_id,
      repair_title,
      repair_description,
      technician_id,
      repair_method,
      parts_used,
      parts_cost,
      labor_cost,
      repair_result,
      test_result,
      quality_check = true,
      before_images_urls = [],
      after_images_urls = [],
      notes = ''
    } = body

    // 필수 필드 검증
    if (!breakdown_report_id || !equipment_id || !repair_title || !technician_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: '필수 필드가 누락되었습니다 (breakdown_report_id, equipment_id, repair_title, technician_id)', 
          timestamp: new Date().toISOString() 
        }, 
        { status: 400 }
      )
    }

    // 고장 신고 존재 확인
    const { data: breakdown, error: breakdownError } = await supabase
      .from('breakdown_reports')
      .select('id, equipment_id, breakdown_title')
      .eq('id', breakdown_report_id)
      .single()

    if (breakdownError || !breakdown) {
      return NextResponse.json(
        { 
          success: false, 
          error: `고장 신고를 찾을 수 없습니다: ${breakdown_report_id}`, 
          timestamp: new Date().toISOString() 
        }, 
        { status: 404 }
      )
    }

    // 설비 ID 일치 확인
    if (breakdown.equipment_id !== equipment_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: '고장 신고의 설비 ID와 수리 대상 설비 ID가 일치하지 않습니다', 
          timestamp: new Date().toISOString() 
        }, 
        { status: 400 }
      )
    }

    // 수리 시작 시간
    const repair_started_at = new Date().toISOString()
    
    // 수리 보고서 생성
    const { data: repairReport, error: createError } = await supabase
      .from('repair_reports')
      .insert({
        breakdown_report_id,
        equipment_id,
        repair_title,
        repair_description,
        repair_method,
        technician_id,
        repair_started_at,
        repair_completed_at: repair_started_at, // 일단 시작시간으로 설정
        actual_repair_time: 0, // 초기값
        parts_used,
        parts_cost: parts_cost || 0,
        labor_cost: labor_cost || 0,
        total_cost: (parts_cost || 0) + (labor_cost || 0),
        repair_result: repair_result || '수리 진행중',
        test_result,
        quality_check,
        before_images_urls,
        after_images_urls,
        notes,
        unified_status: 'repair_in_progress', // 통합 상태 시스템 사용
        complexity_level: 'medium', // 기본값
        required_skills: [],
        certification_required: false,
        safety_requirements: [],
        environmental_impact: null
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create repair report:', createError)
      return NextResponse.json(
        { 
          success: false, 
          error: `수리 보고서 생성 실패: ${createError.message}`, 
          timestamp: new Date().toISOString() 
        }, 
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: repairReport,
      message: '수리 보고서가 성공적으로 생성되었습니다',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Create repair report error:', error)
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