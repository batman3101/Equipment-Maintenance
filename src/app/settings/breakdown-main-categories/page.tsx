'use client';

import React from 'react';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { useBreakdownCategories } from '@/domains/settings';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';

const BreakdownMainCategoriesPage = () => {
  const { mainCategories, loading, error } = useBreakdownCategories();

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">고장 대분류 설정</h1>
          <p className="text-gray-600 mt-1">고장의 대분류를 관리합니다.</p>
        </div>
        <Button>새 고장 대분류 추가</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mainCategories.map((category) => (
          <Card key={category.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-gray-600 text-sm">
                    {category.description}
                  </p>
                )}
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                category.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {category.is_active ? '활성' : '비활성'}
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                순서: {category.display_order}
              </span>
              <div className="space-x-2">
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  수정
                </button>
                <button className="text-sm text-red-600 hover:text-red-800">
                  삭제
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {mainCategories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">등록된 고장 대분류가 없습니다.</p>
          <Button>첫 번째 고장 대분류 추가</Button>
        </div>
      )}
    </div>
  );
};

export default BreakdownMainCategoriesPage;