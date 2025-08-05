'use client'

import React, { useState } from 'react'
import { Button, Input, Card } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'

interface RepairReport {
  breakdownReportId?: string
  equipmentId: string
  equipmentNumber: string
  equipmentName: string
  category: string
  location: string
  technicianName: string
  technicianPhone: string
  department: string
  repairType: 'preventive' | 'corrective' | 'emergency' | 'upgrade'
  workDescription: string
  partsUsed: string
  timeSpent: number
  laborCost: number
  partsCost: number
  totalCost: number
  completionStatus: 'completed' | 'partial' | 'failed'
  testResults: string
  nextMaintenanceDate?: string
  notes?: string
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

const repairTypes = [
  { value: 'corrective', label: '사후 정비 (고장 수리)' },
  { value: 'preventive', label: '예방 정비 (정기 점검)' },
  { value: 'emergency', label: '긴급 수리' },
  { value: 'upgrade', label: '개선/업그레이드' }
]

const completionStatuses = [
  { value: 'completed', label: '완료', color: 'text-green-600' },
  { value: 'partial', label: '부분 완료', color: 'text-yellow-600' },
  { value: 'failed', label: '실패/보류', color: 'text-red-600' }
]

interface RepairReportFormProps {
  onSubmit?: (report: RepairReport) => void
  onCancel?: () => void
  preSelectedEquipmentId?: string
  relatedBreakdownId?: string
}

export function RepairReportForm({ onSubmit, onCancel, preSelectedEquipmentId, relatedBreakdownId }: RepairReportFormProps) {
  const { showSuccess, showError } = useToast()
  const [formData, setFormData] = useState<Partial<RepairReport>>({
    equipmentId: preSelectedEquipmentId || '',
    breakdownReportId: relatedBreakdownId || '',
    repairType: 'corrective',
    completionStatus: 'completed',
    technicianName: '',
    technicianPhone: '',
    department: '',
    workDescription: '',
    partsUsed: '',
    timeSpent: 0,
    laborCost: 0,
    partsCost: 0,
    totalCost: 0,
    testResults: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const selectedEquipment = mockEquipmentOptions.find(eq => eq.id === formData.equipmentId)

  // 총 비용 자동 계산
  React.useEffect(() => {
    const laborCost = formData.laborCost || 0
    const partsCost = formData.partsCost || 0
    const totalCost = laborCost + partsCost
    
    if (totalCost !== formData.totalCost) {
      setFormData(prev => ({ ...prev, totalCost }))
    }
  }, [formData.laborCost, formData.partsCost, formData.totalCost])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.equipmentId) {
      newErrors.equipmentId = '설비를 선택해주세요'
    }
    if (!formData.technicianName?.trim()) {
      newErrors.technicianName = '기술자 이름을 입력해주세요'
    }
    if (!formData.technicianPhone?.trim()) {
      newErrors.technicianPhone = '연락처를 입력해주세요'
    }
    if (!formData.department?.trim()) {
      newErrors.department = '부서를 입력해주세요'
    }
    if (!formData.workDescription?.trim()) {
      newErrors.workDescription = '작업 내용을 입력해주세요'
    }
    if (!formData.testResults?.trim()) {
      newErrors.testResults = '테스트 결과를 입력해주세요'
    }
    if (!formData.timeSpent || formData.timeSpent <= 0) {
      newErrors.timeSpent = '작업 시간을 입력해주세요'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    
    try {
      const reportData: RepairReport = {
        ...formData,
        equipmentNumber: selectedEquipment?.equipment_number || '',
        equipmentName: selectedEquipment?.equipment_name || '',
        category: selectedEquipment?.category || '',
        location: selectedEquipment?.location || ''
      } as RepairReport

      // 여기서 실제 API 호출이나 상태 업데이트
      console.log('수리 완료 보고 데이터:', reportData)
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onSubmit?.(reportData)
      
      showSuccess(
        '수리 완료 보고',
        `${selectedEquipment?.equipment_name}의 수리 완료가 성공적으로 등록되었습니다.`
      )
      
    } catch (error) {
      console.error('수리 완료 보고 제출 실패:', error)
      showError(
        '등록 실패',
        '수리 완료 보고 처리 중 오류가 발생했습니다. 다시 시도해주세요.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <Card.Header>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">수리 완료 보고</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            수리 작업이 완료되면 상세한 내용을 기록해주세요. 정확한 기록은 향후 유지보수에 도움이 됩니다.
          </p>
        </Card.Header>
        
        <Card.Content>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 설비 선택 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  수리 설비 <span className="text-red-500">*</span>
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
                <div className="lg:col-span-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h3 className="font-medium text-green-900 dark:text-green-300 mb-2">수리 완료 설비</h3>
                  <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                    <p><strong>설비명:</strong> {selectedEquipment.equipment_name}</p>
                    <p><strong>설비번호:</strong> {selectedEquipment.equipment_number}</p>
                    <p><strong>카테고리:</strong> {selectedEquipment.category}</p>
                    <p><strong>위치:</strong> {selectedEquipment.location}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 기술자 정보 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Input
                label="기술자 이름"
                value={formData.technicianName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, technicianName: e.target.value }))}
                placeholder="수리 담당자 이름"
                required
                error={errors.technicianName}
              />
              
              <Input
                label="연락처"
                value={formData.technicianPhone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, technicianPhone: e.target.value }))}
                placeholder="기술자 연락처"
                required
                error={errors.technicianPhone}
              />
              
              <Input
                label="소속 부서"
                value={formData.department || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="정비팀, 기술팀 등"
                required
                error={errors.department}
              />
            </div>

            {/* 수리 유형 및 완료 상태 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  수리 유형 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.repairType || 'corrective'}
                  onChange={(e) => setFormData(prev => ({ ...prev, repairType: e.target.value as 'preventive' | 'corrective' | 'emergency' | 'upgrade' }))}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {repairTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  완료 상태 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.completionStatus || 'completed'}
                  onChange={(e) => setFormData(prev => ({ ...prev, completionStatus: e.target.value as 'completed' | 'partial' | 'failed' }))}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {completionStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 작업 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                수행한 작업 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.workDescription || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, workDescription: e.target.value }))}
                placeholder="수행한 수리 작업을 자세히 기술해주세요 (교체 부품, 조정 내용, 청소 등)"
                rows={4}
                className={`block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 resize-none ${
                  errors.workDescription 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              />
              {errors.workDescription && <p className="mt-1 text-sm text-red-600">{errors.workDescription}</p>}
            </div>

            {/* 사용 부품 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                사용 부품/소모품
              </label>
              <textarea
                value={formData.partsUsed || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, partsUsed: e.target.value }))}
                placeholder="교체한 부품, 사용한 소모품 목록 (부품명, 수량, 규격 등)"
                rows={3}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* 시간 및 비용 */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Input
                label="작업 시간 (시간)"
                type="number"
                value={formData.timeSpent?.toString() || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, timeSpent: parseFloat(e.target.value) || 0 }))}
                placeholder="0.5"
                required
                error={errors.timeSpent}
                min="0"
                step="0.5"
              />
              
              <Input
                label="인건비 (원)"
                type="number"
                value={formData.laborCost?.toString() || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, laborCost: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
              />
              
              <Input
                label="부품비 (원)"
                type="number"
                value={formData.partsCost?.toString() || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, partsCost: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
              />
              
              <Input
                label="총 비용 (원)"
                type="number"
                value={formData.totalCost?.toString() || ''}
                readOnly
                className="bg-gray-50 dark:bg-gray-900"
              />
            </div>

            {/* 테스트 결과 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                테스트 및 검증 결과 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.testResults || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, testResults: e.target.value }))}
                placeholder="수리 후 동작 테스트 결과, 성능 확인 내용 등"
                rows={3}
                className={`block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 resize-none ${
                  errors.testResults 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              />
              {errors.testResults && <p className="mt-1 text-sm text-red-600">{errors.testResults}</p>}
            </div>

            {/* 다음 정비 일정 및 참고사항 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Input
                label="다음 정비 예정일"
                type="date"
                value={formData.nextMaintenanceDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, nextMaintenanceDate: e.target.value }))}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  추가 참고사항
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="향후 유지보수 시 참고할 내용이나 주의사항"
                  rows={2}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>
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
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? '등록 중...' : '수리 완료 등록'}
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </div>
  )
}