'use client';

import { Suspense, lazy, useEffect } from 'react';
import { ProtectedRoute } from '@/domains/auth/components/protected-route';
import { UserProfile } from '@/domains/auth/components/user-profile';
import { DashboardSkeleton } from '@/domains/dashboard/components/dashboard-skeleton';
import { Navigation } from '@/components/navigation';

// 동적 임포트를 통한 코드 스플리팅
const Dashboard = lazy(() => import('@/domains/dashboard/components/dashboard').then(mod => ({
  default: mod.Dashboard
})));

export default function Home() {
  // 개발 환경에서 사용자 인증 상태 확인
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const devUser = localStorage.getItem('dev_user');
      if (!devUser) {
        console.log('개발 환경: 사용자 인증되지 않음, 로그인 페이지로 이동');
        window.location.href = '/login';
      } else {
        console.log('개발 환경: 사용자 인증됨, 홈페이지 표시');
      }
    }
  }, []);
  
  return (
    <Suspense fallback={<div className="p-4 text-center">로딩 중...</div>}>
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          {/* 네비게이션 추가 */}
          <Navigation />
          
          <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
              <Suspense fallback={<div className="h-12 bg-gray-200 rounded animate-pulse"></div>}>
                <UserProfile />
              </Suspense>
            </div>
            
            <Suspense fallback={<DashboardSkeleton />}>
              <Dashboard />
            </Suspense>
          </div>
        </div>
      </ProtectedRoute>
    </Suspense>
  );
}
