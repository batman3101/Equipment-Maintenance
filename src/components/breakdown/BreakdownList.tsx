'use client'

import React, { useState, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Card, StatusBadge, Modal, Button } from '@/components/ui'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'
import { apiService } from '@/lib/api/unified-api-service'
import { useAsyncOperation } from '@/hooks/useAsyncOperation'
import { useComponentError } from '@/contexts/ErrorContext'
import { BreakdownReport, BreakdownListProps, BreakdownListRef, BreakdownStatus, BREAKDOWN_STATUS_LABELS } from '@/types/breakdown'


const getPriorityColor = (priority: string): 'success' | 'warning' | 'danger' | 'secondary' => {
  switch (priority) {
    case 'low': return 'success'
    case 'medium': return 'warning'
    case 'high': return 'danger'
    case 'urgent': return 'danger'
    default: return 'secondary'
  }
}

const getStatusColor = (status: string): 'secondary' | 'info' | 'warning' | 'success' | 'danger' => {
  switch (status) {
    case BreakdownStatus.REPORTED: return 'danger'
    case BreakdownStatus.IN_PROGRESS: return 'warning'  
    case BreakdownStatus.COMPLETED: return 'success'
    default: return 'secondary'
  }
}


export const BreakdownList = forwardRef<BreakdownListRef, BreakdownListProps>(({ onReportClick: _onReportClick }, ref) => {
  const { t } = useTranslation(['breakdown', 'common'])
  const { showSuccess, showError } = useToast()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  
  // 비동기 작업 및 에러 처리
  const asyncFetchReports = useAsyncOperation(
    async () => {
      console.log('[BreakdownList] 고장 신고 데이터 로드 시작...')
      const apiResponse = await apiService.getBreakdownReports()
      
      if (!apiResponse.success) {
        throw new Error(apiResponse.error || '고장 신고 데이터를 가져오는데 실패했습니다.')
      }
      
      const data = apiResponse.data || []
      console.log('[BreakdownList] 로드된 고장 신고 데이터:', data.length, '건')

      // API 데이터를 컴포넌트 인터페이스에 맞게 변환
      const formattedReports: BreakdownReport[] = (data || []).map((report: any) => {
        const assigneeName = report.profiles_assigned?.full_name || 
                             (Array.isArray(report.profiles_assigned) && report.profiles_assigned[0]?.full_name) ||
                             '담당자 미지정'
        
        const cleanDescription = report.breakdown_description?.replace(/\[신고자:\s*.+?\]\n\n/, '') || ''
        
        return {
          id: report.id,
          equipmentId: report.equipment_id,
          equipmentCategory: report.equipment_info?.category || '',
          equipmentNumber: report.equipment_info?.equipment_number || '',
          breakdownTitle: report.breakdown_title,
          breakdownDescription: cleanDescription,
          breakdownType: report.breakdown_type as 'mechanical' | 'electrical' | 'software' | 'safety' | 'other',
          priority: report.priority as 'low' | 'medium' | 'high' | 'critical',
          assignedTo: assigneeName,
          assignedToId: report.assigned_to,
          urgencyLevel: report.priority as 'low' | 'medium' | 'high' | 'critical',
          issueType: report.breakdown_type as 'mechanical' | 'electrical' | 'software' | 'safety' | 'other',
          description: cleanDescription,
          symptoms: report.symptoms,
          status: report.status,
          occurredAt: report.occurred_at,
          createdAt: report.created_at,
          updatedAt: report.updated_at
        }
      })

      return formattedReports
    },
    {
      maxRetries: 3,
      retryDelay: 1000,
      componentId: 'breakdown-list',
      onSuccess: () => {
        console.log('[BreakdownList] 데이터 로드 성공')
      },
      onError: (error) => {
        console.error('[BreakdownList] 데이터 로드 실패:', error)
        showError('고장 신고 목록을 불러오는데 실패했습니다.')
      }
    }
  )
  
  const reports = asyncFetchReports.data || []
  const loading = asyncFetchReports.loading
  const error = asyncFetchReports.error
  
  // 모달 상태
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<BreakdownReport | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<BreakdownReport>>({})
  const [availableUsers, setAvailableUsers] = useState<Array<{id: string, full_name: string}>>([])
  const [editAssigneeId, setEditAssigneeId] = useState<string>('')

  // ref를 통해 외부에서 refreshData 호출 가능
  useImperativeHandle(ref, () => ({
    refreshData: async () => {
      await asyncFetchReports.execute()
    }
  }))

  // 초기 로드
  useEffect(() => {
    asyncFetchReports.execute()
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name')

      if (error) {
        console.error('Error fetching users:', error)
        return
      }

      setAvailableUsers(data || [])
    } catch (err) {
      console.error('Unexpected error fetching users:', err)
    }
  }

  // 🔥 설비 상태 자동 동기화 함수
  const updateEquipmentStatus = async (equipmentId: string, breakdownStatus: string, breakdownId: string) => {
    try {
      console.log('updateEquipmentStatus 호출됨:', { equipmentId, breakdownStatus, breakdownId })
      let equipmentStatus = 'running' // 기본값
      let statusReason = ''

      // 고장 신고 상태에 따라 설비 상태 결정
      switch (breakdownStatus) {
        case 'reported':
        case 'in_progress':
          equipmentStatus = 'breakdown'
          statusReason = `고장 신고 진행중 (ID: ${breakdownId})`
          break
        case 'completed':
          // 해당 설비의 다른 활성 고장 신고가 있는지 확인
          const { data: otherActiveBreakdowns } = await supabase
            .from('breakdown_reports')
            .select('id')
            .eq('equipment_id', equipmentId)
            .in('status', ['reported', 'in_progress'])
            .neq('id', breakdownId)

          if (otherActiveBreakdowns && otherActiveBreakdowns.length > 0) {
            equipmentStatus = 'breakdown'
            statusReason = `기타 고장 신고 진행중`
          } else {
            equipmentStatus = 'running'
            statusReason = `고장 수리 완료 (ID: ${breakdownId})`
          }
          break
      }

      // 설비 상태 업데이트
      console.log('설비 상태 업데이트 시도:', {
        equipment_id: equipmentId,
        status: equipmentStatus,
        status_reason: statusReason,
        breakdown_status: breakdownStatus
      })
      
      const { data: updateResult, error: statusError } = await supabase
        .from('equipment_status')
        .upsert({
          equipment_id: equipmentId,
          status: equipmentStatus,
          status_reason: statusReason,
          status_changed_at: new Date().toISOString(),
          notes: `고장 신고 상태 동기화: ${breakdownStatus}`
        })
        .select()

      if (statusError) {
        console.error('설비 상태 업데이트 실패:', statusError)
      } else {
        console.log('설비 상태 업데이트 성공:', updateResult)
        console.log(`설비 ${equipmentId} 상태가 ${equipmentStatus}로 업데이트됨`)
      }
    } catch (err) {
      console.error('설비 상태 동기화 오류:', err)
    }
  }


  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      if (statusFilter !== 'all' && report.status !== statusFilter) return false
      if (priorityFilter !== 'all' && report.urgencyLevel !== priorityFilter) return false
      return true
    })
  }, [reports, statusFilter, priorityFilter])

  const statusCounts = useMemo(() => {
    return reports.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [reports])

  // CRUD 핸들러들
  const handleViewDetails = (report: BreakdownReport) => {
    setSelectedReport(report)
    setShowDetailsModal(true)
  }

  const handleEdit = (report: BreakdownReport) => {
    setSelectedReport(report)
    setEditFormData({
      breakdownTitle: report.breakdownTitle,
      breakdownDescription: report.breakdownDescription,
      breakdownType: report.breakdownType,
      priority: report.priority,
      status: report.status,
      assignedTo: report.assignedTo,
      symptoms: report.symptoms
    })
    setEditAssigneeId(report.assignedToId || '')
    setShowEditModal(true)
  }

  const handleDelete = (report: BreakdownReport) => {
    setSelectedReport(report)
    setShowDeleteModal(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedReport || !editFormData.breakdownTitle || !editFormData.breakdownDescription) {
      showError(
        t('common:messages.requiredFields'),
        t('common:messages.requiredFieldsDetail')
      )
      return
    }

    try {
      const { error } = await supabase
        .from('breakdown_reports')
        .update({
          breakdown_title: editFormData.breakdownTitle,
          breakdown_description: editFormData.breakdownDescription,
          breakdown_type: editFormData.breakdownType,
          priority: editFormData.priority,
          status: editFormData.status,
          assigned_to: editAssigneeId || null,
          symptoms: editFormData.symptoms,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedReport.id)

      if (error) {
        console.error('Error updating breakdown report:', error)
        showError(
          t('common:messages.updateFailed'),
          error.message
        )
        return
      }

      // 🔥 고장 신고 상태 변경 시 설비 상태도 자동 동기화
      if (editFormData.status && editFormData.status !== selectedReport.status) {
        console.log('상태 변경 감지:', {
          이전상태: selectedReport.status,
          새상태: editFormData.status,
          설비ID: selectedReport.equipmentId,
          신고ID: selectedReport.id
        })
        await updateEquipmentStatus(selectedReport.equipmentId, editFormData.status, selectedReport.id)
      }

      // 데이터 새로고침
      await asyncFetchReports.execute()
      
      showSuccess(
        t('common:messages.updateSuccess'),
        `${editFormData.breakdownTitle}`
      )
      
      setShowEditModal(false)
      setSelectedReport(null)
      setEditFormData({})
      setEditAssigneeId('')
    } catch (err) {
      console.error('Unexpected error updating breakdown report:', err)
      showError(
        t('common:messages.updateFailed'),
        t('common:errors.unexpected')
      )
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedReport) return

    try {
      const { error } = await supabase
        .from('breakdown_reports')
        .delete()
        .eq('id', selectedReport.id)

      if (error) {
        console.error('Error deleting breakdown report:', error)
        showError(
          t('common:messages.deleteFailed'),
          error.message
        )
        return
      }

      // 데이터 새로고침
      await asyncFetchReports.execute()
      
      showSuccess(
        t('common:messages.deleteSuccess'),
        `${selectedReport.breakdownTitle}`
      )
      
      setShowDeleteModal(false)
      setSelectedReport(null)
    } catch (err) {
      console.error('Unexpected error deleting breakdown report:', err)
      showError(
        t('common:messages.deleteFailed'),
        t('common:errors.unexpected')
      )
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <Card.Content className="text-center py-8">
            <div className="text-gray-500">고장 신고 목록을 불러오는 중...</div>
          </Card.Content>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <Card.Content className="text-center py-8">
            <div className="text-red-500 mb-4">{error}</div>
            <button 
              onClick={() => asyncFetchReports.execute()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              다시 시도
            </button>
          </Card.Content>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 통계 요약 - 3개 상태만 표시 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-red-600">
              {statusCounts[BreakdownStatus.REPORTED] || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('breakdown:status.reported')}</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-yellow-600">
              {statusCounts[BreakdownStatus.IN_PROGRESS] || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('breakdown:status.in_progress')}</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-green-600">
              {statusCounts[BreakdownStatus.COMPLETED] || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('breakdown:status.completed')}</div>
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
                <option value={BreakdownStatus.REPORTED}>{t('breakdown:status.reported')}</option>
                <option value={BreakdownStatus.IN_PROGRESS}>{t('breakdown:status.in_progress')}</option>
                <option value={BreakdownStatus.COMPLETED}>{t('breakdown:status.completed')}</option>
              </select>
              
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="block w-auto rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">{t('breakdown:list.filters.allUrgency')}</option>
                <option value="urgent">{t('breakdown:urgency.urgent')}</option>
                <option value="high">{t('breakdown:urgency.high')}</option>
                <option value="medium">{t('breakdown:urgency.medium')}</option>
                <option value="low">{t('breakdown:urgency.low')}</option>
              </select>
            </div>
          </div>
        </Card.Header>
        
        <Card.Content>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('breakdown:list.breakdownTitle')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('breakdown:list.equipmentId')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('breakdown:list.priority')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('breakdown:list.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    담당자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('breakdown:list.reportedAt')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('common:actions.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {report.breakdownTitle}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {report.equipmentNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge variant={getPriorityColor(report.priority || report.urgencyLevel)}>
                        {t(`breakdown:urgency.${report.priority || report.urgencyLevel}`, report.priority || report.urgencyLevel)}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge variant={getStatusColor(report.status)}>
                        {t(`breakdown:status.${report.status}`, report.status)}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {report.assignedTo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {report.occurredAt ? new Date(report.occurredAt).toLocaleDateString() : '정보 없음'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(report)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title={t('common:actions.viewDetails')}
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => handleEdit(report)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title={t('common:actions.editItem')}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(report)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title={t('common:actions.deleteItem')}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
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
        </Card.Content>
      </Card>

      {/* 상세보기 모달 */}
      {showDetailsModal && selectedReport && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedReport(null)
          }}
          title={t('common:modals.viewDetails')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('breakdown:list.breakdownTitle')}
              </label>
              <p className="text-gray-900 dark:text-white">{selectedReport.breakdownTitle}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('breakdown:list.equipmentId')}
              </label>
              <p className="text-gray-900 dark:text-white">{selectedReport.equipmentNumber}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('breakdown:list.description')}
              </label>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedReport.breakdownDescription}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('breakdown:list.symptoms')}
              </label>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedReport.symptoms || '-'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('breakdown:list.type')}
              </label>
              <p className="text-gray-900 dark:text-white">{selectedReport.breakdownType || '-'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('breakdown:list.priority')}
              </label>
              <StatusBadge variant={getPriorityColor(selectedReport.priority || selectedReport.urgencyLevel)}>
                {t(`breakdown:urgency.${selectedReport.priority || selectedReport.urgencyLevel}`, selectedReport.priority || selectedReport.urgencyLevel)}
              </StatusBadge>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('breakdown:list.status')}
              </label>
              <StatusBadge variant={getStatusColor(selectedReport.status)}>
                {t(`breakdown:status.${selectedReport.status}`, selectedReport.status)}
              </StatusBadge>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                담당자
              </label>
              <p className="text-gray-900 dark:text-white">{selectedReport.assignedTo}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('breakdown:list.reportedAt')}
              </label>
              <p className="text-gray-900 dark:text-white">
                {selectedReport.occurredAt ? new Date(selectedReport.occurredAt).toLocaleString() : '정보 없음'}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* 편집 모달 */}
      {showEditModal && selectedReport && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedReport(null)
            setEditFormData({})
            setEditAssigneeId('')
          }}
          title={t('common:modals.editItem')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('breakdown:list.breakdownTitle')} *
              </label>
              <input
                type="text"
                value={editFormData.breakdownTitle || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, breakdownTitle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('breakdown:list.description')} *
              </label>
              <textarea
                value={editFormData.breakdownDescription || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, breakdownDescription: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('breakdown:list.symptoms')}
              </label>
              <textarea
                value={editFormData.symptoms || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('breakdown:list.type')}
              </label>
              <select
                value={editFormData.breakdownType || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, breakdownType: e.target.value as 'mechanical' | 'electrical' | 'software' | 'safety' | 'other' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">선택하세요</option>
                <option value="mechanical">기계적</option>
                <option value="electrical">전기적</option>
                <option value="software">소프트웨어</option>
                <option value="safety">안전</option>
                <option value="other">기타</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('breakdown:list.priority')}
              </label>
              <select
                value={editFormData.priority || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, priority: e.target.value as BreakdownReport['priority'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="low">{t('breakdown:urgency.low')}</option>
                <option value="medium">{t('breakdown:urgency.medium')}</option>
                <option value="high">{t('breakdown:urgency.high')}</option>
                <option value="urgent">{t('breakdown:urgency.urgent')}</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('breakdown:list.status')}
              </label>
              <select
                value={editFormData.status || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value as BreakdownReport['status'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="reported">신고 접수</option>
                <option value="in_progress">수리 중</option>
                <option value="completed">수리 완료</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('breakdown:list.assignee')}
              </label>
              <select
                value={editAssigneeId}
                onChange={(e) => setEditAssigneeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">{t('breakdown:form.assigneePlaceholder')}</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedReport(null)
                  setEditFormData({})
                  setEditAssigneeId('')
                }}
              >
                {t('common:actions.cancel')}
              </Button>
              <Button onClick={handleSaveEdit}>
                {t('common:actions.save')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && selectedReport && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedReport(null)
          }}
          title={t('common:modals.deleteConfirm')}
        >
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              {t('common:modals.deleteConfirmMessage')}
            </p>
            
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('breakdown:list.breakdownTitle')}: <span className="font-medium text-gray-900 dark:text-white">{selectedReport.breakdownTitle}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('breakdown:list.equipmentId')}: <span className="font-medium text-gray-900 dark:text-white">{selectedReport.equipmentNumber}</span>
              </p>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedReport(null)
                }}
              >
                {t('common:actions.cancel')}
              </Button>
              <Button
                variant="error"
                onClick={handleConfirmDelete}
              >
                {t('common:actions.delete')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
})

BreakdownList.displayName = 'BreakdownList'