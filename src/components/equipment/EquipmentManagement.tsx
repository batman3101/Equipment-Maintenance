'use client'

import React, { useState, useRef } from 'react'
import * as ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { Button, Card } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { useSystemSettings } from '@/contexts/SystemSettingsContext'
import { useTranslation } from 'react-i18next'

interface Equipment {
  id: string
  equipmentType: string
  equipmentNumber: string
  location: string
  installDate: string
  status: 'operational' | 'maintenance' | 'broken' | 'test' | 'idle'
}


// Mock equipment data
const mockEquipments: Equipment[] = [
  {
    id: '1',
    equipmentType: 'CNC',
    equipmentNumber: 'CNC-001',
    location: 'BUILD_A',
    installDate: '2020-03-15',
    status: 'operational'
  },
  {
    id: '2',
    equipmentType: 'CLEANING',
    equipmentNumber: 'CLEAN-001',
    location: 'BUILD_A',
    installDate: '2019-11-20',
    status: 'maintenance'
  },
  {
    id: '3',
    equipmentType: 'DEBURRING',
    equipmentNumber: 'DEBUR-001',
    location: 'BUILD_B',
    installDate: '2021-08-10',
    status: 'operational'
  }
]

const getStatusColor = (status: string, settings: { equipment: { statuses: Array<{ value: string; label: string; color: string }> } }) => {
  const statusConfig = settings.equipment.statuses.find((s) => s.value === status)
  if (!statusConfig) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  
  const colorMap: Record<string, string> = {
    green: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
    red: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
  
  return colorMap[statusConfig.color] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
}

const getStatusText = (status: string, settings: { equipment: { statuses: Array<{ value: string; label: string; color: string }> } }, t: (key: string) => string) => {
  const statusConfig = settings.equipment.statuses.find((s) => s.value === status)
  return statusConfig?.label || t('equipment:status.unknown')
}

export function EquipmentManagement() {
  const { t } = useTranslation(['equipment', 'common'])
  const { showSuccess, showError, showWarning } = useToast()
  const { getTranslatedSettings } = useSystemSettings()
  const settings = getTranslatedSettings()
  const [equipments, setEquipments] = useState<Equipment[]>(mockEquipments)
  const [isUploading, setIsUploading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEquipment, setNewEquipment] = useState<Partial<Equipment>>({
    equipmentType: '',
    equipmentNumber: '',
    location: '',
    installDate: new Date().toISOString().split('T')[0],
    status: settings.equipment.defaultStatus as Equipment['status']
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

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
            equipmentType: String(row[equipmentTypeKey]),
            equipmentNumber: String(row[equipmentNumberKey]),
            location: String(row[locationKey] || settings.equipment.locations[0]?.value || ''),
            installDate: String(row[installDateKey] || new Date().toISOString().split('T')[0]),
            status: status as Equipment['status']
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
  const handleAddEquipment = () => {
    // 필수 필드 검증
    if (!newEquipment.equipmentType || !newEquipment.equipmentNumber) {
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

    // 새 설비 추가
    const equipment: Equipment = {
      id: Date.now().toString(),
      equipmentType: newEquipment.equipmentType!,
      equipmentNumber: newEquipment.equipmentNumber!,
      location: newEquipment.location || settings.equipment.locations[0]?.value || '',
      installDate: newEquipment.installDate || new Date().toISOString().split('T')[0],
      status: newEquipment.status as Equipment['status'] || 'operational'
    }

    setEquipments(prev => [...prev, equipment])
    showSuccess(
      t('equipment:messages.registerSuccess'),
      t('equipment:messages.registerSuccessDetail', { equipmentNumber: equipment.equipmentNumber })
    )

    // 폼 초기화 및 닫기
    setNewEquipment({
      equipmentType: '',
      equipmentNumber: '',
      location: '',
      installDate: new Date().toISOString().split('T')[0],
      status: settings.equipment.defaultStatus as Equipment['status']
    })
    setShowAddForm(false)
  }

  // 개별 등록 폼 취소
  const handleCancelAdd = () => {
    setShowAddForm(false)
    setNewEquipment({
      equipmentType: '',
      equipmentNumber: '',
      location: '',
      installDate: new Date().toISOString().split('T')[0],
      status: settings.equipment.defaultStatus as Equipment['status']
    })
  }

  // 설비 현황 통계
  const statusCounts = equipments.reduce((acc, equipment) => {
    acc[equipment.status] = (acc[equipment.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

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
              {/* 1. 설비 종류 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('equipment:fields.equipmentType')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={newEquipment.equipmentType || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, equipmentType: e.target.value }))}
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

              {/* 2. 설비 번호 */}
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

              {/* 3. 설비 위치 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('equipment:fields.location')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={newEquipment.location || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, location: e.target.value }))}
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

              {/* 4. 설치 일자 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('equipment:fields.installDate')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newEquipment.installDate || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, installDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 5. 상태 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('equipment:fields.status')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={newEquipment.status || settings.equipment.defaultStatus}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, status: e.target.value as Equipment['status'] }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {settings.equipment.statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
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
              {statusCounts.operational || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('equipment:management.operational')}</div>
          </Card.Content>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
          <Card.Content className="text-center py-6">
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {statusCounts.maintenance || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('equipment:management.maintenance')}</div>
          </Card.Content>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <Card.Content className="text-center py-6">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {statusCounts.broken || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('equipment:management.broken')}</div>
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
                    {t('equipment:fields.equipmentType')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('equipment:fields.equipmentNumber')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('equipment:fields.location')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('equipment:fields.installDate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('equipment:fields.status')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {equipments.map((equipment) => (
                  <tr key={equipment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {settings.equipment.categories.find(category => category.value === equipment.equipmentType)?.label || equipment.equipmentType}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {equipment.equipmentNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {settings.equipment.locations.find(loc => loc.value === equipment.location)?.label || equipment.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(equipment.installDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(equipment.status, settings)}`}>
                        {getStatusText(equipment.status, settings, t)}
                      </span>
                    </td>
                  </tr>
                ))}
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
    </div>
  )
}