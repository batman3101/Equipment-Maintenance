'use client'

import React, { useState, useEffect } from 'react'
import { Button, Input, Card } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { useSystemSettings } from '@/contexts/SystemSettingsContext'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

interface BreakdownReport {
  equipmentCategory: string
  equipmentNumber: string
  reporterName: string
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  issueType: 'mechanical' | 'electrical' | 'software' | 'safety' | 'other'
  description: string
  symptoms: string
}

// 이제 시스템 설정에서 가져옵니다

interface BreakdownReportFormProps {
  onSubmit?: (report: BreakdownReport) => void
  onCancel?: () => void
}

export function BreakdownReportForm({ onSubmit, onCancel }: BreakdownReportFormProps) {
  const { showSuccess, showError } = useToast()
  const { getTranslatedSettings } = useSystemSettings()
  const { t } = useTranslation(['breakdown', 'common'])
  const settings = getTranslatedSettings()
  
  const [formData, setFormData] = useState<Partial<BreakdownReport>>({
    equipmentCategory: '',
    equipmentNumber: '',
    reporterName: '',
    urgencyLevel: settings.breakdown.defaultUrgency as 'low' | 'medium' | 'high' | 'critical',
    issueType: 'mechanical',
    description: '',
    symptoms: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [availableEquipment, setAvailableEquipment] = useState<Array<{id: string, equipment_number: string, equipment_name: string}>>([])

  // 컴포넌트 로드 시 사용 가능한 설비 목록 가져오기
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

    fetchEquipment()
  }, [])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.equipmentCategory) {
      newErrors.equipmentCategory = t('breakdown:validation.equipmentCategoryRequired')
    }
    if (!formData.equipmentNumber?.trim()) {
      newErrors.equipmentNumber = t('breakdown:validation.equipmentNumberRequired')
    }
    if (!formData.reporterName?.trim()) {
      newErrors.reporterName = t('breakdown:validation.reporterNameRequired')
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
      const reportData: BreakdownReport = formData as BreakdownReport

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

      // 현재 로그인된 사용자 ID 가져오기 (임시로 가짜 UUID 사용)
      const currentUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' // 임시 UUID, 나중에 실제 auth.uid() 사용
      
      // Supabase에 데이터 저장
      const { data, error } = await supabase
        .from('breakdown_reports')
        .insert({
          equipment_id: equipmentData.id, // 실제 equipment_info의 UUID
          breakdown_title: `${reportData.equipmentCategory} - ${reportData.equipmentNumber} 고장 신고`,
          breakdown_description: `[신고자: ${reportData.reporterName}]\n\n${reportData.description}`,
          breakdown_type: reportData.issueType,
          priority: reportData.urgencyLevel === 'critical' ? 'urgent' : reportData.urgencyLevel, // critical -> urgent 매핑
          occurred_at: new Date().toISOString(),
          reported_by: currentUserId, // UUID 타입으로 저장
          status: 'reported',
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
      
      onSubmit?.(reportData)
      
      showSuccess(
        t('breakdown:messages.reportSuccess'),
        t('breakdown:messages.reportSuccessWithEquipment', { equipmentNumber: reportData.equipmentNumber })
      )
      
      // 폼 초기화
      setFormData({
        equipmentCategory: '',
        equipmentNumber: '',
        reporterName: '',
        urgencyLevel: settings.breakdown.defaultUrgency as 'low' | 'medium' | 'high' | 'critical',
        issueType: 'mechanical',
        description: '',
        symptoms: ''
      })
      
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
                  {availableEquipment.length}개의 설비를 사용할 수 있습니다.
                </p>
              )}
            </div>

            {/* 3. 신고자 이름 */}
            <div>
              <Input
                label={t('breakdown:form.reporterName')}
                value={formData.reporterName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, reporterName: e.target.value }))}
                placeholder={t('breakdown:form.reporterNamePlaceholder')}
                required
                error={errors.reporterName}
              />
            </div>

            {/* 4. 긴급도 및 5. 문제 유형 */}
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

            {/* 6. 고장 내용 */}
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

            {/* 7. 발생 증상 */}
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