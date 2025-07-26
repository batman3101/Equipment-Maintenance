'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/navigation';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Badge } from '@/shared/components/ui/Badge';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { Pagination } from '@/shared/components/ui/Pagination';
import { ArrowLeft, Plus, Search, Filter, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import type { BaseSettingItem, SettingListFilter, SettingListSort } from '../types';

export interface SettingListLayoutProps<T extends BaseSettingItem> {
  title: string;
  description: string;
  backHref: string;
  createHref: string;
  items: T[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filter: SettingListFilter;
  sort: SettingListSort;
  onFilterChange: (filter: SettingListFilter) => void;
  onSortChange: (sort: SettingListSort) => void;
  onPageChange: (page: number) => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onToggleActive: (item: T) => void;
  renderItem: (item: T) => React.ReactNode;
  emptyStateMessage?: string;
  itemsPerPage?: number;
}

/**
 * 설정 목록 페이지의 공통 레이아웃 컴포넌트
 * CRUD 기능을 위한 일관된 UI 패턴을 제공
 */
export function SettingListLayout<T extends BaseSettingItem>({
  title,
  description,
  backHref,
  createHref,
  items,
  loading,
  totalCount,
  currentPage,
  totalPages,
  filter,
  sort,
  onFilterChange,
  onSortChange,
  onPageChange,
  onEdit,
  onDelete,
  onToggleActive,
  renderItem,
  emptyStateMessage,
  itemsPerPage = 20
}: SettingListLayoutProps<T>) {
  const [showFilters, setShowFilters] = useState(false);

  // 검색어 변경 핸들러
  const handleSearchChange = (search: string) => {
    onFilterChange({ ...filter, search });
  };

  // 활성 상태 필터 변경 핸들러
  const handleActiveFilterChange = (value: string) => {
    const is_active = value === 'all' ? undefined : value === 'active';
    onFilterChange({ ...filter, is_active });
  };

  // 정렬 변경 핸들러
  const handleSortChange = (value: string) => {
    const [field, direction] = value.split('-') as [SettingListSort['field'], SettingListSort['direction']];
    onSortChange({ field, direction });
  };

  // 정렬 옵션
  const sortOptions = [
    { value: 'display_order-asc', label: '표시 순서 ↑' },
    { value: 'display_order-desc', label: '표시 순서 ↓' },
    { value: 'name-asc', label: '이름 ↑' },
    { value: 'name-desc', label: '이름 ↓' },
    { value: 'created_at-desc', label: '최신 등록순' },
    { value: 'created_at-asc', label: '오래된 등록순' }
  ];

  // 활성 상태 필터 옵션
  const activeFilterOptions = [
    { value: 'all', label: '전체' },
    { value: 'active', label: '활성' },
    { value: 'inactive', label: '비활성' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 네비게이션 */}
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <Link href={backHref}>
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-600 text-sm mt-1">{description}</p>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 영역 */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* 검색 */}
            <div className="flex-1">
              <Input
                type="text"
                placeholder="이름이나 코드로 검색..."
                value={filter.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                className="w-full"
              />
            </div>
            
            {/* 필터 토글 버튼 (모바일) */}
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              필터
            </Button>

            {/* 새 항목 추가 버튼 */}
            <Link href={createHref}>
              <Button variant="primary" size="md" className="whitespace-nowrap">
                <Plus className="h-4 w-4 mr-2" />
                새로 만들기
              </Button>
            </Link>
          </div>

          {/* 필터 영역 */}
          <div className={`flex flex-col sm:flex-row gap-3 ${showFilters ? 'block' : 'hidden sm:flex'}`}>
            <Select
              label=""
              placeholder="활성 상태"
              options={activeFilterOptions}
              value={filter.is_active === undefined ? 'all' : filter.is_active ? 'active' : 'inactive'}
              onChange={handleActiveFilterChange}
              className="w-full sm:w-40"
            />
            
            <Select
              label=""
              placeholder="정렬 방식"
              options={sortOptions}
              value={`${sort.field}-${sort.direction}`}
              onChange={handleSortChange}
              className="w-full sm:w-48"
            />
          </div>
        </div>

        {/* 통계 정보 */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  전체 <span className="font-semibold text-gray-900">{totalCount.toLocaleString()}</span>개의 항목
                </div>
                {loading && (
                  <div className="flex items-center text-sm text-gray-500">
                    <LoadingSpinner size="sm" className="mr-2" />
                    로딩 중...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 목록 컨테이너 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {loading ? (
              // 로딩 상태
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <LoadingSpinner size="lg" className="mx-auto mb-4" />
                  <p className="text-gray-600">목록을 불러오는 중...</p>
                </div>
              </div>
            ) : items.length === 0 ? (
              // 빈 상태
              <EmptyState
                title={filter.search ? '검색 결과가 없습니다' : '등록된 항목이 없습니다'}
                description={
                  filter.search 
                    ? '다른 검색어를 사용해보세요.' 
                    : emptyStateMessage || '새 항목을 등록하여 시작하세요.'
                }
                actionButton={
                  !filter.search ? (
                    <Link href={createHref}>
                      <Button variant="primary">
                        <Plus className="h-4 w-4 mr-2" />
                        새로 만들기
                      </Button>
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              // 항목 목록
              <>
                <div className="space-y-3">
                  {items.map((item) => renderItem(item))}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="mt-8 border-t border-gray-200 pt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={onPageChange}
                      showInfo={true}
                      totalItems={totalCount}
                      itemsPerPage={itemsPerPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}