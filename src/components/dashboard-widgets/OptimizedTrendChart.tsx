'use client'

import React, { memo, useMemo, useState, useCallback } from 'react'
import { useDashboardAnalytics } from '@/hooks/useAnalytics'
import { Card } from '@/components/ui'

interface TrendChartProps {
  className?: string
  height?: number
  maxDataPoints?: number
}

// [SRP] Rule: 트렌드 차트 컴포넌트는 차트 렌더링만 담당
const TrendChartComponent: React.FC<TrendChartProps> = ({ 
  className = '',
  height = 300,
  maxDataPoints = 12 
}) => {
  const { data, loading, error } = useDashboardAnalytics()
  const [selectedMetric, setSelectedMetric] = useState<'breakdowns' | 'repairs'>('breakdowns')

  // [OCP] Rule: 메모이제이션을 통한 성능 확장 - 기존 로직 수정 없음
  const chartData = useMemo(() => {
    if (!data?.trendData) return []
    
    // 데이터 포인트 제한으로 렌더링 성능 개선
    const limitedData = data.trendData.slice(-maxDataPoints)
    
    return limitedData.map(item => ({
      name: item.period,
      breakdowns: item.breakdowns,
      repairs: item.repairs,
      total: item.breakdowns + item.repairs
    }))
  }, [data?.trendData, maxDataPoints])

  // [ISP] Rule: 메트릭 선택 핸들러 분리
  const handleMetricChange = useCallback((metric: 'breakdowns' | 'repairs') => {
    setSelectedMetric(metric)
  }, [])

  // 최대값 계산 (차트 스케일링용)
  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 100
    return Math.max(...chartData.map(item => Math.max(item.breakdowns, item.repairs)))
  }, [chartData])

  // SVG 차트 렌더링 (외부 라이브러리 의존성 제거로 번들 크기 축소)
  const renderChart = useMemo(() => {
    if (chartData.length === 0) return null

    const width = 800
    const padding = 60
    const chartHeight = height - padding * 2
    const chartWidth = width - padding * 2

    const xStep = chartWidth / Math.max(chartData.length - 1, 1)
    const yScale = chartHeight / maxValue

    // 선 그리기
    const createPath = (dataKey: 'breakdowns' | 'repairs') => {
      return chartData
        .map((item, index) => {
          const x = padding + index * xStep
          const y = height - padding - (item[dataKey] * yScale)
          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
        })
        .join(' ')
    }

    return (
      <svg width={width} height={height} className="overflow-visible">
        {/* 격자 */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width={chartWidth} height={chartHeight} x={padding} y={padding} fill="url(#grid)" />

        {/* 고장 데이터 선 */}
        <path
          d={createPath('breakdowns')}
          fill="none"
          stroke="#ef4444"
          strokeWidth="3"
          className="drop-shadow-sm"
        />

        {/* 수리 데이터 선 */}
        <path
          d={createPath('repairs')}
          fill="none"
          stroke="#22c55e"
          strokeWidth="3"
          className="drop-shadow-sm"
        />

        {/* 데이터 포인트 */}
        {chartData.map((item, index) => {
          const x = padding + index * xStep
          const breakdownY = height - padding - (item.breakdowns * yScale)
          const repairY = height - padding - (item.repairs * yScale)

          return (
            <g key={item.name}>
              {/* 고장 포인트 */}
              <circle
                cx={x}
                cy={breakdownY}
                r="4"
                fill="#ef4444"
                className="hover:r-6 transition-all cursor-pointer drop-shadow-md"
              />
              {/* 수리 포인트 */}
              <circle
                cx={x}
                cy={repairY}
                r="4"
                fill="#22c55e"
                className="hover:r-6 transition-all cursor-pointer drop-shadow-md"
              />
              
              {/* X축 라벨 */}
              <text
                x={x}
                y={height - padding + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600 dark:fill-gray-300"
              >
                {item.name}
              </text>
            </g>
          )
        })}

        {/* Y축 라벨 */}
        {[0, Math.ceil(maxValue * 0.25), Math.ceil(maxValue * 0.5), Math.ceil(maxValue * 0.75), maxValue].map((value) => {
          const y = height - padding - (value * yScale)
          return (
            <g key={value}>
              <line
                x1={padding - 5}
                y1={y}
                x2={padding}
                y2={y}
                stroke="#6b7280"
                strokeWidth="1"
              />
              <text
                x={padding - 10}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-gray-600 dark:fill-gray-300"
              >
                {value}
              </text>
            </g>
          )
        })}
      </svg>
    )
  }, [chartData, height, maxValue])

  if (loading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <Card.Header>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        </Card.Header>
        <Card.Content>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </Card.Content>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`${className} border-red-200 dark:border-red-800`}>
        <Card.Content className="p-6 text-center">
          <div className="text-red-600 dark:text-red-400">
            <span className="text-2xl">⚠️</span>
            <p className="mt-2 text-sm">차트 데이터를 불러올 수 없습니다</p>
            <p className="text-xs text-gray-500 mt-1">{error}</p>
          </div>
        </Card.Content>
      </Card>
    )
  }

  return (
    <Card className={`${className} shadow-lg hover:shadow-xl transition-shadow`}>
      <Card.Header className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <span className="mr-2">📈</span> 월별 고장/수리 트렌드
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">최근 12개월 데이터</p>
          </div>
          
          {/* 메트릭 선택 버튼 */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleMetricChange('breakdowns')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                selectedMetric === 'breakdowns'
                  ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              🚨 고장
            </button>
            <button
              onClick={() => handleMetricChange('repairs')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                selectedMetric === 'repairs'
                  ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              🔧 수리
            </button>
          </div>
        </div>
      </Card.Header>
      
      <Card.Content className="p-6">
        {/* 요약 통계 */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-center">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {chartData.reduce((sum, item) => sum + item.breakdowns, 0)}
            </div>
            <div className="text-xs text-red-600 dark:text-red-400">총 고장 건수</div>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {chartData.reduce((sum, item) => sum + item.repairs, 0)}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">총 수리 완료</div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {chartData.length > 0 
                ? Math.round((chartData.reduce((sum, item) => sum + item.repairs, 0) / 
                            Math.max(chartData.reduce((sum, item) => sum + item.breakdowns, 0), 1)) * 100)
                : 0}%
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">수리 완료율</div>
          </div>
        </div>

        {/* 차트 */}
        <div className="flex justify-center overflow-x-auto">
          {renderChart}
        </div>

        {/* 범례 */}
        <div className="flex justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-gray-600 dark:text-gray-300">고장 발생</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-600 dark:text-gray-300">수리 완료</span>
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}

// [DIP] Rule: 메모이제이션된 컴포넌트 추상화
export const OptimizedTrendChart = memo(TrendChartComponent, (prevProps, nextProps) => {
  // 얕은 비교로 불필요한 리렌더링 방지
  return (
    prevProps.className === nextProps.className &&
    prevProps.height === nextProps.height &&
    prevProps.maxDataPoints === nextProps.maxDataPoints
  )
})

OptimizedTrendChart.displayName = 'OptimizedTrendChart'