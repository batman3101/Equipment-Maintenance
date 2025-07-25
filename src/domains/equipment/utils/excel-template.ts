// Excel 템플릿 생성 및 다운로드 유틸리티

import * as XLSX from 'xlsx';
import { EquipmentStatus } from '../types';

/**
 * Excel 템플릿 헤더 정의
 */
export const EQUIPMENT_TEMPLATE_HEADERS = [
  'equipment_number', // 설비 번호 (필수)
  'equipment_type',   // 설비 종류 (필수)
  'status'           // 상태 (선택, 기본값: active)
] as const;

/**
 * Excel 템플릿 헤더 한글 라벨
 */
export const EQUIPMENT_TEMPLATE_LABELS = {
  equipment_number: '설비 번호',
  equipment_type: '설비 종류', 
  status: '상태'
} as const;

/**
 * 설비 종류 옵션
 */
export const EQUIPMENT_TYPE_OPTIONS = [
  'cnc_machine',
  'lathe', 
  'milling_machine',
  'drill_press',
  'grinder',
  'press',
  'conveyor',
  'robot',
  'other'
] as const;

/**
 * 상태 옵션
 */
export const STATUS_OPTIONS = [
  EquipmentStatus.ACTIVE,
  EquipmentStatus.INACTIVE, 
  EquipmentStatus.MAINTENANCE,
  EquipmentStatus.BROKEN
] as const;

/**
 * Excel 템플릿용 샘플 데이터
 */
const SAMPLE_DATA = [
  {
    equipment_number: 'CNC-001',
    equipment_type: 'cnc_machine',
    status: EquipmentStatus.ACTIVE
  },
  {
    equipment_number: 'LATHE-001', 
    equipment_type: 'lathe',
    status: EquipmentStatus.ACTIVE
  },
  {
    equipment_number: 'MILL-001',
    equipment_type: 'milling_machine', 
    status: EquipmentStatus.MAINTENANCE
  }
];

/**
 * Excel 템플릿 파일 생성 및 다운로드
 */
