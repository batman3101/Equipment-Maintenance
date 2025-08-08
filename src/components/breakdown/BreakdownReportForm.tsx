'use client'

import React, { useState } from 'react'
import { Button, Input, Card } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { useSystemSettings } from '@/contexts/SystemSettingsContext'
import { useTranslation } from 'react-i18next'

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

      // 여기서 실제 API 호출이나 상태 업데이트
      console.log('고장 신고 데이터:', reportData)
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
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
        urgencyLevel: 'medium',
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
              <Input
                label={t('breakdown:form.equipmentNumber')}
                value={formData.equipmentNumber || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, equipmentNumber: e.target.value }))}
                placeholder={t('breakdown:form.equipmentNumberPlaceholder')}
                required
                error={errors.equipmentNumber}
              />
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