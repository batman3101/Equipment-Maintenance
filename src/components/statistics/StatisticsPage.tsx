'use client'

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
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


export function StatisticsPage() {
  const { t } = useTranslation('statistics')
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisType>('realtime')
  const [selectedSubOption, setSelectedSubOption] = useState<string>('current-status')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('daily')
  const [isLoading, setIsLoading] = useState(false)

  // [SRP] Rule: 번역 기반 동적 옵션 생성
  const analysisOptions: AnalysisOption[] = [
    {
      id: 'realtime',
      label: t('analysisType.realtime.label'),
      icon: '📊',
      description: t('analysisType.realtime.description'),
      subOptions: [
        { id: 'current-status', label: t('subOptions.realtime.currentStatus.label'), description: t('subOptions.realtime.currentStatus.description') },
        { id: 'real-alarms', label: t('subOptions.realtime.realAlarms.label'), description: t('subOptions.realtime.realAlarms.description') },
        { id: 'urgent-equipment', label: t('subOptions.realtime.urgentEquipment.label'), description: t('subOptions.realtime.urgentEquipment.description') }
      ]
    },
    {
      id: 'performance',
      label: t('analysisType.performance.label'),
      icon: '📈',
      description: t('analysisType.performance.description'),
      subOptions: [
        { id: 'operation-rate', label: t('subOptions.performance.operationRate.label'), description: t('subOptions.performance.operationRate.description') },
        { id: 'efficiency', label: t('subOptions.performance.efficiency.label'), description: t('subOptions.performance.efficiency.description') },
        { id: 'productivity', label: t('subOptions.performance.productivity.label'), description: t('subOptions.performance.productivity.description') }
      ]
    },
    {
      id: 'maintenance',
      label: t('analysisType.maintenance.label'),
      icon: '🔧',
      description: t('analysisType.maintenance.description'),
      subOptions: [
        { id: 'schedule-analysis', label: t('subOptions.maintenance.scheduleAnalysis.label'), description: t('subOptions.maintenance.scheduleAnalysis.description') },
        { id: 'maintenance-type', label: t('subOptions.maintenance.maintenanceType.label'), description: t('subOptions.maintenance.maintenanceType.description') },
        { id: 'team-performance', label: t('subOptions.maintenance.teamPerformance.label'), description: t('subOptions.maintenance.teamPerformance.description') }
      ]
    },
    {
      id: 'report',
      label: t('analysisType.report.label'),
      icon: '📋',
      description: t('analysisType.report.description'),
      subOptions: [
        { id: 'monthly-report', label: t('subOptions.report.monthlyReport.label'), description: t('subOptions.report.monthlyReport.description') },
        { id: 'equipment-detail', label: t('subOptions.report.equipmentDetail.label'), description: t('subOptions.report.equipmentDetail.description') },
        { id: 'improvement', label: t('subOptions.report.improvement.label'), description: t('subOptions.report.improvement.description') }
      ]
    }
  ]

  const periodOptions = [
    { id: 'realtime', label: t('periods.realtime') },
    { id: 'daily', label: t('periods.daily') },
    { id: 'weekly', label: t('periods.weekly') },
    { id: 'monthly', label: t('periods.monthly') },
    { id: 'quarterly', label: t('periods.quarterly') }
  ]

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
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('title')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('subtitle')}
          </p>
        </div>
        <Button 
          onClick={handleGenerateReport}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? t('generating') : `📊 ${t('generateReport')}`}
        </Button>
      </div>

      {/* Analysis Type Selection */}
      <Card>
        <Card.Header>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('analysisType.title')}</h3>
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
                  {t('subOptions.label')}
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
                    {t('periods.label')}
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