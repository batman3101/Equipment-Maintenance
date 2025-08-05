'use client'

import React from 'react'
import { Card } from '@/components/ui'

interface DailyStatusCardsProps {
  className?: string
}

export function DailyStatusCards({ className = '' }: DailyStatusCardsProps) {
  // 실제 데이터는 API에서 가져올 예정
  const dailyStats = {
    breakdowns: {
      total: 3,
      urgent: 1,
      pending: 2,
      trend: '+1'
    },
    repairs: {
      completed: 5,
      inProgress: 2,
      scheduled: 3,
      trend: '+2'
    },
    equipmentStatus: {
      operational: 12,
      total: 15,
      maintenance: 2,
      stopped: 1
    },
  }

  const formatTrend = (trend: string, isPositive: boolean = false) => {
    const isIncrease = trend.startsWith('+')
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
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">금일 고장 발생</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {dailyStats.breakdowns.total}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">건</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              {formatTrend(dailyStats.breakdowns.trend, false)}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">전일 대비</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-red-600 dark:text-red-400 flex items-center">
                <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                긴급
              </span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {dailyStats.breakdowns.urgent}건
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-orange-600 dark:text-orange-400 flex items-center">
                <span className="w-2 h-2 bg-orange-600 rounded-full mr-2"></span>
                대기중
              </span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                {dailyStats.breakdowns.pending}건
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-red-200 dark:border-red-700">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              최근 고장: CNC-DR-001 (13:45)
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
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">금일 수리 완료</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {dailyStats.repairs.completed}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">건</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              {formatTrend(dailyStats.repairs.trend, true)}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">전일 대비</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-blue-600 dark:text-blue-400 flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                진행중
              </span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {dailyStats.repairs.inProgress}건
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-purple-600 dark:text-purple-400 flex items-center">
                <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                예정
              </span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                {dailyStats.repairs.scheduled}건
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-green-200 dark:border-green-700">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              최근 완료: CNC-ML-001 (11:30)
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
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">설비 가동 현황</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {dailyStats.equipmentStatus.operational}
                  </span>
                  <span className="text-lg text-gray-500 dark:text-gray-400">
                    /{dailyStats.equipmentStatus.total}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {Math.round((dailyStats.equipmentStatus.operational / dailyStats.equipmentStatus.total) * 100)}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">가동률</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-yellow-600 dark:text-yellow-400 flex items-center">
                <span className="w-2 h-2 bg-yellow-600 rounded-full mr-2"></span>
                정비중
              </span>
              <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                {dailyStats.equipmentStatus.maintenance}대
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-600 dark:text-red-400 flex items-center">
                <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                정지
              </span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {dailyStats.equipmentStatus.stopped}대
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-700">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(dailyStats.equipmentStatus.operational / dailyStats.equipmentStatus.total) * 100}%` }}
              ></div>
            </div>
          </div>
        </Card.Content>
      </Card>

    </div>
  )
}