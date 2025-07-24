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
  // 빌드 디렉토리 설정
  distDir: '.next',
  
  // React Strict Mode 활성화 (개발 시 더 나은 디버깅)
  reactStrictMode: true,
  
  // 미들웨어 최적화
  skipMiddlewareUrlNormalize: false,
  skipTrailingSlashRedirect: false,

  // 빌드 시 타입 체크 (개발 환경에서는 활성화, 프로덕션에서는 CI/CD에서 처리)
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
    dirs: ['src'],
  },

  // 실험적 기능들
  experimental: {
    // 패키지 임포트 최적화
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@supabase/supabase-js',
      'clsx',
      'tailwind-merge',
    ],

  },

  // 서버 외부 패키지 설정 (Supabase는 클라이언트에서 사용하므로 제외)
  // serverExternalPackages: ['@supabase/supabase-js'],

  // Webpack 설정 최적화
  webpack: (config, { isServer, dev }) => {
    // self is not defined 문제 해결
    if (isServer) {
      // 서버에서 self 전역 변수 정의
      config.plugins = config.plugins || [];
      config.plugins.push(
        new (require('webpack')).DefinePlugin({
          'typeof self': JSON.stringify('undefined'),
        })
      );
    }

    // 폴백 설정
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      util: false,
    };

    // 프로덕션 빌드 최적화 (간소화)
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
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
      // 이미지 캐싱
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400',
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
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
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
  

};

// 번들 분석기 적용
export default withBundleAnalyzer_(nextConfig);
