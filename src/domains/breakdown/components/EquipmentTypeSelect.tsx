'use client';

import React from 'react';
import { Select, type SelectOption } from '@/shared/components/ui/Select';

export interface EquipmentTypeSelectProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

// 설비 종류 옵션 (실제 환경에서는 API에서 가져올 수 있음)
const EQUIPMENT_TYPE_OPTIONS: SelectOption[] = [
  { value: 'cnc_lathe', label: 'CNC 선반' },
  { value: 'cnc_mill', label: 'CNC 밀링' },
  { value: 'cnc_drill', label: 'CNC 드릴' },
  { value: 'cnc_grinder', label: 'CNC 연삭기' },
  { value: 'cnc_boring', label: 'CNC 보링' },
  { value: 'cnc_router', label: 'CNC 라우터' },
  { value: 'cnc_plasma', label: 'CNC 플라즈마' },
  { value: 'cnc_laser', label: 'CNC 레이저' },
  { value: 'cnc_waterjet', label: 'CNC 워터젯' },
  { value: 'cnc_edm', label: 'CNC 방전가공기' },
  { value: 'other', label: '기타' }
];

/**
 * 설비 종류 선택 컴포넌트
 * - 미리 정의된 설비 종류 목록 제공
 * - 검색 및 필터링 기능
 * - 모바일 최적화
 */
export const EquipmentTypeSelect: React.FC<EquipmentTypeSelectProps> = ({
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className
}) => {
  return (
    <Select
      label="설비 종류"
      placeholder="설비 종류를 선택하세요"
      options={EQUIPMENT_TYPE_OPTIONS}
      value={value}
      onChange={onChange}
      error={error}
      required={required}
      disabled={disabled}
      className={className}
      helperText="고장이 발생한 설비의 종류를 선택해주세요"
    />
  );
};

/**
 * 설비 종류 옵션을 가져오는 유틸리티 함수
 */
export const getEquipmentTypeOptions = (): SelectOption[] => {
  return EQUIPMENT_TYPE_OPTIONS;
};

/**
 * 설비 종류 값을 라벨로 변환하는 유틸리티 함수
 */
export const getEquipmentTypeLabel = (value: string): string => {
  const option = EQUIPMENT_TYPE_OPTIONS.find(opt => opt.value === value);
  return option?.label || value;
};