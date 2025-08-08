'use client'

import React, { useState } from 'react'
import { Card, StatusBadge } from '@/components/ui'
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

// Mock breakdown reports data
const mockBreakdownReports: BreakdownReport[] = [
  {
    id: '1',
    equipmentCategory: '선반',
    equipmentNumber: 'CNC-LT-001',
    reporterName: '김기술자',
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
    equipmentCategory: '드릴링머신',
    equipmentNumber: 'CNC-DR-001',
    reporterName: '이현장',
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
    equipmentCategory: '밀링머신',
    equipmentNumber: 'CNC-ML-001',
    reporterName: '정기술자',
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

interface BreakdownListProps {
  onReportClick?: (report: BreakdownReport) => void
}

export function BreakdownList({ onReportClick }: BreakdownListProps) {
  const { t } = useTranslation(['breakdown', 'common'])
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
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('breakdown:list.statistics.reported')}</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-blue-600">
              {statusCounts.assigned || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('breakdown:list.statistics.assigned')}</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-yellow-600">
              {statusCounts.in_progress || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('breakdown:list.statistics.inProgress')}</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-green-600">
              {statusCounts.resolved || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('breakdown:list.statistics.resolved')}</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-red-600">
              {statusCounts.rejected || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('breakdown:list.statistics.rejected')}</div>
          </Card.Content>
        </Card>
      </div>

      {/* 필터링 */}
      <Card>
        <Card.Header>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('breakdown:list.title')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('breakdown:list.totalReports', { count: filteredReports.length })}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-auto rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">{t('breakdown:list.filters.allStatus')}</option>
                <option value="reported">{t('breakdown:status.reported')}</option>
                <option value="assigned">{t('breakdown:status.assigned')}</option>
                <option value="in_progress">{t('breakdown:status.in_progress')}</option>
                <option value="resolved">{t('breakdown:status.resolved')}</option>
                <option value="rejected">{t('breakdown:status.rejected')}</option>
              </select>
              
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="block w-auto rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">{t('breakdown:list.filters.allUrgency')}</option>
                <option value="critical">{t('breakdown:urgency.critical')}</option>
                <option value="high">{t('breakdown:urgency.high')}</option>
                <option value="medium">{t('breakdown:urgency.medium')}</option>
                <option value="low">{t('breakdown:urgency.low')}</option>
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
                        {report.equipmentCategory} ({report.equipmentNumber})
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusBadge variant={getUrgencyColor(report.urgencyLevel)}>
                      {t(`breakdown:urgency.${report.urgencyLevel}`, report.urgencyLevel)}
                    </StatusBadge>
                    <StatusBadge variant={getStatusColor(report.status)}>
                      {t(`breakdown:status.${report.status}`, report.status)}
                    </StatusBadge>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                    <strong>{t('breakdown:list.symptoms')}:</strong> {report.symptoms}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {report.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span><strong>{t('breakdown:list.reporter')}:</strong> {report.reporterName}</span>
                    <span><strong>{t('breakdown:list.type')}:</strong> {t(`breakdown:issueTypes.${report.issueType}`, report.issueType)}</span>
                    {report.assignedTo && (
                      <span><strong>{t('breakdown:list.assignee')}:</strong> {report.assignedTo}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div>{t('breakdown:list.reportedAt')}: {new Date(report.reportedAt).toLocaleString()}</div>
                    <div>{t('breakdown:list.updatedAt')}: {new Date(report.updatedAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredReports.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('breakdown:list.noReports')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('breakdown:list.noReportsDescription')}
                </p>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}