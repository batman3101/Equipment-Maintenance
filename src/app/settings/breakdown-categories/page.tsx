'use client';

import React, { useState, useEffect } from 'react';
import { SettingListLayout } from '@/domains/settings/components/SettingListLayout';
import { SettingItemCard } from '@/domains/settings/components/SettingItemCard';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { 
  ChevronDown, 
  ChevronRight,
  Plus,
  Layers,
  Edit2,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import Link from 'next/link';
import type { 
  BreakdownCategory, 
  BreakdownSubcategory,
  SettingListFilter,
  SettingListSort
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

const ITEMS_PER_PAGE = 20;

/**
 * 고장 내용 설정 페이지 (대분류/소분류 계층 구조)
 */
export default function BreakdownCategoriesPage() {
  // 상태 관리
  const [categories, setCategories] = useState<BreakdownCategory[]>([]);
  const [subcategories, setSubcategories] = useState<BreakdownSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // 필터 및 정렬 상태
  const [filter, setFilter] = useState<SettingListFilter>({});
  const [sort, setSort] = useState<SettingListSort>({
    field: 'display_order',
    direction: 'asc'
  });

  // 데이터 로드
  const loadData = async () => {
    setLoading(true);
    try {
      // TODO: 실제 API 호출로 대체
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredCategories = [...mockCategories];
      
      // 검색 필터 적용
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredCategories = filteredCategories.filter(category => 
          category.name.toLowerCase().includes(searchLower) ||
          category.code.toLowerCase().includes(searchLower)
        );
      }
      
      // 활성 상태 필터 적용
      if (filter.is_active !== undefined) {
        filteredCategories = filteredCategories.filter(category => category.is_active === filter.is_active);
      }
      
      // 정렬 적용
      filteredCategories.sort((a, b) => {
        const aValue = a[sort.field];
        const bValue = b[sort.field];
        const modifier = sort.direction === 'asc' ? 1 : -1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue) * modifier;
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return (aValue - bValue) * modifier;
        }
        return 0;
      });
      
      // 페이지네이션 적용
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const paginatedCategories = filteredCategories.slice(startIndex, endIndex);
      
      setCategories(paginatedCategories);
      setSubcategories(mockSubcategories);
      setTotalCount(filteredCategories.length);
      
      // 기본적으로 첫 번째 카테고리는 확장
      if (paginatedCategories.length > 0) {
        setExpandedCategories(new Set([paginatedCategories[0].id]));
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setCategories([]);
      setSubcategories([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // 데이터 로드 훅
  useEffect(() => {
    loadData();
  }, [filter, sort, currentPage]);

  // 페이지 변경 시 첫 페이지로 이동
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filter, sort]);


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
  const handleEdit = (category: BreakdownCategory) => {
    console.log('대분류 수정:', category);
    // TODO: 수정 페이지로 이동
  };

  const handleDelete = async (category: BreakdownCategory) => {
    console.log('대분류 삭제:', category);
    // TODO: 삭제 확인 및 API 호출
    try {
      // 임시로 목록에서 제거
      setCategories(prev => prev.filter(c => c.id !== category.id));
      setTotalCount(prev => prev - 1);
    } catch (error) {
      console.error('삭제 실패:', error);
    }
  };

  const handleToggleActive = async (category: BreakdownCategory) => {
    console.log('대분류 활성 상태 변경:', category);
    // TODO: API 호출
    try {
      // 임시로 상태 변경
      setCategories(prev => prev.map(c => 
        c.id === category.id ? { ...c, is_active: !c.is_active } : c
      ));
    } catch (error) {
      console.error('상태 변경 실패:', error);
    }
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

  // 항목 렌더링 함수
  const renderItem = (category: BreakdownCategory) => {
    const isExpanded = expandedCategories.has(category.id);
    const categorySubcategories = getSubcategoriesForCategory(category.id);

    return (
      <SettingItemCard
        key={category.id}
        item={category}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        showColor={true}
        colorValue={category.color}
        customContent={
          <div className="space-y-3">
            {/* 대분류 기본 정보 */}
            <div className="flex items-center space-x-2">
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
            
            {/* 확장/축소 토글 */}
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleCategoryExpansion(category.id)}
                className="p-2 text-gray-600 hover:text-gray-800"
              >
                {isExpanded ? (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    소분류 숨기기
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4 mr-1" />
                    소분류 보기
                  </>
                )}
              </Button>
            </div>

            {/* 소분류 목록 */}
            {isExpanded && (
              <div className="ml-4 border-l-2 border-gray-200 pl-4 space-y-2">
                {categorySubcategories.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    <p className="text-sm mb-2">등록된 소분류가 없습니다</p>
                    <Link href={`/settings/breakdown-categories/subcategories/new?category=${category.id}`}>
                      <Button variant="secondary" size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        소분류 추가
                      </Button>
                    </Link>
                  </div>
                ) : (
                  categorySubcategories.map((subcategory) => (
                    <div key={subcategory.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
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
                            <span className="font-mono text-xs bg-white dark:bg-gray-600 px-2 py-1 rounded border">
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
                            className="p-1"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleSubcategoryActive(subcategory)}
                            className="p-1"
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
                            className="p-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        }
      />
    );
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <SettingListLayout
      title="고장 내용 설정"
      description="고장 분류 체계(대분류/소분류)를 관리합니다"
      backHref="/settings"
      createHref="/settings/breakdown-categories/new"
      items={categories}
      loading={loading}
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      filter={filter}
      sort={sort}
      onFilterChange={setFilter}
      onSortChange={setSort}
      onPageChange={setCurrentPage}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onToggleActive={handleToggleActive}
      renderItem={renderItem}
      emptyStateMessage="첫 번째 고장 분류를 등록해보세요."
      itemsPerPage={ITEMS_PER_PAGE}
    />
  );
}