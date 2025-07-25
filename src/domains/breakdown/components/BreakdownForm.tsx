'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/Button';
import { EquipmentTypeSelect } from './EquipmentTypeSelect';
import { EquipmentNumberInput, validateEquipmentNumber } from './EquipmentNumberInput';
import { SymptomsInput } from './SymptomsInput';
import { OccurredAtInput } from './OccurredAtInput';
import { BreakdownFileUpload } from './BreakdownFileUpload';
import { useBreakdown } from '../hooks/useBreakdown';
import { useOfflineSync } from '../hooks/useOfflineSync';
import type { CreateBreakdownRequest } from '../types';

export interface BreakdownFormProps {
  onSuccess?: (breakdownId: string) => void;
  onSubmit?: (data: CreateBreakdownRequest) => void;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
}

interface FormData {
  equipment_type: string;
  equipment_number: string;
  symptoms: string;
  occurred_at: string;
  cause?: string;
  attachments: File[];
}

interface FormErrors {
  equipment_type?: string;
  equipment_number?: string;
  symptoms?: string;
  occurred_at?: string;
  cause?: string;
  attachments?: string;
  submit?: string;
}

/**
 * 고장 등록 폼 컴포넌트
 * - 필수 필드 유효성 검사
 * - 실시간 피드백
 * - 자동완성 및 템플릿 지원
 * - 모바일 최적화
 */
