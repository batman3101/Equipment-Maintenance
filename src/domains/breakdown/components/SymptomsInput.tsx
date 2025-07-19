'use client';

import React, { useState } from 'react';
import { Textarea } from '@/shared/components/ui/Textarea';
import { ActionSheet, useActionSheet } from '@/shared/components/ui/ActionSheet';

export interface SymptomsInputProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

// 증상 템플릿 목록
const SYMPTOM_TEMPLATES = [
  {
    category: '가동 중단',
    templates: [
      '설비가 갑자기 정지되었습니다.',
      '전원이 켜지지 않습니다.',
      '비상정지 버튼이 눌린 상태입니다.',
      '모터가 회전하지 않습니다.'
    ]
  },
  {
    category: '가공 품질',
    templates: [
      '가공 치수가 맞지 않습니다.',
      '표면 거칠기가 불량합니다.',
      '진동이 심하게 발생합니다.',
      '소음이 평소보다 큽니다.'
    ]
  },
  {
    category: '공구 문제',
    templates: [
      '공구가 파손되었습니다.',
      '공구 교환이 되지 않습니다.',
      '공구 마모가 심합니다.',
      '공구 홀더가 헐거워졌습니다.'
    ]
  },
  {
    category: '냉각/윤활',
    templates: [
      '냉각수가 나오지 않습니다.',
      '냉각수 압력이 낮습니다.',
      '오일 누유가 발생했습니다.',
      '윤활유 부족 경고가 표시됩니다.'
    ]
  },
  {
    category: '제어 시스템',
    templates: [
      '화면에 에러 메시지가 표시됩니다.',
      '프로그램이 실행되지 않습니다.',
      '축 이동이 되지 않습니다.',
      '원점 복귀가 되지 않습니다.'
    ]
  },
  {
    category: '기타',
    templates: [
      '평소와 다른 이상 소음이 발생합니다.',
      '설비에서 이상한 냄새가 납니다.',
      '온도가 평소보다 높습니다.',
      '기타 이상 현상이 발생했습니다.'
    ]
  }
];

/**
 * 증상 입력 컴포넌트
 * - 자유 텍스트 입력
 * - 미리 정의된 템플릿 제공
 * - 문자 수 제한 및 표시
 */
export const SymptomsInput: React.FC<SymptomsInputProps> = ({
  value = '',
  onChange,
  error,
  required = false,
  disabled = false,
  className
}) => {
  const { open: openActionSheet, ActionSheet } = useActionSheet();

  // 템플릿 선택 핸들러
  const handleTemplateSelect = (template: string) => {
    if (value.trim()) {
      // 기존 내용이 있으면 추가
      onChange(`${value}\n${template}`);
    } else {
      // 기존 내용이 없으면 대체
      onChange(template);
    }
  };

  // 템플릿 버튼 클릭 핸들러
  const handleTemplateButtonClick = () => {
    const actions = SYMPTOM_TEMPLATES.flatMap(category => [
      // 카테고리 헤더 (비활성화된 액션으로 표시)
      {
        label: category.category,
        onClick: () => {},
        disabled: true,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )
      },
      // 템플릿 항목들
      ...category.templates.map(template => ({
        label: template,
        onClick: () => handleTemplateSelect(template),
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )
      }))
    ]);

    openActionSheet({
      title: '증상 템플릿 선택',
      description: '자주 발생하는 증상을 선택하여 빠르게 입력할 수 있습니다.',
      actions
    });
  };

  return (
    <div className={className}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            증상 설명
            {required && <span className="text-red-500 ml-1">*</span>}
          </span>
          <button
            type="button"
            onClick={handleTemplateButtonClick}
            disabled={disabled}
            className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            템플릿
          </button>
        </div>

        <Textarea
          placeholder="발생한 고장의 증상을 자세히 설명해주세요.&#10;예: 가공 중 갑자기 설비가 정지되었고, 화면에 'SERVO ERROR' 메시지가 표시됩니다."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={error}
          required={required}
          disabled={disabled}
          maxLength={1000}
          rows={4}
          helperText="고장 상황을 구체적으로 기록하면 빠른 해결에 도움이 됩니다."
        />
      </div>

      <ActionSheet />
    </div>
  );
};

/**
 * 증상 템플릿 목록을 가져오는 유틸리티 함수
 */
export const getSymptomTemplates = () => {
  return SYMPTOM_TEMPLATES;
};

/**
 * 카테고리별 템플릿을 가져오는 유틸리티 함수
 */
export const getTemplatesByCategory = (category: string) => {
  const categoryData = SYMPTOM_TEMPLATES.find(cat => cat.category === category);
  return categoryData?.templates || [];
};