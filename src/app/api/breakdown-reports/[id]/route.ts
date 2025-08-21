import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// [SRP] Rule: 특정 고장 신고 조회만 담당
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: breakdown, error } = await supabase
      .from('breakdown_reports')
      .select(`
        *,
        equipment_info:equipment_id (
          id,
          equipment_name,
          equipment_number,
          category,
          location
        ),
        profiles:reporter_id (
          id,
          username,
          role
        )
      `)
      .eq('id', params.id)
      .single()

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

    if (!breakdown) {
      return NextResponse.json(
        { 
          success: false, 
          error: '고장 신고를 찾을 수 없습니다', 
          timestamp: new Date().toISOString() 
        }, 
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: breakdown,
      message: '고장 신고 상세 정보를 성공적으로 조회했습니다',
      timestamp: new Date().toISOString(),
      metadata: {
        version: '1.0',
        executionTime: Date.now()
      }
    })

  } catch (error) {
    console.error('Get breakdown report error:', error)
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

// [SRP] Rule: 고장 신고 업데이트만 담당
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json()
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    }

    // 현재 상태 조회
    const { data: currentBreakdown, error: fetchError } = await supabase
      .from('breakdown_reports')
      .select('*, equipment_info:equipment_id(id)')
      .eq('id', params.id)
      .single()

    if (fetchError || !currentBreakdown) {
      return NextResponse.json(
        { 
          success: false, 
          error: '고장 신고를 찾을 수 없습니다', 
          timestamp: new Date().toISOString() 
        }, 
        { status: 404 }
      )
    }

    // 고장 신고 업데이트
    const { data: updatedBreakdown, error: updateError } = await supabase
      .from('breakdown_reports')
      .update(updateData)
      .eq('id', params.id)
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

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { 
          success: false, 
          error: `고장 신고 업데이트 실패: ${updateError.message}`, 
          timestamp: new Date().toISOString() 
        }, 
        { status: 500 }
      )
    }

    // 상태 변경 시 설비 상태도 동기화
    if (body.status && body.status !== currentBreakdown.status) {
      try {
        const equipmentId = currentBreakdown.equipment_id
        let newEquipmentStatus = 'running' // 기본값

        switch (body.status) {
          case 'reported':
          case 'assigned':
          case 'in_progress':
            newEquipmentStatus = 'breakdown'
            break
          case 'resolved':
          case 'completed':
            // 해당 설비의 다른 활성 고장 신고가 있는지 확인
            const { data: otherActiveBreakdowns } = await supabase
              .from('breakdown_reports')
              .select('id')
              .eq('equipment_id', equipmentId)
              .in('status', ['reported', 'assigned', 'in_progress'])
              .neq('id', params.id)

            // 다른 활성 고장 신고가 없으면 정상 상태로 복구
            newEquipmentStatus = (otherActiveBreakdowns && otherActiveBreakdowns.length > 0) ? 'breakdown' : 'running'
            break
          case 'rejected':
          case 'cancelled':
            // 해당 설비의 다른 활성 고장 신고가 있는지 확인
            const { data: otherActiveBreakdowns2 } = await supabase
              .from('breakdown_reports')
              .select('id')
              .eq('equipment_id', equipmentId)
              .in('status', ['reported', 'assigned', 'in_progress'])
              .neq('id', params.id)

            newEquipmentStatus = (otherActiveBreakdowns2 && otherActiveBreakdowns2.length > 0) ? 'breakdown' : 'running'
            break
        }

        // 설비 상태 업데이트
        const statusUpdate: any = {
          equipment_id: equipmentId,
          status: newEquipmentStatus,
          status_reason: `고장 신고 상태 변경: ${body.status}`,
          updated_by: user.id,
          status_changed_at: new Date().toISOString(),
          notes: `고장 신고 ID: ${params.id} - ${currentBreakdown.status} → ${body.status}`
        }

        if (newEquipmentStatus === 'running' && currentBreakdown.status !== 'resolved') {
          statusUpdate.last_repair_date = new Date().toISOString()
          statusUpdate.breakdown_start_time = null
        }

        const { error: statusError } = await supabase
          .from('equipment_status')
          .upsert(statusUpdate)

        if (statusError) {
          console.warn('Failed to update equipment status:', statusError)
        }

      } catch (statusUpdateError) {
        console.warn('Equipment status sync failed:', statusUpdateError)
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedBreakdown,
      message: '고장 신고가 성공적으로 업데이트되었습니다',
      timestamp: new Date().toISOString(),
      metadata: {
        version: '1.0',
        executionTime: Date.now()
      }
    })

  } catch (error) {
    console.error('Update breakdown report error:', error)
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

// [SRP] Rule: 고장 신고 삭제만 담당
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 권한 확인 (관리자 또는 작성자만 삭제 가능)
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const { data: breakdown } = await supabase
      .from('breakdown_reports')
      .select('reporter_id, equipment_id')
      .eq('id', params.id)
      .single()

    if (!breakdown) {
      return NextResponse.json(
        { 
          success: false, 
          error: '고장 신고를 찾을 수 없습니다', 
          timestamp: new Date().toISOString() 
        }, 
        { status: 404 }
      )
    }

    const isAdmin = userProfile?.role === 'system_admin' || userProfile?.role === 'manager'
    const isReporter = breakdown.reporter_id === user.id

    if (!isAdmin && !isReporter) {
      return NextResponse.json(
        { 
          success: false, 
          error: '삭제 권한이 없습니다', 
          timestamp: new Date().toISOString() 
        }, 
        { status: 403 }
      )
    }

    // 고장 신고 삭제
    const { error: deleteError } = await supabase
      .from('breakdown_reports')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json(
        { 
          success: false, 
          error: `고장 신고 삭제 실패: ${deleteError.message}`, 
          timestamp: new Date().toISOString() 
        }, 
        { status: 500 }
      )
    }

    // 해당 설비의 다른 활성 고장 신고가 있는지 확인하여 상태 업데이트
    try {
      const { data: otherActiveBreakdowns } = await supabase
        .from('breakdown_reports')
        .select('id')
        .eq('equipment_id', breakdown.equipment_id)
        .in('status', ['reported', 'assigned', 'in_progress'])

      // 다른 활성 고장 신고가 없으면 정상 상태로 복구
      if (!otherActiveBreakdowns || otherActiveBreakdowns.length === 0) {
        const { error: statusError } = await supabase
          .from('equipment_status')
          .upsert({
            equipment_id: breakdown.equipment_id,
            status: 'running',
            status_reason: '고장 신고 삭제로 인한 상태 복구',
            updated_by: user.id,
            status_changed_at: new Date().toISOString(),
            breakdown_start_time: null,
            notes: `고장 신고 ${params.id} 삭제됨`
          })

        if (statusError) {
          console.warn('Failed to update equipment status after deletion:', statusError)
        }
      }
    } catch (statusUpdateError) {
      console.warn('Equipment status sync after deletion failed:', statusUpdateError)
    }

    return NextResponse.json({
      success: true,
      message: '고장 신고가 성공적으로 삭제되었습니다',
      timestamp: new Date().toISOString(),
      metadata: {
        version: '1.0',
        executionTime: Date.now()
      }
    })

  } catch (error) {
    console.error('Delete breakdown report error:', error)
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