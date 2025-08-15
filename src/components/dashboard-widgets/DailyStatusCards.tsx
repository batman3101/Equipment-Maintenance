'use client'

import React from 'react'
import { Card } from '@/components/ui'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  breakdowns: {
    total: number
    urgent: number
    pending: number
    critical: number
  }
  repairs: {
    completed: number
    inProgress: number
    scheduled: number
  }
  equipment: {
    totalReported: number
    completed: number
    needsRepair: number
  }
}

interface DailyStatusCardsProps {
  className?: string
}

export function DailyStatusCards({ className = '' }: DailyStatusCardsProps) {
  const { t } = useTranslation(['dashboard', 'common'])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true)
        
        // 1. 고장 신고 통계
        const { data: breakdownData, error: breakdownError } = await supabase
          .from('breakdown_reports')
          .select('status, priority')

        if (breakdownError) throw breakdownError

        // 2. 수리 완료 통계
        const { data: repairData, error: repairError } = await supabase
          .from('repair_reports')
          .select('completion_status, created_at')

        if (repairError) throw repairError

        // 통계 계산
        const breakdownStats = {
          total: breakdownData?.length || 0,
          urgent: breakdownData?.filter(r => r.priority === 'critical' || r.priority === 'high').length || 0,
          pending: breakdownData?.filter(r => r.status === 'reported' || r.status === 'assigned').length || 0,
          critical: breakdownData?.filter(r => r.priority === 'critical').length || 0
        }

        const repairStats = {
          completed: repairData?.filter(r => r.completion_status === 'completed').length || 0,
          inProgress: repairData?.filter(r => r.completion_status === 'partial').length || 0,
          scheduled: breakdownData?.filter(r => r.status === 'assigned' || r.status === 'in_progress').length || 0
        }

        const equipmentStats = {
          totalReported: breakdownData?.length || 0,
          completed: breakdownData?.filter(r => r.status === 'completed').length || 0,
          needsRepair: breakdownData?.filter(r => r.status !== 'completed').length || 0
        }

        setDashboardStats({
          breakdowns: breakdownStats,
          repairs: repairStats,
          equipment: equipmentStats
        })
        setError(null)
      } catch (err) {
        console.error('Error fetching dashboard stats:', err)
        setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.')
        // 에러 시 기본값 설정
        setDashboardStats({
          breakdowns: { total: 0, urgent: 0, pending: 0, critical: 0 },
          repairs: { completed: 0, inProgress: 0, scheduled: 0 },
          equipment: { totalReported: 0, completed: 0, needsRepair: 0 }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
    
    // 1분마다 데이터 새로고침
    const interval = setInterval(fetchDashboardStats, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <Card.Content className="p-6">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </Card.Content>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        <Card className="bg-red-50 border-red-200">
          <Card.Content className="p-6 text-center">
            <div className="text-red-600 mb-2">⚠️ 데이터 로드 오류</div>
            <p className="text-sm text-gray-600">{error}</p>
          </Card.Content>
        </Card>
      </div>
    )
  }

  const stats = dashboardStats || {
    breakdowns: { total: 0, urgent: 0, pending: 0, critical: 0 },
    repairs: { completed: 0, inProgress: 0, scheduled: 0 },
    equipment: { totalReported: 0, completed: 0, needsRepair: 0 }
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {/* 고장 신고 현황 */}
      <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700 shadow-lg hover:shadow-xl transition-shadow">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-2xl">🚨</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">고장 신고</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {stats.breakdowns.total}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">건</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-red-600 dark:text-red-400 flex items-center">
                <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                긴급/높음
              </span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {stats.breakdowns.urgent}건
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-orange-600 dark:text-orange-400 flex items-center">
                <span className="w-2 h-2 bg-orange-600 rounded-full mr-2"></span>
                처리 대기중
              </span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                {stats.breakdowns.pending}건
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-red-200 dark:border-red-700">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              전체 신고 건수 ({new Date().toLocaleDateString()})
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* 수리 완료 현황 */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700 shadow-lg hover:shadow-xl transition-shadow">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-2xl">🔧</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">수리 완료</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {stats.repairs.completed}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">건</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-blue-600 dark:text-blue-400 flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                진행중
              </span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {stats.repairs.inProgress}건
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-purple-600 dark:text-purple-400 flex items-center">
                <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                예정됨
              </span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                {stats.repairs.scheduled}건
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-green-200 dark:border-green-700">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              전체 수리 완료 건수
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* 설비 현황 */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700 shadow-lg hover:shadow-xl transition-shadow">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-2xl">🏭</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">설비 현황</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.equipment.needsRepair}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">대</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-600 dark:text-green-400 flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                수리 완료
              </span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {stats.equipment.completed}대
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400 flex items-center">
                <span className="w-2 h-2 bg-gray-600 rounded-full mr-2"></span>
                전체 신고
              </span>
              <span className="font-semibold text-gray-600 dark:text-gray-400">
                {stats.equipment.totalReported}대
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-700">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              수리가 필요한 설비 현황
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}