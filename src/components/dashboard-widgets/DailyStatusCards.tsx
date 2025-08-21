'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { Card } from '@/components/ui'
import { useTranslation } from 'react-i18next'
import { useUnifiedState } from '@/hooks/useUnifiedState'

interface DailyStatusCardsProps {
  className?: string
}

export function DailyStatusCards({ className = '' }: DailyStatusCardsProps) {
  const { t } = useTranslation(['dashboard', 'common'])
  
  // [SRP] Rule: 통합 상태 관리 사용 - 중복 API 호출 제거
  const {
    equipments,
    equipmentStatuses,
    breakdownReports,
    loading,
    derived
  } = useUnifiedState()

  // 카드 통계를 별도로 가져오기
  const [cardStats, setCardStats] = useState({
    breakdowns: { total: 0, urgent: 0, pending: 0 },
    repairs: { completed: 0, inProgress: 0 },
    equipment: { total: 0, needsRepair: 0 }
  })
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    const fetchCardStats = async () => {
      try {
        const response = await fetch('/api/dashboard/card-stats')
        const data = await response.json()
        
        if (data.success) {
          setCardStats(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch card stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchCardStats()
  }, [])

  // [DIP] Rule: 추상화에 의존 - derived 메서드 사용
  const dashboardStats = useMemo(() => {
    if (!breakdownReports || breakdownReports.length === 0) {
      return {
        breakdowns: { total: 0, urgent: 0, pending: 0, critical: 0 },
        repairs: { completed: 0, inProgress: 0, scheduled: 0 },
        equipment: { totalReported: 0, completed: 0, needsRepair: 0 }
      }
    }

    // 고장 신고 통계 계산
    const breakdownStats = {
      total: breakdownReports.length,
      urgent: breakdownReports.filter(br => 
        br.urgencyLevel === 'critical' || br.urgencyLevel === 'high'
      ).length,
      pending: breakdownReports.filter(br => 
        br.status === 'reported' || br.status === 'in_progress'
      ).length,
      critical: breakdownReports.filter(br => 
        br.urgencyLevel === 'critical'
      ).length
    }

    // 수리 통계 계산 (고장 신고 기반)
    const repairStats = {
      completed: breakdownReports.filter(br => 
        br.status === 'completed'
      ).length,
      inProgress: breakdownReports.filter(br => 
        br.status === 'in_progress'
      ).length,
      scheduled: breakdownReports.filter(br => 
        br.status === 'reported'
      ).length
    }

    // 설비 통계 계산
    const equipmentStats = {
      totalReported: breakdownReports.length,
      completed: breakdownReports.filter(br => 
        br.status === 'completed'
      ).length,
      needsRepair: breakdownReports.filter(br => 
        br.status !== 'completed'
      ).length
    }

    return {
      breakdowns: breakdownStats,
      repairs: repairStats,
      equipment: equipmentStats
    }
  }, [breakdownReports])

  // 로딩 상태 처리
  if (loading.global || loading.breakdowns) {
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
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('dashboard:cards.breakdowns.title', '고장 신고')}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {statsLoading ? '...' : cardStats.breakdowns.total}
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
                {t('dashboard:cards.breakdowns.urgent', '긴급/높음')}
              </span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {statsLoading ? '...' : cardStats.breakdowns.urgent}건
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-orange-600 dark:text-orange-400 flex items-center">
                <span className="w-2 h-2 bg-orange-600 rounded-full mr-2"></span>
                {t('dashboard:cards.breakdowns.pending', '처리 대기중')}
              </span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                {statsLoading ? '...' : cardStats.breakdowns.pending}건
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-red-200 dark:border-red-600">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              💡 {t('dashboard:cards.breakdowns.tip', '긴급 고장은 우선 처리가 필요합니다')}
            </p>
          </div>
        </Card.Content>
      </Card>

      {/* 수리 작업 현황 */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700 shadow-lg hover:shadow-xl transition-shadow">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-2xl">🔧</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('dashboard:cards.repairs.title', '수리 작업')}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {statsLoading ? '...' : (cardStats.repairs.completed + cardStats.repairs.inProgress)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">건</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-600 dark:text-green-400 flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                {t('dashboard:cards.repairs.completed', '완료')}
              </span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {statsLoading ? '...' : cardStats.repairs.completed}건
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-600 dark:text-blue-400 flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                {t('dashboard:cards.repairs.inProgress', '진행중')}
              </span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {statsLoading ? '...' : cardStats.repairs.inProgress}건
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-600">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              💡 {t('dashboard:cards.repairs.tip', '수리 작업 진행률을 모니터링하세요')}
            </p>
          </div>
        </Card.Content>
      </Card>

      {/* 설비 운영 현황 */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700 shadow-lg hover:shadow-xl transition-shadow">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-2xl">⚙️</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('dashboard:cards.equipment.title', '설비 운영')}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {statsLoading ? '...' : (cardStats.equipment.total || (equipmentStatuses ? equipmentStatuses.length : 0))}
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
                {t('dashboard:cards.equipment.running', '정상 운영')}
              </span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {derived.getStatistics().running}대
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-600 dark:text-red-400 flex items-center">
                <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                {t('dashboard:cards.equipment.needsRepair', '수리 필요')}
              </span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {statsLoading ? '...' : cardStats.equipment.needsRepair}대
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-green-200 dark:border-green-600">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              💡 {t('dashboard:cards.equipment.tip', '설비 가동률을 최적화하세요')}
            </p>
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}