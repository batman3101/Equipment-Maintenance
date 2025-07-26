'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, User, Check } from 'lucide-react';

interface Technician {
  id: string;
  name: string;
  email: string;
}

interface TechnicianSelectProps {
  value: string;
  onChange: (technicianId: string) => void;
  technicians?: Technician[];
  currentUserId?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * 담당자 선택 컴포넌트
 * - 드롭다운 형태의 담당자 선택
 * - 현재 사용자를 기본값으로 설정
 * - 검색 기능 포함
 */
export function TechnicianSelect({
  value,
  onChange,
  technicians = [],
  currentUserId,
  disabled = false,
  required = true
}: TechnicianSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>(technicians);

  // 현재 선택된 담당자 정보
  const selectedTechnician = technicians.find(tech => tech.id === value);

  // 검색 필터링
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTechnicians(technicians);
    } else {
      const filtered = technicians.filter(tech =>
        tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tech.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTechnicians(filtered);
    }
  }, [searchQuery, technicians]);

  // 현재 사용자를 기본값으로 설정
  useEffect(() => {
    if (!value && currentUserId && technicians.some(tech => tech.id === currentUserId)) {
      onChange(currentUserId);
    }
  }, [value, currentUserId, technicians, onChange]);

  // 담당자 선택
  const selectTechnician = (technicianId: string) => {
    onChange(technicianId);
    setIsOpen(false);
    setSearchQuery('');
  };

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.technician-select')) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="technician-select relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        담당자 {required && <span className="text-red-500">*</span>}
      </label>

      {/* 선택 버튼 */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${!selectedTechnician ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <User className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
            {selectedTechnician ? (
              <div>
                <span className="font-medium">{selectedTechnician.name}</span>
                {selectedTechnician.id === currentUserId && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    나
                  </span>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400">{selectedTechnician.email}</div>
              </div>
            ) : (
              <span>담당자를 선택하세요</span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-64 overflow-hidden">
          {/* 검색 입력 */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-600">
            <input
              type="text"
              placeholder="담당자 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* 담당자 목록 */}
          <div className="max-h-48 overflow-y-auto">
            {filteredTechnicians.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                {searchQuery ? '검색 결과가 없습니다.' : '담당자가 없습니다.'}
              </div>
            ) : (
              filteredTechnicians.map((technician) => (
                <button
                  key={technician.id}
                  type="button"
                  onClick={() => selectTechnician(technician.id)}
                  className={`
                    w-full px-3 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none
                    ${value === technician.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-3 text-gray-400 dark:text-gray-500" />
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{technician.name}</span>
                          {technician.id === currentUserId && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              나
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{technician.email}</div>
                      </div>
                    </div>
                    {value === technician.id && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* 필수 필드 에러 표시 */}
      {required && !value && (
        <p className="mt-1 text-xs text-red-600">담당자를 선택해주세요.</p>
      )}
    </div>
  );
}