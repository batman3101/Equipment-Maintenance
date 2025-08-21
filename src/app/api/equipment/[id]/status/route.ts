import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// [SRP] Rule: 설비 상태 업데이트만 담당
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 임시로 인증 우회 (개발 중)
    const { id } = await params
    console.log('Updating equipment status:', id)

    const body = await request.json()
    const { status, status_reason, notes } = body

    // 필수 필드 검증
    if (!status) {
      return NextResponse.json(
        { 
          success: false, 
          error: '상태 정보가 필요합니다', 
          timestamp: new Date().toISOString() 
        }, 
        { status: 400 }
      )
    }

    // 설비 존재 확인
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment_info')
      .select('id, equipment_name, equipment_number')
      .eq('id', id)
      .single()

    if (equipmentError || !equipment) {
      return NextResponse.json(
        { 
          success: false, 
          error: '설비를 찾을 수 없습니다', 
          timestamp: new Date().toISOString() 
        }, 
        { status: 404 }
      )
    }

    // 현재 상태 조회
    const { data: currentStatus } = await supabase
      .from('equipment_status')
      .select('*')
      .eq('equipment_id', id)
      .single()

    // 상태 업데이트 데이터 준비
    const statusUpdate: any = {
      equipment_id: id,
      status,
      status_reason: status_reason || `상태 변경: ${status}`,
      updated_by: null, // 임시로 null
      status_changed_at: new Date().toISOString(),
      notes: notes || null
    }

    // 상태별 추가 필드 설정
    switch (status) {
      case 'breakdown':
        if (!currentStatus || currentStatus.status !== 'breakdown') {
          statusUpdate.breakdown_start_time = new Date().toISOString()
        }
        break
      case 'running':
        if (currentStatus?.status === 'breakdown') {
          statusUpdate.last_repair_date = new Date().toISOString()
        }
        break
      case 'maintenance':
        if (!currentStatus || currentStatus.status !== 'maintenance') {
          statusUpdate.maintenance_start_time = new Date().toISOString()
        }
        break
      case 'standby':
      case 'stopped':
        // 기본 처리
        break
    }

    // 상태 업데이트 실행
    const { data: updatedStatus, error: updateError } = await supabase
      .from('equipment_status')
      .upsert(statusUpdate)
      .select()
      .single()

    if (updateError) {
      console.error('Status update error:', updateError)
      return NextResponse.json(
        { 
          success: false, 
          error: `상태 업데이트 실패: ${updateError.message}`, 
          timestamp: new Date().toISOString() 
        }, 
        { status: 500 }
      )
    }

    // 관련 고장 신고 상태 동기화
    try {
      if (status === 'running' && currentStatus?.status === 'breakdown') {
        // 설비가 정상으로 복구되면 관련 고장 신고를 완료 처리
        const { error: breakdownUpdateError } = await supabase
          .from('breakdown_reports')
          .update({
            status: 'resolved',
            resolution_date: new Date().toISOString(),
            notes: '설비 상태 변경으로 인한 자동 완료 처리',
            updated_at: new Date().toISOString()
          })
          .eq('equipment_id', id)
          .in('status', ['reported', 'assigned', 'in_progress'])

        if (breakdownUpdateError) {
          console.warn('Failed to update breakdown reports:', breakdownUpdateError)
        }
      }
    } catch (syncError) {
      console.warn('Related data sync failed:', syncError)
    }

    return NextResponse.json({
      success: true,
      data: updatedStatus,
      message: '설비 상태가 성공적으로 업데이트되었습니다',
      timestamp: new Date().toISOString(),
      metadata: {
        version: '1.0',
        executionTime: Date.now(),
        equipment: {
          id: equipment.id,
          name: equipment.equipment_name,
          number: equipment.equipment_number
        }
      }
    })

  } catch (error) {
    console.error('Equipment status update error:', error)
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

// [SRP] Rule: 설비 상태 조회만 담당
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 임시로 인증 우회 (개발 중)
    const { id } = await params
    console.log('Fetching equipment status:', id)

    const { data: status, error } = await supabase
      .from('equipment_status')
      .select(`
        *,
        equipment_info:equipment_id (
          id,
          equipment_name,
          equipment_number,
          category
        )
      `)
      .eq('equipment_id', id)
      .single()

    if (error) {
      // 상태가 없으면 기본 상태 생성
      if (error.code === 'PGRST116') {
        const { data: newStatus, error: createError } = await supabase
          .from('equipment_status')
          .insert({
            equipment_id: id,
            status: 'running',
            status_reason: '초기 상태',
            updated_by: null,
            status_changed_at: new Date().toISOString()
          })
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

        if (createError) {
          console.error('Create default status error:', createError)
          return NextResponse.json(
            { 
              success: false, 
              error: `상태 생성 실패: ${createError.message}`, 
              timestamp: new Date().toISOString() 
            }, 
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          data: newStatus,
          message: '설비 상태를 초기화했습니다',
          timestamp: new Date().toISOString(),
          metadata: {
            version: '1.0',
            executionTime: Date.now()
          }
        })
      }

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

    return NextResponse.json({
      success: true,
      data: status,
      message: '설비 상태를 성공적으로 조회했습니다',
      timestamp: new Date().toISOString(),
      metadata: {
        version: '1.0',
        executionTime: Date.now()
      }
    })

  } catch (error) {
    console.error('Get equipment status error:', error)
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