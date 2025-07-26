'use client';

import { Suspense, lazy } from 'react';
import { ProtectedRoute } from '@/domains/auth/components/protected-route';
import { UserProfile } from '@/domains/auth/components/user-profile';
import { DashboardSkeleton } from '@/domains/dashboard/components/dashboard-skeleton';
import { Navigation } from '@/components/navigation';

// 동적 임포트를 통한 코드 스플리팅
const Dashboard = lazy(() => import('@/domains/dashboard/components/dashboard').then(mod => ({
  default: mod.Dashboard
})));

export default function Home() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-gray-600 dark:text-gray-400">로딩 중...</div>}>
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* 네비게이션 */}
          <Navigation />
          
          <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
              <Suspense fallback={<div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>}>
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