export function downloadEquipmentTemplate(): void {
  // 워크북 생성
  const workbook = XLSX.utils.book_new();
  
  // 메인 데이터 시트 생성
  const headers = EQUIPMENT_TEMPLATE_HEADERS.map(key => EQUIPMENT_TEMPLATE_LABELS[key]);
  const sampleRows = SAMPLE_DATA.map(item => [
    item.equipment_number,
    item.equipment_type,
    item.status
  ]);
  
  const worksheetData = [headers, ...sampleRows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // 컬럼 너비 설정
  worksheet['!cols'] = [
    { wch: 15 }, // 설비 번호
    { wch: 20 }, // 설비 종류  
    { wch: 12 }  // 상태
  ];
  
  // 헤더 스타일 적용 (배경색, 굵은 글씨)
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:C1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    
    worksheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'E3F2FD' } },
      alignment: { horizontal: 'center' }
    };
  }
  
  XLSX.utils.book_append_sheet(workbook, worksheet, '설비 목록');
  
  // 옵션 시트 생성 (설비 종류, 상태 옵션)
  const optionsData = [
    ['설비 종류 옵션', '상태 옵션'],
    ...Array.from({ length: Math.max(EQUIPMENT_TYPE_OPTIONS.length, STATUS_OPTIONS.length) }, (_, i) => [
      EQUIPMENT_TYPE_OPTIONS[i] || '',
      STATUS_OPTIONS[i] || ''
    ])
  ];
  
  const optionsWorksheet = XLSX.utils.aoa_to_sheet(optionsData);
  optionsWorksheet['!cols'] = [{ wch: 20 }, { wch: 15 }];
  
  // 옵션 시트 헤더 스타일
  ['A1', 'B1'].forEach(cellAddress => {
    if (optionsWorksheet[cellAddress]) {
      optionsWorksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'FFF3E0' } },
        alignment: { horizontal: 'center' }
      };
    }
  });
  
  XLSX.utils.book_append_sheet(workbook, optionsWorksheet, '입력 옵션');
  
  // 파일 다운로드
  const fileName = `설비등록_템플릿_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Excel 파일에서 설비 데이터 파싱
 */
export interface ParsedEquipmentData {
  equipment_number: string;
  equipment_type: string;
  status?: EquipmentStatus;
}

export interface ExcelParseResult {
  data: ParsedEquipmentData[];
  errors: string[];
  warnings: string[];
}

/**
 * Excel 파일 파싱 함수
 */
export function parseEquipmentExcel(file: File): Promise<ExcelParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // 첫 번째 시트 사용
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // JSON으로 변환
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        
        const result: ExcelParseResult = {
          data: [],
          errors: [],
          warnings: []
        };
        
        if (jsonData.length === 0) {
          result.errors.push('Excel 파일이 비어있습니다.');
          resolve(result);
          return;
        }
        
        // 헤더 검증
        const headers = jsonData[0];
        const expectedHeaders = Object.values(EQUIPMENT_TEMPLATE_LABELS);
        
        // 필수 헤더 확인
        const requiredHeaders = ['설비 번호', '설비 종류'];
        const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
        
        if (missingHeaders.length > 0) {
          result.errors.push(`필수 헤더가 누락되었습니다: ${missingHeaders.join(', ')}`);
          resolve(result);
          return;
        }
        
        // 헤더 인덱스 매핑
        const headerIndexMap: Record<string, number> = {};
        headers.forEach((header, index) => {
          switch (header) {
            case '설비 번호':
              headerIndexMap.equipment_number = index;
              break;
            case '설비 종류':
              headerIndexMap.equipment_type = index;
              break;
            case '상태':
              headerIndexMap.status = index;
              break;
          }
        });
        
        // 데이터 행 처리
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const rowNumber = i + 1;
          
          // 빈 행 스킵
          if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
            continue;
          }
          
          const equipment: Partial<ParsedEquipmentData> = {};
          let hasErrors = false;
          
          // 설비 번호 (필수)
          const equipmentNumber = row[headerIndexMap.equipment_number]?.toString().trim();
          if (!equipmentNumber) {
            result.errors.push(`${rowNumber}행: 설비 번호가 필요합니다.`);
            hasErrors = true;
          } else {
            equipment.equipment_number = equipmentNumber;
          }
          
          // 설비 종류 (필수)
          const equipmentType = row[headerIndexMap.equipment_type]?.toString().trim();
          if (!equipmentType) {
            result.errors.push(`${rowNumber}행: 설비 종류가 필요합니다.`);
            hasErrors = true;
          } else if (!EQUIPMENT_TYPE_OPTIONS.includes(equipmentType as any)) {
            result.errors.push(`${rowNumber}행: 유효하지 않은 설비 종류입니다. (${equipmentType})`);
            hasErrors = true;
          } else {
            equipment.equipment_type = equipmentType;
          }
          
          // 상태 (선택)
          if (headerIndexMap.status !== undefined) {
            const status = row[headerIndexMap.status]?.toString().trim();
            if (status) {
              if (!STATUS_OPTIONS.includes(status as any)) {
                result.warnings.push(`${rowNumber}행: 유효하지 않은 상태입니다. 기본값(active)을 사용합니다. (${status})`);
                equipment.status = EquipmentStatus.ACTIVE;
              } else {
                equipment.status = status;
              }
            } else {
              equipment.status = EquipmentStatus.ACTIVE;
            }
          } else {
            equipment.status = EquipmentStatus.ACTIVE;
          }
          
          if (!hasErrors) {
            result.data.push(equipment as ParsedEquipmentData);
          }
        }
        
        resolve(result);
        
      } catch (error) {
        resolve({
          data: [],
          errors: [`파일 파싱 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`],
          warnings: []
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        data: [],
        errors: ['파일 읽기 오류가 발생했습니다.'],
        warnings: []
      });
    };
    
    reader.readAsArrayBuffer(file);
  });
}