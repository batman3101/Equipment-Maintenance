'use client'

import { saveAs } from 'file-saver'

let ExcelJS: any = null

// ExcelJS를 한 번만 로드하고 캐시
async function loadExcelJS() {
  if (ExcelJS) return ExcelJS
  
  try {
    // 브라우저 환경에서 동적 import
    const module = await import('exceljs/dist/exceljs.min.js')
    console.log('ExcelJS module loaded:', module)
    
    // 다양한 export 방식 처리
    ExcelJS = (window as any).ExcelJS || module.default || module
    
    // Fallback: window 객체에서 직접 찾기
    if (!ExcelJS && typeof window !== 'undefined') {
      // ExcelJS가 window에 직접 할당되는 경우
      await new Promise(resolve => setTimeout(resolve, 100)) // 짧은 대기
      ExcelJS = (window as any).ExcelJS
    }
    
    console.log('ExcelJS resolved to:', ExcelJS)
    
    if (!ExcelJS) {
      throw new Error('ExcelJS를 로드할 수 없습니다')
    }
    
    return ExcelJS
  } catch (error) {
    console.error('ExcelJS 로드 실패:', error)
    throw error
  }
}

export async function createWorkbook() {
  const Excel = await loadExcelJS()
  
  // Workbook 생성자 찾기
  let workbook
  
  if (Excel.Workbook) {
    workbook = new Excel.Workbook()
  } else if (typeof Excel === 'function') {
    workbook = new Excel()
  } else {
    // ExcelJS 구조 디버깅
    console.log('Excel object structure:', Object.keys(Excel))
    throw new Error('Workbook 생성자를 찾을 수 없습니다')
  }
  
  return workbook
}

export function downloadExcel(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  saveAs(blob, filename)
}