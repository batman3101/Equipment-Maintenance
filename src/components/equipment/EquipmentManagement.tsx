'use client'

import React, { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { Button, Card } from '@/components/ui'

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
  const [equipments, setEquipments] = useState<Equipment[]>(mockEquipments)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    success: boolean
    message: string
    addedCount?: number
  } | null>(null)
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
    setUploadResult(null)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      const newEquipments: Equipment[] = []
      let errors: string[] = []

      jsonData.forEach((row: any, index) => {
        try {
          // 필수 필드 검증
          if (!row['설비번호'] || !row['설비명']) {
            errors.push(`행 ${index + 2}: 설비번호와 설비명은 필수입니다.`)
            return
          }

          // 중복 설비번호 검증
          const existingEquipment = equipments.find(eq => eq.equipmentNumber === row['설비번호'])
          if (existingEquipment) {
            errors.push(`행 ${index + 2}: 설비번호 '${row['설비번호']}'는 이미 존재합니다.`)
            return
          }

          // 상태 값 검증
          const validStatuses = ['operational', 'maintenance', 'broken', 'idle']
          const status = row['상태'] || 'operational'
          if (!validStatuses.includes(status)) {
            errors.push(`행 ${index + 2}: 상태값은 'operational', 'maintenance', 'broken', 'idle' 중 하나여야 합니다.`)
            return
          }

          const equipment: Equipment = {
            id: Date.now().toString() + index,
            equipmentNumber: row['설비번호'],
            equipmentName: row['설비명'],
            model: row['모델명'] || '',
            manufacturer: row['제조사'] || '',
            location: row['위치'] || '',
            department: row['담당부서'] || '',
            installDate: row['설치일자'] || new Date().toISOString().split('T')[0],
            lastMaintenanceDate: row['최근정비일'] || undefined,
            nextMaintenanceDate: row['다음정비일'] || undefined,
            status: status as Equipment['status'],
            operatingHours: Number(row['가동시간']) || 0,
            notes: row['비고'] || undefined
          }

          newEquipments.push(equipment)
        } catch (error) {
          errors.push(`행 ${index + 2}: 데이터 처리 중 오류가 발생했습니다.`)
        }
      })

      if (errors.length > 0) {
        setUploadResult({
          success: false,
          message: `업로드 실패:\n${errors.join('\n')}`
        })
      } else if (newEquipments.length === 0) {
        setUploadResult({
          success: false,
          message: '추가할 설비가 없습니다. 파일 형식과 내용을 확인해주세요.'
        })
      } else {
        // 성공적으로 처리된 설비들을 추가
        setEquipments(prev => [...prev, ...newEquipments])
        setUploadResult({
          success: true,
          message: `${newEquipments.length}개의 설비가 성공적으로 추가되었습니다.`,
          addedCount: newEquipments.length
        })
      }
    } catch (error) {
      console.error('Excel file processing error:', error)
      setUploadResult({
        success: false,
        message: 'Excel 파일 처리 중 오류가 발생했습니다. 파일 형식을 확인해주세요.'
      })
    } finally {
      setIsUploading(false)
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
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

      {/* 업로드 결과 알림 */}
      {uploadResult && (
        <Card className={`border-l-4 ${uploadResult.success 
          ? 'border-l-green-500 bg-green-50 dark:bg-green-900/20' 
          : 'border-l-red-500 bg-red-50 dark:bg-red-900/20'
        }`}>
          <Card.Content className="py-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className={`text-2xl ${uploadResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {uploadResult.success ? '✅' : '❌'}
                </span>
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${uploadResult.success 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
                }`}>
                  {uploadResult.success ? '업로드 성공' : '업로드 실패'}
                </h3>
                <pre className={`mt-1 text-sm whitespace-pre-wrap ${uploadResult.success 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-red-700 dark:text-red-300'
                }`}>
                  {uploadResult.message}
                </pre>
              </div>
              <div className="ml-auto">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setUploadResult(null)}
                  className="text-xs"
                >
                  닫기
                </Button>
              </div>
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