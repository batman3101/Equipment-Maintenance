'use client'

import React, { useState, useEffect } from 'react'
import { Button, Card } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { useSystemSettings } from '@/contexts/SystemSettingsContext'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { BreakdownReportForm as BreakdownReportFormType, BreakdownStatus, BREAKDOWN_STATUS_LABELS } from '@/types/breakdown'

// 이제 시스템 설정에서 가져옵니다

interface BreakdownReportFormProps {
  onSubmit?: (report: BreakdownReportFormType) => void
  onCancel?: () => void
}

export function BreakdownReportForm({ onSubmit, onCancel }: BreakdownReportFormProps) {
  const { showSuccess, showError } = useToast()
  const { getTranslatedSettings } = useSystemSettings()
  const { t } = useTranslation(['breakdown', 'common'])
  const settings = getTranslatedSettings()
  
  const [formData, setFormData] = useState<Partial<BreakdownReportFormType>>({
    equipmentCategory: '',
    equipmentNumber: '',
    assignee: '',
    urgencyLevel: settings.breakdown.defaultUrgency as 'low' | 'medium' | 'high' | 'critical',
    issueType: 'mechanical',
    description: '',
    symptoms: '',
    status: BreakdownStatus.REPORTED // 기본값: 신고 접수
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [availableEquipment, setAvailableEquipment] = useState<Array<{id: string, equipment_number: string, equipment_name: string}>>([])
  const [availableUsers, setAvailableUsers] = useState<Array<{id: string, full_name: string, email: string}>>([])
  const [selectedAssignee, setSelectedAssignee] = useState<string>('')

  // 컴포넌트 로드 시 사용 가능한 설비 목록과 사용자 목록 가져오기
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const { data, error } = await supabase
          .from('equipment_info')
          .select('id, equipment_number, equipment_name')
          .order('equipment_number')

        if (error) {
          console.error('Error fetching equipment:', error)
          return
        }

        console.log('Available equipment:', data)
        setAvailableEquipment(data || [])
      } catch (err) {
        console.error('Unexpected error fetching equipment:', err)
      }
    }

    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('is_active', true)
          .order('full_name')

        if (error) {
          console.error('Error fetching users:', error)
          return
        }

        console.log('Available users:', data)
        setAvailableUsers(data || [])
      } catch (err) {
        console.error('Unexpected error fetching users:', err)
      }
    }

    fetchEquipment()
    fetchUsers()
  }, [])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.equipmentCategory) {
      newErrors.equipmentCategory = t('breakdown:validation.equipmentCategoryRequired')
    }
    if (!formData.equipmentNumber?.trim()) {
      newErrors.equipmentNumber = t('breakdown:validation.equipmentNumberRequired')
    }
    if (!selectedAssignee) {
      newErrors.assignee = t('breakdown:validation.assigneeRequired')
    }
    if (!formData.description?.trim()) {
      newErrors.description = t('breakdown:validation.descriptionRequired')
    }
    if (!formData.symptoms?.trim()) {
      newErrors.symptoms = t('breakdown:validation.symptomsRequired')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    
    try {
      const reportData: BreakdownReportFormType = {
        ...formData,
        assignee: selectedAssignee
      } as BreakdownReportFormType

      console.log('Submitting breakdown report:', reportData)

      // 먼저 설비 번호로 equipment_info에서 equipment_id 찾기
      console.log('Looking for equipment with number:', reportData.equipmentNumber)
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment_info')
        .select('id')
        .eq('equipment_number', reportData.equipmentNumber)
        .single()

      console.log('Equipment lookup result:', { equipmentData, equipmentError })

      if (equipmentError || !equipmentData) {
        console.error('Equipment lookup error:', equipmentError)
        console.error('Equipment data:', equipmentData)
        showError(
          t('breakdown:messages.reportError'),
          `설비 번호 '${reportData.equipmentNumber}'를 찾을 수 없습니다. 올바른 설비 번호를 입력해주세요.`
        )
        return
      }

      // 담당자 ID 검증
      if (!selectedAssignee) {
        showError(
          t('breakdown:messages.reportError'),
          '담당자를 선택해주세요.'
        )
        return
      }
      
      // Supabase에 데이터 저장
      const { data, error } = await supabase
        .from('breakdown_reports')
        .insert({
          equipment_id: equipmentData.id, // 실제 equipment_info의 UUID
          breakdown_title: `${reportData.equipmentCategory} - ${reportData.equipmentNumber} 고장 신고`,
          breakdown_description: reportData.description,
          breakdown_type: reportData.issueType,
          priority: reportData.urgencyLevel === 'critical' ? 'urgent' : reportData.urgencyLevel, // critical -> urgent 매핑
          occurred_at: new Date().toISOString(),
          assigned_to: selectedAssignee, // 선택된 담당자 UUID
          status: formData.status || BreakdownStatus.REPORTED,
          symptoms: reportData.symptoms,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving breakdown report:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        showError(
          t('breakdown:messages.reportError'),
          error.message || '알 수 없는 오류가 발생했습니다.'
        )
        return
      }

      console.log('고장 신고 저장 성공:', data)
      
      // 🔥 고장 신고 생성 시 설비 상태를 자동으로 'breakdown'으로 변경
      try {
        const { error: statusError } = await supabase
          .from('equipment_status')
          .upsert({
            equipment_id: equipmentData.id,
            status: 'breakdown',
            status_reason: `고장 신고 접수 (ID: ${data.id})`,
            status_changed_at: new Date().toISOString(),
            notes: `고장 신고 자동 생성: ${reportData.description}`
          })

        if (statusError) {
          console.warn('설비 상태 업데이트 실패:', statusError)
        } else {
          console.log(`설비 ${equipmentData.id} 상태가 breakdown으로 변경됨`)
        }
      } catch (statusErr) {
        console.error('설비 상태 동기화 오류:', statusErr)
      }
      
      onSubmit?.(reportData)
      
      showSuccess(
        t('breakdown:messages.reportSuccess'),
        t('breakdown:messages.reportSuccessWithEquipment', { equipmentNumber: reportData.equipmentNumber })
      )
      
      // 폼 초기화
      setFormData({
        equipmentCategory: '',
        equipmentNumber: '',
        assignee: '',
        urgencyLevel: settings.breakdown.defaultUrgency as 'low' | 'medium' | 'high' | 'critical',
        issueType: 'mechanical',
        description: '',
        symptoms: '',
        status: BreakdownStatus.REPORTED
      })
      setSelectedAssignee('')
      
    } catch (error) {
      console.error('고장 신고 제출 실패:', error)
      showError(
        t('breakdown:messages.reportError'),
        t('breakdown:messages.reportErrorDetail')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <Card.Header>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('breakdown:form.title')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('breakdown:form.description')}
          </p>
        </Card.Header>
        
        <Card.Content>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. 고장 설비 종류 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('breakdown:form.equipmentCategory')} <span className="text-red-500">{t('breakdown:form.required')}</span>
              </label>
              <select
                value={formData.equipmentCategory || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, equipmentCategory: e.target.value }))}
                className={`block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.equipmentCategory 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              >
                <option value="">{t('breakdown:form.equipmentCategoryPlaceholder')}</option>
                {settings.equipment.categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              {errors.equipmentCategory && <p className="mt-1 text-sm text-red-600">{errors.equipmentCategory}</p>}
            </div>

            {/* 2. 고장 설비 번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('breakdown:form.equipmentNumber')} <span className="text-red-500">{t('breakdown:form.required')}</span>
              </label>
              <select
                value={formData.equipmentNumber || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, equipmentNumber: e.target.value }))}
                className={`block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.equipmentNumber 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              >
                <option value="">{t('breakdown:form.equipmentNumberPlaceholder')}</option>
                {availableEquipment.map((equipment) => (
                  <option key={equipment.id} value={equipment.equipment_number}>
                    {equipment.equipment_number} - {equipment.equipment_name}
                  </option>
                ))}
              </select>
              {errors.equipmentNumber && <p className="mt-1 text-sm text-red-600">{errors.equipmentNumber}</p>}
              
              {/* 디버깅 정보 표시 */}
              {availableEquipment.length === 0 && (
                <p className="mt-1 text-sm text-yellow-600">
                  사용 가능한 설비 목록을 불러오는 중입니다... ({availableEquipment.length}개 설비)
                </p>
              )}
              {availableEquipment.length > 0 && (
                <p className="mt-1 text-sm text-green-600">
                  {t('breakdown:messages.availableEquipment', { count: availableEquipment.length })}
                </p>
              )}
            </div>

            {/* 3. 담당자 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                담당자 <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className={`block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.assignee 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              >
                <option value="">담당자를 선택하세요</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </option>
                ))}
              </select>
              {errors.assignee && <p className="mt-1 text-sm text-red-600">{errors.assignee}</p>}
              
              {/* 담당자 목록 디버깅 정보 */}
              {availableUsers.length === 0 && (
                <p className="mt-1 text-sm text-yellow-600">
                  사용자 목록을 불러오는 중입니다...
                </p>
              )}
              {availableUsers.length > 0 && (
                <p className="mt-1 text-sm text-green-600">
                  {availableUsers.length}명의 담당자 중에서 선택할 수 있습니다.
                </p>
              )}
            </div>

            {/* 5. 상태 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                상태 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status || BreakdownStatus.REPORTED}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as BreakdownStatus }))}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {Object.entries(BREAKDOWN_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                고장 신고의 현재 처리 상태를 선택하세요
              </p>
            </div>

            {/* 6. 긴급도 및 7. 문제 유형 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('breakdown:form.urgencyLevel')} <span className="text-red-500">{t('breakdown:form.required')}</span>
                </label>
                <select
                  value={formData.urgencyLevel || 'medium'}
                  onChange={(e) => setFormData(prev => ({ ...prev, urgencyLevel: e.target.value as 'low' | 'medium' | 'high' | 'critical' }))}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {settings.breakdown.urgencyLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('breakdown:form.issueType')} <span className="text-red-500">{t('breakdown:form.required')}</span>
                </label>
                <select
                  value={formData.issueType || 'mechanical'}
                  onChange={(e) => setFormData(prev => ({ ...prev, issueType: e.target.value as 'mechanical' | 'electrical' | 'software' | 'safety' | 'other' }))}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {settings.breakdown.issueTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 7. 고장 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('breakdown:form.description')} <span className="text-red-500">{t('breakdown:form.required')}</span>
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('breakdown:form.descriptionPlaceholder')}
                rows={4}
                className={`block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 resize-none ${
                  errors.description 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            {/* 8. 발생 증상 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('breakdown:form.symptoms')} <span className="text-red-500">{t('breakdown:form.required')}</span>
              </label>
              <textarea
                value={formData.symptoms || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                placeholder={t('breakdown:form.symptomsPlaceholder')}
                rows={3}
                className={`block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 resize-none ${
                  errors.symptoms 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              />
              {errors.symptoms && <p className="mt-1 text-sm text-red-600">{errors.symptoms}</p>}
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
                  {t('breakdown:form.cancel')}
                </Button>
              )}
              <Button
                type="submit"
                loading={loading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? t('breakdown:form.submitting') : t('breakdown:form.submit')}
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </div>
  )
}