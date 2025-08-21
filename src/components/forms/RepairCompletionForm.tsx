'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Button, Input, Card } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

// [SRP] Rule: 수리 완료 보고서 타입 정의 - 데이터 구조만 담당
interface RepairCompletionReport {
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

// [SRP] Rule: API 응답 타입 정의 - 데이터 구조만 담당
interface BreakdownEquipment {
  id: string
  equipment_name: string
  equipment_number: string
  category: string
  location: string
  breakdown_report_id: string
  breakdown_title: string
  breakdown_status: string
  urgency_level: string
  occurred_at: string
  display_text: string
}

interface RepairCompletionFormProps {
  onSubmit?: (report: RepairCompletionReport) => void
  onCancel?: () => void
  onSuccess?: () => void
}

// [SRP] Rule: 수리 완료 폼 컴포넌트 - 폼 렌더링과 검증만 담당
export function RepairCompletionForm({ onSubmit, onCancel, onSuccess }: RepairCompletionFormProps) {
  const { showSuccess, showError } = useToast()
  const { t } = useTranslation(['repair', 'common'])
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [availableEquipment, setAvailableEquipment] = useState<BreakdownEquipment[]>([])
  const [availableUsers, setAvailableUsers] = useState<Array<{id: string, full_name: string}>>([])
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('')

  // [OCP] Rule: 기본 폼 데이터를 초기화하되, 새로운 필드 추가에 열려있음
  const [formData, setFormData] = useState<Partial<RepairCompletionReport>>({
    equipmentId: '',
    technicianName: '',
    repairType: 'corrective',
    completionStatus: 'completed',
    workDescription: '',
    timeSpent: 0,
    testResults: '',
    notes: ''
  })

  // [DIP] Rule: API 서비스를 추상화하여 의존성 역전
  const fetchBreakdownEquipment = async (): Promise<BreakdownEquipment[]> => {
    try {
      const response = await fetch('/api/equipment/breakdown', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'API 응답 오류')
      }

      return result.data || []
    } catch (error) {
      console.error('Error fetching breakdown equipment:', error)
      throw error
    }
  }

  // 컴포넌트 로드 시 고장 설비 목록 및 사용자 목록 가져오기
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 고장 설비 목록 가져오기
        const equipmentData = await fetchBreakdownEquipment()
        setAvailableEquipment(equipmentData)
        
        if (equipmentData.length === 0) {
          console.warn('No breakdown equipment found')
        }
      } catch (error) {
        console.error('Error initializing breakdown equipment:', error)
        showError(
          '고장 설비 조회 실패', 
          `고장 설비 목록을 불러오는데 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }

      // 사용자 목록 가져오기
      await fetchUsers()
    }

    initializeData()
  }, [showError])

  // [SRP] Rule: 사용자 목록 조회만 담당
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name')

      if (error) {
        console.error('Error fetching users:', error)
        showError('사용자 조회 실패', '사용자 목록을 불러오는데 실패했습니다')
        return
      }

      setAvailableUsers(data || [])
    } catch (err) {
      console.error('Unexpected error fetching users:', err)
      showError('사용자 조회 실패', '예상치 못한 오류가 발생했습니다')
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
      const reportData: RepairCompletionReport = formData as RepairCompletionReport
      const selectedUser = availableUsers.find(u => u.id === selectedTechnicianId)

      // 1. 수리 완료 정보를 repair_history 테이블에 저장
      const { data: repairData, error: repairError } = await supabase
        .from('repair_history')
        .insert({
          equipment_id: formData.equipmentId,
          technician_id: selectedTechnicianId,
          technician_name: selectedUser?.full_name || '',
          repair_type: formData.repairType,
          completion_status: formData.completionStatus,
          work_description: formData.workDescription,
          time_spent_hours: formData.timeSpent,
          test_results: formData.testResults,
          notes: formData.notes || '',
          repaired_at: new Date().toISOString(),
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
      if (formData.completionStatus === 'completed' && selectedEquipment) {
        const { error: updateError } = await supabase
          .from('breakdown_reports')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedEquipment.breakdown_report_id)

        if (updateError) {
          console.error('Error updating breakdown status:', updateError)
          // 수리 보고서는 저장되었지만 상태 업데이트에 실패한 경우
          console.warn('Repair report saved but breakdown status update failed')
        }

        // 3. 설비 상태를 'operational'로 업데이트
        const { error: equipmentUpdateError } = await supabase
          .from('equipment_info')
          .update({ 
            status: 'operational',
            updated_at: new Date().toISOString()
          })
          .eq('id', formData.equipmentId)

        if (equipmentUpdateError) {
          console.error('Error updating equipment status:', equipmentUpdateError)
          console.warn('Repair report saved but equipment status update failed')
        }
      }

      console.log('수리 완료 보고 저장 성공:', repairData)
      
      // 폼 초기화
      setFormData({
        equipmentId: '',
        technicianName: '',
        repairType: 'corrective',
        completionStatus: 'completed',
        workDescription: '',
        timeSpent: 0,
        testResults: '',
        notes: ''
      })
      setSelectedTechnicianId('')
      setErrors({})

      // 고장 설비 목록 새로고침
      try {
        const updatedEquipmentData = await fetchBreakdownEquipment()
        setAvailableEquipment(updatedEquipmentData)
      } catch (refreshError) {
        console.warn('Could not refresh equipment list:', refreshError)
      }
      
      onSubmit?.(reportData)
      onSuccess?.()
      
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
            {/* 1. 설비 선택 */}
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
                      {equipment.equipment_number} - {equipment.equipment_name} ({equipment.breakdown_status})
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

            {/* 2. 담당자 선택 */}
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