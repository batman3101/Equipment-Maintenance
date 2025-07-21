'use client';

import { Suspense, lazy } from 'react';
import { ProtectedRoute } from '@/domains/auth/components/protected-route';
import { UserProfile } from '@/domains/auth/components/user-profile';
import { DashboardSkeleton } from '@/domains/dashboard/components/dashboard-skeleton';

// 동적 임포트를 통한 코드 스플리팅
const Dashboard = lazy(() => import('@/domains/dashboard/components/dashboard').then(mod => ({
  default: mod.Dashboard
})));

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <UserProfile />
        </div>
        
        <Suspense fallback={<DashboardSkeleton />}>
          <Dashboard />
        </Suspense>
      </div>
    </ProtectedRoute>
  );
}
