'use client'

import React, { useState, useMemo } from 'react'
import { Card, StatusBadge } from '@/components/ui'
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

interface RepairListProps {
  onRepairClick: (repair: RepairReport) => void
}

// [SRP] Rule: Mock 데이터 생성 - 시연용 데이터만 담당
const mockRepairs: RepairReport[] = [
  {
    id: '1',
    equipmentId: 'CNC-ML-001',
    technicianName: '김기술',
    repairType: 'preventive',
    completionStatus: 'completed',
    workDescription: '정기 점검 및 윤활유 교체 작업을 수행했습니다. 베어링 상태 확인 및 조정.',
    timeSpent: 2.5,
    testResults: '모든 테스트 통과. 정상 작동 확인.',
    notes: '다음 점검 시 벨트 교체 필요',
    completedAt: '2024-03-20T10:30:00'
  },
  {
    id: '2',
    equipmentId: 'CNC-LAT-003',
    technicianName: 'Nguyễn Văn A',
    repairType: 'corrective',
    completionStatus: 'completed',
    workDescription: 'Đã thay thế motor servo bị hỏng. Kiểm tra và điều chỉnh lại hệ thống.',
    timeSpent: 4.0,
    testResults: 'Thiết bị hoạt động bình thường sau khi sửa chữa.',
    completedAt: '2024-03-19T14:15:00'
  },
  {
    id: '3',
    equipmentId: 'CNC-DRL-005',
    technicianName: '박수리',
    repairType: 'emergency',
    completionStatus: 'partial',
    workDescription: '긴급 수리 진행. 메인 스핀들 베어링 교체 필요. 임시 조치 완료.',
    timeSpent: 3.5,
    testResults: '임시 조치로 제한적 작동 가능. 완전 수리 필요.',
    notes: '교체 부품 주문 중',
    completedAt: '2024-03-18T16:45:00'
  },
  {
    id: '4',
    equipmentId: 'CNC-GRD-002',
    technicianName: 'Trần Thị B',
    repairType: 'upgrade',
    completionStatus: 'completed',
    workDescription: 'Nâng cấp hệ thống điều khiển CNC lên phiên bản mới nhất.',
    timeSpent: 6.0,
    testResults: 'Nâng cấp thành công. Hiệu suất cải thiện 20%.',
    completedAt: '2024-03-17T11:00:00'
  },
  {
    id: '5',
    equipmentId: 'CNC-ML-004',
    technicianName: '이정비',
    repairType: 'preventive',
    completionStatus: 'failed',
    workDescription: '예방 정비 중 추가 문제 발견. 전문가 상담 필요.',
    timeSpent: 1.5,
    testResults: '정비 중단. 추가 진단 필요.',
    notes: '제조사 기술 지원 요청',
    completedAt: '2024-03-16T09:20:00'
  }
]

// [SRP] Rule: 수리 목록 컴포넌트 - 목록 표시와 필터링만 담당
export function RepairList({ onRepairClick }: RepairListProps) {
  const { t } = useTranslation(['repair'])
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // [SRP] Rule: 필터링된 수리 목록 계산 - 데이터 필터링만 담당
  const filteredRepairs = useMemo(() => {
    return mockRepairs.filter(repair => {
      const matchesType = filterType === 'all' || repair.repairType === filterType
      const matchesStatus = filterStatus === 'all' || repair.completionStatus === filterStatus
      const matchesSearch = searchTerm === '' || 
        repair.equipmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair.technicianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair.workDescription.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesType && matchesStatus && matchesSearch
    })
  }, [filterType, filterStatus, searchTerm])

  // [SRP] Rule: 통계 계산 - 수리 통계만 담당
  const statistics = useMemo(() => {
    return {
      total: mockRepairs.length,
      completed: mockRepairs.filter(r => r.completionStatus === 'completed').length,
      partial: mockRepairs.filter(r => r.completionStatus === 'partial').length,
      failed: mockRepairs.filter(r => r.completionStatus === 'failed').length,
      preventive: mockRepairs.filter(r => r.repairType === 'preventive').length,
      corrective: mockRepairs.filter(r => r.repairType === 'corrective').length,
      emergency: mockRepairs.filter(r => r.repairType === 'emergency').length,
      upgrade: mockRepairs.filter(r => r.repairType === 'upgrade').length
    }
  }, [])

  // [SRP] Rule: 수리 유형 색상 결정 - UI 스타일링만 담당
  const getRepairTypeColor = (type: string): 'success' | 'warning' | 'danger' | 'info' | 'secondary' => {
    switch (type) {
      case 'preventive': return 'success'
      case 'corrective': return 'warning'
      case 'emergency': return 'danger'
      case 'upgrade': return 'info'
      default: return 'secondary'
    }
  }

  // [SRP] Rule: 완료 상태 색상 결정 - UI 스타일링만 담당
  const getCompletionStatusColor = (status: string): 'success' | 'warning' | 'danger' => {
    switch (status) {
      case 'completed': return 'success'
      case 'partial': return 'warning'
      case 'failed': return 'danger'
      default: return 'warning'
    }
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{statistics.completed}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t('repair:list.statistics.completed')}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">{statistics.partial}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t('repair:list.statistics.partial')}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">{statistics.failed}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t('repair:list.statistics.failed')}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t('repair:list.totalRepairs', { count: statistics.total })}
          </div>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('repair:list.filters.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">{t('repair:list.filters.allTypes')}</option>
            <option value="preventive">{t('repair:repairTypes.preventive')}</option>
            <option value="corrective">{t('repair:repairTypes.corrective')}</option>
            <option value="emergency">{t('repair:repairTypes.emergency')}</option>
            <option value="upgrade">{t('repair:repairTypes.upgrade')}</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">{t('repair:list.filters.allStatus')}</option>
            <option value="completed">{t('repair:completionStatus.completed')}</option>
            <option value="partial">{t('repair:completionStatus.partial')}</option>
            <option value="failed">{t('repair:completionStatus.failed')}</option>
          </select>
        </div>
      </Card>

      {/* 수리 목록 테이블 */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('repair:list.columns.equipmentId')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('repair:list.columns.technician')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('repair:list.columns.type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('repair:list.columns.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('repair:list.columns.timeSpent')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('repair:list.columns.completedAt')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('repair:list.columns.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRepairs.length > 0 ? (
                filteredRepairs.map((repair) => (
                  <tr 
                    key={repair.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => onRepairClick(repair)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {repair.equipmentId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {repair.technicianName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge variant={getRepairTypeColor(repair.repairType)}>
                        {t(`repair:repairTypes.${repair.repairType}`)}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge variant={getCompletionStatusColor(repair.completionStatus)}>
                        {t(`repair:completionStatus.${repair.completionStatus}`)}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {repair.timeSpent}h
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(repair.completedAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(repair.completedAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRepairClick(repair)
                        }}
                      >
                        {t('repair:list.viewDetail')}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <p className="text-lg font-medium">{t('repair:list.noRepairs')}</p>
                      <p className="text-sm mt-2">{t('repair:list.noRepairsDescription')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}