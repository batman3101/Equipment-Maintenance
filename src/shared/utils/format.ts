/**
 * 데이터 포맷팅 유틸리티 함수들
 * - 날짜, 시간, 숫자 등의 표시 형식 통일
 * - 한국어 로케일 지원
 */

// 날짜 포맷팅
export const formatDate = (
  date: string | Date,
  options: {
    format?: 'short' | 'medium' | 'long' | 'relative';
    includeTime?: boolean;
  } = {}
): string => {
  const { format = 'medium', includeTime = false } = options;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '잘못된 날짜';
  }
  
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // 상대적 시간 표시
  if (format === 'relative') {
    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
    return `${Math.floor(diffDays / 365)}년 전`;
  }
  
  // 절대적 시간 표시
  const formatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'short' ? 'numeric' : 'long',
    day: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  };
  
  if (format === 'long') {
    formatOptions.weekday = 'long';
  }
  
  return dateObj.toLocaleDateString('ko-KR', formatOptions);
};

// 시간 포맷팅
export const formatTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '잘못된 시간';
  }
  
  return dateObj.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// 숫자 포맷팅 (천 단위 구분)
export const formatNumber = (
  num: number,
  options: {
    decimals?: number;
    currency?: boolean;
    unit?: string;
  } = {}
): string => {
  const { decimals = 0, currency = false, unit } = options;
  
  if (isNaN(num)) return '0';
  
  let formatted = num.toLocaleString('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  
  if (currency) {
    formatted = `₩${formatted}`;
  }
  
  if (unit) {
    formatted = `${formatted}${unit}`;
  }
  
  return formatted;
};

// 파일 크기 포맷팅
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// 전화번호 포맷팅
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  
  return phone;
};

// 설비 번호 포맷팅 (대문자 변환)
export const formatEquipmentNumber = (equipmentNumber: string): string => {
  return equipmentNumber.toUpperCase().trim();
};

// 상태 텍스트 포맷팅
export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'in_progress': '진행 중',
    'under_repair': '수리 중',
    'completed': '완료',
    'active': '활성',
    'inactive': '비활성',
    'pending': '대기 중',
    'cancelled': '취소됨'
  };
  
  return statusMap[status] || status;
};

// 우선순위 포맷팅
export const formatPriority = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    'low': '낮음',
    'medium': '보통',
    'high': '높음',
    'urgent': '긴급'
  };
  
  return priorityMap[priority] || priority;
};

// 텍스트 줄임 처리
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// 마스킹 처리 (개인정보 보호)
export const maskText = (
  text: string,
  type: 'email' | 'phone' | 'name' | 'custom',
  customPattern?: { start: number; end: number }
): string => {
  if (!text) return '';
  
  switch (type) {
    case 'email':
      const [local, domain] = text.split('@');
      if (!domain) return text;
      const maskedLocal = local.length > 2 
        ? `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}`
        : local;
      return `${maskedLocal}@${domain}`;
      
    case 'phone':
      const cleaned = text.replace(/\D/g, '');
      if (cleaned.length === 11) {
        return `${cleaned.substring(0, 3)}-****-${cleaned.substring(7)}`;
      }
      return text;
      
    case 'name':
      if (text.length <= 2) return text;
      return `${text[0]}${'*'.repeat(text.length - 2)}${text[text.length - 1]}`;
      
    case 'custom':
      if (!customPattern) return text;
      const { start, end } = customPattern;
      const before = text.substring(0, start);
      const after = text.substring(text.length - end);
      const middle = '*'.repeat(text.length - start - end);
      return `${before}${middle}${after}`;
      
    default:
      return text;
  }
};