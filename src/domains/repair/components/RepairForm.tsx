'use client';

import React, { useState, useEffect } from 'react';
import { Save, X, Clock, FileText } from 'lucide-react';
import { PartsInput } from './PartsInput';
import { TechnicianSelect } from './TechnicianSelect';
import type { CreateRepairRequest, CreateRepairPartRequest, PartSuggestion } from '../types';

interface Technician {
  id: string;
  name: string;
  email: string;
}

interface RepairFormProps {
  breakdownId: string;
  onSubmit: (repairData: CreateRepairRequest) => Promise<void>;
  onCancel: () => void;
  onGetPartSuggestions?: (query: string) => Promise<PartSuggestion[]>;
  technicians?: Technician[];
  currentUserId?: string;
  isSubmitting?: boolean;
  initialData?: Partial<CreateRepairRequest>;
}

/**
 * 수리 내역 입력 폼 컴포넌트
 * - 조치 내용 입력
 * - 사용 부품 입력 및 자동완성
 * - 담당자 선택
 * - 완료 시각 입력
 * - 총 비용 자동 계산
 */
export function RepairForm({
  breakdownId,
  onSubmit,
  onCancel,
  onGetPartSuggestions,
  technicians = [],
  currentUserId,
  isSubmitting = false,
  initialData
}: RepairFormProps) {
  const [formData, setFormData] = useState<CreateRepairRequest>({
    breakdown_id: breakdownId,
    action_taken: initialData?.action_taken || '',
    technician_id: initialData?.technician_id || currentUserId || '',
    completed_at: initialData?.completed_at || new Date().toISOString().slice(0, 16),
    parts_used: initialData?.parts_used || []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 폼 데이터 업데이트
  const updateFormData = (field: keyof CreateRepairRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 에러 클리어
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // 폼 검증
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 조치 내용 검증
    if (!formData.action_taken.trim()) {
      newErrors.action_taken = '조치 내용을 입력해주세요.';
    } else if (formData.action_taken.length > 2000) {
      newErrors.action_taken = '조치 내용은 2000자를 초과할 수 없습니다.';
    }

    // 담당자 검증
    if (!formData.technician_id) {
      newErrors.technician_id = '담당자를 선택해주세요.';
    }

    // 완료 시각 검증
    if (!formData.completed_at) {
      newErrors.completed_at = '완료 시각을 입력해주세요.';
    } else {
      const completedAt = new Date(formData.completed_at);
      const now = new Date();
      if (completedAt > now) {
        newErrors.completed_at = '완료 시각은 현재 시간보다 이후일 수 없습니다.';
      }
    }

    // 부품 데이터 검증
    if (formData.parts_used && formData.parts_used.length > 0) {
      for (let i = 0; i < formData.parts_used.length; i++) {
        const part = formData.parts_used[i];
        
        if (!part.part_name.trim()) {
          newErrors[`part_${i}_name`] = `부품 #${i + 1}의 이름을 입력해주세요.`;
        }
        
        if (part.quantity <= 0) {
          newErrors[`part_${i}_quantity`] = `부품 #${i + 1}의 수량은 0보다 커야 합니다.`;
        }
        
        if (part.unit_price < 0) {
          newErrors[`part_${i}_price`] = `부품 #${i + 1}의 단가는 0 이상이어야 합니다.`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('수리 기록 저장 실패:', error);
    }
  };

  // 총 비용 계산
  const calculateTotalCost = () => {
    if (!formData.parts_used || formData.parts_used.length === 0) {
      return 0;
    }
    
    return formData.parts_used.reduce((total, part) => {
      return total + (part.quantity * part.unit_price);
    }, 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            수리 내역 기록
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* 조치 내용 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            조치 내용 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.action_taken}
            onChange={(e) => updateFormData('action_taken', e.target.value)}
            disabled={isSubmitting}
            placeholder="수행한 수리 작업의 상세 내용을 입력하세요..."
            rows={4}
            maxLength={2000}
            className={`
              w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed resize-none
              ${errors.action_taken ? 'border-red-500' : 'border-gray-300'}
            `}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.action_taken && (
              <p className="text-xs text-red-600">{errors.action_taken}</p>
            )}
            <p className="text-xs text-gray-500 ml-auto">
              {formData.action_taken.length}/2000
            </p>
          </div>
        </div>

        {/* 사용 부품 입력 */}
        <PartsInput
          parts={formData.parts_used || []}
          onChange={(parts) => updateFormData('parts_used', parts)}
          onGetSuggestions={onGetPartSuggestions}
          disabled={isSubmitting}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 담당자 선택 */}
          <TechnicianSelect
            value={formData.technician_id}
            onChange={(technicianId) => updateFormData('technician_id', technicianId)}
            technicians={technicians}
            currentUserId={currentUserId}
            disabled={isSubmitting}
            required
          />

          {/* 완료 시각 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              완료 시각 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={formData.completed_at}
                onChange={(e) => updateFormData('completed_at', e.target.value)}
                disabled={isSubmitting}
                max={new Date().toISOString().slice(0, 16)}
                className={`
                  w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                  ${errors.completed_at ? 'border-red-500' : 'border-gray-300'}
                `}
              />
              <Clock className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.completed_at && (
              <p className="mt-1 text-xs text-red-600">{errors.completed_at}</p>
            )}
          </div>
        </div>

        {/* 총 비용 표시 */}
        {formData.parts_used && formData.parts_used.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                예상 수리 비용
              </span>
              <span className="text-xl font-bold text-gray-900">
                ₩{calculateTotalCost().toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              * 부품 비용만 포함되며, 인건비는 별도입니다.
            </p>
          </div>
        )}

        {/* 폼 액션 버튼 */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                수리 완료 기록
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}