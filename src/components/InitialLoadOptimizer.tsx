'use client';

import React, { useEffect, useState } from 'react';
import { useMemorySafeState } from '@/hooks/use-memory-safe';

interface InitialLoadOptimizerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  timeout?: number;
}

/**
 * 초기 로딩 최적화 컴포넌트
 * 3G 환경에서 2초 이내 로딩을 위한 최적화 컴포넌트
 * - 중요 콘텐츠 우선 로딩
 * - 비중요 콘텐츠 지연 로딩
 * - 로딩 상태 표시
 */
export function InitialLoadOptimizer({
  children,
  fallback,
  timeout = 2000,
}: InitialLoadOptimizerProps) {
  const [isLoaded, setIsLoaded] = useMemorySafeState(false);
  const [isSlowConnection, setIsSlowConnection] = useMemorySafeState(false);

  useEffect(() => {
    // 네트워크 상태 확인
    const connection = (navigator as any).connection;
    const isSlowNetwork =
      connection &&
      (connection.effectiveType === 'slow-2g' ||
        connection.effectiveType === '2g' ||
        connection.effectiveType === '3g');

    setIsSlowConnection(isSlowNetwork);

    // 페이지 로드 시간 측정
    const startTime = performance.now();

    // 주요 콘텐츠 로드 완료 시점 감지
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      
      // 빠른 연결에서는 즉시 콘텐츠 표시
      if (!isSlowNetwork) {
        setIsLoaded(true);
        return;
      }
      
      // 느린 연결에서는 최소 표시 시간 보장
      if (loadTime < timeout) {
        setTimeout(() => {
          setIsLoaded(true);
        }, timeout - loadTime);
      } else {
        setIsLoaded(true);
      }
    };

    // 페이지 로드 이벤트 리스너
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    // 타임아웃 설정 (최대 대기 시간)
    const timeoutId = setTimeout(() => {
      setIsLoaded(true);
    }, timeout);

    return () => {
      window.removeEventListener('load', handleLoad);
      clearTimeout(timeoutId);
    };
  }, [timeout, setIsLoaded, setIsSlowConnection]);

  // 느린 연결에서는 폴백 UI 표시
  if (!isLoaded && isSlowConnection) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}