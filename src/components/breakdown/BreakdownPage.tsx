'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui'
import { BreakdownReportForm } from './BreakdownReportForm'
import { BreakdownList } from './BreakdownList'
import { BreakdownListRef } from '@/types/breakdown'
import { useToast } from '@/contexts/ToastContext'
import { useTranslation } from 'react-i18next'

interface BreakdownReport {
  id: string
  equipmentCategory: string
  equipmentNumber: string
  reporterName: string
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  issueType: 'mechanical' | 'electrical' | 'software' | 'safety' | 'other'
  description: string
  symptoms: string
  status: 'reported' | 'assigned' | 'in_progress' | 'resolved' | 'rejected'
  reportedAt: string
  updatedAt: string
  assignedTo?: string
}

type ViewMode = 'list' | 'form' | 'detail'

export function BreakdownPage() {
  const { showSuccess } = useToast()
  const { t } = useTranslation(['breakdown', 'common'])
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedReport, setSelectedReport] = useState<BreakdownReport | null>(null)
  const breakdownListRef = useRef<BreakdownListRef>(null)

  const handleNewReport = () => {
    setViewMode('form')
    setSelectedReport(null)
  }

  const handleReportSubmit = (report: { equipmentCategory: string; equipmentNumber: string; reporterName: string; urgencyLevel: 'low' | 'medium' | 'high' | 'critical'; issueType: 'mechanical' | 'electrical' | 'software' | 'safety' | 'other'; description: string; symptoms: string }) => {
    console.log('새 고장 신고 제출:', report)
    
    // 성공 메시지 표시
    showSuccess(
      t('breakdown:messages.reportSuccess'),
      t('breakdown:messages.reportSuccessDetail')
    )
    
    // 목록으로 돌아가기 및 데이터 새로고침
    setViewMode('list')
    
    // BreakdownList 데이터 새로고침
    if (breakdownListRef.current) {
      breakdownListRef.current.refreshData()
    }
  }

  const handleCancel = () => {
    setViewMode('list')
  }

  const renderBreadcrumb = () => {
    switch (viewMode) {
      case 'form':
        return (
          <nav className="flex mb-6" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <button
                  onClick={() => setViewMode('list')}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  {t('breakdown:breadcrumb.breakdownManagement')}
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-gray-500 dark:text-gray-400">{t('breakdown:breadcrumb.newReport')}</span>
                </div>
              </li>
            </ol>
          </nav>
        )
      case 'detail':
        return (
          <nav className="flex mb-6" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <button
                  onClick={() => setViewMode('list')}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  {t('breakdown:breadcrumb.breakdownManagement')}
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {t('breakdown:breadcrumb.detail', { equipmentNumber: selectedReport?.equipmentNumber })}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        )
      default:
        return null
    }
  }

  const renderHeader = () => {
    switch (viewMode) {
      case 'list':
        return (
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('breakdown:management.title')}</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t('breakdown:management.description')}
              </p>
            </div>
            <Button onClick={handleNewReport} className="bg-red-600 hover:bg-red-700">
              🚨 {t('breakdown:management.reportBreakdown')}
            </Button>
          </div>
        )
      case 'form':
        return null // BreakdownReportForm에서 자체 헤더 사용
      case 'detail':
        return (
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('breakdown:detail.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t('breakdown:detail.equipmentNumber')}: {selectedReport?.equipmentNumber}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={handleCancel}>
                {t('breakdown:management.backToList')}
              </Button>
              <Button onClick={handleNewReport} className="bg-red-600 hover:bg-red-700">
                🚨 {t('breakdown:management.newReport')}
              </Button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const renderContent = () => {
    switch (viewMode) {
      case 'form':
        return (
          <BreakdownReportForm
            onSubmit={handleReportSubmit}
            onCancel={handleCancel}
          />
        )
      case 'detail':
        return selectedReport ? (
          <BreakdownDetailView report={selectedReport} onBack={handleCancel} />
        ) : null
      default:
        return (
          <BreakdownList ref={breakdownListRef} />
        )
    }
  }

  return (
    <div>
      {renderBreadcrumb()}
      {renderHeader()}
      {renderContent()}
    </div>
  )
}

// 고장 신고 상세 보기 컴포넌트
function BreakdownDetailView({ report }: { report: BreakdownReport; onBack: () => void }) {
  const { t } = useTranslation(['breakdown', 'common'])
  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20'
      case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
      case 'assigned': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
      case 'in_progress': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
      case 'resolved': return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      case 'rejected': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 기본 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('breakdown:detail.equipmentInfo')}</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('breakdown:detail.equipmentCategory')}:</span>
              <span className="font-medium text-gray-900 dark:text-white">{report.equipmentCategory}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('breakdown:detail.equipmentNumber')}:</span>
              <span className="font-medium text-gray-900 dark:text-white">{report.equipmentNumber}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('breakdown:detail.reporterInfo')}</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('breakdown:detail.reporterName')}:</span>
              <span className="font-medium text-gray-900 dark:text-white">{report.reporterName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 고장 상세 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('breakdown:detail.breakdownDetail')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`px-4 py-2 rounded-lg ${getUrgencyColor(report.urgencyLevel)}`}>
            <div className="text-sm font-medium">{t('breakdown:urgency.urgencyLevel')}</div>
            <div className="text-lg font-bold">
              {t(`breakdown:urgency.${report.urgencyLevel}`, report.urgencyLevel)}
            </div>
          </div>
          
          <div className={`px-4 py-2 rounded-lg ${getStatusColor(report.status)}`}>
            <div className="text-sm font-medium">{t('breakdown:status.current')}</div>
            <div className="text-lg font-bold">
              {t(`breakdown:status.${report.status}`, report.status)}
            </div>
          </div>
          
          <div className="px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400">
            <div className="text-sm font-medium">{t('breakdown:issueTypes.issueType')}</div>
            <div className="text-lg font-bold">
              {t(`breakdown:issueTypes.${report.issueType}`, report.issueType)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">{t('breakdown:detail.symptomsTitle')}</h4>
            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
              {report.symptoms}
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">{t('breakdown:detail.descriptionTitle')}</h4>
            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
              {report.description}
            </p>
          </div>
        </div>
      </div>

      {/* 진행 상황 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('breakdown:detail.progress')}</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">{t('breakdown:detail.reportedAt')}:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {new Date(report.reportedAt).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">{t('breakdown:detail.updatedAt')}:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {new Date(report.updatedAt).toLocaleString()}
            </span>
          </div>
          {report.assignedTo && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">{t('breakdown:detail.assignedTo')}:</span>
              <span className="font-medium text-gray-900 dark:text-white">{report.assignedTo}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}