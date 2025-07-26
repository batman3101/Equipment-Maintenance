'use client';

import React, { useState, useEffect } from 'react';
import { SettingListLayout } from '@/domains/settings/components/SettingListLayout';
import { SettingItemCard } from '@/domains/settings/components/SettingItemCard';
import type { 
  EquipmentTypeSetting, 
  SettingListFilter, 
  SettingListSort 
} from '@/domains/settings/types';

// TODO: 실제 서비스로 대체
const mockEquipmentTypes: EquipmentTypeSetting[] = [
  {
    id: '1',
    name: 'CNC 머신',
    code: 'cnc_machine',
    description: 'Computer Numerical Control 머신',
    color: '#3B82F6',
    is_active: true,
    display_order: 1,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z'
  },
  {
    id: '2',
    name: '선반',
    code: 'lathe',
    description: '회전 가공 설비',
    color: '#10B981',
    is_active: true,
    display_order: 2,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z'
  },
  {
    id: '3',
    name: '밀링머신',
    code: 'milling_machine',
    description: '밀링 가공 설비',
    color: '#F59E0B',
    is_active: true,
    display_order: 3,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z'
  },
  {
    id: '4',
    name: '드릴프레스',
    code: 'drill_press',
    description: '드릴링 전용 설비',
    color: '#EF4444',
    is_active: false,
    display_order: 4,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z'
  }
];

const ITEMS_PER_PAGE = 20;

/**
 * 설비 종류 설정 페이지
 */
export default function EquipmentTypesPage() {
  // 상태 관리
  const [items, setItems] = useState<EquipmentTypeSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // 필터 및 정렬 상태
  const [filter, setFilter] = useState<SettingListFilter>({});
  const [sort, setSort] = useState<SettingListSort>({
    field: 'display_order',
    direction: 'asc'
  });

  // 데이터 로드 (모의 함수)
  const loadData = async () => {
    setLoading(true);
    try {
      // TODO: 실제 API 호출로 대체
      await new Promise(resolve => setTimeout(resolve, 500)); // 로딩 시뮬레이션
      
      let filteredItems = [...mockEquipmentTypes];
      
      // 검색 필터 적용
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredItems = filteredItems.filter(item => 
          item.name.toLowerCase().includes(searchLower) ||
          item.code.toLowerCase().includes(searchLower)
        );
      }
      
      // 활성 상태 필터 적용
      if (filter.is_active !== undefined) {
        filteredItems = filteredItems.filter(item => item.is_active === filter.is_active);
      }
      
      // 정렬 적용
      filteredItems.sort((a, b) => {
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
      const paginatedItems = filteredItems.slice(startIndex, endIndex);
      
      setItems(paginatedItems);
      setTotalCount(filteredItems.length);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setItems([]);
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

  // CRUD 핸들러들
  const handleEdit = (item: EquipmentTypeSetting) => {
    console.log('수정:', item);
    // TODO: 수정 페이지로 이동 또는 모달 표시
  };

  const handleDelete = async (item: EquipmentTypeSetting) => {
    console.log('삭제:', item);
    // TODO: 실제 삭제 API 호출
    try {
      // 임시로 목록에서 제거
      setItems(prev => prev.filter(i => i.id !== item.id));
      setTotalCount(prev => prev - 1);
    } catch (error) {
      console.error('삭제 실패:', error);
    }
  };

  const handleToggleActive = async (item: EquipmentTypeSetting) => {
    console.log('활성 상태 변경:', item);
    // TODO: 실제 상태 변경 API 호출
    try {
      // 임시로 상태 변경
      setItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, is_active: !i.is_active } : i
      ));
    } catch (error) {
      console.error('상태 변경 실패:', error);
    }
  };

  // 항목 렌더링
  const renderItem = (item: EquipmentTypeSetting) => (
    <SettingItemCard
      key={item.id}
      item={item}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onToggleActive={handleToggleActive}
      showColor={true}
      colorValue={item.color}
      customContent={
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>설비 코드: {item.code}</span>
        </div>
      }
    />
  );

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <SettingListLayout
      title="설비 종류 설정"
      description="시스템에서 사용할 설비 종류를 관리합니다"
      backHref="/settings"
      createHref="/settings/equipment-types/new"
      items={items}
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
      emptyStateMessage="첫 번째 설비 종류를 등록해보세요."
      itemsPerPage={ITEMS_PER_PAGE}
    />
  );
}