/**
 * 대시보드 로딩 스켈레톤 컴포넌트
 * 코드 스플리팅 시 Suspense fallback으로 사용
 */

import React from 'react';
import { KPICardSkeleton } from './kpi-card';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-4 w-48 bg-gray-100 rounded-md animate-pulse mt-1"></div>
        </div>
        <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      {/* KPI 카드 스켈레톤 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>

      {/* 최근 활동 스켈레톤 */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-4 w-48 bg-gray-100 rounded-md animate-pulse mt-1"></div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-5 w-3/4 bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="h-4 w-1/2 bg-gray-100 rounded-md animate-pulse mt-1"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}