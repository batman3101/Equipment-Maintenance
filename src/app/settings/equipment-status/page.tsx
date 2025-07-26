'use client';

import React, { useState, useEffect } from 'react';
import { SettingListLayout } from '@/domains/settings/components/SettingListLayout';
import { SettingItemCard } from '@/domains/settings/components/SettingItemCard';
import { Badge } from '@/shared/components/ui/Badge';
import { 
  CheckCircle, 
  Settings, 
  TestTube,
  AlertCircle,
  Clock,
  XCircle 
} from 'lucide-react';
import type { 
  EquipmentStatusSetting, 
  SettingListFilter, 
  SettingListSort 
} from '@/domains/settings/types';

// 아이콘 매핑
const iconMap = {
  'check-circle': CheckCircle,
  'settings': Settings,
  'test-tube': TestTube,
  'alert-circle': AlertCircle,
  'clock': Clock,
  'x-circle': XCircle
};

// TODO: 실제 서비스로 대체
const mockEquipmentStatus: EquipmentStatusSetting[] = [
  {
    id: '1',
    name: '정상 운영',
    code: 'active',
    description: '설비가 정상적으로 운영되고 있는 상태',
    color: '#10B981',
    icon: 'check-circle',
    is_active: true,
    display_order: 1,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z'
  },
  {
    id: '2',
    name: '정비 중',
    code: 'maintenance',
    description: '계획된 정비 또는 수리 작업 중',
    color: '#F59E0B',
    icon: 'settings',
    is_active: true,
    display_order: 2,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z'
  },
  {
    id: '3',
    name: '테스트',
    code: 'test',
    description: '시험 운전 또는 검증 중인 상태',
    color: '#3B82F6',
    icon: 'test-tube',
    is_active: true,
    display_order: 3,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z'
  },
  {
    id: '4',
    name: '고장',
    code: 'broken',
    description: '설비 고장으로 인한 정지 상태',
    color: '#EF4444',
    icon: 'alert-circle',
    is_active: false,
    display_order: 4,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z'
  },
  {
    id: '5',
    name: '대기',
    code: 'standby',
    description: '작업 대기 중인 상태',
    color: '#6B7280',
    icon: 'clock',
    is_active: true,
    display_order: 5,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z'
  }
];

const ITEMS_PER_PAGE = 20;

/**
 * 설비 상태 설정 페이지
 */
export default function EquipmentStatusPage() {
  // 상태 관리
  const [items, setItems] = useState<EquipmentStatusSetting[]>([]);
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
      
      let filteredItems = [...mockEquipmentStatus];
      
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
  const handleEdit = (item: EquipmentStatusSetting) => {
    console.log('수정:', item);
    // TODO: 수정 페이지로 이동 또는 모달 표시
  };

  const handleDelete = async (item: EquipmentStatusSetting) => {
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

  const handleToggleActive = async (item: EquipmentStatusSetting) => {
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
  const renderItem = (item: EquipmentStatusSetting) => {
    const IconComponent = item.icon ? iconMap[item.icon as keyof typeof iconMap] : null;
    
    return (
      <SettingItemCard
        key={item.id}
        item={item}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        showColor={true}
        colorValue={item.color}
        showIcon={true}
        iconValue={item.icon}
        customContent={
          <div className="space-y-2">
            {/* 상태 미리보기 */}
            <div className="flex items-center space-x-2">
              <Badge 
                style={{ 
                  backgroundColor: item.color,
                  color: 'white'
                }}
                className="text-xs font-medium"
              >
                {IconComponent && <IconComponent className="h-3 w-3 mr-1" />}
                {item.name}
              </Badge>
              <span className="text-xs text-gray-500 font-mono">
                {item.code}
              </span>
            </div>
            
            {/* 사용 현황 (모의 데이터) */}
            <div className="text-xs text-gray-500">
              현재 이 상태인 설비: {Math.floor(Math.random() * 20) + 1}개
            </div>
          </div>
        }
      />
    );
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <SettingListLayout
      title="설비 상태 설정"
      description="설비의 상태 종류와 색상을 관리합니다"
      backHref="/settings"
      createHref="/settings/equipment-status/new"
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
      emptyStateMessage="첫 번째 설비 상태를 등록해보세요."
      itemsPerPage={ITEMS_PER_PAGE}
    />
  );
}