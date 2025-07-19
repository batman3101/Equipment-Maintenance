'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Search } from 'lucide-react';
import type { CreateRepairPartRequest, PartSuggestion } from '../types';

interface PartsInputProps {
  parts: CreateRepairPartRequest[];
  onChange: (parts: CreateRepairPartRequest[]) => void;
  onGetSuggestions?: (query: string) => Promise<PartSuggestion[]>;
  disabled?: boolean;
}

/**
 * 수리 부품 입력 컴포넌트
 * - 부품 추가/삭제 기능
 * - 자동완성 기능
 * - 총 비용 자동 계산
 */
export function PartsInput({ 
  parts, 
  onChange, 
  onGetSuggestions,
  disabled = false 
}: PartsInputProps) {
  const [suggestions, setSuggestions] = useState<PartSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // 새 부품 추가
  const addPart = () => {
    const newPart: CreateRepairPartRequest = {
      part_name: '',
      quantity: 1,
      unit_price: 0
    };
    onChange([...parts, newPart]);
  };

  // 부품 삭제
  const removePart = (index: number) => {
    const updatedParts = parts.filter((_, i) => i !== index);
    onChange(updatedParts);
  };

  // 부품 정보 업데이트
  const updatePart = (index: number, field: keyof CreateRepairPartRequest, value: string | number) => {
    const updatedParts = parts.map((part, i) => {
      if (i === index) {
        return { ...part, [field]: value };
      }
      return part;
    });
    onChange(updatedParts);
  };

  // 자동완성 검색
  const searchSuggestions = async (query: string, partIndex: number) => {
    if (!onGetSuggestions || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(null);
      return;
    }

    try {
      const results = await onGetSuggestions(query);
      setSuggestions(results);
      setShowSuggestions(partIndex);
    } catch (error) {
      console.error('부품 검색 실패:', error);
      setSuggestions([]);
      setShowSuggestions(null);
    }
  };

  // 부품명 입력 처리
  const handlePartNameChange = (index: number, value: string) => {
    updatePart(index, 'part_name', value);
    setSearchQuery(value);

    // 디바운스 적용
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchSuggestions(value, index);
    }, 300);
  };

  // 제안 선택
  const selectSuggestion = (index: number, suggestion: PartSuggestion) => {
    updatePart(index, 'part_name', suggestion.name);
    updatePart(index, 'unit_price', suggestion.average_price);
    setShowSuggestions(null);
    setSuggestions([]);
  };

  // 총 비용 계산
  const calculateTotalCost = () => {
    return parts.reduce((total, part) => {
      return total + (part.quantity * part.unit_price);
    }, 0);
  };

  // 외부 클릭 시 자동완성 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(null);
      setSuggestions([]);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          사용 부품
        </label>
        <button
          type="button"
          onClick={addPart}
          disabled={disabled}
          className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 mr-1" />
          부품 추가
        </button>
      </div>

      {parts.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p>사용된 부품이 없습니다.</p>
          <p className="text-sm mt-1">부품 추가 버튼을 클릭하여 부품을 추가하세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {parts.map((part, index) => (
            <div key={index} className="relative bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">
                  부품 #{index + 1}
                </h4>
                <button
                  type="button"
                  onClick={() => removePart(index)}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* 부품명 입력 (자동완성) */}
                <div className="md:col-span-2 relative">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    부품명 *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={part.part_name}
                      onChange={(e) => handlePartNameChange(index, e.target.value)}
                      disabled={disabled}
                      placeholder="부품명을 입력하세요"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                  </div>

                  {/* 자동완성 제안 */}
                  {showSuggestions === index && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {suggestions.map((suggestion, suggestionIndex) => (
                        <button
                          key={suggestionIndex}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectSuggestion(index, suggestion);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{suggestion.name}</span>
                            <span className="text-sm text-gray-500">
                              ₩{suggestion.average_price.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">
                            사용 횟수: {suggestion.usage_count}회
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 수량 입력 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    수량 *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={part.quantity}
                    onChange={(e) => updatePart(index, 'quantity', parseInt(e.target.value) || 1)}
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* 단가 입력 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    단가 (원) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10000000"
                    value={part.unit_price}
                    onChange={(e) => updatePart(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* 부품별 총 가격 표시 */}
              <div className="mt-3 text-right">
                <span className="text-sm text-gray-600">
                  소계: <span className="font-medium">₩{(part.quantity * part.unit_price).toLocaleString()}</span>
                </span>
              </div>
            </div>
          ))}

          {/* 전체 총 비용 표시 */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-800">
                부품 총 비용
              </span>
              <span className="text-lg font-bold text-blue-900">
                ₩{calculateTotalCost().toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}