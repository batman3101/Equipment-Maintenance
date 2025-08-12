'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import * as ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { Button, Card, Modal } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { useSystemSettings } from '@/contexts/SystemSettingsContext'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

interface Equipment {
  id: string
  equipmentNumber: string
  equipmentName: string
  category: string
  location: string | null
  manufacturer: string | null
  model: string | null
  installationDate: string | null
  specifications: string | null
  createdAt: string
  updatedAt: string
}

interface EquipmentStatus {
  id: string
  equipmentId: string
  status: 'running' | 'breakdown' | 'standby' | 'maintenance' | 'stopped'
  statusReason: string | null
  updatedBy: string | null
  statusChangedAt: string
  lastMaintenanceDate: string | null
  nextMaintenanceDate: string | null
  operatingHours: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}


const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    running: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
    breakdown: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200',
    standby: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
    maintenance: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
    stopped: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
  
  return colorMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
}

const getStatusText = (status: string, t: (key: string) => string) => {
  const statusMap: Record<string, string> = {
    running: '운영 중',
    breakdown: '고장',
    standby: '대기',
    maintenance: '정비 중',
    stopped: '중지'
  }
  
  return statusMap[status] || t('equipment:status.unknown')
}

export function EquipmentManagement() {
  const { t } = useTranslation(['equipment', 'common'])
  const { showSuccess, showError, showWarning } = useToast()
  const { getTranslatedSettings } = useSystemSettings()
  const settings = getTranslatedSettings()
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [equipmentStatuses, setEquipmentStatuses] = useState<EquipmentStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<Equipment>>({})
  const [newEquipment, setNewEquipment] = useState<Partial<Equipment>>({
    equipmentName: '',
    equipmentNumber: '',
    category: '',
    location: null,
    manufacturer: null,
    model: null,
    installationDate: new Date().toISOString().split('T')[0],
    specifications: null
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Supabase에서 설비 데이터 가져오기
  useEffect(() => {
    fetchEquipments()
  }, [])

  const fetchEquipments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 설비 정보 가져오기
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment_info')
        .select('*')
        .order('created_at', { ascending: false })

      if (equipmentError) {
        console.error('Error fetching equipment:', equipmentError)
        setError(t('equipment:messages.loadFailed'))
        return
      }

      // 설비 상태 정보 가져오기
      const { data: statusData, error: statusError } = await supabase
        .from('equipment_status')
        .select('*')

      if (statusError) {
        console.error('Error fetching equipment status:', statusError)
        console.warn('Could not load equipment status information.')
      }

      // Supabase 데이터를 컴포넌트 인터페이스에 맞게 변환
      const formattedEquipments: Equipment[] = (equipmentData || []).map(eq => ({
        id: eq.id,
        equipmentNumber: eq.equipment_number,
        equipmentName: eq.equipment_name,
        category: eq.category,
        location: eq.location,
        manufacturer: eq.manufacturer,
        model: eq.model,
        installationDate: eq.installation_date,
        specifications: eq.specifications,
        createdAt: eq.created_at,
        updatedAt: eq.updated_at
      }))

      const formattedStatuses: EquipmentStatus[] = (statusData || []).map(status => ({
        id: status.id,
        equipmentId: status.equipment_id,
        status: status.status,
        statusReason: status.status_reason,
        updatedBy: status.updated_by,
        statusChangedAt: status.status_changed_at,
        lastMaintenanceDate: status.last_maintenance_date,
        nextMaintenanceDate: status.next_maintenance_date,
        operatingHours: status.operating_hours,
        notes: status.notes,
        createdAt: status.created_at,
        updatedAt: status.updated_at
      }))

      setEquipments(formattedEquipments)
      setEquipmentStatuses(formattedStatuses)
    } catch (err) {
      console.error('Unexpected error fetching equipment:', err)
      setError(t('common:errors.unexpected'))
    } finally {
      setLoading(false)
    }
  }

  // Excel 템플릿 다운로드
  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(t('equipment:excel.sheetName'))

    // 헤더 추가
    const headers = [
      t('equipment:excel.columns.equipmentType'),
      t('equipment:excel.columns.equipmentNumber'),
      t('equipment:excel.columns.location'),
      t('equipment:excel.columns.installDate'),
      t('equipment:excel.columns.status')
    ]
    worksheet.addRow(headers)

    // 샘플 데이터 추가
    worksheet.addRow(['CNC', 'CNC-002', 'BUILD_A', '2024-01-15', 'operational'])

    // 컬럼 너비 조정
    worksheet.columns = [
      { width: 15 }, // 설비종류
      { width: 15 }, // 설비번호
      { width: 15 }, // 설비위치
      { width: 12 }, // 설치일자
      { width: 10 }  // 상태
    ]

    // 헤더 스타일 적용
    worksheet.getRow(1).font = { bold: true }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, t('equipment:excel.templateName'))
  }

  // Excel 파일 업로드 처리
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const data = await file.arrayBuffer()
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(data)
      const worksheet = workbook.getWorksheet(1)
      
      // Excel 데이터를 JSON 형태로 변환
      const jsonData: Record<string, unknown>[] = []
      const headerRow = worksheet?.getRow(1)
      const headers = headerRow?.values as string[]
      
      worksheet?.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // 헤더 행 제외
          const rowData: Record<string, unknown> = {}
          row.eachCell((cell, colNumber) => {
            if (headers && headers[colNumber]) {
              rowData[headers[colNumber]] = cell.value
            }
          })
          jsonData.push(rowData)
        }
      })

      const newEquipments: Equipment[] = []
      const validationErrors = [] as string[]

      (jsonData as Record<string, unknown>[]).forEach((row: Record<string, unknown>, index: number) => {
        try {
          // 필수 필드 검증 - 다국어 컬럼명 지원
          const equipmentTypeKey = t('equipment:excel.columns.equipmentType')
          const equipmentNumberKey = t('equipment:excel.columns.equipmentNumber')
          const locationKey = t('equipment:excel.columns.location')
          const installDateKey = t('equipment:excel.columns.installDate')
          const statusKey = t('equipment:excel.columns.status')
          
          if (!row[equipmentTypeKey] || !row[equipmentNumberKey]) {
            validationErrors.push(t('equipment:messages.validationError', { 
              row: index + 2, 
              message: t('equipment:messages.equipmentTypeAndNumberRequired') 
            }))
            return
          }

          // 중복 설비번호 검증
          const existingEquipment = equipments.find(eq => eq.equipmentNumber === row[equipmentNumberKey])
          if (existingEquipment) {
            validationErrors.push(t('equipment:messages.validationError', {
              row: index + 2,
              message: t('equipment:messages.equipmentNumberExists', { equipmentNumber: row[equipmentNumberKey] })
            }))
            return
          }

          // 상태 값 검증
          const validStatuses = settings.equipment.statuses.map((s) => s.value)
          const status = String(row[statusKey] || settings.equipment.defaultStatus)
          if (!validStatuses.includes(status)) {
            validationErrors.push(t('equipment:messages.validationError', {
              row: index + 2,
              message: t('equipment:messages.invalidStatus', { validStatuses: validStatuses.join(', ') })
            }))
            return
          }

          const equipment: Equipment = {
            id: Date.now().toString() + index,
            equipmentNumber: String(row[equipmentNumberKey]),
            equipmentName: String(row[equipmentTypeKey]),  // 장비 이름으로 매핑
            category: String(row[equipmentTypeKey]),  // 카테고리로 매핑  
            location: String(row[locationKey] || settings.equipment.locations[0]?.value || ''),
            manufacturer: null,
            model: null,
            installationDate: String(row[installDateKey] || new Date().toISOString().split('T')[0]),
            specifications: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }

          newEquipments.push(equipment)
        } catch (error) {
          console.error('Equipment validation error:', error)
          validationErrors.push(t('equipment:messages.validationError', {
            row: index + 2,
            message: t('equipment:messages.dataProcessingError')
          }))
        }
      })

      if (validationErrors.length > 0) {
        showError(
          t('equipment:messages.uploadFailed'),
          validationErrors.slice(0, 3).join('\n') + (validationErrors.length > 3 ? 
            `\n${t('equipment:messages.moreErrors', { count: validationErrors.length - 3 })}` : ''),
          { duration: 8000 }
        )
      } else if (newEquipments.length === 0) {
        showWarning(
          t('equipment:messages.uploadWarning'),
          t('equipment:messages.uploadWarningDetail')
        )
      } else {
        // 성공적으로 처리된 설비들을 추가
        setEquipments(prev => [...prev, ...newEquipments])
        showSuccess(
          t('equipment:messages.uploadSuccess'),
          t('equipment:messages.uploadSuccessDetail', { count: newEquipments.length })
        )
      }
    } catch (error) {
      console.error('Excel file processing error:', error)
      showError(
        t('equipment:messages.excelProcessingError'),
        t('equipment:messages.excelProcessingErrorDetail')
      )
    } finally {
      setIsUploading(false)
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 개별 설비 등록
  const handleAddEquipment = async () => {
    // 필수 필드 검증
    if (!newEquipment.equipmentName || !newEquipment.equipmentNumber || !newEquipment.category) {
      showError(
        t('equipment:messages.requiredFields'),
        t('equipment:messages.requiredFieldsDetail')
      )
      return
    }

    // 중복 설비번호 검증
    const existingEquipment = equipments.find(eq => eq.equipmentNumber === newEquipment.equipmentNumber)
    if (existingEquipment) {
      showError(
        t('equipment:messages.duplicateEquipmentNumber'),
        t('equipment:messages.duplicateEquipmentNumberDetail', { equipmentNumber: newEquipment.equipmentNumber })
      )
      return
    }

    try {
      // Supabase에 새 설비 추가
      const { data, error } = await supabase
        .from('equipment_info')
        .insert({
          equipment_number: newEquipment.equipmentNumber!,
          equipment_name: newEquipment.equipmentName!,
          category: newEquipment.category!,
          location: newEquipment.location,
          manufacturer: newEquipment.manufacturer,
          model: newEquipment.model,
          installation_date: newEquipment.installationDate,
          specifications: newEquipment.specifications
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding equipment:', error)
        showError(
          t('equipment:messages.registerFailed'),
          t('equipment:messages.registerFailed')
        )
        return
      }

      // 로컬 상태 업데이트
      const newEquipmentData: Equipment = {
        id: data.id,
        equipmentNumber: data.equipment_number,
        equipmentName: data.equipment_name,
        category: data.category,
        location: data.location,
        manufacturer: data.manufacturer,
        model: data.model,
        installationDate: data.installation_date,
        specifications: data.specifications,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }

      setEquipments(prev => [...prev, newEquipmentData])
      showSuccess(
        t('equipment:messages.registerSuccess'),
        t('equipment:messages.registerSuccessDetail', { equipmentNumber: newEquipment.equipmentNumber })
      )
    } catch (err) {
      console.error('Unexpected error adding equipment:', err)
      showError(
        t('equipment:messages.registerFailed'),
        t('common:errors.unexpected')
      )
      return
    }

    // 폼 초기화 및 닫기
    setNewEquipment({
      equipmentName: '',
      equipmentNumber: '',
      category: '',
      location: null,
      manufacturer: null,
      model: null,
      installationDate: new Date().toISOString().split('T')[0],
      specifications: null
    })
    setShowAddForm(false)
  }

  // 개별 등록 폼 취소
  const handleCancelAdd = () => {
    setShowAddForm(false)
    setNewEquipment({
      equipmentName: '',
      equipmentNumber: '',
      category: '',
      location: null,
      manufacturer: null,
      model: null,
      installationDate: new Date().toISOString().split('T')[0],
      specifications: null
    })
  }

  // 상세보기 핸들러
  const handleViewDetails = (equipment: Equipment) => {
    setSelectedEquipment(equipment)
    setShowDetailsModal(true)
  }

  // 편집 핸들러
  const handleEdit = (equipment: Equipment) => {
    setSelectedEquipment(equipment)
    setEditFormData(equipment)
    setShowEditModal(true)
  }

  // 삭제 핸들러
  const handleDelete = (equipment: Equipment) => {
    setSelectedEquipment(equipment)
    setShowDeleteModal(true)
  }

  // 편집 저장
  const handleSaveEdit = async () => {
    if (!selectedEquipment || !editFormData.equipmentName || !editFormData.equipmentNumber || !editFormData.category) {
      showError(
        t('equipment:messages.requiredFields'),
        t('equipment:messages.requiredFieldsDetail')
      )
      return
    }

    try {
      const { error } = await supabase
        .from('equipment_info')
        .update({
          equipment_name: editFormData.equipmentName,
          equipment_number: editFormData.equipmentNumber,
          category: editFormData.category,
          location: editFormData.location,
          manufacturer: editFormData.manufacturer,
          model: editFormData.model,
          installation_date: editFormData.installationDate,
          specifications: editFormData.specifications
        })
        .eq('id', selectedEquipment.id)

      if (error) {
        console.error('Error updating equipment:', error)
        showError(
          t('common:messages.updateFailed'),
          error.message
        )
        return
      }

      // 로컬 상태 업데이트
      setEquipments(prev => prev.map(eq => 
        eq.id === selectedEquipment.id 
          ? { ...eq, ...editFormData as Equipment }
          : eq
      ))

      showSuccess(
        t('common:messages.updateSuccess'),
        t('equipment:messages.registerSuccessDetail', { equipmentNumber: editFormData.equipmentNumber })
      )
      
      setShowEditModal(false)
      setSelectedEquipment(null)
      setEditFormData({})
    } catch (err) {
      console.error('Unexpected error updating equipment:', err)
      showError(
        t('common:messages.updateFailed'),
        t('common:errors.unexpected')
      )
    }
  }

  // 삭제 확인
  const handleConfirmDelete = async () => {
    if (!selectedEquipment) return

    try {
      const { error } = await supabase
        .from('equipment_info')
        .delete()
        .eq('id', selectedEquipment.id)

      if (error) {
        console.error('Error deleting equipment:', error)
        showError(
          t('common:messages.deleteFailed'),
          error.message
        )
        return
      }

      // 로컬 상태에서 제거
      setEquipments(prev => prev.filter(eq => eq.id !== selectedEquipment.id))
      
      showSuccess(
        t('common:messages.deleteSuccess'),
        `${selectedEquipment.equipmentName} (${selectedEquipment.equipmentNumber})`
      )
      
      setShowDeleteModal(false)
      setSelectedEquipment(null)
    } catch (err) {
      console.error('Unexpected error deleting equipment:', err)
      showError(
        t('common:messages.deleteFailed'),
        t('common:errors.unexpected')
      )
    }
  }

  // 설비 현황 통계 (상태별)
  const statusCounts = useMemo(() => {
    const counts = {
      running: 0,
      breakdown: 0,
      standby: 0,
      maintenance: 0,
      stopped: 0
    }
    
    equipmentStatuses.forEach(status => {
      if (counts.hasOwnProperty(status.status)) {
        counts[status.status as keyof typeof counts]++
      }
    })
    
    return counts
  }, [equipmentStatuses])

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <Card.Content className="text-center py-8">
            <div className="text-gray-500">{t('common:loading')}</div>
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
            <Button onClick={fetchEquipments} variant="secondary">
              {t('common:actions.retry')}
            </Button>
          </Card.Content>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('equipment:management.title')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('equipment:management.description')}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <span>➕</span>
            <span>{t('equipment:management.addEquipment')}</span>
          </Button>
          <Button
            variant="secondary"
            onClick={downloadTemplate}
            className="flex items-center space-x-2"
          >
            <span>📁</span>
            <span>{t('equipment:management.downloadTemplate')}</span>
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            disabled={isUploading}
          >
            <span>📤</span>
            <span>{isUploading ? t('equipment:management.uploading') : t('equipment:management.excelUpload')}</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>


      {/* 개별 설비 등록 폼 */}
      {showAddForm && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/20">
          <Card.Header>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('equipment:management.newEquipmentForm')}</h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancelAdd}
                className="text-gray-600 hover:text-gray-800"
              >
                ❌ {t('equipment:management.cancel')}
              </Button>
            </div>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. 설비명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('equipment:fields.equipmentName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newEquipment.equipmentName || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, equipmentName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('equipment:placeholders.equipmentNamePlaceholder')}
                />
              </div>

              {/* 2. 카테고리 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('equipment:fields.category')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={newEquipment.category || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('equipment:placeholders.selectEquipmentType')}</option>
                  {settings.equipment.categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. 설비 번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('equipment:fields.equipmentNumber')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newEquipment.equipmentNumber || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, equipmentNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('equipment:placeholders.equipmentNumberExample')}
                />
              </div>

              {/* 4. 설비 위치 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('equipment:fields.location')}
                </label>
                <select
                  value={newEquipment.location || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, location: e.target.value || null }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('equipment:placeholders.selectLocation')}</option>
                  {settings.equipment.locations.map((location) => (
                    <option key={location.value} value={location.value}>
                      {location.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. 제조업체 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('equipment:fields.manufacturer')}
                </label>
                <input
                  type="text"
                  value={newEquipment.manufacturer || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, manufacturer: e.target.value || null }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('equipment:placeholders.manufacturerPlaceholder')}
                />
              </div>

              {/* 6. 모델 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('equipment:fields.model')}
                </label>
                <input
                  type="text"
                  value={newEquipment.model || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, model: e.target.value || null }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('equipment:placeholders.modelPlaceholder')}
                />
              </div>

              {/* 7. 설치 일자 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('equipment:fields.installDate')}
                </label>
                <input
                  type="date"
                  value={newEquipment.installationDate || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, installationDate: e.target.value || null }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 8. 사양 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('equipment:fields.specifications')}
                </label>
                <textarea
                  value={newEquipment.specifications || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, specifications: e.target.value || null }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('equipment:placeholders.specificationsPlaceholder')}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={handleCancelAdd}
              >
                {t('equipment:management.cancel')}
              </Button>
              <Button
                onClick={handleAddEquipment}
                className="bg-blue-600 hover:bg-blue-700"
              >
                ✅ {t('equipment:management.register')}
              </Button>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* 설비 현황 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <Card.Content className="text-center py-6">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {equipments.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('equipment:management.totalEquipment')}</div>
          </Card.Content>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <Card.Content className="text-center py-6">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {statusCounts.running}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('equipment:status.running')}</div>
          </Card.Content>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
          <Card.Content className="text-center py-6">
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {statusCounts.maintenance}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('equipment:status.maintenance')}</div>
          </Card.Content>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <Card.Content className="text-center py-6">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {statusCounts.breakdown}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('equipment:status.breakdown')}</div>
          </Card.Content>
        </Card>
      </div>

      {/* 설비 목록 */}
      <Card>
        <Card.Header>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('equipment:management.equipmentList')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('equipment:management.equipmentListDescription')}
          </p>
        </Card.Header>
        <Card.Content>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('equipment:fields.equipmentName')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('equipment:fields.equipmentNumber')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('equipment:fields.category')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('equipment:fields.location')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('equipment:fields.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('common:actions.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {equipments.map((equipment) => {
                  const equipmentStatus = equipmentStatuses.find(status => status.equipmentId === equipment.id)
                  
                  return (
                    <tr key={equipment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {equipment.equipmentName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {equipment.equipmentNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {settings.equipment.categories.find(cat => cat.value === equipment.category)?.label || equipment.category}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {equipment.location ? settings.equipment.locations.find(loc => loc.value === equipment.location)?.label || equipment.location : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {equipmentStatus ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(equipmentStatus.status)}`}>
                            {getStatusText(equipmentStatus.status, t)}
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                            {t('equipment:status.unknown')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(equipment)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title={t('common:actions.viewDetails')}
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleEdit(equipment)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title={t('common:actions.editItem')}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(equipment)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title={t('common:actions.deleteItem')}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {equipments.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('equipment:management.noEquipment')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('equipment:management.noEquipmentDescription')}
              </p>
              <Button onClick={downloadTemplate} variant="secondary">
                📁 {t('equipment:management.downloadTemplate')}
              </Button>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* 상세보기 모달 */}
      {showDetailsModal && selectedEquipment && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedEquipment(null)
          }}
          title={t('common:modals.viewDetails')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.equipmentName')}
              </label>
              <p className="text-gray-900 dark:text-white">{selectedEquipment.equipmentName}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.equipmentNumber')}
              </label>
              <p className="text-gray-900 dark:text-white">{selectedEquipment.equipmentNumber}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.category')}
              </label>
              <p className="text-gray-900 dark:text-white">
                {settings.equipment.categories.find(cat => cat.value === selectedEquipment.category)?.label || selectedEquipment.category}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.location')}
              </label>
              <p className="text-gray-900 dark:text-white">
                {selectedEquipment.location ? settings.equipment.locations.find(loc => loc.value === selectedEquipment.location)?.label || selectedEquipment.location : '-'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.manufacturer')}
              </label>
              <p className="text-gray-900 dark:text-white">{selectedEquipment.manufacturer || '-'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.model')}
              </label>
              <p className="text-gray-900 dark:text-white">{selectedEquipment.model || '-'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.installationDate')}
              </label>
              <p className="text-gray-900 dark:text-white">
                {selectedEquipment.installationDate ? new Date(selectedEquipment.installationDate).toLocaleDateString() : '-'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.specifications')}
              </label>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedEquipment.specifications || '-'}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* 편집 모달 */}
      {showEditModal && selectedEquipment && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedEquipment(null)
            setEditFormData({})
          }}
          title={t('common:modals.editItem')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.equipmentName')} *
              </label>
              <input
                type="text"
                value={editFormData.equipmentName || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, equipmentName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.equipmentNumber')} *
              </label>
              <input
                type="text"
                value={editFormData.equipmentNumber || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, equipmentNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.category')} *
              </label>
              <select
                value={editFormData.category || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">{t('common:select')}</option>
                {settings.equipment.categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.location')}
              </label>
              <select
                value={editFormData.location || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">{t('common:select')}</option>
                {settings.equipment.locations.map(loc => (
                  <option key={loc.value} value={loc.value}>{loc.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.manufacturer')}
              </label>
              <input
                type="text"
                value={editFormData.manufacturer || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.model')}
              </label>
              <input
                type="text"
                value={editFormData.model || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, model: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.installationDate')}
              </label>
              <input
                type="date"
                value={editFormData.installationDate || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, installationDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.specifications')}
              </label>
              <textarea
                value={editFormData.specifications || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, specifications: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedEquipment(null)
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
      {showDeleteModal && selectedEquipment && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedEquipment(null)
          }}
          title={t('common:modals.deleteConfirm')}
        >
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              {t('common:modals.deleteConfirmMessage')}
            </p>
            
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('equipment:fields.equipmentName')}: <span className="font-medium text-gray-900 dark:text-white">{selectedEquipment.equipmentName}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('equipment:fields.equipmentNumber')}: <span className="font-medium text-gray-900 dark:text-white">{selectedEquipment.equipmentNumber}</span>
              </p>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedEquipment(null)
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