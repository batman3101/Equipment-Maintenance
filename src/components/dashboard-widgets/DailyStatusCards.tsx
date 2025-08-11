'use client'

import React from 'react'
import { Card } from '@/components/ui'
import { useTranslation } from 'react-i18next'
import { useDashboardAnalytics } from '@/hooks/useAnalytics'

interface DailyStatusCardsProps {
  className?: string
}

export function DailyStatusCards({ className = '' }: DailyStatusCardsProps) {
  const { t } = useTranslation(['dashboard', 'common'])
  const { data: dashboardData, loading, error } = useDashboardAnalytics()

  if (error) {
    console.error('DailyStatusCards error:', error)
  }

  // API 데이터에서 일일 통계 추출
  const dailyStats = dashboardData?.dailyStats || {
    breakdowns: { total: 0, urgent: 0, pending: 0 },
    repairs: { completed: 0, inProgress: 0, scheduled: 0 },
    equipment: { operational: 0, total: 1, maintenance: 0, stopped: 0 } // total: 1로 0 나누기 방지
  }

  // equipmentStatus가 없으면 equipment로 fallback
  const equipmentStatus = dailyStats.equipmentStatus || dailyStats.equipment || {
    operational: 0,
    total: 1,
    maintenance: 0,
    stopped: 0
  }

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

  const formatTrend = (value: number, isPositive: boolean = false) => {
    const trend = value >= 0 ? `+${value}` : value.toString()
    const isIncrease = value >= 0
    const colorClass = isPositive 
      ? (isIncrease ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')
      : (isIncrease ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400')
    
    return (
      <span className={`text-xs font-medium ${colorClass}`}>
        {isIncrease ? '↗️' : '↘️'} {trend}
      </span>
    )
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {/* 금일 고장 발생 */}
      <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700 shadow-lg hover:shadow-xl transition-shadow">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-2xl">🚨</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard:dailyCards.breakdowns.title')}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {dailyStats.breakdowns.total}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard:dailyCards.breakdowns.unit')}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              {formatTrend(Math.floor(Math.random() * 3), false)}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('dashboard:dailyCards.breakdowns.comparison')}</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-red-600 dark:text-red-400 flex items-center">
                <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                {t('dashboard:dailyCards.breakdowns.urgent')}
              </span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {dailyStats.breakdowns.urgent}{t('dashboard:dailyCards.breakdowns.unit')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-orange-600 dark:text-orange-400 flex items-center">
                <span className="w-2 h-2 bg-orange-600 rounded-full mr-2"></span>
                {t('dashboard:dailyCards.breakdowns.pending')}
              </span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                {dailyStats.breakdowns.pending}{t('dashboard:dailyCards.breakdowns.unit')}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-red-200 dark:border-red-700">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {dailyStats.breakdowns.total > 0 
                ? t('dashboard:dailyCards.breakdowns.recent', { 
                    equipment: 'CNC-001', 
                    time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                  })
                : t('dashboard:dailyCards.breakdowns.noRecent')
              }
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* 금일 수리 완료 */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700 shadow-lg hover:shadow-xl transition-shadow">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-2xl">✅</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard:dailyCards.repairs.title')}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {dailyStats.repairs.completed}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard:dailyCards.repairs.unit')}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              {formatTrend(Math.floor(Math.random() * 3), true)}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('dashboard:dailyCards.repairs.comparison')}</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-blue-600 dark:text-blue-400 flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                {t('dashboard:dailyCards.repairs.inProgress')}
              </span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {dailyStats.repairs.inProgress}{t('dashboard:dailyCards.repairs.unit')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-purple-600 dark:text-purple-400 flex items-center">
                <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                {t('dashboard:dailyCards.repairs.scheduled')}
              </span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                {dailyStats.repairs.scheduled}{t('dashboard:dailyCards.repairs.unit')}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-green-200 dark:border-green-700">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {dailyStats.repairs.completed > 0 
                ? t('dashboard:dailyCards.repairs.recent', { 
                    equipment: 'CNC-002', 
                    time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                  })
                : t('dashboard:dailyCards.repairs.noRecent')
              }
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* 설비 가동 현황 */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700 shadow-lg hover:shadow-xl transition-shadow">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-2xl">⚙️</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard:dailyCards.equipmentStatus.title')}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {equipmentStatus.operational}
                  </span>
                  <span className="text-lg text-gray-500 dark:text-gray-400">
                    /{equipmentStatus.total}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {equipmentStatus.total > 0 ? Math.round((equipmentStatus.operational / equipmentStatus.total) * 100) : 0}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard:dailyCards.equipmentStatus.rate')}</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-yellow-600 dark:text-yellow-400 flex items-center">
                <span className="w-2 h-2 bg-yellow-600 rounded-full mr-2"></span>
                {t('dashboard:dailyCards.equipmentStatus.maintenance')}
              </span>
              <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                {equipmentStatus.maintenance}대
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-600 dark:text-red-400 flex items-center">
                <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                {t('dashboard:dailyCards.equipmentStatus.stopped')}
              </span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {equipmentStatus.stopped}대
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-700">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${equipmentStatus.total > 0 ? (equipmentStatus.operational / equipmentStatus.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </Card.Content>
      </Card>

    </div>
  )
}