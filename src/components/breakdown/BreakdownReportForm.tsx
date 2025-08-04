'use client'

import React, { useState } from 'react'
import { Button, Input, Card, Select } from '@/components/ui'

interface BreakdownReport {
  equipmentId: string
  equipmentNumber: string
  equipmentName: string
  category: string
  location: string
  reporterName: string
  reporterPhone: string
  department: string
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  issueType: 'mechanical' | 'electrical' | 'software' | 'safety' | 'other'
  description: string
  symptoms: string
  photos?: File[]
}

interface Equipment {
  id: string
  equipment_number: string
  equipment_name: string
  category: string
  location: string
}

// Mock equipment data
const mockEquipmentOptions: Equipment[] = [
  {
    id: '1',
    equipment_number: 'CNC-ML-001',
    equipment_name: 'CNC 밀링머신 #1',
    category: '밀링머신',
    location: '1공장 A라인'
  },
  {
    id: '2',
    equipment_number: 'CNC-LT-001',
    equipment_name: 'CNC 선반 #1',
    category: '선반',
    location: '1공장 B라인'
  },
  {
    id: '3',
    equipment_number: 'CNC-DR-001',
    equipment_name: 'CNC 드릴링머신 #1',
    category: '드릴링머신',
    location: '2공장 A라인'
  },
  {
    id: '4',
    equipment_number: 'CNC-GR-001',
    equipment_name: 'CNC 그라인딩머신 #1',
    category: '그라인딩머신',
    location: '2공장 B라인'
  },
  {
    id: '5',
    equipment_number: 'CNC-LC-001',
    equipment_name: 'CNC 레이저커터 #1',
    category: '레이저커터',
    location: '3공장 A라인'
  }
]

const urgencyLevels = [
  { value: 'low', label: '낮음 - 생산에 영향 없음', color: 'text-green-600' },
  { value: 'medium', label: '보통 - 부분적 영향', color: 'text-yellow-600' },
  { value: 'high', label: '높음 - 생산 중단', color: 'text-orange-600' },
  { value: 'critical', label: '긴급 - 안전 위험', color: 'text-red-600' }
]

const issueTypes = [
  { value: 'mechanical', label: '기계적 문제' },
  { value: 'electrical', label: '전기적 문제' },
  { value: 'software', label: '소프트웨어 문제' },
  { value: 'safety', label: '안전 문제' },
  { value: 'other', label: '기타' }
]

interface BreakdownReportFormProps {
  onSubmit?: (report: BreakdownReport) => void
  onCancel?: () => void
  preSelectedEquipmentId?: string
}

export function BreakdownReportForm({ onSubmit, onCancel, preSelectedEquipmentId }: BreakdownReportFormProps) {
  const [formData, setFormData] = useState<Partial<BreakdownReport>>({
    equipmentId: preSelectedEquipmentId || '',
    urgencyLevel: 'medium',
    issueType: 'mechanical',
    reporterName: '',
    reporterPhone: '',
    department: '',
    description: '',
    symptoms: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const selectedEquipment = mockEquipmentOptions.find(eq => eq.id === formData.equipmentId)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.equipmentId) {
      newErrors.equipmentId = '설비를 선택해주세요'
    }
    if (!formData.reporterName?.trim()) {
      newErrors.reporterName = '신고자 이름을 입력해주세요'
    }
    if (!formData.reporterPhone?.trim()) {
      newErrors.reporterPhone = '연락처를 입력해주세요'
    }
    if (!formData.department?.trim()) {
      newErrors.department = '부서를 입력해주세요'
    }
    if (!formData.description?.trim()) {
      newErrors.description = '고장 내용을 입력해주세요'
    }
    if (!formData.symptoms?.trim()) {
      newErrors.symptoms = '증상을 입력해주세요'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    
    try {
      const reportData: BreakdownReport = {
        ...formData,
        equipmentNumber: selectedEquipment?.equipment_number || '',
        equipmentName: selectedEquipment?.equipment_name || '',
        category: selectedEquipment?.category || '',
        location: selectedEquipment?.location || ''
      } as BreakdownReport

      // 여기서 실제 API 호출이나 상태 업데이트
      console.log('고장 신고 데이터:', reportData)
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onSubmit?.(reportData)
      
      // 폼 초기화
      setFormData({
        equipmentId: '',
        urgencyLevel: 'medium',
        issueType: 'mechanical',
        reporterName: '',
        reporterPhone: '',
        department: '',
        description: '',
        symptoms: ''
      })
      
    } catch (error) {
      console.error('고장 신고 제출 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <Card.Header>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">고장 신고</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            설비 고장 발생 시 즉시 신고해주세요. 모든 항목을 정확히 기입해주시기 바랍니다.
          </p>
        </Card.Header>
        
        <Card.Content>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 설비 선택 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  고장 설비 <span className="text-red-500">*</span>
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
                  <option value="">설비를 선택하세요</option>
                  {mockEquipmentOptions.map((equipment) => (
                    <option key={equipment.id} value={equipment.id}>
                      {equipment.equipment_number} - {equipment.equipment_name} ({equipment.location})
                    </option>
                  ))}
                </select>
                {errors.equipmentId && <p className="mt-1 text-sm text-red-600">{errors.equipmentId}</p>}
              </div>

              {/* 선택된 설비 정보 표시 */}
              {selectedEquipment && (
                <div className="lg:col-span-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">선택된 설비 정보</h3>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <p><strong>설비명:</strong> {selectedEquipment.equipment_name}</p>
                    <p><strong>설비번호:</strong> {selectedEquipment.equipment_number}</p>
                    <p><strong>카테고리:</strong> {selectedEquipment.category}</p>
                    <p><strong>위치:</strong> {selectedEquipment.location}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 신고자 정보 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Input
                label="신고자 이름"
                value={formData.reporterName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, reporterName: e.target.value }))}
                placeholder="이름을 입력하세요"
                required
                error={errors.reporterName}
              />
              
              <Input
                label="연락처"
                value={formData.reporterPhone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, reporterPhone: e.target.value }))}
                placeholder="전화번호를 입력하세요"
                required
                error={errors.reporterPhone}
              />
              
              <Input
                label="부서"
                value={formData.department || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="소속 부서를 입력하세요"
                required
                error={errors.department}
              />
            </div>

            {/* 긴급도 및 문제 유형 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  긴급도 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.urgencyLevel || 'medium'}
                  onChange={(e) => setFormData(prev => ({ ...prev, urgencyLevel: e.target.value as any }))}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {urgencyLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  문제 유형 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.issueType || 'mechanical'}
                  onChange={(e) => setFormData(prev => ({ ...prev, issueType: e.target.value as any }))}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {issueTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 고장 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                고장 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="고장이 발생한 상황을 자세히 기술해주세요"
                rows={4}
                className={`block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 resize-none ${
                  errors.description 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            {/* 증상 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                발생 증상 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.symptoms || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                placeholder="소음, 진동, 오류 메시지 등 구체적인 증상을 기술해주세요"
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
                  취소
                </Button>
              )}
              <Button
                type="submit"
                loading={loading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? '신고 중...' : '고장 신고'}
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </div>
  )
}