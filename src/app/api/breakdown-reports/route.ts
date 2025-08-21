import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// [SRP] Rule: 고장 신고 API만 담당
export async function GET(request: NextRequest) {
  try {
    // 임시로 인증 우회 (개발 중)
    console.log('Fetching breakdown reports...')

    // URL 파라미터 파싱
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const status = url.searchParams.get('status')
    const equipmentId = url.searchParams.get('equipment_id')
    const urgencyLevel = url.searchParams.get('urgency_level')

    // 쿼리 구성
    let query = supabase
      .from('breakdown_reports')
      .select(`
        *,
        equipment_info:equipment_id (
          id,
          equipment_name,
          equipment_number,
          category
        ),
        profiles:reporter_id (
          id,
          username,
          role
        )
      `)
      .order('created_at', { ascending: false })

    // 필터 적용
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (equipmentId) {
      query = query.eq('equipment_id', equipmentId)
    }

    if (urgencyLevel && urgencyLevel !== 'all') {
      query = query.eq('urgency_level', urgencyLevel)
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
    const { count: totalCount } = await supabase
      .from('breakdown_reports')
      .select('*', { count: 'exact', head: true })

    const totalPages = Math.ceil((totalCount || 0) / limit)

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages
      },
      message: '고장 신고 목록을 성공적으로 조회했습니다',
      timestamp: new Date().toISOString(),
      metadata: {
        version: '1.0',
        executionTime: Date.now()
      }
    })

  } catch (error) {
    console.error('Breakdown reports API error:', error)
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

// [SRP] Rule: 고장 신고 생성만 담당
export async function POST(request: NextRequest) {
  try {
    // 임시로 인증 우회 (개발 중)
    console.log('Creating breakdown report...')

    const body = await request.json()
    const {
      equipmentCategory,
      equipmentNumber,
      reporterName,
      urgencyLevel,
      issueType,
      description,
      symptoms
    } = body

    // 필수 필드 검증
    if (!equipmentNumber || !reporterName || !urgencyLevel || !issueType || !description) {
      return NextResponse.json(
        { 
          success: false, 
          error: '필수 필드가 누락되었습니다', 
          timestamp: new Date().toISOString() 
        }, 
        { status: 400 }
      )
    }

    // 설비 정보 조회
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment_info')
      .select('id, equipment_name, equipment_number, category')
      .eq('equipment_number', equipmentNumber)
      .single()

    if (equipmentError || !equipment) {
      return NextResponse.json(
        { 
          success: false, 
          error: `설비를 찾을 수 없습니다: ${equipmentNumber}`, 
          timestamp: new Date().toISOString() 
        }, 
        { status: 404 }
      )
    }

    // 고장 신고 데이터 준비
    const breakdownData = {
      equipment_id: equipment.id,
      equipment_category: equipmentCategory || equipment.category,
      equipment_number: equipmentNumber,
      reporter_name: reporterName,
      reporter_id: null, // 임시로 null
      urgency_level: urgencyLevel,
      issue_type: issueType,
      description,
      symptoms: symptoms || '',
      status: 'reported',
      occurred_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // 고장 신고 생성
    const { data: newBreakdown, error: insertError } = await supabase
      .from('breakdown_reports')
      .insert(breakdownData)
      .select(`
        *,
        equipment_info:equipment_id (
          id,
          equipment_name,
          equipment_number,
          category
        )
      `)
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { 
          success: false, 
          error: `고장 신고 등록 실패: ${insertError.message}`, 
          timestamp: new Date().toISOString() 
        }, 
        { status: 500 }
      )
    }

    // 설비 상태를 breakdown으로 변경
    try {
      const { error: statusError } = await supabase
        .from('equipment_status')
        .upsert({
          equipment_id: equipment.id,
          status: 'breakdown',
          status_reason: `고장 신고: ${issueType}`,
          updated_by: null, // 임시로 null
          status_changed_at: new Date().toISOString(),
          breakdown_start_time: new Date().toISOString(),
          notes: `고장 신고 ID: ${newBreakdown.id}`
        })

      if (statusError) {
        console.warn('Failed to update equipment status:', statusError)
        // 상태 업데이트 실패는 경고로만 처리하고 고장 신고 생성은 성공으로 처리
      }
    } catch (statusUpdateError) {
      console.warn('Equipment status update failed:', statusUpdateError)
    }

    return NextResponse.json({
      success: true,
      data: newBreakdown,
      message: '고장 신고가 성공적으로 등록되었습니다',
      timestamp: new Date().toISOString(),
      metadata: {
        version: '1.0',
        executionTime: Date.now()
      }
    })

  } catch (error) {
    console.error('Create breakdown report error:', error)
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