'use client'

import React, { useState } from 'react'
import { Card, Button } from '@/components/ui'
import { RealTimeMonitoring } from './RealTimeMonitoring'
import { PerformanceAnalysis } from './PerformanceAnalysis'
import { MaintenanceAnalysis } from './MaintenanceAnalysis'
import { ComprehensiveReport } from './ComprehensiveReport'

type AnalysisType = 'realtime' | 'performance' | 'maintenance' | 'report'

interface AnalysisOption {
  id: AnalysisType
  label: string
  icon: string
  description: string
  subOptions: Array<{
    id: string
    label: string
    description: string
  }>
}

const analysisOptions: AnalysisOption[] = [
  {
    id: 'realtime',
    label: '🔥 실시간 모니터링',
    icon: '📊',
    description: '현재 설비 상태와 실시간 데이터 분석',
    subOptions: [
      { id: 'current-status', label: '현재 설비 상태', description: '실시간 설비 운영 현황' },
      { id: 'real-alarms', label: '실시간 알람 현황', description: '진행 중인 알람과 경고' },
      { id: 'urgent-equipment', label: '긴급 조치 필요 설비', description: '즉시 대응이 필요한 설비' }
    ]
  },
  {
    id: 'performance',
    label: '📈 성과 분석',
    icon: '📈',
    description: '설비 성능 및 효율성 지표 분석',
    subOptions: [
      { id: 'operation-rate', label: '가동률 분석', description: '설비별 가동률 및 추이 분석' },
      { id: 'efficiency', label: '효율성 지표', description: 'MTBF, MTTR 등 효율성 측정' },
      { id: 'productivity', label: '생산성 분석', description: '설비 생산성 및 품질 지표' }
    ]
  },
  {
    id: 'maintenance',
    label: '🔧 정비 분석',
    icon: '🔧',
    description: '정비 활동 및 성과 분석',
    subOptions: [
      { id: 'schedule-analysis', label: '정비 일정 분석', description: '정비 계획 대비 실행률' },
      { id: 'maintenance-type', label: '정비 유형 분석', description: '예방정비 vs 사후정비 비율' },
      { id: 'team-performance', label: '정비팀 성과', description: '정비팀별 생산성과 품질' }
    ]
  },
  {
    id: 'report',
    label: '📋 종합 리포트',
    icon: '📋',
    description: '통합 리포트 및 상세 분석',
    subOptions: [
      { id: 'monthly-report', label: '월간 종합 보고서', description: '월별 통합 성과 리포트' },
      { id: 'equipment-detail', label: '설비별 상세 분석', description: '개별 설비 심층 분석' },
      { id: 'improvement', label: '개선 제안 사항', description: 'AI 기반 개선 권고사항' }
    ]
  }
]

const periodOptions = [
  { id: 'realtime', label: '실시간' },
  { id: 'daily', label: '일간' },
  { id: 'weekly', label: '주간' },
  { id: 'monthly', label: '월간' },
  { id: 'quarterly', label: '분기별' }
]

export function StatisticsPage() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisType>('realtime')
  const [selectedSubOption, setSelectedSubOption] = useState<string>('current-status')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('daily')
  const [isLoading, setIsLoading] = useState(false)

  const handleAnalysisChange = (analysisType: AnalysisType) => {
    setSelectedAnalysis(analysisType)
    const firstSubOption = analysisOptions.find(opt => opt.id === analysisType)?.subOptions[0]
    if (firstSubOption) {
      setSelectedSubOption(firstSubOption.id)
    }
  }

  const handleSubOptionChange = (subOptionId: string) => {
    setSelectedSubOption(subOptionId)
  }

  const handleGenerateReport = async () => {
    setIsLoading(true)
    // 실제 리포트 생성 로직
    setTimeout(() => {
      setIsLoading(false)
    }, 2000)
  }

  const renderAnalysisContent = () => {
    switch (selectedAnalysis) {
      case 'realtime':
        return <RealTimeMonitoring subOption={selectedSubOption} />
      case 'performance':
        return <PerformanceAnalysis subOption={selectedSubOption} period={selectedPeriod} />
      case 'maintenance':
        return <MaintenanceAnalysis subOption={selectedSubOption} period={selectedPeriod} />
      case 'report':
        return <ComprehensiveReport subOption={selectedSubOption} period={selectedPeriod} />
      default:
        return null
    }
  }

  const currentAnalysisOption = analysisOptions.find(opt => opt.id === selectedAnalysis)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">통계 분석</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            설비 운영 데이터를 분석하고 인사이트를 확인하세요
          </p>
        </div>
        <Button 
          onClick={handleGenerateReport}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? '생성 중...' : '📊 리포트 생성'}
        </Button>
      </div>

      {/* Analysis Type Selection */}
      <Card>
        <Card.Header>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">분석 유형 선택</h3>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analysisOptions.map((option) => (
              <div
                key={option.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  selectedAnalysis === option.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleAnalysisChange(option.id)}
              >
                <div className="text-2xl mb-2">{option.icon}</div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {option.label}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {option.description}
                </p>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>

      {/* Sub-options and Filters */}
      {currentAnalysisOption && (
        <Card>
          <Card.Content className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Sub-option selection */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  세부 분석 항목
                </label>
                <select
                  value={selectedSubOption}
                  onChange={(e) => handleSubOptionChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {currentAnalysisOption.subOptions.map((subOption) => (
                    <option key={subOption.id} value={subOption.id}>
                      {subOption.label} - {subOption.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Period selection (except for realtime) */}
              {selectedAnalysis !== 'realtime' && (
                <div className="flex-1 lg:max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    분석 기간
                  </label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {periodOptions.filter(p => p.id !== 'realtime').map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Analysis Content */}
      <div className="min-h-[600px]">
        {renderAnalysisContent()}
      </div>
    </div>
  )
}