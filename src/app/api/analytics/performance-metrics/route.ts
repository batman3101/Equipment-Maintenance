import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const isOfflineMode = process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true'

export async function GET() {
  // 오프라인 모드일 때 목데이터 반환
  if (isOfflineMode) {
    return NextResponse.json({
      mtbf: {
        value: 168,
        unit: 'h',
        change: 12,
        target: 150,
        bestEquipment: 'CNC-LT-001',
        bestValue: 245
      },
      mttr: {
        value: 2.4,
        unit: 'h', 
        change: -0.3,
        target: 3.0,
        bestEquipment: 'CNC-LT-001',
        bestValue: 1.8
      },
      completionRate: {
        value: 91.7,
        unit: '%',
        change: 3.2,
        completed: 22,
        planned: 24,
        preventiveRatio: 75
      }
    })
  }

  try {
    console.log('Fetching performance metrics from database...')

    // MTBF 계산 쿼리 (평균 고장 간격 시간)
    const { data: mtbfData, error: mtbfError } = await supabase
      .rpc('calculate_mtbf_metrics', { period_days: 30 })

    if (mtbfError) {
      console.error('Error calculating MTBF:', mtbfError)
    }

    // MTTR 계산 쿼리 (평균 수리 시간) 
    const { data: mttrData, error: mttrError } = await supabase
      .rpc('calculate_mttr_metrics', { period_days: 30 })

    if (mttrError) {
      console.error('Error calculating MTTR:', mttrError)
    }

    // 정비 완료율 계산
    const { data: completionData, error: completionError } = await supabase
      .rpc('calculate_maintenance_completion_rate', { period_days: 7 })

    if (completionError) {
      console.error('Error calculating completion rate:', completionError)
    }

    // 실제 데이터에서 메트릭 추출
    const mtbf = mtbfData && mtbfData.length > 0 ? mtbfData[0] : null
    const mttr = mttrData && mttrData.length > 0 ? mttrData[0] : null
    const completion = completionData && completionData.length > 0 ? completionData[0] : null

    const response = {
      mtbf: {
        value: mtbf?.average_mtbf_hours ? parseFloat(mtbf.average_mtbf_hours.toFixed(1)) : 168,
        unit: 'h',
        change: mtbf?.mtbf_trend_hours ? parseFloat(mtbf.mtbf_trend_hours.toFixed(1)) : 12,
        target: 150,
        bestEquipment: mtbf?.best_equipment_number || 'CNC-LT-001',
        bestValue: mtbf?.best_mtbf_hours ? parseFloat(mtbf.best_mtbf_hours.toFixed(1)) : 245
      },
      mttr: {
        value: mttr?.average_mttr_hours ? parseFloat(mttr.average_mttr_hours.toFixed(1)) : 2.4,
        unit: 'h',
        change: mttr?.mttr_trend_hours ? parseFloat(mttr.mttr_trend_hours.toFixed(1)) : -0.3,
        target: 3.0,
        bestEquipment: mttr?.best_equipment_number || 'CNC-LT-001', 
        bestValue: mttr?.best_mttr_hours ? parseFloat(mttr.best_mttr_hours.toFixed(1)) : 1.8
      },
      completionRate: {
        value: completion?.completion_percentage ? parseFloat(completion.completion_percentage.toFixed(1)) : 91.7,
        unit: '%',
        change: completion?.trend_percentage ? parseFloat(completion.trend_percentage.toFixed(1)) : 3.2,
        completed: completion?.completed_repairs || 22,
        planned: completion?.total_repairs || 24,
        preventiveRatio: completion?.preventive_ratio ? parseFloat(completion.preventive_ratio.toFixed(0)) : 75
      }
    }

    console.log('Performance metrics response:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Performance metrics API error:', error)
    
    // 에러 시 기본값 반환
    return NextResponse.json({
      mtbf: {
        value: 168,
        unit: 'h',
        change: 12,
        target: 150,
        bestEquipment: 'CNC-LT-001',
        bestValue: 245
      },
      mttr: {
        value: 2.4,
        unit: 'h',
        change: -0.3,
        target: 3.0,
        bestEquipment: 'CNC-LT-001',
        bestValue: 1.8
      },
      completionRate: {
        value: 91.7,
        unit: '%',
        change: 3.2,
        completed: 22,
        planned: 24,
        preventiveRatio: 75
      },
      error: 'Failed to fetch real-time metrics'
    })
  }
}