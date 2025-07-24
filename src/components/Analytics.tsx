'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';

// 성능 메트릭 추적 (간단한 버전)
function trackWebVitals() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // 기본 성능 메트릭만 추적
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      console.log('Page Load Time:', navigation.loadEventEnd - navigation.fetchStart);
    }
  }
}

// 실제 분석 로직을 담당하는 컴포넌트
function AnalyticsContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

    // 페이지 뷰 추적
    const handleRouteChange = () => {
      // Google Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'page_view', {
          page_path: url,
          page_title: document.title,
        });
      }

      // 커스텀 분석 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        console.log('Page view:', url);
      }
    };

    handleRouteChange();
  }, [pathname, searchParams]);

  // 성능 메트릭 추적 (한 번만 실행)
  useEffect(() => {
    trackWebVitals();
  }, []);

  return null;
}

// 메인 Analytics 컴포넌트
export function Analytics() {
  // Google Analytics ID가 설정된 경우에만 스크립트 로드
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  // 프로덕션 환경이 아니면 분석 스크립트 로드하지 않음
  if (!gaId || process.env.NODE_ENV !== 'production') {
    return (
      <Suspense fallback={null}>
        <AnalyticsContent />
      </Suspense>
    );
  }

  return (
    <>
      {/* Google Analytics 스크립트 */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        onLoad={() => {
          console.log('Google Analytics loaded');
        }}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
              send_page_view: false
            });
          `,
        }}
      />
      
      {/* useSearchParams를 Suspense 경계 내에서 사용 */}
      <Suspense fallback={null}>
        <AnalyticsContent />
      </Suspense>
    </>
  );
}

// 타입 선언
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}