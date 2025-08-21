'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Button, StatusBadge, Modal } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'
import { useUnifiedState } from '@/hooks/useUnifiedState'

// [SRP] Rule: 수리 보고서 인터페이스 정의 - 타입 정의만 담당
interface RepairReport {
  id: string
  equipmentId: string
  technicianName: string
  repairType: 'preventive' | 'corrective' | 'emergency' | 'upgrade'
  completionStatus: 'completed' | 'partial' | 'failed' | 'in_progress'
  workDescription: string
  timeSpent: number
  testResults?: string
  notes?: string
  completedAt: string
}

interface RepairListProps {
  onRepairClick: (repair: RepairReport) => void
}

// [SRP] Rule: 수리 목록 컴포넌트 - 목록 표시와 필터링만 담당
export function RepairList({ onRepairClick: _onRepairClick }: RepairListProps) {
  const { t } = useTranslation(['repair', 'common'])
  const { showSuccess, showError } = useToast()
  const { actions } = useUnifiedState()
  const [repairs, setRepairs] = useState<RepairReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // 모달 상태
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedRepair, setSelectedRepair] = useState<RepairReport | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<RepairReport>>({})

  // Supabase에서 수리 데이터 가져오기
  useEffect(() => {
    fetchRepairs()
  }, [])

  const fetchRepairs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('repair_reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Error fetching repairs:', fetchError)
        setError('수리 목록을 불러오는데 실패했습니다.')
        setRepairs([]) // 빈 배열로 설정하여 UI가 깨지지 않도록
        return
      }

      // Supabase 데이터를 컴포넌트 인터페이스에 맞게 변환
      const formattedRepairs: RepairReport[] = (data || []).map(repair => ({
        id: repair.id,
        equipmentId: repair.equipment_id || `EQUIP-${repair.id}`,
        technicianName: repair.technician_name || '미지정',
        repairType: repair.repair_type || '일반수리',
        completionStatus: repair.completion_status || repair.status || 'pending',
        workDescription: repair.work_description || repair.description || '수리 작업',
        timeSpent: repair.time_spent || repair.repair_time_hours || 0,
        testResults: repair.test_results || '테스트 완료',
        notes: repair.notes || repair.comment || '',
        completedAt: repair.completed_at || repair.created_at || new Date().toISOString()
      }))

      setRepairs(formattedRepairs)
    } catch (err) {
      console.error('Unexpected error fetching repairs:', err)
      setError('예상치 못한 오류가 발생했습니다.')
      setRepairs([]) // 에러 시에도 빈 배열로 설정
    } finally {
      setLoading(false)
    }
  }

  // [SRP] Rule: 필터링된 수리 목록 계산 - 데이터 필터링만 담당
  const filteredRepairs = useMemo(() => {
    return repairs.filter(repair => {
      const matchesType = filterType === 'all' || repair.repairType === filterType
      const matchesStatus = filterStatus === 'all' || repair.completionStatus === filterStatus
      const matchesSearch = searchTerm === '' || 
        repair.equipmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair.technicianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair.workDescription.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesType && matchesStatus && matchesSearch
    })
  }, [repairs, filterType, filterStatus, searchTerm])

  // [SRP] Rule: 통계 계산 - 수리 데이터 통계만 담당
  const statistics = useMemo(() => {
    return {
      total: repairs.length,
      completed: repairs.filter(r => r.completionStatus === 'completed').length,
      partial: repairs.filter(r => r.completionStatus === 'partial').length,
      failed: repairs.filter(r => r.completionStatus === 'failed').length,
      preventive: repairs.filter(r => r.repairType === 'preventive').length,
      corrective: repairs.filter(r => r.repairType === 'corrective').length,
      emergency: repairs.filter(r => r.repairType === 'emergency').length,
      upgrade: repairs.filter(r => r.repairType === 'upgrade').length
    }
  }, [repairs])

  const getCompletionStatusColor = (status: string): 'success' | 'warning' | 'danger' | 'secondary' => {
    switch (status) {
      case 'completed': return 'success'
      case 'partial': return 'warning'
      case 'failed': return 'danger'
      case 'in_progress': return 'secondary'
      default: return 'secondary'
    }
  }

  const getRepairTypeColor = (type: string): 'success' | 'warning' | 'danger' | 'secondary' => {
    switch (type) {
      case 'preventive': return 'success'
      case 'corrective': return 'warning'
      case 'emergency': return 'danger'
      case 'upgrade': return 'secondary'
      default: return 'secondary'
    }
  }

  // CRUD 핸들러들
  const handleViewDetails = (repair: RepairReport) => {
    setSelectedRepair(repair)
    setShowDetailsModal(true)
  }

  const handleEdit = (repair: RepairReport) => {
    setSelectedRepair(repair)
    setEditFormData({
      technicianName: repair.technicianName,
      repairType: repair.repairType,
      completionStatus: repair.completionStatus,
      workDescription: repair.workDescription,
      timeSpent: repair.timeSpent,
      testResults: repair.testResults,
      notes: repair.notes
    })
    setShowEditModal(true)
  }

  const handleDelete = (repair: RepairReport) => {
    setSelectedRepair(repair)
    setShowDeleteModal(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedRepair || !editFormData.technicianName || !editFormData.workDescription) {
      showError(
        t('common:messages.requiredFields'),
        t('common:messages.requiredFieldsDetail')
      )
      return
    }

    try {
      const { error } = await supabase
        .from('repair_reports')
        .update({
          technician_name: editFormData.technicianName,
          repair_type: editFormData.repairType,
          completion_status: editFormData.completionStatus,
          work_description: editFormData.workDescription,
          time_spent: editFormData.timeSpent,
          test_results: editFormData.testResults,
          notes: editFormData.notes
        })
        .eq('id', selectedRepair.id)

      if (error) {
        console.error('Error updating repair report:', error)
        showError(
          t('common:messages.updateFailed'),
          error.message
        )
        return
      }

      // 로컬 상태 업데이트
      setRepairs(prev => prev.map(repair => 
        repair.id === selectedRepair.id 
          ? { ...repair, ...editFormData as RepairReport }
          : repair
      ))

      // 통합 상태 관리를 통한 데이터 새로고침
      await actions.refreshBreakdowns()
      await actions.refreshEquipments()
      
      showSuccess(
        t('common:messages.updateSuccess'),
        `${editFormData.technicianName} - ${editFormData.workDescription}`
      )
      
      setShowEditModal(false)
      setSelectedRepair(null)
      setEditFormData({})
    } catch (err) {
      console.error('Unexpected error updating repair report:', err)
      showError(
        t('common:messages.updateFailed'),
        t('common:errors.unexpected')
      )
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedRepair) return

    try {
      const { error } = await supabase
        .from('repair_reports')
        .delete()
        .eq('id', selectedRepair.id)

      if (error) {
        console.error('Error deleting repair report:', error)
        showError(
          t('common:messages.deleteFailed'),
          error.message
        )
        return
      }

      // 로컬 상태에서 제거
      setRepairs(prev => prev.filter(repair => repair.id !== selectedRepair.id))
      
      showSuccess(
        t('common:messages.deleteSuccess'),
        `${selectedRepair.technicianName} - ${selectedRepair.workDescription}`
      )
      
      setShowDeleteModal(false)
      setSelectedRepair(null)
    } catch (err) {
      console.error('Unexpected error deleting repair report:', err)
      showError(
        t('common:messages.deleteFailed'),
        t('common:errors.unexpected')
      )
    }
  }

  if (loading) {
    return (
      <Card>
        <Card.Content className="text-center py-8">
          <div className="text-gray-500">{t('repair:loading')}</div>
        </Card.Content>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <Card.Content className="text-center py-8">
          <div className="text-red-500 mb-4">{error}</div>
          <Button onClick={fetchRepairs} variant="secondary">
            다시 시도
          </Button>
        </Card.Content>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
            <div className="text-sm text-gray-600">{t('repair:statistics.total')}</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-green-600">{statistics.completed}</div>
            <div className="text-sm text-gray-600">{t('repair:statistics.completed')}</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-yellow-600">{statistics.partial}</div>
            <div className="text-sm text-gray-600">{t('repair:statistics.partial')}</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-red-600">{statistics.failed}</div>
            <div className="text-sm text-gray-600">{t('repair:statistics.failed')}</div>
          </Card.Content>
        </Card>
      </div>

      {/* 필터 섹션 */}
      <Card>
        <Card.Header>
          <h3 className="text-lg font-semibold">{t('repair:filters.title')}</h3>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* 검색 */}
            <div>
              <label className="block text-sm font-medium mb-1">{t('repair:filters.search')}</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('repair:filters.searchPlaceholder')}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 수리 유형 필터 */}
            <div>
              <label className="block text-sm font-medium mb-1">{t('repair:filters.type')}</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">{t('repair:filters.all')}</option>
                <option value="preventive">{t('repair:types.preventive')}</option>
                <option value="corrective">{t('repair:types.corrective')}</option>
                <option value="emergency">{t('repair:types.emergency')}</option>
                <option value="upgrade">{t('repair:types.upgrade')}</option>
              </select>
            </div>

            {/* 완료 상태 필터 */}
            <div>
              <label className="block text-sm font-medium mb-1">{t('repair:filters.status')}</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">{t('repair:filters.all')}</option>
                <option value="completed">{t('repair:status.completed')}</option>
                <option value="partial">{t('repair:status.partial')}</option>
                <option value="failed">{t('repair:status.failed')}</option>
                <option value="in_progress">{t('repair:status.inProgress')}</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {t('repair:showing')} {filteredRepairs.length} / {repairs.length}
            </div>
            <Button onClick={fetchRepairs} variant="secondary" size="sm">
              🔄 {t('common:actions.refresh')}
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* 수리 목록 */}
      <Card>
        <Card.Header>
          <h3 className="text-lg font-semibold">{t('repair:list.title')}</h3>
        </Card.Header>
        <Card.Content>
          {filteredRepairs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                {repairs.length === 0 ? t('repair:list.empty') : t('repair:list.noResults')}
              </div>
              {repairs.length === 0 && (
                <Button onClick={() => {/* Navigate to repair form */}} variant="primary">
                  {t('repair:list.addFirst')}
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('repair:fields.equipmentId')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('repair:technician')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('repair:fields.repairType')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('repair:fields.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('repair:timeSpent')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('repair:fields.completedAt')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('common:actions.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRepairs.map((repair) => (
                    <tr key={repair.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
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
                          {t(`repair:types.${repair.repairType}`)}
                        </StatusBadge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge variant={getCompletionStatusColor(repair.completionStatus)}>
                          {t(`repair:status.${repair.completionStatus}`)}
                        </StatusBadge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {repair.timeSpent}시간
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {new Date(repair.completedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(repair)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title={t('common:actions.viewDetails')}
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleEdit(repair)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title={t('common:actions.editItem')}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(repair)}
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
          )}
        </Card.Content>
      </Card>

      {/* 상세보기 모달 */}
      {showDetailsModal && selectedRepair && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedRepair(null)
          }}
          title={t('common:modals.viewDetails')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('repair:fields.equipmentId')}
              </label>
              <p className="text-gray-900 dark:text-white">{selectedRepair.equipmentId}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('repair:technician')}
              </label>
              <p className="text-gray-900 dark:text-white">{selectedRepair.technicianName}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('repair:fields.repairType')}
              </label>
              <StatusBadge variant={getRepairTypeColor(selectedRepair.repairType)}>
                {t(`repair:types.${selectedRepair.repairType}`)}
              </StatusBadge>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('repair:fields.status')}
              </label>
              <StatusBadge variant={getCompletionStatusColor(selectedRepair.completionStatus)}>
                {t(`repair:status.${selectedRepair.completionStatus}`)}
              </StatusBadge>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('repair:fields.workDescription')}
              </label>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedRepair.workDescription}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('repair:timeSpent')}
              </label>
              <p className="text-gray-900 dark:text-white">{selectedRepair.timeSpent}시간</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('repair:fields.testResults')}
              </label>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedRepair.testResults || '-'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('repair:fields.notes')}
              </label>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedRepair.notes || '-'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('repair:fields.completedAt')}
              </label>
              <p className="text-gray-900 dark:text-white">
                {new Date(selectedRepair.completedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* 편집 모달 */}
      {showEditModal && selectedRepair && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedRepair(null)
            setEditFormData({})
          }}
          title={t('common:modals.editItem')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('repair:technician')} *
              </label>
              <input
                type="text"
                value={editFormData.technicianName || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, technicianName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('repair:fields.repairType')}
              </label>
              <select
                value={editFormData.repairType || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, repairType: e.target.value as RepairReport['repairType'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="preventive">{t('repair:types.preventive')}</option>
                <option value="corrective">{t('repair:types.corrective')}</option>
                <option value="emergency">{t('repair:types.emergency')}</option>
                <option value="upgrade">{t('repair:types.upgrade')}</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('repair:fields.status')}
              </label>
              <select
                value={editFormData.completionStatus || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, completionStatus: e.target.value as RepairReport['completionStatus'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="completed">{t('repair:status.completed')}</option>
                <option value="partial">{t('repair:status.partial')}</option>
                <option value="failed">{t('repair:status.failed')}</option>
                <option value="in_progress">{t('repair:status.inProgress')}</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('repair:fields.workDescription')} *
              </label>
              <textarea
                value={editFormData.workDescription || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, workDescription: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('repair:timeSpent')}
              </label>
              <input
                type="number"
                value={editFormData.timeSpent || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, timeSpent: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('repair:fields.testResults')}
              </label>
              <textarea
                value={editFormData.testResults || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, testResults: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('repair:fields.notes')}
              </label>
              <textarea
                value={editFormData.notes || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedRepair(null)
                  setEditFormData({})
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
      {showDeleteModal && selectedRepair && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedRepair(null)
          }}
          title={t('common:modals.deleteConfirm')}
        >
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              {t('common:modals.deleteConfirmMessage')}
            </p>
            
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('repair:fields.equipmentId')}: <span className="font-medium text-gray-900 dark:text-white">{selectedRepair.equipmentId}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('repair:technician')}: <span className="font-medium text-gray-900 dark:text-white">{selectedRepair.technicianName}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('repair:fields.completedAt')}: <span className="font-medium text-gray-900 dark:text-white">{new Date(selectedRepair.completedAt).toLocaleDateString()}</span>
              </p>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedRepair(null)
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
}