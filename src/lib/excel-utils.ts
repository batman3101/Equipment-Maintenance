'use client'

import { saveAs } from 'file-saver'

// 간단한 Excel 템플릿 생성 (ExcelJS 없이)
export async function createSimpleExcelTemplate(
  sheetName: string,
  headers: string[],
  sampleData: any[]
) {
  try {
    // ExcelJS를 require 방식으로 로드 시도
    const ExcelJS = require('exceljs')
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(sheetName)
    
    // 헤더 추가
    worksheet.addRow(headers)
    
    // 필드 설명 추가 (두 번째 행)
    const hasStatusOrDate = headers.includes('상태') || 
                           headers.find(h => h.includes('status')) ||
                           headers.includes('설치일자') ||
                           headers.find(h => h.includes('date'))
    
    if (hasStatusOrDate) {
      const helpRow = headers.map(header => {
        if (header === '상태' || header.includes('status')) {
          return 'running, breakdown, standby, maintenance, stopped 중 하나'
        }
        if (header === '설치일자' || header.includes('date')) {
          return 'YYYY-MM-DD 형식 (예: 2024-01-15)'
        }
        return ''
      })
      worksheet.addRow(helpRow)
      
      // 설명 행 스타일
      const helpRowStyle = worksheet.getRow(2)
      helpRowStyle.font = { italic: true, color: { argb: 'FF666666' } }
      helpRowStyle.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFEAA7' }
      }
    }
    
    // 샘플 데이터 추가
    if (sampleData.length > 0) {
      worksheet.addRow(sampleData)
    }
    
    // 컬럼 너비 자동 조정
    worksheet.columns = headers.map((header, index) => ({
      width: Math.max(header.length + 5, 15)
    }))
    
    // 헤더 스타일
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F3FF' }
    }
    headerRow.alignment = { horizontal: 'center' }
    
    // 테두리 추가
    headerRow.eachCell((cell: any) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })
    
    // 버퍼로 변환
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    
    return blob
  } catch (error) {
    console.error('Excel 생성 실패:', error)
    throw error
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  saveAs(blob, filename)
}