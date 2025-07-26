'use client';

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/navigation';
import { ProtectedRoute } from '@/domains/auth/components/protected-route';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  ChevronDown, 
  ChevronRight,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  MoreVertical,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import type { 
  BreakdownCategory, 
  BreakdownSubcategory 
} from '@/domains/settings/types';

// 모의 데이터
const mockCategories: BreakdownCategory[] = [
  {
    id: '1',
    name: '기계적 고장',
    code: 'mechanical',
    description: '기계적 부품의 고장이나 마모',
    color: '#EF4444',
    is_active: true,
    display_order: 1,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z'
  },
  {
    id: '2',
    name: '전기적 고장',
    code: 'electrical',
    description: '전기 시스템 및 제어 장치 문제',
    color: '#F59E0B',
    is_active: true,
    display_order: 2,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z'
  },
  {
    id: '3',
    name: '소프트웨어 오류',
    code: 'software',
    description: 'CNC 프로그램 및 시스템 소프트웨어 오류',
    color: '#3B82F6',
    is_active: true,
    display_order: 3,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z'
  }
];

const mockSubcategories: BreakdownSubcategory[] = [
  // 기계적 고장 하위
  { id: '1-1', category_id: '1', name: '베어링 마모', code: 'bearing_wear', is_active: true, display_order: 1, created_at: '2024-01-15T09:00:00Z', updated_at: '2024-01-15T09:00:00Z' },
  { id: '1-2', category_id: '1', name: '벨트 파손', code: 'belt_damage', is_active: true, display_order: 2, created_at: '2024-01-15T09:00:00Z', updated_at: '2024-01-15T09:00:00Z' },
  { id: '1-3', category_id: '1', name: '기어 손상', code: 'gear_damage', is_active: true, display_order: 3, created_at: '2024-01-15T09:00:00Z', updated_at: '2024-01-15T09:00:00Z' },
  
  // 전기적 고장 하위
  { id: '2-1', category_id: '2', name: '모터 고장', code: 'motor_failure', is_active: true, display_order: 1, created_at: '2024-01-15T09:00:00Z', updated_at: '2024-01-15T09:00:00Z' },
  { id: '2-2', category_id: '2', name: '센서 오작동', code: 'sensor_malfunction', is_active: true, display_order: 2, created_at: '2024-01-15T09:00:00Z', updated_at: '2024-01-15T09:00:00Z' },
  { id: '2-3', category_id: '2', name: '전원 문제', code: 'power_issue', is_active: false, display_order: 3, created_at: '2024-01-15T09:00:00Z', updated_at: '2024-01-15T09:00:00Z' },
  
  // 소프트웨어 오류 하위
  { id: '3-1', category_id: '3', name: 'G코드 오류', code: 'gcode_error', is_active: true, display_order: 1, created_at: '2024-01-15T09:00:00Z', updated_at: '2024-01-15T09:00:00Z' },
  { id: '3-2', category_id: '3', name: '시스템 크래시', code: 'system_crash', is_active: true, display_order: 2, created_at: '2024-01-15T09:00:00Z', updated_at: '2024-01-15T09:00:00Z' }
];

/**
 * 고장 내용 설정 페이지 (대분류/소분류 계층 구조)
 */
