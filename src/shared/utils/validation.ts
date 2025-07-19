/**
 * 폼 유효성 검사 유틸리티 함수들
 * - 재사용 가능한 검증 로직
 * - 한국어 에러 메시지
 */

// 이메일 유효성 검사
export const validateEmail = (email: string): string | undefined => {
  if (!email) return '이메일을 입력해주세요.';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return '올바른 이메일 형식을 입력해주세요.';
  }
  
  return undefined;
};

// 비밀번호 유효성 검사
export const validatePassword = (password: string): string | undefined => {
  if (!password) return '비밀번호를 입력해주세요.';
  
  if (password.length < 8) {
    return '비밀번호는 8자 이상이어야 합니다.';
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return '비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다.';
  }
  
  return undefined;
};

// 필수 필드 검사
export const validateRequired = (value: any, fieldName: string): string | undefined => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName}을(를) 입력해주세요.`;
  }
  return undefined;
};

// 최소 길이 검사
export const validateMinLength = (
  value: string, 
  minLength: number, 
  fieldName: string
): string | undefined => {
  if (value && value.length < minLength) {
    return `${fieldName}은(는) 최소 ${minLength}자 이상이어야 합니다.`;
  }
  return undefined;
};

// 최대 길이 검사
export const validateMaxLength = (
  value: string, 
  maxLength: number, 
  fieldName: string
): string | undefined => {
  if (value && value.length > maxLength) {
    return `${fieldName}은(는) 최대 ${maxLength}자까지 입력 가능합니다.`;
  }
  return undefined;
};

// 숫자 유효성 검사
export const validateNumber = (
  value: string, 
  fieldName: string,
  options?: { min?: number; max?: number; integer?: boolean }
): string | undefined => {
  if (!value) return undefined;
  
  const num = Number(value);
  if (isNaN(num)) {
    return `${fieldName}은(는) 숫자여야 합니다.`;
  }
  
  if (options?.integer && !Number.isInteger(num)) {
    return `${fieldName}은(는) 정수여야 합니다.`;
  }
  
  if (options?.min !== undefined && num < options.min) {
    return `${fieldName}은(는) ${options.min} 이상이어야 합니다.`;
  }
  
  if (options?.max !== undefined && num > options.max) {
    return `${fieldName}은(는) ${options.max} 이하여야 합니다.`;
  }
  
  return undefined;
};

// 전화번호 유효성 검사 (한국 형식)
export const validatePhoneNumber = (phone: string): string | undefined => {
  if (!phone) return undefined;
  
  const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return '올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)';
  }
  
  return undefined;
};

// 설비 번호 유효성 검사
export const validateEquipmentNumber = (equipmentNumber: string): string | undefined => {
  if (!equipmentNumber) return '설비 번호를 입력해주세요.';
  
  // 설비 번호는 영문자와 숫자, 하이픈만 허용
  const equipmentRegex = /^[A-Za-z0-9-]+$/;
  if (!equipmentRegex.test(equipmentNumber)) {
    return '설비 번호는 영문자, 숫자, 하이픈(-)만 사용 가능합니다.';
  }
  
  if (equipmentNumber.length < 3 || equipmentNumber.length > 20) {
    return '설비 번호는 3자 이상 20자 이하로 입력해주세요.';
  }
  
  return undefined;
};

// 파일 유효성 검사
export const validateFile = (
  file: File,
  options: {
    maxSize?: number; // bytes
    allowedTypes?: string[];
    maxFiles?: number;
  }
): string | undefined => {
  if (options.maxSize && file.size > options.maxSize) {
    const maxSizeMB = Math.round(options.maxSize / (1024 * 1024));
    return `파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`;
  }
  
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    return `허용되지 않는 파일 형식입니다. (${options.allowedTypes.join(', ')})`;
  }
  
  return undefined;
};

// 복합 유효성 검사 함수
export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, Array<(value: any) => string | undefined>>
): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field];
    const value = data[field];
    
    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) {
        errors[field] = error;
        break; // 첫 번째 에러만 표시
      }
    }
  });
  
  return errors;
};