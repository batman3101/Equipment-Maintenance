'use client';

import React from 'react';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { useBreakdownCategories } from '@/domains/settings';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { Navigation } from '@/components/navigation';
import { ProtectedRoute } from '@/domains/auth/components/protected-route';

const BreakdownSubCategoriesPage = () => {
  const { subCategories, loading, error } = useBreakdownCategories();

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navigation />
          <div className="container mx-auto p-4">
            <div className="flex items-center justify-center min-h-[400px]">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navigation />
          <div className="container mx-auto p-4">
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">고장 소분류 설정</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">고장의 소분류를 관리합니다.</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">새 고장 소분류 추가</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subCategories.map((subCategory) => (
            <Card key={subCategory.id} className="p-6 card-hover transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {subCategory.name}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                    대분류: {subCategory.main_category?.name || 'N/A'}
                  </p>
                  {subCategory.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {subCategory.description}
                    </p>
                  )}
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  subCategory.is_active 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {subCategory.is_active ? '활성' : '비활성'}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  순서: {subCategory.display_order}
                </span>
                <div className="space-x-2">
                  <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                    수정
                  </button>
                  <button className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium">
                    삭제
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {subCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">등록된 고장 소분류가 없습니다.</p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">첫 번째 고장 소분류 추가</Button>
          </div>
        )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default BreakdownSubCategoriesPage;