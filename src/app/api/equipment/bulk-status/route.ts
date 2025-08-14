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