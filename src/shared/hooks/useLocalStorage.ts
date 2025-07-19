'use client';

import { useState } from 'react';

/**
 * 로컬 스토리지를 React 상태와 동기화하는 훅
 * - SSR 안전성 보장
 * - 타입 안전성 제공
 * - 자동 직렬화/역직렬화
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // SSR 환경에서 안전하게 초기값 설정
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`로컬 스토리지에서 ${key} 읽기 실패:`, error);
      return initialValue;
    }
  });

  // 값 설정 함수
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // 함수형 업데이트 지원
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      // 브라우저 환경에서만 로컬 스토리지에 저장
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`로컬 스토리지에 ${key} 저장 실패:`, error);
    }
  };

  return [storedValue, setValue];
}