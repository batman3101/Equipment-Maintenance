'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreakdownCategory {
  id: string;
  name: string;
  code: string;
  color: string;
  is_active: boolean;
}

interface BreakdownSubcategory {
  id: string;
  category_id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export interface BreakdownCategorySelectProps {
  mainCategoryValue?: string;
  subCategoryValue?: string;
  onMainCategoryChange: (value: string) => void;
  onSubCategoryChange: (value: string) => void;
  mainCategoryError?: string;
  subCategoryError?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

// 모의 데이터 (실제로는 API에서 가져와야 함)
const mockCategories: BreakdownCategory[] = [
  {
    id: '1',
    name: '기계적 고장',
    code: 'mechanical',
    color: '#EF4444',
    is_active: true
  },
  {
    id: '2',
    name: '전기적 고장',
    code: 'electrical',
    color: '#F59E0B',
    is_active: true
  },
  {
    id: '3',
    name: '소프트웨어 오류',
    code: 'software',
    color: '#3B82F6',
    is_active: true
  }
];

const mockSubcategories: BreakdownSubcategory[] = [
  // 기계적 고장 하위
  { id: '1-1', category_id: '1', name: '베어링 마모', code: 'bearing_wear', is_active: true },
  { id: '1-2', category_id: '1', name: '벨트 파손', code: 'belt_damage', is_active: true },
  { id: '1-3', category_id: '1', name: '기어 손상', code: 'gear_damage', is_active: true },
  
  // 전기적 고장 하위
  { id: '2-1', category_id: '2', name: '모터 고장', code: 'motor_failure', is_active: true },
  { id: '2-2', category_id: '2', name: '센서 오작동', code: 'sensor_malfunction', is_active: true },
  { id: '2-3', category_id: '2', name: '전원 문제', code: 'power_issue', is_active: true },
  
  // 소프트웨어 오류 하위
  { id: '3-1', category_id: '3', name: 'G코드 오류', code: 'gcode_error', is_active: true },
  { id: '3-2', category_id: '3', name: '시스템 크래시', code: 'system_crash', is_active: true }
];

/**
 * 고장 대분류/소분류 선택 컴포넌트
 */
export const BreakdownCategorySelect: React.FC<BreakdownCategorySelectProps> = ({
  mainCategoryValue = '',
  subCategoryValue = '',
  onMainCategoryChange,
  onSubCategoryChange,
  mainCategoryError,
  subCategoryError,
  required = false,
  disabled = false,
  className
}) => {
  const [categories, setCategories] = useState<BreakdownCategory[]>([]);
  const [subcategories, setSubcategories] = useState<BreakdownSubcategory[]>([]);
  const [loading, setLoading] = useState(false);

  // 데이터 로드
  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        // TODO: 실제 API 호출로 대체
        await new Promise(resolve => setTimeout(resolve, 300));
        setCategories(mockCategories.filter(cat => cat.is_active));
        setSubcategories(mockSubcategories.filter(sub => sub.is_active));
      } catch (error) {
        console.error('카테고리 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // 대분류 변경 시 소분류 초기화
  useEffect(() => {
    if (mainCategoryValue && subCategoryValue) {
      const availableSubcategories = getSubcategoriesForCategory(mainCategoryValue);
      const isSubcategoryValid = availableSubcategories.some(sub => sub.id === subCategoryValue);
      
      if (!isSubcategoryValid) {
        onSubCategoryChange('');
      }
    }
  }, [mainCategoryValue, subCategoryValue, onSubCategoryChange]);

  // 특정 대분류의 소분류 목록 가져오기
  const getSubcategoriesForCategory = (categoryId: string) => {
    return subcategories.filter(sub => sub.category_id === categoryId);
  };

  // 선택된 대분류 정보
  const selectedMainCategory = categories.find(cat => cat.id === mainCategoryValue);
  
  // 선택된 대분류의 소분류들
  const availableSubcategories = mainCategoryValue ? 
    getSubcategoriesForCategory(mainCategoryValue) : [];

  return (
    <div className={cn('space-y-4', className)}>
      {/* 대분류 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          고장 대분류
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <div className="relative">
          <select
            value={mainCategoryValue}
            onChange={(e) => {
              onMainCategoryChange(e.target.value);
              // 대분류 변경 시 소분류 초기화
              if (subCategoryValue) {
                onSubCategoryChange('');
              }
            }}
            disabled={disabled || loading}
            className={cn(
              'flex w-full rounded-lg border bg-white px-3 py-2 text-base',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              'appearance-none pr-10',
              mainCategoryError 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300'
            )}
          >
            <option value="">대분류를 선택해주세요</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* 선택된 대분류 색상 표시 */}
        {selectedMainCategory && (
          <div className="flex items-center mt-2 text-sm text-gray-600">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: selectedMainCategory.color }}
            />
            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
              {selectedMainCategory.code}
            </span>
          </div>
        )}

        {mainCategoryError && (
          <div className="flex items-center mt-1 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            {mainCategoryError}
          </div>
        )}
      </div>

      {/* 소분류 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          고장 소분류
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <div className="relative">
          <select
            value={subCategoryValue}
            onChange={(e) => onSubCategoryChange(e.target.value)}
            disabled={disabled || loading || !mainCategoryValue || availableSubcategories.length === 0}
            className={cn(
              'flex w-full rounded-lg border bg-white px-3 py-2 text-base',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              'appearance-none pr-10',
              subCategoryError 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300'
            )}
          >
            <option value="">
              {!mainCategoryValue 
                ? '먼저 대분류를 선택해주세요'
                : availableSubcategories.length === 0
                ? '등록된 소분류가 없습니다'
                : '소분류를 선택해주세요'}
            </option>
            {availableSubcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
          
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* 선택된 소분류 코드 표시 */}
        {subCategoryValue && (
          <div className="flex items-center mt-2 text-sm text-gray-600">
            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
              {availableSubcategories.find(sub => sub.id === subCategoryValue)?.code}
            </span>
          </div>
        )}

        {subCategoryError && (
          <div className="flex items-center mt-1 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            {subCategoryError}
          </div>
        )}
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="text-sm text-gray-500 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          카테고리 정보를 불러오는 중...
        </div>
      )}
    </div>
  );
};