export default function BreakdownCategoriesPage() {
  // 상태 관리
  const [categories, setCategories] = useState<BreakdownCategory[]>([]);
  const [subcategories, setSubcategories] = useState<BreakdownSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // TODO: 실제 API 호출로 대체
        await new Promise(resolve => setTimeout(resolve, 500));
        setCategories(mockCategories);
        setSubcategories(mockSubcategories);
        
        // 기본적으로 첫 번째 카테고리는 확장
        if (mockCategories.length > 0) {
          setExpandedCategories(new Set([mockCategories[0].id]));
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 검색 필터링
  const filteredCategories = categories.filter(category => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return category.name.toLowerCase().includes(searchLower) ||
           category.code.toLowerCase().includes(searchLower);
  });

  // 카테고리 확장/축소 토글
  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // 특정 카테고리의 소분류 가져오기
  const getSubcategoriesForCategory = (categoryId: string) => {
    return subcategories.filter(sub => sub.category_id === categoryId);
  };

  // CRUD 핸들러들
  const handleEditCategory = (category: BreakdownCategory) => {
    console.log('대분류 수정:', category);
    // TODO: 수정 페이지로 이동
  };

  const handleDeleteCategory = (category: BreakdownCategory) => {
    console.log('대분류 삭제:', category);
    // TODO: 삭제 확인 및 API 호출
  };

  const handleToggleCategoryActive = (category: BreakdownCategory) => {
    console.log('대분류 활성 상태 변경:', category);
    // TODO: API 호출
  };

  const handleEditSubcategory = (subcategory: BreakdownSubcategory) => {
    console.log('소분류 수정:', subcategory);
    // TODO: 수정 페이지로 이동
  };

  const handleDeleteSubcategory = (subcategory: BreakdownSubcategory) => {
    console.log('소분류 삭제:', subcategory);
    // TODO: 삭제 확인 및 API 호출
  };

  const handleToggleSubcategoryActive = (subcategory: BreakdownSubcategory) => {
    console.log('소분류 활성 상태 변경:', subcategory);
    // TODO: API 호출
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* 네비게이션 */}
        <Navigation />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">고장 내용 설정</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                고장 분류 체계(대분류/소분류)를 관리합니다
              </p>
            </div>
          </div>
        </div>

        {/* 검색 및 액션 버튼 */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="대분류 또는 소분류 이름으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex gap-2">
              <Link href="/settings/breakdown-categories/subcategories/new">
                <Button variant="secondary" size="md">
                  <Plus className="h-4 w-4 mr-2" />
                  소분류 추가
                </Button>
              </Link>
              <Link href="/settings/breakdown-categories/new">
                <Button variant="primary" size="md">
                  <Plus className="h-4 w-4 mr-2" />
                  대분류 추가
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 통계 정보 */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Layers className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">대분류</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {categories.length}개
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Layers className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">소분류</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {subcategories.length}개
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">활성 항목</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {categories.filter(c => c.is_active).length + subcategories.filter(s => s.is_active).length}개
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 분류 목록 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <LoadingSpinner size="lg" className="mx-auto mb-4" />
                  <p className="text-gray-600">분류 목록을 불러오는 중...</p>
                </div>
              </div>
            ) : filteredCategories.length === 0 ? (
              <EmptyState
                title={searchQuery ? '검색 결과가 없습니다' : '등록된 분류가 없습니다'}
                description={
                  searchQuery 
                    ? '다른 검색어를 사용해보세요.' 
                    : '첫 번째 대분류를 등록해보세요.'
                }
                actionButton={
                  !searchQuery ? (
                    <Link href="/settings/breakdown-categories/new">
                      <Button variant="primary">
                        <Plus className="h-4 w-4 mr-2" />
                        대분류 추가
                      </Button>
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              <div className="space-y-3">
                {filteredCategories.map((category) => {
                  const isExpanded = expandedCategories.has(category.id);
                  const categorySubcategories = getSubcategoriesForCategory(category.id);

                  return (
                    <div key={category.id} className="border border-gray-200 dark:border-gray-700 rounded-lg card-hover transition-all duration-200 hover:shadow-lg">
                      {/* 대분류 카드 */}
                      <div className="p-4 bg-gray-50 dark:bg-gray-700">
                        <div className="flex items-center space-x-3">
                          {/* 확장/축소 버튼 */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCategoryExpansion(category.id)}
                            className="p-1 hover:bg-gray-200"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>

                          {/* 색상 표시 */}
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: category.color }}
                          />

                          {/* 카테고리 정보 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {category.name}
                              </h3>
                              <Badge 
                                variant={category.is_active ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {category.is_active ? '활성' : '비활성'}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {categorySubcategories.length}개 소분류
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-3 text-sm text-gray-500">
                              <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                                {category.code}
                              </span>
                              <span>순서: {category.display_order}</span>
                            </div>
                            
                            {category.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {category.description}
                              </p>
                            )}
                          </div>

                          {/* 액션 버튼 */}
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCategory(category)}
                              className="p-2"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleCategoryActive(category)}
                              className="p-2"
                            >
                              {category.is_active ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCategory(category)}
                              className="p-2 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* 소분류 목록 */}
                      {isExpanded && (
                        <div className="border-t border-gray-200">
                          {categorySubcategories.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              <p className="text-sm mb-2">등록된 소분류가 없습니다</p>
                              <Link href={`/settings/breakdown-categories/subcategories/new?category=${category.id}`}>
                                <Button variant="secondary" size="sm">
                                  <Plus className="h-3 w-3 mr-1" />
                                  소분류 추가
                                </Button>
                              </Link>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-100">
                              {categorySubcategories.map((subcategory) => (
                                <div key={subcategory.id} className="p-4 pl-12 hover:bg-gray-50">
                                  <div className="flex items-center space-x-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <h4 className="font-medium text-gray-900">
                                          {subcategory.name}
                                        </h4>
                                        <Badge 
                                          variant={subcategory.is_active ? 'default' : 'secondary'}
                                          className="text-xs"
                                        >
                                          {subcategory.is_active ? '활성' : '비활성'}
                                        </Badge>
                                      </div>
                                      
                                      <div className="flex items-center space-x-3 text-sm text-gray-500">
                                        <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                                          {subcategory.code}
                                        </span>
                                        <span>순서: {subcategory.display_order}</span>
                                      </div>
                                    </div>

                                    {/* 소분류 액션 버튼 */}
                                    <div className="flex items-center space-x-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditSubcategory(subcategory)}
                                        className="p-2"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToggleSubcategoryActive(subcategory)}
                                        className="p-2"
                                      >
                                        {subcategory.is_active ? (
                                          <EyeOff className="h-3 w-3" />
                                        ) : (
                                          <Eye className="h-3 w-3" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteSubcategory(subcategory)}
                                        className="p-2 text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}