export const BreakdownForm: React.FC<BreakdownFormProps> = ({
  onSuccess,
  onSubmit,
  onCancel,
  loading: externalLoading = false,
  className
}) => {
  const { createBreakdown, creating, error: submitError, clearError } = useBreakdown();
  const { isOnline, saveOffline, pendingCount } = useOfflineSync();

  const [formData, setFormData] = useState<FormData>({
    equipment_type: '',
    equipment_number: '',
    symptoms: '',
    occurred_at: new Date().toISOString(),
    cause: '',
    attachments: []
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);

  // 필드 값 변경 핸들러
  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 해당 필드의 에러 클리어
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // 전체 제출 에러 클리어
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: undefined }));
    }
    
    clearError();
  };

  // 필드 포커스 아웃 핸들러
  const handleFieldBlur = (field: keyof FormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field !== 'attachments') {
      validateField(field, formData[field] as string);
    }
  };

  // 파일 첨부 핸들러
  const handleFilesChange = (files: File[]) => {
    setFormData(prev => ({ ...prev, attachments: files }));
  };

  // 파일 첨부 에러 핸들러
  const handleFileError = (error: string) => {
    setErrors(prev => ({ ...prev, submit: error }));
  };

  // 개별 필드 유효성 검사
  const validateField = async (field: keyof Omit<FormData, 'attachments'>, value: string) => {
    let error: string | undefined;

    switch (field) {
      case 'equipment_type':
        if (!value.trim()) {
          error = '설비 종류를 선택해주세요.';
        }
        break;

      case 'equipment_number':
        if (!value.trim()) {
          error = '설비 번호를 입력해주세요.';
        } else if (formData.equipment_type) {
          // 설비 번호 유효성 검사
          setIsValidating(true);
          try {
            const validation = await validateEquipmentNumber(value, formData.equipment_type);
            if (!validation.isValid) {
              error = validation.error;
            }
          } catch (err) {
            error = '설비 번호 확인 중 오류가 발생했습니다.';
          } finally {
            setIsValidating(false);
          }
        }
        break;

      case 'symptoms':
        if (!value.trim()) {
          error = '증상을 입력해주세요.';
        } else if (value.trim().length < 10) {
          error = '증상을 더 자세히 설명해주세요. (최소 10자)';
        }
        break;

      case 'occurred_at':
        if (!value) {
          error = '고장 발생 시각을 선택해주세요.';
        } else {
          const selectedDate = new Date(value);
          const now = new Date();
          if (selectedDate > now) {
            error = '미래 시간은 선택할 수 없습니다.';
          }
        }
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  // 전체 폼 유효성 검사
  const validateForm = async (): Promise<boolean> => {
    const newErrors: FormErrors = {};

    // 필수 필드 검사
    if (!formData.equipment_type.trim()) {
      newErrors.equipment_type = '설비 종류를 선택해주세요.';
    }

    if (!formData.equipment_number.trim()) {
      newErrors.equipment_number = '설비 번호를 입력해주세요.';
    }

    if (!formData.symptoms.trim()) {
      newErrors.symptoms = '증상을 입력해주세요.';
    } else if (formData.symptoms.trim().length < 10) {
      newErrors.symptoms = '증상을 더 자세히 설명해주세요. (최소 10자)';
    }

    if (!formData.occurred_at) {
      newErrors.occurred_at = '고장 발생 시각을 선택해주세요.';
    }

    // 설비 번호 유효성 검사
    if (formData.equipment_type && formData.equipment_number && !newErrors.equipment_number) {
      try {
        const validation = await validateEquipmentNumber(
          formData.equipment_number,
          formData.equipment_type
        );
        if (!validation.isValid) {
          newErrors.equipment_number = validation.error;
        }
      } catch (err) {
        newErrors.equipment_number = '설비 번호 확인 중 오류가 발생했습니다.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출 핸들러
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // 모든 필드를 touched로 표시
    setTouched({
      equipment_type: true,
      equipment_number: true,
      symptoms: true,
      occurred_at: true,
      cause: true
    });

    // 유효성 검사
    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    try {
      const request: CreateBreakdownRequest = {
        equipment_type: formData.equipment_type,
        equipment_number: formData.equipment_number,
        symptoms: formData.symptoms,
        occurred_at: formData.occurred_at,
        cause: formData.cause || undefined,
        attachments: formData.attachments.length > 0 ? formData.attachments : undefined
      };

      // onSubmit이 제공된 경우 외부에서 처리
      if (onSubmit) {
        await onSubmit(request);
        return;
      }

      // 기본 내부 처리 로직
      if (isOnline) {
        // 온라인 상태: 즉시 서버에 등록
        const breakdown = await createBreakdown(request);
        onSuccess?.(breakdown.id);
      } else {
        // 오프라인 상태: 로컬에 저장 후 나중에 동기화
        const offlineId = await saveOffline(request);
        
        // 성공 메시지 표시
        setErrors(prev => ({
          ...prev,
          submit: undefined
        }));
        
        // 사용자에게 오프라인 저장 알림
        alert('오프라인 상태입니다. 고장 신고가 임시 저장되었으며, 온라인 상태가 되면 자동으로 등록됩니다.');
        
        onSuccess?.(offlineId);
      }
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        submit: err instanceof Error ? err.message : '고장 등록 중 오류가 발생했습니다.'
      }));
    }
  };

  // 설비 종류 변경 시 설비 번호 초기화
  useEffect(() => {
    if (formData.equipment_type && formData.equipment_number) {
      setFormData(prev => ({ ...prev, equipment_number: '' }));
      setErrors(prev => ({ ...prev, equipment_number: undefined }));
    }
  }, [formData.equipment_type]);

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* 오프라인 상태 표시 */}
      {!isOnline && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-amber-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">
                오프라인 모드
              </p>
              <p className="text-sm text-amber-700">
                고장 신고가 임시 저장되며, 온라인 상태가 되면 자동으로 등록됩니다.
                {pendingCount > 0 && ` (대기 중: ${pendingCount}개)`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 설비 종류 선택 */}
      <EquipmentTypeSelect
        value={formData.equipment_type}
        onChange={(value) => {
          handleFieldChange('equipment_type', value);
          setTouched(prev => ({ ...prev, equipment_type: true }));
          validateField('equipment_type', value);
        }}
        error={touched.equipment_type ? errors.equipment_type : undefined}
        required
      />

      {/* 설비 번호 입력 */}
      <EquipmentNumberInput
        value={formData.equipment_number}
        onChange={(value) => {
          handleFieldChange('equipment_number', value);
          setTouched(prev => ({ ...prev, equipment_number: true }));
          validateField('equipment_number', value);
        }}
        equipmentType={formData.equipment_type}
        error={touched.equipment_number ? errors.equipment_number : undefined}
        required
      />

      {/* 고장 발생 시각 */}
      <OccurredAtInput
        value={formData.occurred_at}
        onChange={(value) => {
          handleFieldChange('occurred_at', value);
          setTouched(prev => ({ ...prev, occurred_at: true }));
          validateField('occurred_at', value);
        }}
        error={touched.occurred_at ? errors.occurred_at : undefined}
        required
      />

      {/* 증상 입력 */}
      <SymptomsInput
        value={formData.symptoms}
        onChange={(value) => {
          handleFieldChange('symptoms', value);
          setTouched(prev => ({ ...prev, symptoms: true }));
          validateField('symptoms', value);
        }}
        error={touched.symptoms ? errors.symptoms : undefined}
        required
      />

      {/* 원인 입력 (선택사항) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          원인 (선택사항)
        </label>
        <textarea
          value={formData.cause}
          onChange={(e) => {
            handleFieldChange('cause', e.target.value);
            setTouched(prev => ({ ...prev, cause: true }));
            validateField('cause', e.target.value);
          }}
          placeholder="고장의 원인을 알고 있다면 입력해주세요."
          className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px] resize-y"
          maxLength={500}
        />
        <div className="flex justify-end mt-1">
          <span className="text-xs text-gray-500">
            {formData.cause ? formData.cause.length : 0}/500
          </span>
        </div>
      </div>

      {/* 파일 첨부 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          첨부 파일 (선택사항)
        </label>
        <BreakdownFileUpload
          onFilesChange={handleFilesChange}
          onError={handleFileError}
          disabled={creating || isValidating || externalLoading}
          maxFiles={5}
        />
      </div>

      {/* 제출 에러 표시 */}
      {(errors.submit || submitError) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">
              {errors.submit || submitError}
            </p>
          </div>
        </div>
      )}

      {/* 버튼 영역 */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={creating || isValidating || externalLoading}
            className="w-full sm:w-auto"
          >
            취소
          </Button>
        )}
        <Button
          type="submit"
          loading={creating || isValidating || externalLoading}
          disabled={creating || isValidating || externalLoading}
          className="w-full sm:w-auto"
        >
          {(creating || externalLoading) ? '등록 중...' : '고장 등록'}
        </Button>
      </div>
    </form>
  );
};