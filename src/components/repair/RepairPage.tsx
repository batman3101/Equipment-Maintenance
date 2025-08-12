'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui'
import { RepairReportForm } from './RepairReportForm'
import { RepairList } from './RepairList'
import { useToast } from '@/contexts/ToastContext'
import { useTranslation } from 'react-i18next'

// [SRP] Rule: 수리 보고서 타입 정의 - 데이터 구조만 담당
interface RepairReport {
  id: string
  equipmentId: string
  technicianName: string
  repairType: 'preventive' | 'corrective' | 'emergency' | 'upgrade'
  completionStatus: 'completed' | 'partial' | 'failed'
  workDescription: string
  timeSpent: number
  testResults: string
  notes?: string
  completedAt: string
}

type ViewMode = 'list' | 'form' | 'detail'

// [SRP] Rule: 메인 수리 페이지 컴포넌트 - 페이지 레벨 상태 관리만 담당
export function RepairPage() {
  const { showSuccess } = useToast()
  const { t } = useTranslation(['repair', 'common'])
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedRepair, setSelectedRepair] = useState<RepairReport | null>(null)

  const handleNewRepair = () => {
    setViewMode('form')
    setSelectedRepair(null)
  }

  const handleRepairSubmit = (repair: { 
    equipmentId: string
    technicianName: string
    repairType: 'preventive' | 'corrective' | 'emergency' | 'upgrade'
    completionStatus: 'completed' | 'partial' | 'failed'
    workDescription: string
    timeSpent: number
    testResults: string
    notes?: string 
  }) => {
    console.log('새 수리 완료 보고 제출:', repair)
    // 여기서 실제 API 호출이나 상태 업데이트
    
    // 성공 메시지 표시
    showSuccess(
      t('repair:messages.repairSuccess'),
      t('repair:messages.repairSuccessDetail')
    )
    
    // 목록으로 돌아가기
    setViewMode('list')
  }

  const handleCancel = () => {
    setViewMode('list')
    setSelectedRepair(null)
  }

  // [SRP] Rule: 브레드크럼 렌더링 - 네비게이션 표시만 담당
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
                  {t('repair:breadcrumb.repairManagement')}
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {t('repair:breadcrumb.registerRepair')}
                  </span>
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
                  {t('repair:breadcrumb.repairManagement')}
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {t('repair:breadcrumb.detail', { equipmentId: selectedRepair?.equipmentId })}
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

  // [SRP] Rule: 헤더 렌더링 - 페이지 타이틀과 액션 버튼만 담당
  const renderHeader = () => {
    switch (viewMode) {
      case 'list':
        return (
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('repair:management.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t('repair:management.description')}
              </p>
            </div>
            <Button onClick={handleNewRepair} className="bg-green-600 hover:bg-green-700">
              🔧 {t('repair:management.registerRepair')}
            </Button>
          </div>
        )
      case 'form':
        return null // RepairReportForm에서 자체 헤더 사용
      case 'detail':
        return (
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('repair:management.repairDetail')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t('repair:breadcrumb.detail', { equipmentId: selectedRepair?.equipmentId })}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={handleCancel}>
                {t('repair:management.backToList')}
              </Button>
              <Button onClick={handleNewRepair} className="bg-green-600 hover:bg-green-700">
                🔧 {t('repair:management.newRepair')}
              </Button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  // [SRP] Rule: 콘텐츠 렌더링 - 뷰 모드에 따른 컴포넌트 렌더링만 담당
  const renderContent = () => {
    switch (viewMode) {
      case 'form':
        return (
          <RepairReportForm
            onSubmit={handleRepairSubmit}
            onCancel={handleCancel}
          />
        )
      case 'detail':
        return selectedRepair ? (
          <RepairDetailView repair={selectedRepair} onBack={handleCancel} />
        ) : null
      default:
        return (
          <RepairList onRepairClick={() => {}} />
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

// [SRP] Rule: 수리 상세 보기 컴포넌트 - 상세 정보 표시만 담당
function RepairDetailView({ repair }: { repair: RepairReport; onBack: () => void }) {
  const { t } = useTranslation(['repair'])

  // [SRP] Rule: 수리 유형 색상 결정 - UI 스타일링만 담당
  const getRepairTypeColor = (type: string) => {
    switch (type) {
      case 'preventive': return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      case 'corrective': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
      case 'emergency': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      case 'upgrade': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  // [SRP] Rule: 완료 상태 색상 결정 - UI 스타일링만 담당
  const getCompletionColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      case 'partial': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
      case 'failed': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 기본 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('repair:detail.equipmentInfo')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                {t('repair:detail.equipmentName')}:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {t('repair:detail.equipmentId')}: {repair.equipmentId}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('repair:detail.technicianInfo')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                {t('repair:detail.technicianName')}:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {repair.technicianName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 수리 상세 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('repair:detail.repairDetails')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className={`px-4 py-2 rounded-lg ${getRepairTypeColor(repair.repairType)}`}>
            <div className="text-sm font-medium">{t('repair:detail.repairType')}</div>
            <div className="text-lg font-bold">
              {t(`repair:repairTypes.${repair.repairType}`)}
            </div>
          </div>
          
          <div className={`px-4 py-2 rounded-lg ${getCompletionColor(repair.completionStatus)}`}>
            <div className="text-sm font-medium">{t('repair:detail.completionStatus')}</div>
            <div className="text-lg font-bold">
              {t(`repair:completionStatus.${repair.completionStatus}`)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              {t('repair:detail.workPerformed')}
            </h4>
            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
              {repair.workDescription}
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              {t('repair:detail.testResults')}
            </h4>
            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
              {repair.testResults}
            </p>
          </div>
        </div>
      </div>

      {/* 비용 및 시간 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('repair:detail.timeAndCost')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{repair.timeSpent}h</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('repair:detail.workTime')}
            </div>
          </div>
        </div>
      </div>

      {/* 일정 및 참고사항 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('repair:detail.scheduleNotes')}
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">
              {t('repair:detail.completedAt')}:
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {new Date(repair.completedAt).toLocaleString()}
            </span>
          </div>
          {repair.notes && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                {t('repair:detail.additionalNotes')}
              </h4>
              <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                {repair.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}