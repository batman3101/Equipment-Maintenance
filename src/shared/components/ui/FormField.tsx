'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  children: React.ReactNode;
  error?: string;
  className?: string;
}

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  children: React.ReactNode;
}

export interface FormErrorProps {
  message?: string;
  className?: string;
}

export interface FormHelperTextProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * 폼 필드 래퍼 컴포넌트
 * - 일관된 폼 레이아웃 제공
 * - 에러 상태 관리
 */
export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ children, error, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-2', className)}
        {...props}
      >
        {children}
        {error && <FormError message={error} />}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

/**
 * 폼 라벨 컴포넌트
 * - 접근성 준수
 * - 필수 필드 표시
 */
export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'block text-sm font-medium text-gray-700',
          className
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="text-red-500 ml-1" aria-label="필수 입력">
            *
          </span>
        )}
      </label>
    );
  }
);

FormLabel.displayName = 'FormLabel';

/**
 * 폼 에러 메시지 컴포넌트
 * - 접근성 준수 (role="alert")
 * - 일관된 에러 스타일
 */
export const FormError = React.forwardRef<HTMLParagraphElement, FormErrorProps>(
  ({ message, className, ...props }, ref) => {
    if (!message) return null;

    return (
      <p
        ref={ref}
        role="alert"
        className={cn('text-sm text-red-600 flex items-center', className)}
        {...props}
      >
        <svg
          className="h-4 w-4 mr-1 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        {message}
      </p>
    );
  }
);

FormError.displayName = 'FormError';

/**
 * 폼 도움말 텍스트 컴포넌트
 */
export const FormHelperText = React.forwardRef<HTMLParagraphElement, FormHelperTextProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-gray-500', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);

FormHelperText.displayName = 'FormHelperText';

/**
 * 폼 유효성 검사 훅
 */
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | undefined;
}

export interface UseFormValidationProps {
  rules?: ValidationRule;
  value: any;
}

export const useFormValidation = ({ rules, value }: UseFormValidationProps) => {
  const [error, setError] = React.useState<string>('');

  const validate = React.useCallback(() => {
    if (!rules) return true;

    // 필수 필드 검사
    if (rules.required && (!value || value.toString().trim() === '')) {
      setError('이 필드는 필수입니다.');
      return false;
    }

    // 최소 길이 검사
    if (rules.minLength && value && value.toString().length < rules.minLength) {
      setError(`최소 ${rules.minLength}자 이상 입력해주세요.`);
      return false;
    }

    // 최대 길이 검사
    if (rules.maxLength && value && value.toString().length > rules.maxLength) {
      setError(`최대 ${rules.maxLength}자까지 입력 가능합니다.`);
      return false;
    }

    // 패턴 검사
    if (rules.pattern && value && !rules.pattern.test(value.toString())) {
      setError('올바른 형식으로 입력해주세요.');
      return false;
    }

    // 커스텀 검사
    if (rules.custom && value) {
      const customError = rules.custom(value);
      if (customError) {
        setError(customError);
        return false;
      }
    }

    setError('');
    return true;
  }, [rules, value]);

  React.useEffect(() => {
    if (value !== undefined && value !== '') {
      validate();
    }
  }, [value, validate]);

  return { error, validate, setError };
};