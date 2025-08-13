import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 오프라인 모드 확인
const isOfflineMode = process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true'

export async function GET() {
  // 오프라인 모드일 때 목데이터 반환
  if (isOfflineMode) {
    return NextResponse.json({
      dailyStats: {
        breakdowns: {
          total: 3,
          urgent: 1,
          pending: 2
        },
        repairs: {
          completed: 2,
          inProgress: 1,
          scheduled: 3
        },
        equipment: {
          operational: 4,
          total: 5,
          maintenance: 1,
          stopped: 0
        }
      },
      weeklyTrend: {
        labels: ['월', '화', '수', '목', '금', '토', '일'],
        breakdowns: [2, 1, 3, 0, 2, 1, 3],
        repairs: [1, 2, 2, 1, 3, 2, 2],
        uptime: [95, 97, 92, 100, 94, 96, 93]
      },
      equipmentPerformance: [
        { id: 1, name: 'CNC-ML-001', status: 'running', uptime: 98.5, efficiency: 95.2 },
        { id: 2, name: 'CNC-LT-001', status: 'maintenance', uptime: 85.3, efficiency: 89.1 },
        { id: 3, name: 'CNC-DR-001', status: 'running', uptime: 92.7, efficiency: 91.8 },
        { id: 4, name: 'CNC-GR-001', status: 'running', uptime: 94.1, efficiency: 93.5 },
        { id: 5, name: 'CNC-LC-001', status: 'running', uptime: 96.8, efficiency: 97.2 }
      ],
      maintenanceSchedule: [
        { id: 1, equipment: 'CNC-ML-001', type: 'routine', dueDate: '2024-01-20', priority: 'medium' },
        { id: 2, equipment: 'CNC-LT-001', type: 'urgent', dueDate: '2024-01-16', priority: 'high' },
        { id: 3, equipment: 'CNC-DR-001', type: 'routine', dueDate: '2024-01-25', priority: 'low' }
      ]
    })
  }

  // 온라인 모드일 때 실제 Supabase 데이터 조회
  try {
    console.log('Fetching real dashboard data from database...')
    
    // 새로운 get_dashboard_statistics 함수 호출
    const { data: dashboardStats, error: statsError } = await supabase
      .rpc('get_dashboard_statistics', { date_range_days: 30 })
    
    if (statsError) {
      console.error('Error calling get_dashboard_statistics:', statsError)
      throw statsError
    }

    console.log('Dashboard statistics from database:', dashboardStats)

    // 함수가 배열로 반환하므로 첫 번째 요소 사용
    const stats = dashboardStats && dashboardStats.length > 0 ? dashboardStats[0] : null

    if (!stats) {
      throw new Error('No dashboard statistics returned from database')
    }

    // 설비 현황 - v_equipment_dashboard 뷰 사용
    const { data: equipmentDashboard, error: equipmentError } = await supabase
      .from('v_equipment_dashboard')
      .select('*')
      .order('equipment_number')

    if (equipmentError) {
      console.error('Error fetching equipment dashboard:', equipmentError)
      throw equipmentError
    }

    console.log('Equipment dashboard data:', equipmentDashboard)

    // 월별 통계 - v_monthly_statistics 뷰 사용
    const { data: monthlyStats, error: monthlyError } = await supabase
      .from('v_monthly_statistics')
      .select('*')
      .order('month_year', { ascending: false })
      .limit(7) // 최근 7개월

    if (monthlyError) {
      console.error('Error fetching monthly statistics:', monthlyError)
      // 월별 통계는 선택사항이므로 에러를 던지지 않음
    }

    console.log('Monthly statistics data:', monthlyStats)

    // 응답 데이터 구성
    const response = {
      dailyStats: {
        breakdowns: {
          total: stats.total_breakdowns_period || 0,
          urgent: stats.urgent_breakdowns_period || 0,
          pending: stats.pending_repairs || 0
        },
        repairs: {
          completed: stats.completed_repairs_period || 0,
          inProgress: stats.pending_repairs || 0,
          scheduled: 0 // 정비 스케줄은 별도 테이블에서 가져와야 함
        },
        equipment: {
          operational: stats.active_equipment || 0,
          total: stats.total_equipment || 1,
          maintenance: stats.maintenance_equipment || 0,
          stopped: stats.breakdown_equipment || 0
        }
      },
      weeklyTrend: {
        labels: ['월', '화', '수', '목', '금', '토', '일'],
        breakdowns: monthlyStats ? 
          monthlyStats.slice(0, 7).reverse().map(s => s.breakdown_count || 0) :
          [2, 1, 3, 0, 2, 1, 3],
        repairs: monthlyStats ? 
          monthlyStats.slice(0, 7).reverse().map(s => s.repair_count || 0) :
          [1, 2, 2, 1, 3, 2, 2],
        uptime: equipmentDashboard ? 
          equipmentDashboard.slice(0, 7).map(e => e.availability_percentage || 95) :
          [95, 97, 92, 100, 94, 96, 93]
      },
      equipmentPerformance: equipmentDashboard ? 
        equipmentDashboard.map(eq => ({
          id: eq.id,
          name: eq.equipment_number,
          status: eq.current_status || 'running',
          uptime: parseFloat(eq.availability_percentage || 95),
          efficiency: parseFloat(eq.repair_success_rate || 90)
        })) :
        [
          { id: 1, name: 'CNC-ML-001', status: 'running', uptime: 98.5, efficiency: 95.2 },
          { id: 2, name: 'CNC-LT-001', status: 'maintenance', uptime: 85.3, efficiency: 89.1 }
        ],
      maintenanceSchedule: [
        { id: 1, equipment: 'CNC-ML-001', type: 'routine', dueDate: '2024-01-20', priority: 'medium' },
        { id: 2, equipment: 'CNC-LT-001', type: 'urgent', dueDate: '2024-01-16', priority: 'high' },
        { id: 3, equipment: 'CNC-DR-001', type: 'routine', dueDate: '2024-01-25', priority: 'low' }
      ],
      // 추가 통계 정보
      realTimeStats: {
        totalCost: parseFloat(stats.total_repair_cost_period || 0),
        avgRepairTime: parseFloat(stats.avg_repair_time_minutes || 0),
        equipmentAvailability: parseFloat(stats.equipment_availability_percent || 95),
        topProblematicEquipment: stats.top_problematic_equipment || []
      }
    }

    console.log('Final dashboard response:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Dashboard API error:', error)
    
    // 에러 발생 시 기본값 반환 (서비스 가용성 보장)
    return NextResponse.json({
      dailyStats: {
        breakdowns: {
          total: 0,
          urgent: 0,
          pending: 0
        },
        repairs: {
          completed: 0,
          inProgress: 0,
          scheduled: 0
        },
        equipment: {
          operational: 1,
          total: 1,
          maintenance: 0,
          stopped: 0
        }
      },
      weeklyTrend: {
        labels: ['월', '화', '수', '목', '금', '토', '일'],
        breakdowns: [0, 0, 0, 0, 0, 0, 0],
        repairs: [0, 0, 0, 0, 0, 0, 0],
        uptime: [95, 95, 95, 95, 95, 95, 95]
      },
      equipmentPerformance: [],
      maintenanceSchedule: [],
      error: 'Failed to fetch real-time data, showing defaults'
    })
  }
}