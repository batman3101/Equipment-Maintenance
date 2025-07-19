'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { supabase } from '@/lib/supabase';

export interface EquipmentNumberInputProps {
  value?: string;
  onChange: (value: string) => void;
  equipmentType?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

interface Equipment {
  id: string;
  equipment_number: string;
  equipment_type: string;
}

/**
 * 설비 번호 입력 및 자동완성 컴포넌트
 * - 설비 종류에 따른 필터링
 * - 실시간 검색 및 자동완성
 * - 유효한 설비 번호 검증
 */
export const EquipmentNumberInput: React.FC<EquipmentNumberInputProps> = ({
  value = '',
  onChange,
  equipmentType,
  error,
  required = false,
  disabled = false,
  className
}) => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 설비 목록 조회
  const fetchEquipment = async (searchTerm?: string) => {
    try {
      setLoading(true);
      setSearchError(null);

      let query = supabase
        .from('equipment')
        .select('id, equipment_number, equipment_type')
        .eq('status', 'active');

      // 설비 종류 필터링
      if (equipmentType) {
        query = query.eq('equipment_type', equipmentType);
      }

      // 검색어 필터링
      if (searchTerm && searchTerm.trim()) {
        query = query.ilike('equipment_number', `%${searchTerm.trim()}%`);
      }

      // 최대 20개까지만 조회
      query = query.limit(20).order('equipment_number');

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setEquipmentList(data || []);
    } catch (err) {
      console.error('설비 목록 조회 오류:', err);
      setSearchError('설비 목록을 불러오는 중 오류가 발생했습니다.');
      setEquipmentList([]);
    } finally {
      setLoading(false);
    }
  };

  // 설비 종류가 변경되면 목록 새로고침
  useEffect(() => {
    if (equipmentType) {
      fetchEquipment();
    } else {
      setEquipmentList([]);
    }
  }, [equipmentType]);

  // 자동완성 제안 목록 생성
  const suggestions = useMemo(() => {
    return equipmentList.map(equipment => equipment.equipment_number);
  }, [equipmentList]);

  // 검색 핸들러
  const handleSearch = (searchTerm: string) => {
    if (equipmentType) {
      fetchEquipment(searchTerm);
    }
  };

  // 값 변경 핸들러
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  // 제안 선택 핸들러
  const handleSuggestionSelect = (suggestion: string) => {
    onChange(suggestion);
  };

  // 클리어 핸들러
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={className}>
      <SearchInput
        label="설비 번호"
        placeholder={equipmentType ? "설비 번호를 입력하세요" : "먼저 설비 종류를 선택하세요"}
        value={value}
        onChange={handleChange}
        onSearch={handleSearch}
        onSuggestionSelect={handleSuggestionSelect}
        onClear={handleClear}
        suggestions={suggestions}
        loading={loading}
        error={error || searchError || undefined}
        required={required}
        disabled={disabled || !equipmentType}
        helperText={
          !equipmentType 
            ? "설비 종류를 먼저 선택해주세요" 
            : "등록된 설비 번호를 입력하거나 목록에서 선택하세요"
        }
        debounceMs={300}
      />
    </div>
  );
};

/**
 * 설비 번호 유효성 검사 함수
 */
export const validateEquipmentNumber = async (
  equipmentNumber: string,
  equipmentType: string
): Promise<{ isValid: boolean; error?: string; equipmentId?: string }> => {
  if (!equipmentNumber.trim()) {
    return { isValid: false, error: '설비 번호를 입력해주세요.' };
  }

  if (!equipmentType) {
    return { isValid: false, error: '설비 종류를 먼저 선택해주세요.' };
  }

  try {
    const { data, error } = await supabase
      .from('equipment')
      .select('id')
      .eq('equipment_number', equipmentNumber.trim())
      .eq('equipment_type', equipmentType)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return { 
        isValid: false, 
        error: '해당 설비 번호를 찾을 수 없습니다. 설비 종류와 번호를 다시 확인해주세요.' 
      };
    }

    return { 
      isValid: true, 
      equipmentId: data.id 
    };
  } catch (err) {
    return { 
      isValid: false, 
      error: '설비 번호 확인 중 오류가 발생했습니다.' 
    };
  }
};