import type { NextConfig } from "next";

// Bundle Analyzer 설정 (로컬 개발 전용)
const withBundleAnalyzer = process.env.NODE_ENV === 'development' && process.env.ANALYZE === 'true' 
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config: NextConfig) => config;

const nextConfig: NextConfig = {
  // 성능 최적화 설정
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // 실험적 기능
  experimental: {
    optimizePackageImports: [
      '@/components',
      '@/hooks',
      '@/lib',
      '@/utils'
    ],
  },

  // 서버 컴포넌트 외부 패키지 설정
  serverExternalPackages: ['@supabase/supabase-js'],

  // 이미지 최적화
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 압축 최적화
  compress: true,
  
  // 캐싱 설정
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, s-maxage=300, stale-while-revalidate=600',
        },
      ],
    },
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
      ],
    },
  ],

  // 다이내믹 임포트 최적화
  webpack: (config, { dev, isServer }) => {
    // ExcelJS를 브라우저에서 사용하기 위한 설정
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        stream: false,
        crypto: false,
        buffer: require.resolve('buffer/'),
      }
    }

    // 개발 환경에서만 번들 크기 분석 활성화
    if (dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      }
    }

    // 프로덕션 빌드 최적화
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 250000,
          cacheGroups: {
            default: false,
            vendors: false,
            // React 청크
            react: {
              name: 'react',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              priority: 30,
              enforce: true,
            },
            // Supabase 전용 청크
            supabase: {
              name: 'supabase',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              priority: 25,
              enforce: true,
            },
            // ExcelJS는 동적 임포트로만 로드 (번들에서 제외)
            excel: {
              name: 'excel',
              chunks: 'async',
              test: /[\\/]node_modules[\\/](exceljs|file-saver)[\\/]/,
              priority: 20,
              enforce: true,
            },
            // i18n 관련 라이브러리
            i18n: {
              name: 'i18n',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](i18next|react-i18next)[\\/]/,
              priority: 15,
              enforce: true,
            },
            // 기타 라이브러리
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              minChunks: 2,
            },
            // 사용자 코드
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }

    return config
  },

  // 환경 변수 설정
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || 'default_value',
  },

  // TypeScript 설정
  typescript: {
    // 오류 간소는 단계에서 빌드 중단 안 함
    ignoreBuildErrors: false,
  },

  // ESLint 설정
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },

  // 리다이렉트 최적화
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: false,
      },
    ]
  },

  // 리라이트 최적화
  async rewrites() {
    return [
      {
        source: '/health',
        destination: '/api/health',
      },
    ]
  },
};

export default withBundleAnalyzer(nextConfig);
