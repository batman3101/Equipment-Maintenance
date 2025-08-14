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

export async function POST(request: NextRequest) {
  try {
    const { equipments } = await request.json()
    
    if (!equipments || !Array.isArray(equipments) || equipments.length === 0) {
      return NextResponse.json(
        { error: 'Invalid equipments data' },
        { status: 400 }
      )
    }

    console.log('Bulk inserting equipments:', equipments.length)

    // Service Role로 설비 정보 삽입 (RLS 정책 우회)
    const { data: insertedEquipments, error: insertError } = await supabaseAdmin
      .from('equipment_info')
      .insert(equipments)
      .select()

    if (insertError) {
      console.error('Bulk insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to insert equipments', details: insertError },
        { status: 500 }
      )
    }

    console.log('Successfully inserted:', insertedEquipments?.length, 'equipments')

    return NextResponse.json({
      success: true,
      data: insertedEquipments,
      count: insertedEquipments?.length || 0
    })

  } catch (error) {
    console.error('Bulk insert API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}