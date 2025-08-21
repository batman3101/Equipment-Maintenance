import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // 오프라인 모드 상태 확인
    const { data, error } = await supabase
      .rpc('get_offline_mode_status')

    if (error) {
      console.error('Error fetching offline status:', error)
      return NextResponse.json(
        { error: 'Failed to fetch offline status' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Offline status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}