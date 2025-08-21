import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service Role를 사용한 Supabase 클라이언트 (RLS 우회 가능)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// GET 메서드: 모든 설비 상태 조회
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 설비 상태 일괄 조회 중...')

    // Service Role로 모든 설비 상태 조회 (RLS 정책 우회)
    const { data: statuses, error: selectError } = await supabaseAdmin
      .from('equipment_status')
      .select('*')
      .order('status_changed_at', { ascending: false })

    if (selectError) {
      console.error('Bulk status select error:', selectError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch equipment statuses', 
          details: selectError,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    console.log(`✅ ${statuses?.length || 0}개 설비 상태 조회 완료`)

    // 상태별 카운트 계산
    const statusCounts = statuses?.reduce((acc, status) => {
      acc[status.status] = (acc[status.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    console.log('📊 상태 분포:', statusCounts)

    // 데이터 변환 (DB -> 클라이언트 형식)
    const transformedStatuses = statuses?.map(status => ({
      id: status.id,
      equipmentId: status.equipment_id,
      status: status.status,
      statusReason: status.status_reason,
      updatedBy: status.updated_by,
      statusChangedAt: status.status_changed_at,
      lastMaintenanceDate: status.last_maintenance_date,
      nextMaintenanceDate: status.next_maintenance_date,
      operatingHours: status.operating_hours,
      notes: status.notes,
      createdAt: status.created_at,
      updatedAt: status.updated_at
    })) || []

    return NextResponse.json({
      success: true,
      data: transformedStatuses,
      count: transformedStatuses.length,
      timestamp: new Date().toISOString(),
      metadata: {
        version: '1.0',
        statusCounts,
        executionTime: Date.now()
      }
    })

  } catch (error) {
    console.error('Bulk status select API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// POST 메서드: 설비 상태 일괄 삽입
export async function POST(request: NextRequest) {
  try {
    const { statuses } = await request.json()
    
    if (!statuses || !Array.isArray(statuses) || statuses.length === 0) {
      return NextResponse.json(
        { error: 'Invalid statuses data' },
        { status: 400 }
      )
    }

    console.log('Bulk inserting equipment statuses:', statuses.length)

    // Service Role로 설비 상태 정보 삽입 (RLS 정책 우회)
    const { data: insertedStatuses, error: insertError } = await supabaseAdmin
      .from('equipment_status')
      .insert(statuses)
      .select()

    if (insertError) {
      console.error('Bulk status insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to insert equipment statuses', details: insertError },
        { status: 500 }
      )
    }

    console.log('Successfully inserted:', insertedStatuses?.length, 'statuses')

    return NextResponse.json({
      success: true,
      data: insertedStatuses,
      count: insertedStatuses?.length || 0
    })

  } catch (error) {
    console.error('Bulk status insert API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}