'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui'

type TrendPeriod = 'weekly' | 'monthly' | 'yearly'

interface TrendData {
  period: string
  breakdowns: number
  repairs: number
}

interface TrendChartProps {
  className?: string
}

export function TrendChart({ className = '' }: TrendChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TrendPeriod>('weekly')

  const trendData: Record<TrendPeriod, TrendData[]> = {
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

  const currentData = trendData[selectedPeriod]
  const maxValue = Math.max(...currentData.flatMap(d => [d.breakdowns, d.repairs]))

  const getPeriodLabel = (period: TrendPeriod) => {
    const labels = {
      weekly: '주간',
      monthly: '월간', 
      yearly: '연간'
    }
    return labels[period]
  }

  return (
    <Card className={className}>
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            📈 고장/수리 트렌드 분석
          </h3>
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['weekly', 'monthly', 'yearly'] as TrendPeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
                  selectedPeriod === period
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {getPeriodLabel(period)}
              </button>
            ))}
          </div>
        </div>
      </Card.Header>
      <Card.Content>
        <div className="space-y-4">
          {/* 범례 */}
          <div className="flex items-center justify-center space-x-6 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">고장 발생</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">수리 완료</span>
            </div>
          </div>

          {/* 차트 */}
          <div className="space-y-4">
            {currentData.map((data, index) => (
              <div key={data.period} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900 dark:text-white min-w-[80px]">
                    {data.period}
                  </span>
                  <div className="flex items-center space-x-4 text-xs">
                    <span className="text-red-600 dark:text-red-400">
                      고장 {data.breakdowns}건
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      수리 {data.repairs}건
                    </span>
                  </div>
                </div>
                
                {/* 막대 그래프 */}
                <div className="flex space-x-1 h-8">
                  {/* 고장 발생 바 */}
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-l">
                    <div 
                      className="bg-red-500 h-full rounded-l transition-all duration-500 ease-out flex items-center justify-end pr-2"
                      style={{ 
                        width: `${(data.breakdowns / maxValue) * 100}%`,
                        minWidth: data.breakdowns > 0 ? '20px' : '0px'
                      }}
                    >
                      {data.breakdowns > 0 && (
                        <span className="text-white text-xs font-medium">
                          {data.breakdowns}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* 수리 완료 바 */}
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-r">
                    <div 
                      className="bg-green-500 h-full rounded-r transition-all duration-500 ease-out flex items-center justify-end pr-2"
                      style={{ 
                        width: `${(data.repairs / maxValue) * 100}%`,
                        minWidth: data.repairs > 0 ? '20px' : '0px'
                      }}
                    >
                      {data.repairs > 0 && (
                        <span className="text-white text-xs font-medium">
                          {data.repairs}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 요약 통계 */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {currentData.reduce((sum, d) => sum + d.breakdowns, 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  총 고장 발생
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {currentData.reduce((sum, d) => sum + d.repairs, 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  총 수리 완료
                </div>
              </div>
            </div>
          </div>

          {/* 트렌드 분석 */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-blue-600 dark:text-blue-400">📊</span>
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {getPeriodLabel(selectedPeriod)} 트렌드 분석
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {(() => {
                const totalBreakdowns = currentData.reduce((sum, d) => sum + d.breakdowns, 0)
                const totalRepairs = currentData.reduce((sum, d) => sum + d.repairs, 0)
                const repairRate = totalBreakdowns > 0 ? ((totalRepairs / totalBreakdowns) * 100).toFixed(1) : '100.0'
                
                return `수리 완료율: ${repairRate}% | 평균 ${getPeriodLabel(selectedPeriod)} 고장: ${(totalBreakdowns / currentData.length).toFixed(1)}건`
              })()}
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}