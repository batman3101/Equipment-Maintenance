'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui'
import { BreakdownReportForm } from './BreakdownReportForm'
import { BreakdownList } from './BreakdownList'

interface BreakdownReport {
  id: string
  equipmentNumber: string
  equipmentName: string
  location: string
  reporterName: string
  reporterPhone: string
  department: string
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
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedReport, setSelectedReport] = useState<BreakdownReport | null>(null)

  const handleNewReport = () => {
    setViewMode('form')
    setSelectedReport(null)
  }

  const handleReportSubmit = (report: any) => {
    console.log('새 고장 신고 제출:', report)
    // 여기서 실제 API 호출이나 상태 업데이트
    
    // 성공 메시지 표시 (실제로는 toast나 notification 사용)
    alert('고장 신고가 성공적으로 제출되었습니다!')
    
    // 목록으로 돌아가기
    setViewMode('list')
  }

  const handleReportClick = (report: BreakdownReport) => {
    setSelectedReport(report)
    setViewMode('detail')
  }

  const handleCancel = () => {
    setViewMode('list')
    setSelectedReport(null)
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
                  고장 신고 관리
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-gray-500 dark:text-gray-400">새 고장 신고</span>
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
                  고장 신고 관리
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {selectedReport?.equipmentName} 상세
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">고장 신고 관리</h2>
              <p className="text-gray-600 dark:text-gray-400">
                설비 고장 신고 현황을 확인하고 새로운 고장을 신고할 수 있습니다
              </p>
            </div>
            <Button onClick={handleNewReport} className="bg-red-600 hover:bg-red-700">
              🚨 고장 신고
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
                고장 신고 상세 정보
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedReport?.equipmentName} ({selectedReport?.equipmentNumber})
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={handleCancel}>
                목록으로
              </Button>
              <Button onClick={handleNewReport} className="bg-red-600 hover:bg-red-700">
                🚨 새 고장 신고
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
          <BreakdownList onReportClick={handleReportClick} />
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
function BreakdownDetailView({ report, onBack }: { report: BreakdownReport; onBack: () => void }) {
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">설비 정보</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">설비명:</span>
              <span className="font-medium text-gray-900 dark:text-white">{report.equipmentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">설비번호:</span>
              <span className="font-medium text-gray-900 dark:text-white">{report.equipmentNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">위치:</span>
              <span className="font-medium text-gray-900 dark:text-white">{report.location}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">신고자 정보</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">이름:</span>
              <span className="font-medium text-gray-900 dark:text-white">{report.reporterName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">연락처:</span>
              <span className="font-medium text-gray-900 dark:text-white">{report.reporterPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">부서:</span>
              <span className="font-medium text-gray-900 dark:text-white">{report.department}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 고장 상세 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">고장 상세 정보</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`px-4 py-2 rounded-lg ${getUrgencyColor(report.urgencyLevel)}`}>
            <div className="text-sm font-medium">긴급도</div>
            <div className="text-lg font-bold">
              {report.urgencyLevel === 'low' && '낮음'}
              {report.urgencyLevel === 'medium' && '보통'}
              {report.urgencyLevel === 'high' && '높음'}
              {report.urgencyLevel === 'critical' && '긴급'}
            </div>
          </div>
          
          <div className={`px-4 py-2 rounded-lg ${getStatusColor(report.status)}`}>
            <div className="text-sm font-medium">현재 상태</div>
            <div className="text-lg font-bold">
              {report.status === 'reported' && '신고 접수'}
              {report.status === 'assigned' && '담당자 배정'}
              {report.status === 'in_progress' && '수리 중'}
              {report.status === 'resolved' && '해결 완료'}
              {report.status === 'rejected' && '반려'}
            </div>
          </div>
          
          <div className="px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400">
            <div className="text-sm font-medium">문제 유형</div>
            <div className="text-lg font-bold">
              {report.issueType === 'mechanical' && '기계적'}
              {report.issueType === 'electrical' && '전기적'}
              {report.issueType === 'software' && '소프트웨어'}
              {report.issueType === 'safety' && '안전'}
              {report.issueType === 'other' && '기타'}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">발생 증상</h4>
            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
              {report.symptoms}
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">고장 내용</h4>
            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
              {report.description}
            </p>
          </div>
        </div>
      </div>

      {/* 진행 상황 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">진행 상황</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">신고 일시:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {new Date(report.reportedAt).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">최종 업데이트:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {new Date(report.updatedAt).toLocaleString()}
            </span>
          </div>
          {report.assignedTo && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">담당자:</span>
              <span className="font-medium text-gray-900 dark:text-white">{report.assignedTo}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}