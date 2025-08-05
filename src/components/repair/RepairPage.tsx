'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui'
import { RepairReportForm } from './RepairReportForm'
import { RepairList } from './RepairList'
import { useToast } from '@/contexts/ToastContext'

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

export function RepairPage() {
  const { showSuccess } = useToast()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedRepair, setSelectedRepair] = useState<RepairReport | null>(null)

  const handleNewRepair = () => {
    setViewMode('form')
    setSelectedRepair(null)
  }

  const handleRepairSubmit = (repair: { equipmentId: string; technicianName: string; repairType: 'preventive' | 'corrective' | 'emergency' | 'upgrade'; completionStatus: 'completed' | 'partial' | 'failed'; workDescription: string; timeSpent: number; testResults: string; notes?: string }) => {
    console.log('새 수리 완료 보고 제출:', repair)
    // 여기서 실제 API 호출이나 상태 업데이트
    
    // 성공 메시지 표시
    showSuccess(
      '수리 완료 보고',
      '수리 완료 보고가 성공적으로 등록되었습니다!'
    )
    
    // 목록으로 돌아가기
    setViewMode('list')
  }

  const handleRepairClick = (repair: RepairReport) => {
    setSelectedRepair(repair)
    setViewMode('detail')
  }

  const handleCancel = () => {
    setViewMode('list')
    setSelectedRepair(null)
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
                  수리 내역 관리
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-gray-500 dark:text-gray-400">수리 완료 등록</span>
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
                  수리 내역 관리
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    설비 ID: {selectedRepair?.equipmentId} 상세
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">수리 내역 관리</h2>
              <p className="text-gray-600 dark:text-gray-400">
                완료된 수리 작업 내역을 확인하고 새로운 수리 완료를 등록할 수 있습니다
              </p>
            </div>
            <Button onClick={handleNewRepair} className="bg-green-600 hover:bg-green-700">
              🔧 수리 완료 등록
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
                수리 완료 상세 정보
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                설비 ID: {selectedRepair?.equipmentId}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={handleCancel}>
                목록으로
              </Button>
              <Button onClick={handleNewRepair} className="bg-green-600 hover:bg-green-700">
                🔧 새 수리 등록
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
          <RepairList onRepairClick={handleRepairClick} />
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

// 수리 완료 상세 보기 컴포넌트
function RepairDetailView({ repair }: { repair: RepairReport; onBack: () => void }) {
  const getRepairTypeColor = (type: string) => {
    switch (type) {
      case 'preventive': return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      case 'corrective': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
      case 'emergency': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      case 'upgrade': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
    }
  }

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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">설비 정보</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">설비명:</span>
              <span className="font-medium text-gray-900 dark:text-white">설비 ID: {repair.equipmentId}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">담당 기술자</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">이름:</span>
              <span className="font-medium text-gray-900 dark:text-white">{repair.technicianName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 수리 상세 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">수리 상세 정보</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className={`px-4 py-2 rounded-lg ${getRepairTypeColor(repair.repairType)}`}>
            <div className="text-sm font-medium">수리 유형</div>
            <div className="text-lg font-bold">
              {repair.repairType === 'preventive' && '예방 정비'}
              {repair.repairType === 'corrective' && '사후 정비'}
              {repair.repairType === 'emergency' && '긴급 수리'}
              {repair.repairType === 'upgrade' && '개선/업그레이드'}
            </div>
          </div>
          
          <div className={`px-4 py-2 rounded-lg ${getCompletionColor(repair.completionStatus)}`}>
            <div className="text-sm font-medium">완료 상태</div>
            <div className="text-lg font-bold">
              {repair.completionStatus === 'completed' && '완료'}
              {repair.completionStatus === 'partial' && '부분 완료'}
              {repair.completionStatus === 'failed' && '실패/보류'}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">수행한 작업 내용</h4>
            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
              {repair.workDescription}
            </p>
          </div>
          
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">테스트 결과</h4>
            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
              {repair.testResults}
            </p>
          </div>
        </div>
      </div>

      {/* 비용 및 시간 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">비용 및 시간</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{repair.timeSpent}h</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">작업 시간</div>
          </div>
        </div>
      </div>

      {/* 일정 및 참고사항 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">일정 및 참고사항</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">완료 일시:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {new Date(repair.completedAt).toLocaleString()}
            </span>
          </div>
          {repair.notes && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">추가 참고사항</h4>
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