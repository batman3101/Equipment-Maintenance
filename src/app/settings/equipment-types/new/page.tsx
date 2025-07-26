'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SettingFormLayout } from '@/domains/settings/components/SettingFormLayout';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Select } from '@/shared/components/ui/Select';
import { FormField } from '@/shared/components/ui/FormField';
import { COLOR_OPTIONS, CreateEquipmentTypeRequest } from '@/domains/settings/types';

/**
 * 설비 종류 생성 페이지
 */
export default function NewEquipmentTypePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // 폼 상태
  const [formData, setFormData] = useState<CreateEquipmentTypeRequest>({
    name: '',
    code: '',
    description: '',
    color: COLOR_OPTIONS[0].value,
    display_order: 1
  });

  // 유효성 검사 에러
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 입력 핸들러
  const handleInputChange = (field: keyof CreateEquipmentTypeRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 에러 클리어
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 코드 자동 생성 (이름 기반)
  const generateCode = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // 특수문자 제거
      .replace(/\s+/g, '_') // 공백을 underscore로
      .replace(/^_+|_+$/g, ''); // 앞뒤 underscore 제거
  };

  // 이름 변경 시 코드 자동 생성
  const handleNameChange = (value: string) => {
    handleInputChange('name', value);
    
    // 코드가 비어있거나 이전 이름에서 생성된 코드라면 자동 생성
    if (!formData.code || formData.code === generateCode(formData.name)) {
      const newCode = generateCode(value);
      handleInputChange('code', newCode);
    }
  };

  // 유효성 검사
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '설비 종류명을 입력해주세요.';
    }

    if (!formData.code.trim()) {
      newErrors.code = '설비 코드를 입력해주세요.';
    } else if (!/^[a-z0-9_]+$/.test(formData.code)) {
      newErrors.code = '코드는 영문 소문자, 숫자, 언더스코어(_)만 사용할 수 있습니다.';
    }

    if (formData.display_order < 1) {
      newErrors.display_order = '표시 순서는 1 이상이어야 합니다.';
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

    setLoading(true);
    try {
      // TODO: 실제 API 호출로 대체
      console.log('생성 데이터:', formData);
      
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 성공 시 목록 페이지로 이동
      router.push('/settings/equipment-types');
    } catch (error) {
      console.error('생성 실패:', error);
      // TODO: 에러 토스트 표시
    } finally {
      setLoading(false);
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    router.push('/settings/equipment-types');
  };

  return (
    <SettingFormLayout
      title="새 설비 종류 생성"
      description="새로운 설비 종류를 추가합니다"
      backHref="/settings/equipment-types"
      isEditing={false}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
      submitButtonText="생성 완료"
    >
      <div className="space-y-6">
        {/* 기본 정보 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            기본 정보
          </h3>
          
          <FormField label="설비 종류명" required error={errors.name}>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="예: CNC 머신"
              error={errors.name}
              maxLength={50}
            />
          </FormField>

          <FormField label="설비 코드" required error={errors.code}>
            <Input
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              placeholder="예: cnc_machine"
              error={errors.code}
              helperText="시스템에서 사용할 고유 코드입니다. 영문 소문자, 숫자, 언더스코어(_)만 사용 가능합니다."
              maxLength={30}
            />
          </FormField>

          <FormField label="설명" error={errors.description}>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="설비 종류에 대한 설명을 입력해주세요"
              rows={3}
              maxLength={200}
            />
          </FormField>
        </div>

        {/* 표시 설정 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            표시 설정
          </h3>

          <FormField label="색상" error={errors.color}>
            <Select
              options={COLOR_OPTIONS.map(color => ({
                value: color.value,
                label: color.label
              }))}
              value={formData.color || ''}
              onChange={(value) => handleInputChange('color', value)}
              placeholder="색상을 선택해주세요"
            />
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-sm text-gray-600">선택된 색상:</span>
              <div 
                className="w-6 h-6 rounded border border-gray-300"
                style={{ backgroundColor: formData.color }}
              />
            </div>
          </FormField>

          <FormField label="표시 순서" required error={errors.display_order}>
            <Input
              type="number"
              value={formData.display_order}
              onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 1)}
              placeholder="1"
              error={errors.display_order}
              helperText="작은 숫자일수록 먼저 표시됩니다."
              min={1}
              max={999}
            />
          </FormField>
        </div>

        {/* 미리보기 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            미리보기
          </h3>
          
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full border border-gray-200"
                style={{ backgroundColor: formData.color }}
              />
              <div>
                <div className="font-medium text-gray-900">
                  {formData.name || '설비 종류명'}
                </div>
                <div className="text-sm text-gray-500 font-mono">
                  {formData.code || 'equipment_code'}
                </div>
                {formData.description && (
                  <div className="text-sm text-gray-600 mt-1">
                    {formData.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SettingFormLayout>
  );
}