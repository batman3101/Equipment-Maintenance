'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';

// 실제 분석 로직을 담당하는 컴포넌트
function AnalyticsContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = pathname + searchParams.toString();

    // 페이지 뷰 추적
    const handleRouteChange = () => {
      if (window.gtag) {
        window.gtag('event', 'page_view', {
          page_path: url,
        });
      }
    };

    handleRouteChange();
  }, [pathname, searchParams]);

  return null;
}

// 메인 Analytics 컴포넌트
export function Analytics() {
  // Google Analytics ID가 설정된 경우에만 스크립트 로드
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  if (!gaId) {
    return null;
  }

  return (
    <>
      {/* Google Analytics 스크립트 */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
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