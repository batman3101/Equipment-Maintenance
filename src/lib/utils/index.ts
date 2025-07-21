/**
 * 공통 유틸리티 함수
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 클래스 이름을 병합하는 유틸리티 함수
 * clsx와 tailwind-merge를 결합하여 사용
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 디바운스 함수
 * 연속적인 함수 호출을 제한하여 성능 최적화
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 스로틀 함수
 * 함수 호출 빈도를 제한하여 성능 최적화
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 이미지 URL을 WebP 형식으로 변환하는 함수
 * 브라우저가 WebP를 지원하는 경우에만 사용
 */
export function getWebPImageUrl(url: string): string {
  if (typeof window === 'undefined') return url;
  
  const supportsWebP = localStorage.getItem('supportsWebP');
  
  if (supportsWebP === 'true' && !url.endsWith('.webp') && !url.includes('data:image')) {
    // 이미 쿼리 파라미터가 있는 경우
    if (url.includes('?')) {
      return `${url}&format=webp`;
    }
    return `${url}?format=webp`;
  }
  
  return url;
}

/**
 * 브라우저의 WebP 지원 여부를 확인하는 함수
 */
export function checkWebPSupport(): void {
  if (typeof window === 'undefined') return;
  
  if (localStorage.getItem('supportsWebP') !== null) return;
  
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    localStorage.setItem('supportsWebP', supportsWebP.toString());
  } else {
    localStorage.setItem('supportsWebP', 'false');
  }
}