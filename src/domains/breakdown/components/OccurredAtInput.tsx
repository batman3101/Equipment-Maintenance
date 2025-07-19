'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/shared/components/ui/Input';

export interface OccurredAtInputProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * 고장 발생 시각 입력 컴포넌트
 * - 현재 시간을 기본값으로 설정
 * - 날짜와 시간 입력
 * - 미래 시간 입력 방지
 */
export const OccurredAtInput: React.FC<OccurredAtInputProps> = ({
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className
}) => {
  const [localValue, setLocalValue] = useState('');

  // 현재 시간을 YYYY-MM-DDTHH:MM 형식으로 변환
  const getCurrentDateTime = (): string => {
    const now = new Date();
    // 로컬 시간대 오프셋을 고려하여 조정
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  // 최대 날짜/시간 (현재 시간)
  const maxDateTime = getCurrentDateTime();

  // 초기값 설정
  useEffect(() => {
    if (value) {
      // 전달받은 값이 있으면 사용 (ISO 문자열을 로컬 datetime-local 형식으로 변환)
      const date = new Date(value);
      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      setLocalValue(localDate.toISOString().slice(0, 16));
    } else {
      // 기본값으로 현재 시간 설정
      const currentDateTime = getCurrentDateTime();
      setLocalValue(currentDateTime);
      onChange(new Date().toISOString());
    }
  }, [value, onChange]);

  // 값 변경 핸들러
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setLocalValue(newValue);

    if (newValue) {
      // datetime-local 값을 ISO 문자열로 변환
      const date = new Date(newValue);
      onChange(date.toISOString());
    } else {
      onChange('');
    }
  };

  // 현재 시간으로 설정 버튼 핸들러
  const handleSetCurrentTime = () => {
    const currentDateTime = getCurrentDateTime();
    setLocalValue(currentDateTime);
    onChange(new Date().toISOString());
  };

  // 유효성 검사
  const validateDateTime = (dateTimeValue: string): string | undefined => {
    if (!dateTimeValue) {
      return required ? '고장 발생 시각을 입력해주세요.' : undefined;
    }

    const selectedDate = new Date(dateTimeValue);
    const now = new Date();

    if (selectedDate > now) {
      return '미래 시간은 선택할 수 없습니다.';
    }

    // 너무 과거 시간 체크 (1년 전)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (selectedDate < oneYearAgo) {
      return '1년 이전의 시간은 선택할 수 없습니다.';
    }

    return undefined;
  };

  const validationError = validateDateTime(localValue);
  const displayError = error || validationError;

  return (
    <div className={className}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            고장 발생 시각
            {required && <span className="text-red-500 ml-1">*</span>}
          </span>
          <button
            type="button"
            onClick={handleSetCurrentTime}
            disabled={disabled}
            className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            현재 시간
          </button>
        </div>

        <Input
          type="datetime-local"
          value={localValue}
          onChange={handleChange}
          max={maxDateTime}
          error={displayError}
          required={required}
          disabled={disabled}
          helperText="고장이 실제로 발생한 시간을 선택해주세요. 기본값은 현재 시간입니다."
        />
      </div>
    </div>
  );
};

/**
 * 날짜/시간 형식 유틸리티 함수들
 */

/**
 * ISO 문자열을 로컬 datetime-local 형식으로 변환
 */
export const isoToDateTimeLocal = (isoString: string): string => {
  const date = new Date(isoString);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

/**
 * datetime-local 형식을 ISO 문자열로 변환
 */
export const dateTimeLocalToIso = (dateTimeLocal: string): string => {
  return new Date(dateTimeLocal).toISOString();
};

/**
 * 날짜/시간을 사용자 친화적 형식으로 포맷
 */
export const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * 상대적 시간 표시 (예: "2시간 전", "방금 전")
 */
export const getRelativeTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return '방금 전';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return formatDateTime(isoString);
  }
};