'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/shared/components/ui/Card';
import { useSettingsStats } from '@/domains/settings';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';

const SettingsPage = () => {
  const { stats, loading, error } = useSettingsStats();

  const settingsMenus = [
    {
      title: '설비 종류 설정',
      description: '설비의 종류를 관리합니다.',
      href: '/settings/equipment-types',
      icon: '🏭',
      count: stats?.equipment_types_count || 0,
    },
    {
      title: '설비 상태 설정',
      description: '설비의 상태를 관리합니다.',
      href: '/settings/equipment-statuses',
      icon: '📊',
      count: stats?.equipment_statuses_count || 0,
    },
    {
      title: '고장 대분류 설정',
      description: '고장의 대분류를 관리합니다.',
      href: '/settings/breakdown-main-categories',
      icon: '🔧',
      count: stats?.breakdown_main_categories_count || 0,
    },
    {
      title: '고장 소분류 설정',
      description: '고장의 소분류를 관리합니다.',
      href: '/settings/breakdown-sub-categories',
      icon: '⚙️',
      count: stats?.breakdown_sub_categories_count || 0,
    },
  ];

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          시스템 설정
        </h1>
        <p className="text-gray-600">
          설비 관리 시스템의 기본 설정을 관리할 수 있습니다.
        </p>
      </div>

      {/* 설정 메뉴 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {settingsMenus.map((menu) => (
          <Link key={menu.href} href={menu.href}>
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-3xl mr-3" role="img" aria-hidden="true">
                      {menu.icon}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {menu.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {menu.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {menu.count}개
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">설정 관리</span>
                  <svg 
                    className="w-5 h-5 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 5l7 7-7 7" 
                    />
                  </svg>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* 통계 정보 */}
      {stats && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            설정 현황
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.equipment_types_count}
              </div>
              <div className="text-sm text-gray-600">설비 종류</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.equipment_statuses_count}
              </div>
              <div className="text-sm text-gray-600">설비 상태</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.breakdown_main_categories_count}
              </div>
              <div className="text-sm text-gray-600">고장 대분류</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.breakdown_sub_categories_count}
              </div>
              <div className="text-sm text-gray-600">고장 소분류</div>
            </div>
          </div>
        </div>
      )}

      {/* 주의사항 */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg 
              className="h-5 w-5 text-yellow-400" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              설정 변경 시 주의사항
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                <li>설정 변경은 시스템 전체에 영향을 미칠 수 있습니다.</li>
                <li>사용 중인 설정은 삭제할 수 없습니다.</li>
                <li>변경사항은 즉시 적용됩니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;