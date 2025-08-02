import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 개발 환경 최적화
  experimental: {
    optimizePackageImports: ['@/components'],
  },
};

export default nextConfig;
