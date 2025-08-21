'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Button, Input, Card } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { BreakdownStatus, BREAKDOWN_STATUS_LABELS } from '@/types/breakdown'

// [SRP] Rule: 수리 보고서 타입 정의 - 데이터 구조만 담당
interface RepairReport {
  equipmentId: string
  technicianName: string
  technicianId?: string
  repairType: 'preventive' | 'corrective' | 'emergency' | 'upgrade'
  completionStatus: 'completed' | 'partial' | 'failed'
  workDescription: string
  timeSpent: number
  testResults: string
  notes?: string
}

// [SRP] Rule: 수리 대상 설비 타입 정의 - 데이터 구조만 담당
interface Equipment {
  id: string
  equipment_number: string
  equipment_name: string
  category: string
  location: string
  breakdown_id: string // 고장 신고 ID 추가
  breakdown_title: string // 고장 제목 추가
  status: BreakdownStatus // 상태 정보 추가
}

interface RepairReportFormProps {
  onSubmit?: (report: RepairReport) => void
  onCancel?: () => void
}


// [SRP] Rule: 수리 완료 폼 컴포넌트 - 폼 렌더링과 검증만 담당
export function RepairReportForm({ onSubmit, onCancel }: RepairReportFormProps) {
  const { showSuccess, showError } = useToast()
  const { t } = useTranslation(['repair', 'common'])
  // SystemSettings context available but not needed for current implementation
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([])
  const [availableUsers, setAvailableUsers] = useState<Array<{id: string, full_name: string}>>([])
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('')

  // [OCP] Rule: 기본 폼 데이터를 초기화하되, 새로운 필드 추가에 열려있음
  const [formData, setFormData] = useState<Partial<RepairReport>>({
    equipmentId: '',
    technicianName: '',
    repairType: 'corrective',
    completionStatus: 'completed',
    workDescription: '',
    timeSpent: 0,
    testResults: '',
    notes: ''
  })

  // 컴포넌트 로드 시 수리 완료 상태가 아닌 고장 설비 목록 가져오기
  useEffect(() => {
    const fetchBrokenEquipment = async () => {
      try {
        // '신고 접수' 또는 '수리중' 상태인 고장 설비들을 가져오기
        const { data, error } = await supabase
          .from('breakdown_reports')
          .select(`
            id,
            breakdown_title,
            status,
            equipment_info!inner(
              id,
              equipment_number,
              equipment_name,
              category,
              location
            )
          `)
          .in('status', [BreakdownStatus.REPORTED, BreakdownStatus.IN_PROGRESS]) // '신고 접수' 또는 '수리중' 상태만
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching broken equipment:', error)
          console.error('Error details:', JSON.stringify(error, null, 2))
          showError('고장 설비 조회 실패', `고장 설비 목록을 불러오는데 실패했습니다: ${error.message || 'Unknown error'}`)
          return
        }

        // 중복 제거 후 설비 정보만 추출
        const uniqueEquipment: Equipment[] = []
        data?.forEach((item: any) => {
          const equipment = Array.isArray(item.equipment_info) ? item.equipment_info[0] : item.equipment_info
          if (equipment && !uniqueEquipment.find(eq => eq.id === equipment.id)) {
            uniqueEquipment.push({
              id: equipment.id,
              equipment_number: equipment.equipment_number,
              equipment_name: equipment.equipment_name,
              category: equipment.category,
              location: equipment.location,
              breakdown_id: item.id,
              breakdown_title: item.breakdown_title || '고장 신고',
              status: item.status as BreakdownStatus
            })
          }
        })

        setAvailableEquipment(uniqueEquipment)
      } catch (err) {
        console.error('Unexpected error fetching broken equipment:', err)
        console.error('Error details:', JSON.stringify(err, null, 2))
        showError('고장 설비 조회 실패', `예상치 못한 오류가 발생했습니다: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    fetchBrokenEquipment()
    fetchUsers()
  }, [])

  // 사용자 목록 가져오기
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

  // [SRP] Rule: 수리 유형 옵션 계산 - 번역된 수리 유형만 담당
  const repairTypeOptions = useMemo(() => [
    { value: 'corrective', label: t('repair:repairTypes.corrective') },
    { value: 'preventive', label: t('repair:repairTypes.preventive') },
    { value: 'emergency', label: t('repair:repairTypes.emergency') },
    { value: 'upgrade', label: t('repair:repairTypes.upgrade') }
  ], [t])

  // [SRP] Rule: 완료 상태 옵션 계산 - 번역된 완료 상태만 담당
  const completionStatusOptions = useMemo(() => [
    { 
      value: 'completed', 
      label: t('repair:completionStatus.completed'), 
      color: 'text-green-600' 
    },
    { 
      value: 'partial', 
      label: t('repair:completionStatus.partial'), 
      color: 'text-yellow-600' 
    },
    { 
      value: 'failed', 
      label: t('repair:completionStatus.failed'), 
      color: 'text-red-600' 
    }
  ], [t])

  const selectedEquipment = availableEquipment.find(eq => eq.id === formData.equipmentId)

  // [SRP] Rule: 폼 검증 로직 - 입력값 유효성 검사만 담당
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.equipmentId) {
      newErrors.equipmentId = t('repair:validation.equipmentIdRequired')
    }
    if (!selectedTechnicianId) {
      newErrors.technicianName = t('repair:validation.technicianNameRequired')
    }
    if (!formData.workDescription?.trim()) {
      newErrors.workDescription = t('repair:validation.workDescriptionRequired')
    }
    if (!formData.testResults?.trim()) {
      newErrors.testResults = t('repair:validation.testResultsRequired')
    }
    if (!formData.timeSpent || formData.timeSpent <= 0) {
      newErrors.timeSpent = t('repair:validation.timeSpentRequired')
    } else if (isNaN(formData.timeSpent)) {
      newErrors.timeSpent = t('repair:validation.timeSpentInvalid')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // [SRP] Rule: 폼 제출 처리 - 제출 로직만 담당
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    
    try {
      const reportData: RepairReport = formData as RepairReport
      const selectedUser = availableUsers.find(u => u.id === selectedTechnicianId)

      // 1. 수리 완료 정보를 repair_reports 테이블에 저장
      const { data: repairData, error: repairError } = await supabase
        .from('repair_reports')
        .insert({
          equipment_id: formData.equipmentId,
          technician_id: selectedTechnicianId,
          technician_name: selectedUser?.full_name || '',
          repair_type: formData.repairType,
          completion_status: formData.completionStatus,
          work_description: formData.workDescription,
          time_spent: formData.timeSpent,
          test_results: formData.testResults,
          notes: formData.notes || '',
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (repairError) {
        console.error('Error saving repair report:', repairError)
        throw repairError
      }

      // 2. 완료 상태가 'completed'인 경우에만 고장 신고 상태를 업데이트
      if (formData.completionStatus === 'completed') {
        const { error: updateError } = await supabase
          .from('breakdown_reports')
          .update({ 
            status: BreakdownStatus.COMPLETED,
            updated_at: new Date().toISOString()
          })
          .eq('equipment_id', formData.equipmentId)
          .neq('status', BreakdownStatus.COMPLETED) // 이미 완료된 것은 제외

        if (updateError) {
          console.error('Error updating breakdown status:', updateError)
          // 수리 보고서는 저장되었지만 상태 업데이트에 실패한 경우
          console.warn('Repair report saved but breakdown status update failed')
        }
      }

      console.log('수리 완료 보고 저장 성공:', repairData)
      
      onSubmit?.(reportData)
      
      showSuccess(
        t('repair:messages.repairSuccess'),
        t('repair:messages.repairSuccessWithEquipment', { 
          equipmentId: selectedEquipment?.equipment_number || reportData.equipmentId 
        })
      )
      
    } catch (error) {
      console.error('수리 완료 보고 제출 실패:', error)
      showError(
        t('repair:messages.repairError'),
        t('repair:messages.repairErrorDetail')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <Card.Header>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('repair:form.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('repair:form.description')}
          </p>
        </Card.Header>
        
        <Card.Content>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. 설비 ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('repair:form.equipmentId')} <span className="text-red-500">{t('repair:form.required')}</span>
              </label>
              <select
                value={formData.equipmentId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, equipmentId: e.target.value }))}
                className={`block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.equipmentId 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              >
                <option value="">{t('repair:form.selectEquipment')}</option>
                {availableEquipment.length > 0 ? (
                  availableEquipment.map(equipment => (
                    <option key={equipment.id} value={equipment.id}>
                      {equipment.equipment_number} - {equipment.equipment_name} [{BREAKDOWN_STATUS_LABELS[equipment.status]}] - {equipment.breakdown_title}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>{t('repair:form.noAvailableEquipment', '수리할 고장 설비가 없습니다')}</option>
                )}
              </select>
              {errors.equipmentId && <p className="mt-1 text-sm text-red-600">{errors.equipmentId}</p>}
              {availableEquipment.length === 0 && (
                <p className="mt-1 text-sm text-amber-600">
                  {t('repair:messages.noBreakdownEquipment', '현재 수리가 필요한 고장 신고된 설비가 없습니다.')}
                </p>
              )}
            </div>

            {/* 2. 담당자 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('repair:form.technicianName')} <span className="text-red-500">{t('repair:form.required')}</span>
              </label>
              <select
                value={selectedTechnicianId}
                onChange={(e) => {
                  setSelectedTechnicianId(e.target.value)
                  const selectedUser = availableUsers.find(u => u.id === e.target.value)
                  setFormData(prev => ({ ...prev, technicianName: selectedUser?.full_name || '' }))
                }}
                className={`block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.technicianName 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              >
                <option value="">{t('repair:form.selectTechnician')}</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
              {errors.technicianName && <p className="mt-1 text-sm text-red-600">{errors.technicianName}</p>}
            </div>

            {/* 3. 수리유형 및 4. 완료상태 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('repair:form.repairType')} <span className="text-red-500">{t('repair:form.required')}</span>
                </label>
                <select
                  value={formData.repairType || 'corrective'}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    repairType: e.target.value as 'preventive' | 'corrective' | 'emergency' | 'upgrade' 
                  }))}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {repairTypeOptions.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('repair:form.completionStatus')} <span className="text-red-500">{t('repair:form.required')}</span>
                </label>
                <select
                  value={formData.completionStatus || 'completed'}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    completionStatus: e.target.value as 'completed' | 'partial' | 'failed' 
                  }))}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {completionStatusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 5. 수행한 작업 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('repair:form.workDescription')} <span className="text-red-500">{t('repair:form.required')}</span>
              </label>
              <textarea
                value={formData.workDescription || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, workDescription: e.target.value }))}
                placeholder={t('repair:form.workDescriptionPlaceholder')}
                rows={4}
                className={`block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 resize-none ${
                  errors.workDescription 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              />
              {errors.workDescription && <p className="mt-1 text-sm text-red-600">{errors.workDescription}</p>}
            </div>

            {/* 6. 작업시간 */}
            <div>
              <Input
                label={t('repair:form.timeSpent')}
                type="number"
                value={formData.timeSpent?.toString() || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, timeSpent: parseFloat(e.target.value) || 0 }))}
                placeholder={t('repair:form.timeSpentPlaceholder')}
                required
                error={errors.timeSpent}
                min="0"
                step="0.5"
              />
            </div>

            {/* 7. 테스트 결과 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('repair:form.testResults')} <span className="text-red-500">{t('repair:form.required')}</span>
              </label>
              <textarea
                value={formData.testResults || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, testResults: e.target.value }))}
                placeholder={t('repair:form.testResultsPlaceholder')}
                rows={3}
                className={`block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 resize-none ${
                  errors.testResults 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              />
              {errors.testResults && <p className="mt-1 text-sm text-red-600">{errors.testResults}</p>}
            </div>

            {/* 8. 추가 참고사항 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('repair:form.notes')}
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('repair:form.notesPlaceholder')}
                rows={3}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              {onCancel && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onCancel}
                  disabled={loading}
                >
                  {t('repair:form.cancel')}
                </Button>
              )}
              <Button
                type="submit"
                loading={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? t('repair:form.submitting') : t('repair:form.submit')}
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </div>
  )
}