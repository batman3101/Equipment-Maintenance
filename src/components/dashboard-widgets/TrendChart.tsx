'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation(['dashboard'])
  const [selectedPeriod, setSelectedPeriod] = useState<TrendPeriod>('weekly')
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // API에서 트렌드 데이터 가져오기
  const fetchTrendData = async (period: TrendPeriod) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/analytics/trend-data?period=${period}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setTrendData(data)
    } catch (err) {
      console.error('Error fetching trend data:', err)
      setError(err instanceof Error ? err.message : String(err))
      
      // 에러 시 기본값 설정
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
      setTrendData(fallbackData[period] || fallbackData.weekly)
    } finally {
      setLoading(false)
    }
  }

  // 초기 로드 및 기간 변경시 데이터 가져오기
  useEffect(() => {
    fetchTrendData(selectedPeriod)
  }, [selectedPeriod])

  // 기간 변경 핸들러
  const handlePeriodChange = (period: TrendPeriod) => {
    setSelectedPeriod(period)
  }

  const currentData = trendData
  const maxValue = Math.max(...currentData.flatMap(d => [d.breakdowns, d.repairs]))

  const getPeriodLabel = (period: TrendPeriod) => {
    return t(`dashboard:trend.periods.${period}`)
  }

  return (
    <Card className={className}>
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            📈 {t('dashboard:trend.title')}
          </h3>
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['weekly', 'monthly', 'yearly'] as TrendPeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                disabled={loading}
                className={`px-3 py-1 text-sm rounded-md transition-all duration-200 disabled:opacity-50 ${
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
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">데이터 로딩 중...</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <span className="text-red-700 dark:text-red-300 text-sm">데이터 로딩 실패: {error}</span>
            </div>
          </div>
        )}
        
        {!loading && (
        <div className="space-y-4">
          {/* 범례 */}
          <div className="flex items-center justify-center space-x-6 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard:trend.legend.breakdowns')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard:trend.legend.repairs')}</span>
            </div>
          </div>

          {/* 차트 */}
          <div className="space-y-4">
            {currentData.map((data) => (
              <div key={data.period} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900 dark:text-white min-w-[80px]">
                    {data.period}
                  </span>
                  <div className="flex items-center space-x-4 text-xs">
                    <span className="text-red-600 dark:text-red-400">
                      {t('dashboard:trend.data.breakdowns', { count: data.breakdowns })}
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      {t('dashboard:trend.data.repairs', { count: data.repairs })}
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
                  {t('dashboard:trend.summary.totalBreakdowns')}
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {currentData.reduce((sum, d) => sum + d.repairs, 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('dashboard:trend.summary.totalRepairs')}
                </div>
              </div>
            </div>
          </div>

          {/* 트렌드 분석 */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-blue-600 dark:text-blue-400">📊</span>
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {t('dashboard:trend.summary.analysisTitle', { period: getPeriodLabel(selectedPeriod) })}
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {(() => {
                const totalBreakdowns = currentData.reduce((sum, d) => sum + d.breakdowns, 0)
                const totalRepairs = currentData.reduce((sum, d) => sum + d.repairs, 0)
                const repairRate = totalBreakdowns > 0 ? ((totalRepairs / totalBreakdowns) * 100).toFixed(1) : '100.0'
                const averageBreakdowns = (totalBreakdowns / currentData.length).toFixed(1)
                
                return `${t('dashboard:trend.summary.repairRate', { rate: repairRate })} | ${t('dashboard:trend.summary.averageBreakdowns', { period: getPeriodLabel(selectedPeriod), average: averageBreakdowns })}`
              })()}
            </div>
          </div>
        </div>
        )}
      </Card.Content>
    </Card>
  )
}