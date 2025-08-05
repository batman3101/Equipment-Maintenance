'use client'

import React, { useState } from 'react'
import { Card, StatusBadge } from '@/components/ui'

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

// Mock repair reports data
const mockRepairReports: RepairReport[] = [
  {
    id: '1',
    equipmentId: 'CNC-ML-001',
    technicianName: '김안전관리사',
    repairType: 'emergency',
    workDescription: '안전 커버 센서 교체 및 안전 시스템 점검. 기존 센서가 오작동하여 새 센서로 완전 교체하고 전체 안전 시스템을 재보정했습니다.',
    timeSpent: 3.5,
    completionStatus: 'completed',
    testResults: '안전 커버 개폐 테스트 정상, 센서 감지 정확도 100%, 비상정지 기능 정상 작동 확인',
    completedAt: '2024-01-15 09:15:00',
    notes: '안전 센서는 3개월마다 정기 점검 필요. 습도가 높은 환경에서 부식 주의'
  },
  {
    id: '2',
    equipmentId: 'CNC-LT-001',
    technicianName: '박정비사',
    repairType: 'corrective',
    workDescription: '스핀들 베어링 교체 및 정렬 조정. 고주파 소음과 진동 원인인 손상된 베어링을 교체하고 스핀들 정렬을 재조정했습니다.',
    timeSpent: 6.0,
    completionStatus: 'completed',
    testResults: '스핀들 회전 테스트 정상, 진동 수준 0.2mm/s (기준값 이하), 소음 수준 정상',
    completedAt: '2024-01-15 16:30:00',
    notes: '베어링 교체 후 500시간 운전 후 재점검 권장'
  },
  {
    id: '3',
    equipmentId: 'CNC-DR-001',
    technicianName: '이수리기사',
    repairType: 'corrective',
    workDescription: '드릴 척 교체 및 제어 시스템 소프트웨어 업데이트',
    timeSpent: 2.5,
    completionStatus: 'partial',
    testResults: '드릴링 정확도 개선되었으나 간헐적 에러 코드 E-203 지속. 추가 점검 필요',
    completedAt: '2024-01-15 14:45:00',
    notes: '소프트웨어 업데이트는 완료되었으나 하드웨어 점검이 추가로 필요함'
  },
  {
    id: '4',
    equipmentId: 'CNC-GR-001',
    technicianName: '최정비사',
    repairType: 'preventive',
    workDescription: '정기 예방 정비 - 오일 교체, 필터 청소, 벨트 장력 조정',
    timeSpent: 4.0,
    completionStatus: 'completed',
    testResults: '모든 시스템 정상 작동, 유압 압력 안정, 정밀도 테스트 통과',
    completedAt: '2024-01-14 15:00:00',
    notes: '다음 정기 정비 시 쿨런트 시스템 점검 권장'
  }
]

const getRepairTypeColor = (type: string): 'success' | 'warning' | 'danger' | 'info' => {
  switch (type) {
    case 'preventive': return 'success'
    case 'corrective': return 'warning' 
    case 'emergency': return 'danger'
    case 'upgrade': return 'info'
    default: return 'info'
  }
}

const getRepairTypeText = (type: string) => {
  switch (type) {
    case 'preventive': return '예방 정비'
    case 'corrective': return '사후 정비'
    case 'emergency': return '긴급 수리'
    case 'upgrade': return '개선/업그레이드'
    default: return '알 수 없음'
  }
}

const getCompletionColor = (status: string): 'success' | 'warning' | 'danger' => {
  switch (status) {
    case 'completed': return 'success'
    case 'partial': return 'warning'
    case 'failed': return 'danger'
    default: return 'warning'
  }
}

const getCompletionText = (status: string) => {
  switch (status) {
    case 'completed': return '완료'
    case 'partial': return '부분 완료'
    case 'failed': return '실패/보류'
    default: return '알 수 없음'
  }
}

interface RepairListProps {
  onRepairClick?: (repair: RepairReport) => void
}

export function RepairList({ onRepairClick }: RepairListProps) {
  const [reports] = useState<RepairReport[]>(mockRepairReports)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date_desc')

  const filteredReports = reports
    .filter(report => {
      if (typeFilter !== 'all' && report.repairType !== typeFilter) return false
      if (statusFilter !== 'all' && report.completionStatus !== statusFilter) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        case 'date_asc':
          return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
        case 'time_desc':
          return b.timeSpent - a.timeSpent
        case 'time_asc':
          return a.timeSpent - b.timeSpent
        default:
          return 0
      }
    })

  // const typeCounts = reports.reduce((acc, report) => {
  //   acc[report.repairType] = (acc[report.repairType] || 0) + 1
  //   return acc
  // }, {} as Record<string, number>)

  const statusCounts = reports.reduce((acc, report) => {
    acc[report.completionStatus] = (acc[report.completionStatus] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalTimeSpent = reports.reduce((sum, report) => sum + report.timeSpent, 0)
  const avgTimeSpent = reports.reduce((sum, report) => sum + report.timeSpent, 0) / reports.length

  return (
    <div className="space-y-6">
      {/* 통계 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-green-600">
              {statusCounts.completed || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">완료</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-yellow-600">
              {statusCounts.partial || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">부분 완료</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-blue-600">
              {totalTimeSpent.toFixed(1)}시간
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">총 작업시간</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-purple-600">
              {avgTimeSpent.toFixed(1)}h
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">평균 작업시간</div>
          </Card.Content>
        </Card>
      </div>

      {/* 필터링 및 정렬 */}
      <Card>
        <Card.Header>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">수리 완료 내역</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                총 {filteredReports.length}건의 수리 완료 내역
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="block w-auto rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">모든 유형</option>
                <option value="preventive">예방 정비</option>
                <option value="corrective">사후 정비</option>
                <option value="emergency">긴급 수리</option>
                <option value="upgrade">개선/업그레이드</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-auto rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">모든 상태</option>
                <option value="completed">완료</option>
                <option value="partial">부분 완료</option>
                <option value="failed">실패/보류</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-auto rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="date_desc">최신순</option>
                <option value="date_asc">오래된순</option>
                <option value="time_desc">작업시간 긴순</option>
                <option value="time_asc">작업시간 짧은순</option>
              </select>
            </div>
          </div>
        </Card.Header>
        
        <Card.Content>
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => onRepairClick?.(report)}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        설비 ID: {report.equipmentId}
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusBadge variant={getRepairTypeColor(report.repairType)}>
                      {getRepairTypeText(report.repairType)}
                    </StatusBadge>
                    <StatusBadge variant={getCompletionColor(report.completionStatus)}>
                      {getCompletionText(report.completionStatus)}
                    </StatusBadge>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                    <strong>작업 내용:</strong> {report.workDescription}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span><strong>기술자:</strong> {report.technicianName}</span>
                    <span><strong>작업시간:</strong> {report.timeSpent}시간</span>
                  </div>
                  <div className="text-right">
                    <div>완료: {new Date(report.completedAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredReports.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🔧</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  수리 내역이 없습니다
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  선택한 조건에 해당하는 수리 완료 내역이 없습니다.
                </p>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}