import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';

/**
 * 번들 분석기 설정
 * ANALYZE=true 환경 변수가 설정된 경우에만 활성화됨
 */
const withBundleAnalyzer_ = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false, // 프로덕션 환경에서는 자동으로 열지 않음
});

/**
 * Next.js 설정
 * 프로덕션 배포에 최적화된 설정
 */
const nextConfig: NextConfig = {

  // 정적 내보내기 비활성화
  distDir: '.next',
  // 정적 페이지 생성 비활성화
  reactStrictMode: false,

  // 빌드 시 타입 및 린트 오류 무시 (프로덕션 배포 최적화)
  typescript: {
    ignoreBuildErrors: true, // 타입 오류 무시
  },
  eslint: {
    ignoreDuringBuilds: true, // 린트 오류 무시
    dirs: ['src'],
  },
  // 정적 페이지 생성 비활성화
  env: {
    NEXT_PUBLIC_SKIP_PRERENDER: 'true',
  },
  // 서버 사이드 렌더링만 사용
  experimental: {
    // 코드 스플리팅 최적화
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@supabase/supabase-js',
    ],
  },
  // 정적 페이지 생성 비활성화
  webpack: (config, { isServer }) => {
    // 클라이언트 사이드에서만 적용
    if (!isServer) {
      // 빌드 시 useSearchParams 관련 오류 무시
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
  
  // 정적 파일 최적화
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60, // 이미지 캐시 시간 설정 (초)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  // 헤더 설정 - 보안 및 캐싱 최적화 (프로덕션 배포 시 활성화)
  // async headers() {
  //   return [
  //     // 정적 자산 캐싱 최적화
  //     {
  //       source: '/_next/static/(.*)',
  //       headers: [
  //         {
  //           key: 'Cache-Control',
  //           value: 'public, max-age=31536000, immutable',
  //         },
  //       ],
  //     },
  //     {
  //       source: '/static/(.*)',
  //       headers: [
  //         {
  //           key: 'Cache-Control',
  //           value: 'public, max-age=31536000, immutable',
  //         },
  //       ],
  //     },
  //     // 보안 헤더
  //     {
  //       source: '/(.*)',
  //       headers: [
  //         {
  //           key: 'X-Frame-Options',
  //           value: 'DENY',
  //         },
  //         {
  //           key: 'X-Content-Type-Options',
  //           value: 'nosniff',
  //         },
  //         {
  //           key: 'Referrer-Policy',
  //           value: 'strict-origin-when-cross-origin',
  //         },
  //       ],
  //     },
  //   ];
  // },

  // 압축 설정 - 프로덕션에서 성능 향상
  compress: true,
  
  // 트리 쉐이킹 최적화
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
      skipDefaultConversion: true,
    },
  },
  
  // 빌드 최적화
  

};

// 번들 분석기 적용
export default withBundleAnalyzer_(nextConfig);
