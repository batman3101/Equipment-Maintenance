/**
 * 동적 임포트 유틸리티 함수
 * 코드 스플리팅을 위한 헬퍼 함수들
 */

import { lazy } from 'react';

/**
 * 컴포넌트를 동적으로 임포트하는 함수
 * @param importFn 임포트 함수 (예: () => import('./path/to/component'))
 * @param exportName 내보낸 컴포넌트 이름 (기본 내보내기가 아닌 경우)
 * @returns 지연 로딩된 컴포넌트
 */
export function dynamicImport<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ [key: string]: T }>,
  exportName: string
) {
  return lazy(() =>
    importFn().then((module) => ({ default: module[exportName] }))
  );
}

/**
 * 경로 기반 프리페칭 함수
 * 사용자 상호작용 시 미리 컴포넌트를 로드하여 UX 개선
 * @param paths 프리페치할 경로 배열
 */
export function prefetchComponents(paths: string[]) {
  if (typeof window === 'undefined') return;

  // requestIdleCallback 사용하여 메인 스레드 차단 방지
  const prefetch = () => {
    paths.forEach((path) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = path;
      link.as = 'script';
      document.head.appendChild(link);
    });
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(prefetch);
  } else {
    setTimeout(prefetch, 2000); // fallback
  }
}

/**
 * 컴포넌트 프리로딩 함수
 * 특정 컴포넌트를 미리 로드
 * @param importFn 임포트 함수
 */
export function preloadComponent(importFn: () => Promise<any>) {
  return () => {
    importFn();
    return null;
  };
}