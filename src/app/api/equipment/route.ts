import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// [SRP] Rule: 설비 관리 API만 담당
export async function GET(request: NextRequest) {
  try {
    // 임시로 인증 우회 (개발 중)
    console.log('Fetching equipment list...')

    // URL 파라미터 파싱
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const category = url.searchParams.get('category')
    const status = url.searchParams.get('status')
    const search = url.searchParams.get('search')

    // 쿼리 구성
    let query = supabase
      .from('equipment_info')
      .select(`
        *,
        equipment_status (
          status,
          status_reason,
          last_repair_date,
          breakdown_start_time,
          status_changed_at
        )
      `)
      .order('created_at', { ascending: false })

    // 필터 적용
    if (category && category !== 'all' && category !== '전체 카테고리') {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`equipment_name.ilike.%${search}%,equipment_number.ilike.%${search}%`)
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
      .from('equipment_info')
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
      message: '설비 목록을 성공적으로 조회했습니다',
      timestamp: new Date().toISOString(),
      metadata: {
        version: '1.0',
        executionTime: Date.now()
      }
    })

  } catch (error) {
    console.error('Equipment API error:', error)
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

// [SRP] Rule: 설비 생성만 담당
export async function POST(request: NextRequest) {
  try {
    // 임시로 인증 우회 (개발 중)
    console.log('Creating equipment...')

    const body = await request.json()
    const {
      equipment_name,
      equipmentName,
      category,
      equipment_number,
      equipmentNumber,
      location,
      manufacturer,
      model,
      installation_date,
      installationDate,
      status,
      specifications
    } = body

    // 필드명 매핑 (camelCase -> snake_case)
    const finalEquipmentName = equipment_name || equipmentName
    const finalEquipmentNumber = equipment_number || equipmentNumber
    const finalInstallationDate = installation_date || installationDate

    // 필수 필드 검증
    if (!finalEquipmentName || !category || !finalEquipmentNumber) {
      return NextResponse.json(
        { 
          success: false, 
          error: '필수 필드가 누락되었습니다 (설비명, 카테고리, 설비번호)', 
          timestamp: new Date().toISOString() 
        }, 
        { status: 400 }
      )
    }

    // 설비 번호 중복 확인
    const { data: existingEquipment } = await supabase
      .from('equipment_info')
      .select('id')
      .eq('equipment_number', finalEquipmentNumber)
      .single()

    if (existingEquipment) {
      return NextResponse.json(
        { 
          success: false, 
          error: `설비 번호 '${finalEquipmentNumber}'가 이미 존재합니다`, 
          timestamp: new Date().toISOString() 
        }, 
        { status: 400 }
      )
    }

    // 설비 데이터 준비
    const equipmentData = {
      equipment_name: finalEquipmentName,
      category,
      equipment_number: finalEquipmentNumber,
      location: location || null,
      manufacturer: manufacturer || null,
      model: model || null,
      installation_date: finalInstallationDate || new Date().toISOString(),
      specifications: specifications || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // 설비 생성
    const { data: newEquipment, error: insertError } = await supabase
      .from('equipment_info')
      .insert(equipmentData)
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { 
          success: false, 
          error: `설비 등록 실패: ${insertError.message}`, 
          timestamp: new Date().toISOString() 
        }, 
        { status: 500 }
      )
    }

    // 설비 상태 초기화
    try {
      const { error: statusError } = await supabase
        .from('equipment_status')
        .insert({
          equipment_id: newEquipment.id,
          status: status || 'running',
          status_reason: '설비 등록 시 초기 상태',
          updated_by: null, // 임시로 null
          status_changed_at: new Date().toISOString(),
          notes: '신규 설비 등록'
        })

      if (statusError) {
        console.warn('Failed to create equipment status:', statusError)
        // 상태 생성 실패는 경고로만 처리
      }
    } catch (statusCreateError) {
      console.warn('Equipment status creation failed:', statusCreateError)
    }

    return NextResponse.json({
      success: true,
      data: newEquipment,
      message: '설비가 성공적으로 등록되었습니다',
      timestamp: new Date().toISOString(),
      metadata: {
        version: '1.0',
        executionTime: Date.now()
      }
    })

  } catch (error) {
    console.error('Create equipment error:', error)
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