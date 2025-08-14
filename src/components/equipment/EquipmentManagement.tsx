'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { saveAs } from 'file-saver'
import { createSimpleExcelTemplate, downloadBlob } from '@/lib/excel-utils'
import { Button, Card, Modal } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { useSystemSettings } from '@/contexts/SystemSettingsContext'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { Equipment, EquipmentStatusInfo as EquipmentStatus } from '@/types/equipment'


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
  const { user } = useAuth()
  const settings = getTranslatedSettings()
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [equipmentStatuses, setEquipmentStatuses] = useState<EquipmentStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<Equipment>>({})
  const [editEquipmentStatus, setEditEquipmentStatus] = useState<string>('')
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
  const [newEquipmentStatus, setNewEquipmentStatus] = useState<string>('running')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 검색, 필터, 정렬 상태
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Supabase에서 설비 데이터 가져오기
  useEffect(() => {
    fetchEquipments()
  }, [])

  const fetchEquipments = useCallback(async () => {
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
  }, [t])

  // 필터링된 설비 목록 계산
  const filteredAndSortedEquipments = useMemo(() => {
    let filtered = equipments

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(equipment => 
        equipment.equipmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipment.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipment.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (equipment.manufacturer && equipment.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (equipment.model && equipment.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (equipment.location && equipment.location.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // 카테고리 필터링
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(equipment => equipment.category === categoryFilter)
    }

    // 상태 필터링
    if (statusFilter !== 'all') {
      filtered = filtered.filter(equipment => {
        const status = equipmentStatuses.find(s => s.equipmentId === equipment.id)
        return status?.status === statusFilter
      })
    }

    // 정렬
    filtered = [...filtered].sort((a, b) => {
      let aValue: string | number | Date, bValue: string | number | Date

      switch (sortBy) {
        case 'equipmentNumber':
          aValue = a.equipmentNumber
          bValue = b.equipmentNumber
          break
        case 'equipmentName':
          aValue = a.equipmentName
          bValue = b.equipmentName
          break
        case 'category':
          aValue = a.category
          bValue = b.category
          break
        case 'location':
          aValue = a.location || ''
          bValue = b.location || ''
          break
        case 'status':
          const statusA = equipmentStatuses.find(s => s.equipmentId === a.id)
          const statusB = equipmentStatuses.find(s => s.equipmentId === b.id)
          aValue = statusA?.status || 'unknown'
          bValue = statusB?.status || 'unknown'
          break
        case 'created_at':
        default:
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [equipments, equipmentStatuses, searchTerm, statusFilter, categoryFilter, sortBy, sortOrder])

  // 카테고리 목록 계산
  const availableCategories = useMemo(() => {
    const categories = Array.from(new Set(equipments.map(eq => eq.category)))
    return categories.sort()
  }, [equipments])

  // Excel 템플릿 다운로드
  const downloadTemplate = async () => {
    if (isDownloadingTemplate) return
    
    setIsDownloadingTemplate(true)
    try {
      console.log('Starting template download...')
      
      // 헤더 준비 (실제 데이터베이스 스키마에 맞춰 수정)
      const headers = [
        t('equipment:excel.columns.equipmentName'),    // equipment_name
        t('equipment:excel.columns.equipmentNumber'),  // equipment_number
        t('equipment:excel.columns.category'),         // category  
        t('equipment:excel.columns.location'),         // location
        t('equipment:excel.columns.installDate'),      // installation_date
        t('equipment:excel.columns.status'),           // status
        '제조사',                                      // manufacturer
        '모델명',                                      // model
        '사양'                                         // specifications
      ]
      
      // 샘플 데이터 (실제 스키마에 맞춤)
      const sampleData = [
        'CNC 밀링머신',        // equipment_name
        'CNC-002',            // equipment_number
        'CNC',                // category
        'BUILD_A',            // location
        '2024-01-15',         // installation_date
        'running',            // status (running, breakdown, standby, maintenance, stopped)
        '한화정밀',           // manufacturer
        'HM-500',             // model
        '최대 가공: 500x400x300mm' // specifications
      ]
      
      // Excel 파일 생성
      const blob = await createSimpleExcelTemplate(
        t('equipment:excel.sheetName'),
        headers,
        sampleData
      )
      
      // 파일 다운로드
      const fileName = `설비관리_템플릿_${new Date().toISOString().split('T')[0]}.xlsx`
      console.log('Downloading template file:', fileName)
      downloadBlob(blob, fileName)
      
      showSuccess(
        '템플릿 다운로드 완료',
        '설비 관리 템플릿이 성공적으로 다운로드되었습니다.'
      )
      console.log('Template download completed successfully')
    } catch (error) {
      console.error('Template download failed:', error)
      showError(
        '템플릿 다운로드 실패', 
        `템플릿 다운로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      )
    } finally {
      setIsDownloadingTemplate(false)
    }
  }

  // Excel 파일 업로드 처리
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const data = await file.arrayBuffer()
      
      // ExcelJS를 동적으로 로드
      const ExcelJS = require('exceljs')
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(data)
      const worksheet = workbook.getWorksheet(1)
      
      // Excel 데이터를 JSON 형태로 변환
      const jsonData: Record<string, unknown>[] = []
      const headerRow = worksheet?.getRow(1)
      const headers = headerRow?.values as string[]
      
      worksheet?.eachRow((row: any, rowNumber: number) => {
        if (rowNumber > 1) { // 헤더 행 제외
          const rowData: Record<string, unknown> = {}
          row.eachCell((cell: any, colNumber: number) => {
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
          // 필수 필드 키 (실제 스키마에 맞춰 간소화)
          const equipmentNameKey = t('equipment:excel.columns.equipmentName') || '설비명'
          const equipmentNumberKey = t('equipment:excel.columns.equipmentNumber') || '설비번호'
          const categoryKey = t('equipment:excel.columns.category') || '카테고리'
          const locationKey = t('equipment:excel.columns.location') || '설비위치'
          const installDateKey = t('equipment:excel.columns.installDate') || '설치일자'
          const statusKey = t('equipment:excel.columns.status') || '상태'
          const manufacturerKey = '제조사'
          const modelKey = '모델명'
          const specificationsKey = '사양'
          
          if (!row[equipmentNameKey] || !row[equipmentNumberKey] || !row[categoryKey]) {
            validationErrors.push(t('equipment:messages.validationError', { 
              row: index + 2, 
              message: '설비명, 설비번호, 카테고리는 필수 입력 항목입니다.' 
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
          const validStatuses = ['running', 'breakdown', 'standby', 'maintenance', 'stopped']
          const status = String(row[statusKey] || 'running')
          if (!validStatuses.includes(status)) {
            validationErrors.push(t('equipment:messages.validationError', {
              row: index + 2,
              message: `유효하지 않은 상태값입니다. 허용 값: ${validStatuses.join(', ')}`
            }))
            return
          }

          const equipment: Equipment & { statusFromExcel?: string } = {
            id: Date.now().toString() + index,
            equipmentNumber: String(row[equipmentNumberKey]),
            equipmentName: String(row[equipmentNameKey]),
            category: String(row[categoryKey]),
            location: String(row[locationKey] || ''),
            manufacturer: row[manufacturerKey] ? String(row[manufacturerKey]) : null,
            model: row[modelKey] ? String(row[modelKey]) : null,
            installationDate: (() => {
              const dateValue = row[installDateKey];
              if (!dateValue) return new Date().toISOString().split('T')[0];
              
              try {
                // Excel에서 날짜는 다양한 형식으로 올 수 있음
                if (dateValue instanceof Date) {
                  return dateValue.toISOString().split('T')[0];
                }
                
                // 문자열인 경우 Date로 변환
                const date = new Date(String(dateValue));
                if (isNaN(date.getTime())) {
                  console.warn('Invalid date in Excel:', dateValue);
                  return new Date().toISOString().split('T')[0];
                }
                
                return date.toISOString().split('T')[0];
              } catch (error) {
                console.warn('Date conversion error:', dateValue, error);
                return new Date().toISOString().split('T')[0];
              }
            })(),
            specifications: row[specificationsKey] ? String(row[specificationsKey]) : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            statusFromExcel: status
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
        // Supabase에 설비 데이터 저장 (실제 스키마에 맞춰 수정)
        try {
          const equipmentsToInsert = newEquipments.map(eq => ({
            equipment_number: eq.equipmentNumber,
            equipment_name: eq.equipmentName,
            category: eq.category,
            location: eq.location || null,
            manufacturer: eq.manufacturer || null,
            model: eq.model || null,
            installation_date: (() => {
              if (!eq.installationDate || eq.installationDate === '') return null;
              
              try {
                // Excel 날짜 형식을 안전하게 처리
                const date = new Date(eq.installationDate);
                if (isNaN(date.getTime())) return null;
                return date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
              } catch (error) {
                console.warn('Invalid date format:', eq.installationDate);
                return null;
              }
            })(),
            specifications: eq.specifications || null
          }))

          console.log('Inserting equipments:', equipmentsToInsert)
          console.log('Current user:', user)
          console.log('User auth status:', !!user)
          
          // 사용자 프로필 조회해서 권한 확인
          if (user) {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single()
              
            console.log('User profile:', profile)
            console.log('User role:', profile?.role)
            console.log('Profile error:', profileError)
          }
          
          // 권한 문제 해결을 위해 service role로 실행 시도
          let insertedEquipments: any[] = []
          let insertError: any = null
          
          try {
            // 먼저 일반 사용자 권한으로 시도
            const result = await supabase
              .from('equipment_info')
              .insert(equipmentsToInsert)
              .select()
              
            insertedEquipments = result.data || []
            insertError = result.error
            
            // 권한 오류인 경우, API 라우트를 통해 처리
            if (insertError && (insertError.code === '42501' || insertError.code === 'PGRST301')) {
              console.log('Permission denied, trying API route...')
              
              const response = await fetch('/api/equipment/bulk-insert', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ equipments: equipmentsToInsert })
              })
              
              if (response.ok) {
                const apiResult = await response.json()
                insertedEquipments = apiResult.data || []
                insertError = null
              } else {
                const errorResult = await response.json()
                insertError = { message: errorResult.error || 'API request failed' }
              }
            }
          } catch (error) {
            console.error('Insert attempt failed:', error)
            insertError = error
          }

          if (insertError) {
            console.error('Error inserting equipment:', insertError)
            console.error('Insert error details:', insertError.details)
            console.error('Insert error hint:', insertError.hint)
            console.error('Insert error code:', insertError.code)
            showError(
              '설비 저장 실패',
              `데이터베이스 저장 중 오류가 발생했습니다: ${insertError.message}`
            )
            return
          }

          // 각 설비에 대한 상태 정보도 생성
          if (insertedEquipments && insertedEquipments.length > 0) {
            const statusesToInsert = insertedEquipments.map((eq, index) => {
              // Excel에서 지정한 상태를 사용, 없으면 기본값 'running'
              const equipmentWithStatus = newEquipments[index] as Equipment & { statusFromExcel?: string }
              const status = equipmentWithStatus?.statusFromExcel || 'running'
              
              return {
                equipment_id: eq.id,
                status: status,
                status_reason: status === 'running' ? '초기 설정' : `Excel 업로드 - ${status}`,
                updated_by: user?.id || null,
                status_changed_at: new Date().toISOString()
              }
            })

            try {
              const { error: statusError } = await supabase
                .from('equipment_status')
                .insert(statusesToInsert)

              if (statusError && (statusError.code === '42501' || statusError.code === 'PGRST301')) {
                // 권한 오류인 경우 API를 통해 처리
                const response = await fetch('/api/equipment/bulk-status', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ statuses: statusesToInsert })
                })
                
                if (!response.ok) {
                  console.error('Status API failed:', await response.text())
                  showWarning(
                    '설비 상태 저장 부분적 실패',
                    '설비는 저장되었지만 일부 상태 정보 저장에 실패했습니다.'
                  )
                }
              } else if (statusError) {
                console.error('Error inserting equipment status:', statusError)
                // 상태 저장 실패는 경고로만 처리
                showWarning(
                  '설비 상태 저장 부분적 실패',
                  '설비는 저장되었지만 일부 상태 정보 저장에 실패했습니다.'
                )
              }
            } catch (error) {
              console.error('Status insert failed:', error)
              showWarning(
                '설비 상태 저장 부분적 실패',
                '설비는 저장되었지만 일부 상태 정보 저장에 실패했습니다.'
              )
            }
          }

          // 성공적으로 저장된 후 목록 새로고침
          await fetchEquipments()
          showSuccess(
            '업로드 성공',
            `${newEquipments.length}개의 설비가 성공적으로 등록되었습니다.`
          )
        } catch (dbError) {
          console.error('Database save error:', dbError)
          showError(
            '데이터베이스 저장 실패',
            '설비 데이터 저장 중 예상치 못한 오류가 발생했습니다.'
          )
        }
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

      // 설비 상태 정보 추가
      const { error: statusError } = await supabase
        .from('equipment_status')
        .insert({
          equipment_id: data.id,
          status: newEquipmentStatus || 'running',
          status_changed_at: new Date().toISOString()
        })

      if (statusError) {
        console.error('Error adding equipment status:', statusError)
        // 상태 추가 실패해도 설비는 이미 추가되었으므로 계속 진행
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
      
      // 상태 정보도 로컬에 추가
      if (!statusError) {
        const newStatus: EquipmentStatus = {
          id: crypto.randomUUID(),
          equipmentId: data.id,
          status: (newEquipmentStatus || 'running') as EquipmentStatus['status'],
          statusReason: null,
          updatedBy: null,
          statusChangedAt: new Date().toISOString(),
          lastMaintenanceDate: null,
          nextMaintenanceDate: null,
          operatingHours: null,
          notes: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setEquipmentStatuses(prev => [...prev, newStatus])
      }
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
    setNewEquipmentStatus('operational')
    setShowAddForm(false)
  }

  // 개별 등록 폼 취소
  const handleCancelAdd = () => {
    setShowAddForm(false)
    setNewEquipmentStatus('operational')
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
    // 현재 설비 상태 가져오기
    const currentStatus = equipmentStatuses.find(s => s.equipmentId === equipment.id)
    setEditEquipmentStatus(currentStatus?.status || settings.equipment.defaultStatus || 'operational')
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

      // 설비 상태 업데이트
      const currentStatus = equipmentStatuses.find(s => s.equipmentId === selectedEquipment.id)
      if (currentStatus && currentStatus.status !== editEquipmentStatus) {
        const { error: statusError } = await supabase
          .from('equipment_status')
          .update({
            status: editEquipmentStatus,
            status_changed_at: new Date().toISOString()
          })
          .eq('equipment_id', selectedEquipment.id)
        
        if (statusError) {
          console.error('Error updating equipment status:', statusError)
        } else {
          // 로컬 상태 업데이트
          setEquipmentStatuses(prev => prev.map(s => 
            s.equipmentId === selectedEquipment.id 
              ? { ...s, status: editEquipmentStatus as EquipmentStatus['status'], statusChangedAt: new Date().toISOString() }
              : s
          ))
        }
      } else if (!currentStatus) {
        // 상태가 없으면 새로 생성
        const { error: statusError } = await supabase
          .from('equipment_status')
          .insert({
            equipment_id: selectedEquipment.id,
            status: editEquipmentStatus,
            status_changed_at: new Date().toISOString()
          })
        
        if (statusError) {
          console.error('Error creating equipment status:', statusError)
        } else {
          const newStatus: EquipmentStatus = {
            id: crypto.randomUUID(),
            equipmentId: selectedEquipment.id,
            status: editEquipmentStatus as EquipmentStatus['status'],
            statusReason: null,
            updatedBy: null,
            statusChangedAt: new Date().toISOString(),
            lastMaintenanceDate: null,
            nextMaintenanceDate: null,
            operatingHours: null,
            notes: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          setEquipmentStatuses(prev => [...prev, newStatus])
        }
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
      setEditEquipmentStatus('')
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
            disabled={isDownloadingTemplate}
            className="flex items-center space-x-2"
          >
            <span>{isDownloadingTemplate ? '⏳' : '📁'}</span>
            <span>{isDownloadingTemplate ? '다운로드 중...' : t('equipment:management.downloadTemplate')}</span>
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
            aria-label="Excel upload"
            title="Excel upload"
          />
        </div>
      </div>

      {/* 검색 및 필터 섹션 */}
      <Card>
        <Card.Content className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* 검색 */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('equipment:management.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
              </div>
            </div>

            {/* 카테고리 필터 */}
            <div className="lg:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{t('equipment:management.allCategories')}</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* 상태 필터 */}
            <div className="lg:w-36">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{t('equipment:management.allStatuses')}</option>
                <option value="running">{t('equipment:status.running')}</option>
                <option value="breakdown">{t('equipment:status.breakdown')}</option>
                <option value="standby">{t('equipment:status.standby')}</option>
                <option value="maintenance">{t('equipment:status.maintenance')}</option>
                <option value="stopped">{t('equipment:status.stopped')}</option>
              </select>
            </div>

            {/* 정렬 */}
            <div className="lg:w-44">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="created_at">{t('equipment:management.sortBy.date')}</option>
                <option value="equipmentNumber">{t('equipment:management.sortBy.number')}</option>
                <option value="equipmentName">{t('equipment:management.sortBy.name')}</option>
                <option value="category">{t('equipment:management.sortBy.category')}</option>
                <option value="location">{t('equipment:management.sortBy.location')}</option>
                <option value="status">{t('equipment:management.sortBy.status')}</option>
              </select>
            </div>

            {/* 정렬 순서 */}
            <div className="lg:w-20">
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                title={sortOrder === 'asc' ? t('equipment:management.sortAsc') : t('equipment:management.sortDesc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* 결과 요약 */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div>
              {filteredAndSortedEquipments.length === equipments.length ? (
                <span>{t('equipment:management.totalEquipments', { count: equipments.length })}</span>
              ) : (
                <span>
                  {t('equipment:management.filteredEquipments', { 
                    filtered: filteredAndSortedEquipments.length, 
                    total: equipments.length 
                  })}
                </span>
              )}
            </div>
            {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setCategoryFilter('all')
                  setStatusFilter('all')
                }}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {t('equipment:management.clearFilters')}
              </button>
            )}
          </div>
        </Card.Content>
      </Card>

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
                <label htmlFor="newEquipmentName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('equipment:fields.equipmentName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newEquipment.equipmentName || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, equipmentName: e.target.value }))}
                  id="newEquipmentName"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('equipment:placeholders.equipmentNamePlaceholder')}
                />
              </div>

              {/* 2. 카테고리 */}
              <div>
                <label htmlFor="newCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('equipment:fields.category')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={newEquipment.category || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, category: e.target.value }))}
                  id="newCategory"
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
                <label htmlFor="newEquipmentNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('equipment:fields.equipmentNumber')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newEquipment.equipmentNumber || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, equipmentNumber: e.target.value }))}
                  id="newEquipmentNumber"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('equipment:placeholders.equipmentNumberExample')}
                />
              </div>

              {/* 4. 설비 위치 */}
              <div>
                <label htmlFor="newLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('equipment:fields.location')}
                </label>
                <select
                  value={newEquipment.location || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, location: e.target.value || null }))}
                  id="newLocation"
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
                <label htmlFor="newManufacturer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('equipment:fields.manufacturer')}
                </label>
                <input
                  type="text"
                  value={newEquipment.manufacturer || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, manufacturer: e.target.value || null }))}
                  id="newManufacturer"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('equipment:placeholders.manufacturerPlaceholder')}
                />
              </div>

              {/* 6. 모델 */}
              <div>
                <label htmlFor="newModel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('equipment:fields.model')}
                </label>
                <input
                  type="text"
                  value={newEquipment.model || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, model: e.target.value || null }))}
                  id="newModel"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('equipment:placeholders.modelPlaceholder')}
                />
              </div>

              {/* 7. 설치 일자 */}
              <div>
                <label htmlFor="newInstallDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('equipment:fields.installDate')}
                </label>
                <input
                  type="date"
                  value={newEquipment.installationDate || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, installationDate: e.target.value || null }))}
                  id="newInstallDate"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 8. 설비 상태 */}
              <div>
                <label htmlFor="newStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('equipment:fields.status')}
                </label>
                <select
                  value={newEquipmentStatus}
                  onChange={(e) => setNewEquipmentStatus(e.target.value)}
                  id="newStatus"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {settings.equipment.statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 9. 사양 */}
              <div className="md:col-span-2">
                <label htmlFor="newSpecifications" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('equipment:fields.specifications')}
                </label>
                <textarea
                  value={newEquipment.specifications || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, specifications: e.target.value || null }))}
                  rows={3}
                  id="newSpecifications"
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
                {filteredAndSortedEquipments.map((equipment) => {
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
                        {(() => {
                          const defaultStatus = 'running';
                          const status = equipmentStatus?.status || defaultStatus;
                          const colorClass = getStatusColor(status);
                          
                          return (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorClass}`}>
                              {getStatusText(status, t)}
                            </span>
                          );
                        })()}
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
              <Button 
                onClick={downloadTemplate} 
                variant="secondary"
                disabled={isDownloadingTemplate}
              >
                {isDownloadingTemplate ? '⏳' : '📁'} {isDownloadingTemplate ? '다운로드 중...' : t('equipment:management.downloadTemplate')}
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
          title={t('equipment:modals.detailsTitle')}
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
          title={t('equipment:modals.editTitle')}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="editEquipmentName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.equipmentName')} *
              </label>
              <input
                type="text"
                value={editFormData.equipmentName || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, equipmentName: e.target.value }))}
                id="editEquipmentName"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label htmlFor="editEquipmentNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.equipmentNumber')} *
              </label>
              <input
                type="text"
                value={editFormData.equipmentNumber || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, equipmentNumber: e.target.value }))}
                id="editEquipmentNumber"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label htmlFor="editCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.category')} *
              </label>
              <select
                value={editFormData.category || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                id="editCategory"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">{t('common:select')}</option>
                {settings.equipment.categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="editLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.location')}
              </label>
              <select
                value={editFormData.location || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                id="editLocation"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">{t('common:select')}</option>
                {settings.equipment.locations.map(loc => (
                  <option key={loc.value} value={loc.value}>{loc.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="editManufacturer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.manufacturer')}
              </label>
              <input
                type="text"
                value={editFormData.manufacturer || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                id="editManufacturer"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label htmlFor="editModel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.model')}
              </label>
              <input
                type="text"
                value={editFormData.model || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, model: e.target.value }))}
                id="editModel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label htmlFor="editInstallationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.installationDate')}
              </label>
              <input
                type="date"
                value={editFormData.installationDate || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, installationDate: e.target.value }))}
                id="editInstallationDate"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label htmlFor="editStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.status')}
              </label>
              <select
                value={editEquipmentStatus}
                onChange={(e) => setEditEquipmentStatus(e.target.value)}
                id="editStatus"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {settings.equipment.statuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="editSpecifications" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('equipment:fields.specifications')}
              </label>
              <textarea
                value={editFormData.specifications || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, specifications: e.target.value }))}
                rows={3}
                id="editSpecifications"
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
                  setEditEquipmentStatus('')
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
          title={t('equipment:modals.deleteConfirmTitle')}
        >
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              {t('equipment:modals.deleteConfirmMessage')}
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