'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { Chip } from '@/shared/components/ui/Chip';
import type { BreakdownFilter, BreakdownStatus } from '../types';

interface BreakdownListFilterProps {
  filter: BreakdownFilter;
  onFilterChange: (filter: BreakdownFilter) => void;
  onSearchChange: (query: string) => void;
}

/**
 * 고장 목록 필터 컴포넌트
 * 상태별 필터링과 설비 번호 검색 기능을 제공합니다.
 */
export function BreakdownListFilter({ 
  filter, 
  onFilterChange, 
  onSearchChange 
}: BreakdownListFilterProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filter.equipment_number || '');

  const statusOptions: { value: BreakdownStatus; label: string; color: string }[] = [
    { value: 'in_progress', label: '진행 중', color: 'bg-red-100 text-red-700' },
    { value: 'under_repair', label: '수리 중', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'completed', label: '완료', color: 'bg-green-100 text-green-700' }
  ];

  const handleStatusFilter = (status: BreakdownStatus) => {
    const newFilter = {
      ...filter,
      status: filter.status === status ? undefined : status
    };
    onFilterChange(newFilter);
  };

  const handleSearchSubmit = (query: string) => {
    setSearchQuery(query);
    onSearchChange(query);
    onFilterChange({
      ...filter,
      equipment_number: query || undefined
    });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    onFilterChange({});
    onSearchChange('');
  };

  const hasActiveFilters = filter.status || filter.equipment_number;

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      {/* 검색 바 */}
      <div className="p-4 pb-2">
        <SearchInput
          placeholder="설비 번호로 검색..."
          value={searchQuery}
          onSearch={handleSearchSubmit}
          className="w-full"
        />
      </div>

      {/* 필터 토글 버튼 */}
      <div className="px-4 pb-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
            transition-colors duration-200 min-h-[44px]
            ${showFilters 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          <Filter className="w-4 h-4" />
          필터
          {hasActiveFilters && (
            <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {[filter.status, filter.equipment_number].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* 필터 옵션 */}
      {showFilters && (
        <div className="px-4 pb-4 space-y-3">
          {/* 상태 필터 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">상태</h4>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <Chip
                  key={option.value}
                  onClick={() => handleStatusFilter(option.value)}
                  className={filter.status === option.value ? option.color : ''}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* 필터 초기화 */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-gray-200">
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <X className="w-4 h-4" />
                모든 필터 초기화
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}