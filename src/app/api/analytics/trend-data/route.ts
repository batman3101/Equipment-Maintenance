import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const isOfflineMode = process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'weekly' // weekly, monthly, yearly

  // 오프라인 모드일 때 목데이터 반환
  if (isOfflineMode) {
    const mockData = {
      weekly: [
        { period: '1월 1주', breakdowns: 3, repairs: 5 },
        { period: '1월 2주', breakdowns: 2, repairs: 4 },
        { period: '1월 3주', breakdowns: 4, repairs: 3 },
        { period: '현재주', breakdowns: 1, repairs: 2 }
      ],
      monthly: [
        { period: '10월', breakdowns: 8, repairs: 12 },
        { period: '11월', breakdowns: 6, repairs: 10 },
        { period: '12월', breakdowns: 9, repairs: 8 },
        { period: '1월', breakdowns: 7, repairs: 9 }
      ],
      yearly: [
        { period: '2021', breakdowns: 45, repairs: 52 },
        { period: '2022', breakdowns: 38, repairs: 48 },
        { period: '2023', breakdowns: 32, repairs: 41 },
        { period: '2024', breakdowns: 7, repairs: 9 }
      ]
    }
    
    return NextResponse.json(mockData[period as keyof typeof mockData] || mockData.weekly)
  }

  try {
    console.log(`Fetching ${period} trend data from database...`)

    let trendData = []

    switch (period) {
      case 'weekly':
        // 최근 4주간 데이터
        const { data: weeklyData, error: weeklyError } = await supabase
          .rpc('get_weekly_trend_data', { weeks_count: 4 })
        
        if (weeklyError) {
          console.error('Error fetching weekly trend:', weeklyError)
          throw weeklyError
        }
        
        trendData = weeklyData?.map((item: any) => ({
          period: item.week_label,
          breakdowns: item.breakdown_count || 0,
          repairs: item.repair_count || 0
        })) || []
        break

      case 'monthly':
        // 최근 4개월간 데이터
        const { data: monthlyData, error: monthlyError } = await supabase
          .rpc('get_monthly_trend_data', { months_count: 4 })
        
        if (monthlyError) {
          console.error('Error fetching monthly trend:', monthlyError)
          throw monthlyError
        }
        
        trendData = monthlyData?.map((item: any) => ({
          period: item.month_label,
          breakdowns: item.breakdown_count || 0,
          repairs: item.repair_count || 0
        })) || []
        break

      case 'yearly':
        // 최근 4년간 데이터
        const { data: yearlyData, error: yearlyError } = await supabase
          .rpc('get_yearly_trend_data', { years_count: 4 })
        
        if (yearlyError) {
          console.error('Error fetching yearly trend:', yearlyError)
          throw yearlyError
        }
        
        trendData = yearlyData?.map((item: any) => ({
          period: item.year_label,
          breakdowns: item.breakdown_count || 0,
          repairs: item.repair_count || 0
        })) || []
        break

      default:
        // 기본적으로 주간 데이터 사용
        const { data: defaultData, error: defaultError } = await supabase
          .from('v_weekly_statistics')
          .select('*')
          .order('week_year', { ascending: false })
          .limit(4)

        if (defaultError) {
          console.error('Error fetching default trend:', defaultError)
          throw defaultError
        }

        trendData = defaultData?.map((item: any, index: number) => ({
          period: index === 0 ? '현재주' : `${item.week_number}주차`,
          breakdowns: item.breakdown_count || 0,
          repairs: item.repair_count || 0
        })).reverse() || []
    }

    // 데이터가 없는 경우 기본값 반환
    if (trendData.length === 0) {
      const defaultTrendData = {
        weekly: [
          { period: '3주전', breakdowns: 0, repairs: 0 },
          { period: '2주전', breakdowns: 0, repairs: 0 },
          { period: '1주전', breakdowns: 0, repairs: 0 },
          { period: '현재주', breakdowns: 0, repairs: 0 }
        ],
        monthly: [
          { period: '3개월전', breakdowns: 0, repairs: 0 },
          { period: '2개월전', breakdowns: 0, repairs: 0 },
          { period: '1개월전', breakdowns: 0, repairs: 0 },
          { period: '이번달', breakdowns: 0, repairs: 0 }
        ],
        yearly: [
          { period: '2021', breakdowns: 0, repairs: 0 },
          { period: '2022', breakdowns: 0, repairs: 0 },
          { period: '2023', breakdowns: 0, repairs: 0 },
          { period: '2024', breakdowns: 0, repairs: 0 }
        ]
      }
      
      trendData = defaultTrendData[period as keyof typeof defaultTrendData] || defaultTrendData.weekly
    }

    console.log(`${period} trend data:`, trendData)
    return NextResponse.json(trendData)

  } catch (error) {
    console.error('Trend data API error:', error)
    
    // 에러 시 기본값 반환
    const fallbackData = {
      weekly: [
        { period: '3주전', breakdowns: 0, repairs: 0 },
        { period: '2주전', breakdowns: 0, repairs: 0 },
        { period: '1주전', breakdowns: 0, repairs: 0 },
        { period: '현재주', breakdowns: 0, repairs: 0 }
      ],
      monthly: [
        { period: '3개월전', breakdowns: 0, repairs: 0 },
        { period: '2개월전', breakdowns: 0, repairs: 0 },
        { period: '1개월전', breakdowns: 0, repairs: 0 },
        { period: '이번달', breakdowns: 0, repairs: 0 }
      ],
      yearly: [
        { period: '2021', breakdowns: 0, repairs: 0 },
        { period: '2022', breakdowns: 0, repairs: 0 },
        { period: '2023', breakdowns: 0, repairs: 0 },
        { period: '2024', breakdowns: 0, repairs: 0 }
      ]
    }
    
    return NextResponse.json(fallbackData[period as keyof typeof fallbackData] || fallbackData.weekly)
  }
}