'use client'

import React, { useState } from 'react'
import { Card, StatusBadge } from '@/components/ui'

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

// Mock breakdown reports data
const mockBreakdownReports: BreakdownReport[] = [
  {
    id: '1',
    equipmentNumber: 'CNC-LT-001',
    equipmentName: 'CNC 선반 #1',
    location: '1공장 B라인',
    reporterName: '김기술자',
    reporterPhone: '010-1234-5678',
    department: '생산1팀',
    urgencyLevel: 'high',
    issueType: 'mechanical',
    description: '스핀들에서 이상한 소음이 발생하며 진동이 심합니다. 가공 정확도에 영향을 주고 있어 즉시 점검이 필요합니다.',
    symptoms: '고주파 소음, 비정상적 진동, 가공면 거칠기 증가',
    status: 'in_progress',
    reportedAt: '2024-01-15 13:45:00',
    updatedAt: '2024-01-15 14:30:00',
    assignedTo: '박정비사'
  },
  {
    id: '2',
    equipmentNumber: 'CNC-DR-001',
    equipmentName: 'CNC 드릴링머신 #1',
    location: '2공장 A라인',
    reporterName: '이현장',
    reporterPhone: '010-2345-6789',
    department: '생산2팀',
    urgencyLevel: 'medium',
    issueType: 'electrical',
    description: '제어판에 에러 코드 E-203이 간헐적으로 표시됩니다. 작업은 계속 가능하지만 점검이 필요해 보입니다.',
    symptoms: '간헐적 에러 코드 표시, 작업 중단 없음',
    status: 'assigned',
    reportedAt: '2024-01-15 11:20:00',
    updatedAt: '2024-01-15 12:00:00',
    assignedTo: '최전기기사'
  },
  {
    id: '3',
    equipmentNumber: 'CNC-ML-001',
    equipmentName: 'CNC 밀링머신 #1',
    location: '1공장 A라인',
    reporterName: '정기술자',
    reporterPhone: '010-3456-7890',
    department: '생산1팀',
    urgencyLevel: 'critical',
    issueType: 'safety',
    description: '안전 커버가 완전히 닫히지 않아 안전 센서가 작동하지 않습니다. 작업자 안전을 위해 즉시 사용 중단했습니다.',
    symptoms: '안전 커버 오작동, 안전 센서 미작동, 작업 불가',
    status: 'resolved',
    reportedAt: '2024-01-14 16:30:00',
    updatedAt: '2024-01-15 09:15:00',
    assignedTo: '김안전관리사'
  }
]

const getUrgencyColor = (level: string): 'success' | 'warning' | 'danger' | 'secondary' => {
  switch (level) {
    case 'low': return 'success'
    case 'medium': return 'warning'
    case 'high': return 'danger'
    case 'critical': return 'danger'
    default: return 'secondary'
  }
}

const getUrgencyText = (level: string) => {
  switch (level) {
    case 'low': return '낮음'
    case 'medium': return '보통'
    case 'high': return '높음'
    case 'critical': return '긴급'
    default: return '알 수 없음'
  }
}

const getStatusColor = (status: string): 'secondary' | 'info' | 'warning' | 'success' | 'danger' => {
  switch (status) {
    case 'reported': return 'secondary'
    case 'assigned': return 'info'
    case 'in_progress': return 'warning'
    case 'resolved': return 'success'
    case 'rejected': return 'danger'
    default: return 'secondary'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'reported': return '신고 접수'
    case 'assigned': return '담당자 배정'
    case 'in_progress': return '수리 중'
    case 'resolved': return '해결 완료'
    case 'rejected': return '반려'
    default: return '알 수 없음'
  }
}

const getIssueTypeText = (type: string) => {
  switch (type) {
    case 'mechanical': return '기계적'
    case 'electrical': return '전기적'
    case 'software': return '소프트웨어'
    case 'safety': return '안전'
    case 'other': return '기타'
    default: return '알 수 없음'
  }
}

interface BreakdownListProps {
  onReportClick?: (report: BreakdownReport) => void
}

export function BreakdownList({ onReportClick }: BreakdownListProps) {
  const [reports] = useState<BreakdownReport[]>(mockBreakdownReports)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all')

  const filteredReports = reports.filter(report => {
    if (statusFilter !== 'all' && report.status !== statusFilter) return false
    if (urgencyFilter !== 'all' && report.urgencyLevel !== urgencyFilter) return false
    return true
  })

  const statusCounts = reports.reduce((acc, report) => {
    acc[report.status] = (acc[report.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* 통계 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-gray-600">
              {statusCounts.reported || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">신고 접수</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-blue-600">
              {statusCounts.assigned || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">담당자 배정</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-yellow-600">
              {statusCounts.in_progress || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">수리 중</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-green-600">
              {statusCounts.resolved || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">해결 완료</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-red-600">
              {statusCounts.rejected || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">반려</div>
          </Card.Content>
        </Card>
      </div>

      {/* 필터링 */}
      <Card>
        <Card.Header>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">고장 신고 내역</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                총 {filteredReports.length}건의 신고 내역
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-auto rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">모든 상태</option>
                <option value="reported">신고 접수</option>
                <option value="assigned">담당자 배정</option>
                <option value="in_progress">수리 중</option>
                <option value="resolved">해결 완료</option>
                <option value="rejected">반려</option>
              </select>
              
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="block w-auto rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">모든 긴급도</option>
                <option value="critical">긴급</option>
                <option value="high">높음</option>
                <option value="medium">보통</option>
                <option value="low">낮음</option>
              </select>
            </div>
          </div>
        </Card.Header>
        
        <Card.Content>
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => onReportClick?.(report)}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        {report.equipmentName}
                      </h4>
                      <span className="text-sm text-gray-500">({report.equipmentNumber})</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{report.location}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusBadge variant={getUrgencyColor(report.urgencyLevel)}>
                      {getUrgencyText(report.urgencyLevel)}
                    </StatusBadge>
                    <StatusBadge variant={getStatusColor(report.status)}>
                      {getStatusText(report.status)}
                    </StatusBadge>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                    <strong>증상:</strong> {report.symptoms}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {report.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span><strong>신고자:</strong> {report.reporterName} ({report.department})</span>
                    <span><strong>유형:</strong> {getIssueTypeText(report.issueType)}</span>
                    {report.assignedTo && (
                      <span><strong>담당자:</strong> {report.assignedTo}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div>신고: {new Date(report.reportedAt).toLocaleString()}</div>
                    <div>업데이트: {new Date(report.updatedAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredReports.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  신고 내역이 없습니다
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  선택한 조건에 해당하는 고장 신고가 없습니다.
                </p>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}