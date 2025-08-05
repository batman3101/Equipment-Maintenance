'use client'

import React, { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { Button, Card } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'

interface Equipment {
  id: string
  equipmentNumber: string
  equipmentName: string
  model: string
  manufacturer: string
  location: string
  department: string
  installDate: string
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  status: 'operational' | 'maintenance' | 'broken' | 'idle'
  operatingHours: number
  notes?: string
}

// Mock equipment data
const mockEquipments: Equipment[] = [
  {
    id: '1',
    equipmentNumber: 'CNC-ML-001',
    equipmentName: 'CNC 밀링머신 #1',
    model: 'VMC-850E',
    manufacturer: 'DOOSAN',
    location: '1공장 A라인',
    department: '생산1팀',
    installDate: '2020-03-15',
    lastMaintenanceDate: '2024-01-10',
    nextMaintenanceDate: '2024-04-10',
    status: 'operational',
    operatingHours: 12480,
    notes: '정상 가동 중'
  },
  {
    id: '2',
    equipmentNumber: 'CNC-LT-001',
    equipmentName: 'CNC 선반 #1',
    model: 'PUMA-280Y',
    manufacturer: 'DOOSAN',
    location: '1공장 B라인',
    department: '생산1팀',
    installDate: '2019-11-20',
    lastMaintenanceDate: '2024-01-05',
    nextMaintenanceDate: '2024-04-05',
    status: 'maintenance',
    operatingHours: 15680,
    notes: '스핀들 베어링 교체 중'
  },
  {
    id: '3',
    equipmentNumber: 'CNC-DR-001',
    equipmentName: 'CNC 드릴링머신 #1',
    model: 'D-650',
    manufacturer: 'KITECH',
    location: '2공장 A라인',
    department: '생산2팀',
    installDate: '2021-08-10',
    lastMaintenanceDate: '2023-12-20',
    nextMaintenanceDate: '2024-03-20',
    status: 'operational',
    operatingHours: 8940,
    notes: '정상 가동 중'
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'operational': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
    case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
    case 'broken': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
    case 'idle': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'operational': return '가동중'
    case 'maintenance': return '정비중'
    case 'broken': return '고장'
    case 'idle': return '대기'
    default: return '알 수 없음'
  }
}

export function EquipmentManagement() {
  const { showSuccess, showError, showWarning } = useToast()
  const [equipments, setEquipments] = useState<Equipment[]>(mockEquipments)
  const [isUploading, setIsUploading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEquipment, setNewEquipment] = useState<Partial<Equipment>>({
    equipmentNumber: '',
    equipmentName: '',
    model: '',
    manufacturer: '',
    location: '',
    department: '',
    installDate: new Date().toISOString().split('T')[0],
    status: 'operational',
    operatingHours: 0,
    notes: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Excel 템플릿 다운로드
  const downloadTemplate = () => {
    const templateData = [
      {
        '설비번호': 'CNC-ML-002',
        '설비명': 'CNC 밀링머신 #2',
        '모델명': 'VMC-850E',
        '제조사': 'DOOSAN',
        '위치': '1공장 C라인',
        '담당부서': '생산1팀',
        '설치일자': '2024-01-15',
        '최근정비일': '2024-01-10',
        '다음정비일': '2024-04-10',
        '상태': 'operational',
        '가동시간': 0,
        '비고': '신규 설비'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '설비목록')

    // 컬럼 너비 조정
    ws['!cols'] = [
      { wch: 15 }, // 설비번호
      { wch: 20 }, // 설비명
      { wch: 15 }, // 모델명
      { wch: 12 }, // 제조사
      { wch: 15 }, // 위치
      { wch: 12 }, // 담당부서
      { wch: 12 }, // 설치일자
      { wch: 12 }, // 최근정비일
      { wch: 12 }, // 다음정비일
      { wch: 10 }, // 상태
      { wch: 10 }, // 가동시간
      { wch: 20 }  // 비고
    ]

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
    saveAs(blob, '설비목록_템플릿.xlsx')
  }

  // Excel 파일 업로드 처리
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      const newEquipments: Equipment[] = []
      const validationErrors = [] as string[]

      (jsonData as Record<string, unknown>[]).forEach((row: Record<string, unknown>, index: number) => {
        try {
          // 필수 필드 검증
          if (!row['설비번호'] || !row['설비명']) {
            validationErrors.push(`행 ${index + 2}: 설비번호와 설비명은 필수입니다.`)
            return
          }

          // 중복 설비번호 검증
          const existingEquipment = equipments.find(eq => eq.equipmentNumber === row['설비번호'])
          if (existingEquipment) {
            validationErrors.push(`행 ${index + 2}: 설비번호 '${row['설비번호']}'는 이미 존재합니다.`)
            return
          }

          // 상태 값 검증
          const validStatuses = ['operational', 'maintenance', 'broken', 'idle']
          const status = String(row['상태'] || 'operational')
          if (!validStatuses.includes(status)) {
            validationErrors.push(`행 ${index + 2}: 상태값은 'operational', 'maintenance', 'broken', 'idle' 중 하나여야 합니다.`)
            return
          }

          const equipment: Equipment = {
            id: Date.now().toString() + index,
            equipmentNumber: String(row['설비번호']),
            equipmentName: String(row['설비명']),
            model: String(row['모델명'] || ''),
            manufacturer: String(row['제조사'] || ''),
            location: String(row['위치'] || ''),
            department: String(row['담당부서'] || ''),
            installDate: String(row['설치일자'] || new Date().toISOString().split('T')[0]),
            lastMaintenanceDate: row['최근정비일'] ? String(row['최근정비일']) : undefined,
            nextMaintenanceDate: row['다음정비일'] ? String(row['다음정비일']) : undefined,
            status: status as Equipment['status'],
            operatingHours: Number(row['가동시간']) || 0,
            notes: row['비고'] ? String(row['비고']) : undefined
          }

          newEquipments.push(equipment)
        } catch (_error) {
          validationErrors.push(`행 ${index + 2}: 데이터 처리 중 오류가 발생했습니다.`)
        }
      })

      if (validationErrors.length > 0) {
        showError(
          '업로드 실패',
          validationErrors.slice(0, 3).join('\n') + (validationErrors.length > 3 ? `\n... 외 ${validationErrors.length - 3}개 오류` : ''),
          { duration: 8000 }
        )
      } else if (newEquipments.length === 0) {
        showWarning(
          '추가할 설비 없음',
          '파일 형식과 내용을 확인해주세요.'
        )
      } else {
        // 성공적으로 처리된 설비들을 추가
        setEquipments(prev => [...prev, ...newEquipments])
        showSuccess(
          '업로드 성공',
          `${newEquipments.length}개의 설비가 성공적으로 추가되었습니다.`
        )
      }
    } catch (error) {
      console.error('Excel file processing error:', error)
      showError(
        'Excel 파일 처리 오류',
        'Excel 파일 처리 중 오류가 발생했습니다. 파일 형식을 확인해주세요.'
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
    if (!newEquipment.equipmentNumber || !newEquipment.equipmentName) {
      showError(
        '필수 정보 누락',
        '설비번호와 설비명은 필수 입력 항목입니다.'
      )
      return
    }

    // 중복 설비번호 검증
    const existingEquipment = equipments.find(eq => eq.equipmentNumber === newEquipment.equipmentNumber)
    if (existingEquipment) {
      showError(
        '중복된 설비번호',
        `설비번호 '${newEquipment.equipmentNumber}'는 이미 존재합니다.`
      )
      return
    }

    // 새 설비 추가
    const equipment: Equipment = {
      id: Date.now().toString(),
      equipmentNumber: newEquipment.equipmentNumber!,
      equipmentName: newEquipment.equipmentName!,
      model: newEquipment.model || '',
      manufacturer: newEquipment.manufacturer || '',
      location: newEquipment.location || '',
      department: newEquipment.department || '',
      installDate: newEquipment.installDate || new Date().toISOString().split('T')[0],
      lastMaintenanceDate: newEquipment.lastMaintenanceDate || undefined,
      nextMaintenanceDate: newEquipment.nextMaintenanceDate || undefined,
      status: newEquipment.status as Equipment['status'] || 'operational',
      operatingHours: newEquipment.operatingHours || 0,
      notes: newEquipment.notes || undefined
    }

    setEquipments(prev => [...prev, equipment])
    showSuccess(
      '등록 성공',
      `설비 '${equipment.equipmentName}'이 성공적으로 등록되었습니다.`
    )

    // 폼 초기화 및 닫기
    setNewEquipment({
      equipmentNumber: '',
      equipmentName: '',
      model: '',
      manufacturer: '',
      location: '',
      department: '',
      installDate: new Date().toISOString().split('T')[0],
      status: 'operational',
      operatingHours: 0,
      notes: ''
    })
    setShowAddForm(false)
  }

  // 개별 등록 폼 취소
  const handleCancelAdd = () => {
    setShowAddForm(false)
    setNewEquipment({
      equipmentNumber: '',
      equipmentName: '',
      model: '',
      manufacturer: '',
      location: '',
      department: '',
      installDate: new Date().toISOString().split('T')[0],
      status: 'operational',
      operatingHours: 0,
      notes: ''
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
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">설비 관리</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            전체 설비 현황을 관리하고 Excel을 통해 일괄 등록할 수 있습니다
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <span>➕</span>
            <span>개별 등록</span>
          </Button>
          <Button
            variant="secondary"
            onClick={downloadTemplate}
            className="flex items-center space-x-2"
          >
            <span>📁</span>
            <span>템플릿 다운로드</span>
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            disabled={isUploading}
          >
            <span>📤</span>
            <span>{isUploading ? '업로드 중...' : 'Excel 업로드'}</span>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">새 설비 등록</h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancelAdd}
                className="text-gray-600 hover:text-gray-800"
              >
                ❌ 취소
              </Button>
            </div>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 필수 정보 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  설비번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newEquipment.equipmentNumber || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, equipmentNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: CNC-ML-002"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  설비명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newEquipment.equipmentName || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, equipmentName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: CNC 밀링머신 #2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  모델명
                </label>
                <input
                  type="text"
                  value={newEquipment.model || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: VMC-850E"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  제조사
                </label>
                <input
                  type="text"
                  value={newEquipment.manufacturer || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, manufacturer: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: DOOSAN"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  위치
                </label>
                <input
                  type="text"
                  value={newEquipment.location || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 1공장 C라인"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  담당부서
                </label>
                <input
                  type="text"
                  value={newEquipment.department || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 생산1팀"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  설치일자
                </label>
                <input
                  type="date"
                  value={newEquipment.installDate || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, installDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  상태
                </label>
                <select
                  value={newEquipment.status || 'operational'}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, status: e.target.value as Equipment['status'] }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="operational">가동중</option>
                  <option value="maintenance">정비중</option>
                  <option value="broken">고장</option>
                  <option value="idle">대기</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  가동시간 (시간)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newEquipment.operatingHours || 0}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, operatingHours: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  최근 정비일
                </label>
                <input
                  type="date"
                  value={newEquipment.lastMaintenanceDate || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, lastMaintenanceDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  다음 정비일
                </label>
                <input
                  type="date"
                  value={newEquipment.nextMaintenanceDate || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, nextMaintenanceDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  비고
                </label>
                <textarea
                  value={newEquipment.notes || ''}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="설비에 대한 추가 정보를 입력하세요"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={handleCancelAdd}
              >
                취소
              </Button>
              <Button
                onClick={handleAddEquipment}
                className="bg-blue-600 hover:bg-blue-700"
              >
                ✅ 등록하기
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
            <div className="text-sm text-gray-600 dark:text-gray-400">전체 설비</div>
          </Card.Content>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <Card.Content className="text-center py-6">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {statusCounts.operational || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">가동중</div>
          </Card.Content>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
          <Card.Content className="text-center py-6">
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {statusCounts.maintenance || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">정비중</div>
          </Card.Content>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <Card.Content className="text-center py-6">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {statusCounts.broken || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">고장</div>
          </Card.Content>
        </Card>
      </div>

      {/* 설비 목록 */}
      <Card>
        <Card.Header>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">설비 목록</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            등록된 설비 목록을 확인하고 관리할 수 있습니다
          </p>
        </Card.Header>
        <Card.Content>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    설비 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    위치/부서
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    가동시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    다음 정비일
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {equipments.map((equipment) => (
                  <tr key={equipment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {equipment.equipmentName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {equipment.equipmentNumber} · {equipment.model} ({equipment.manufacturer})
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{equipment.location}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{equipment.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(equipment.status)}`}>
                        {getStatusText(equipment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {equipment.operatingHours.toLocaleString()}시간
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {equipment.nextMaintenanceDate 
                        ? new Date(equipment.nextMaintenanceDate).toLocaleDateString() 
                        : '-'
                      }
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
                등록된 설비가 없습니다
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Excel 템플릿을 다운로드하여 설비를 일괄 등록해보세요
              </p>
              <Button onClick={downloadTemplate} variant="secondary">
                📁 템플릿 다운로드
              </Button>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  )
}