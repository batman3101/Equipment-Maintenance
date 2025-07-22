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
  // 안정적인 기능만 사용
  experimental: {
    // 코드 스플리팅 최적화
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@supabase/supabase-js',
    ],
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

  // 헤더 설정 - 보안 및 캐싱 최적화
  async headers() {
    return [
      // 정적 자산 캐싱 최적화
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // 보안 헤더
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

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
  reactStrictMode: true,
  
  // 린트 설정
  eslint: {
    dirs: ['src'],
  },
};

// 번들 분석기 적용
export default withBundleAnalyzer_(nextConfig);
