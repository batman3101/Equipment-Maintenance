'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { useTranslation } from 'react-i18next'

interface ExcelExportManagerProps {
  data: any[]
  filename: string
  loading?: boolean
  onExportStart?: () => void
  onExportComplete?: () => void
}

/**
 * [SRP] Rule: ExcelJS 동적 로딩만 담당하는 단일 책임 컴포넌트
 * 번들 크기 최적화를 위해 ExcelJS를 필요할 때만 로드
 */
export function ExcelExportManager({ 
  data, 
  filename, 
  loading = false,
  onExportStart,
  onExportComplete 
}: ExcelExportManagerProps) {
  const { t } = useTranslation(['equipment', 'common'])
  const { showSuccess, showError } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  /**
   * ExcelJS 동적 임포트 및 파일 생성
   * 약 2MB의 ExcelJS 번들을 필요할 때만 로드하여 초기 번들 크기 감소
   */
  const handleExport = useCallback(async () => {
    if (loading || isExporting || !data.length) {
      showError(t('equipment:messages.noDataToExport'))
      return
    }

    setIsExporting(true)
    onExportStart?.()

    try {
      // 동적 임포트로 번들 크기 최적화
      const [{ default: ExcelJS }, { saveAs }] = await Promise.all([
        import('exceljs'),
        import('file-saver')
      ])

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Equipment Data')

      // 헤더 설정 (한국어/베트남어 지원)
      const headers = [
        t('equipment:fields.equipmentNumber'),
        t('equipment:fields.equipmentName'),
        t('equipment:fields.category'),
        t('equipment:fields.location'),
        t('equipment:fields.manufacturer'),
        t('equipment:fields.model'),
        t('equipment:fields.installationDate'),
        t('equipment:fields.status')
      ]

      worksheet.addRow(headers)

      // 헤더 스타일링
      const headerRow = worksheet.getRow(1)
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '366092' }
      }

      // 데이터 행 추가
      data.forEach(item => {
        worksheet.addRow([
          item.equipmentNumber || '',
          item.equipmentName || '',
          item.category || '',
          item.location || '',
          item.manufacturer || '',
          item.model || '',
          item.installationDate || '',
          item.status || ''
        ])
      })

      // 열 너비 자동 조정
      worksheet.columns.forEach(column => {
        if (column.number !== undefined) {
          column.width = Math.max(12, Math.min(30, 
            Math.max(...worksheet.getColumn(column.number).values
              .map(v => String(v || '').length)) + 2
          ))
        }
      })

      // 파일 생성 및 다운로드
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      saveAs(blob, `${filename}_${timestamp}.xlsx`)

      showSuccess(t('equipment:messages.exportSuccess'))
      onExportComplete?.()

    } catch (error) {
      console.error('Excel export error:', error)
      showError(t('equipment:messages.exportFailed'))
    } finally {
      setIsExporting(false)
    }
  }, [data, filename, loading, isExporting, t, showSuccess, showError, onExportStart, onExportComplete])

  return (
    <Button
      onClick={handleExport}
      disabled={loading || isExporting || !data.length}
      variant="secondary"
      className="flex items-center gap-2"
    >
      {isExporting ? (
        <>
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          {t('common:actions.exporting')}
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {t('common:actions.exportToExcel')}
        </>
      )}
    </Button>
  )
}

export default ExcelExportManager