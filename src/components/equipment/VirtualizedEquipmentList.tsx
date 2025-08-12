'use client'

import React, { memo, useMemo, useState, useCallback, useRef } from 'react'
import { Card, Button } from '@/components/ui'

interface Equipment {
  id: string
  equipment_number: string
  equipment_name: string
  category: string
  location: string
  status: 'running' | 'breakdown' | 'maintenance' | 'standby' | 'stopped'
  score?: number
  grade?: string
}

interface VirtualizedEquipmentListProps {
  equipment: Equipment[]
  onEquipmentClick?: (equipment: Equipment) => void
  itemHeight?: number
  visibleCount?: number
  className?: string
}

// [SRP] Rule: 가상화된 리스트는 렌더링 최적화만 담당
const VirtualizedEquipmentListComponent: React.FC<VirtualizedEquipmentListProps> = ({
  equipment = [],
  onEquipmentClick,
  itemHeight = 80,
  visibleCount = 10,
  className = ''
}) => {
  const [scrollTop, setScrollTop] = useState(0)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // [OCP] Rule: 필터링 로직 확장 가능하도록 분리
  const filteredEquipment = useMemo(() => {
    let result = equipment

    // 상태 필터
    if (filterStatus !== 'all') {
      result = result.filter(item => item.status === filterStatus)
    }

    // 검색 필터
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(item =>
        item.equipment_number.toLowerCase().includes(searchLower) ||
        item.equipment_name.toLowerCase().includes(searchLower) ||
        item.location.toLowerCase().includes(searchLower)
      )
    }

    return result
  }, [equipment, filterStatus, searchTerm])

  // 가상화 계산
  const virtualizedData = useMemo(() => {
    const containerHeight = visibleCount * itemHeight
    const totalHeight = filteredEquipment.length * itemHeight
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + visibleCount + 2, // 버퍼 추가
      filteredEquipment.length
    )

    const visibleItems = filteredEquipment.slice(startIndex, endIndex)

    return {
      containerHeight,
      totalHeight,
      startIndex,
      endIndex,
      visibleItems,
      offsetY: startIndex * itemHeight
    }
  }, [filteredEquipment, scrollTop, itemHeight, visibleCount])

  // 스크롤 핸들러
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // 상태별 색상 매핑
  const getStatusColor = useCallback((status: string) => {
    const colors = {
      running: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
      breakdown: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200',
      maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
      standby: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
      stopped: 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
    }
    return colors[status as keyof typeof colors] || colors.stopped
  }, [])

  // 상태별 아이콘
  const getStatusIcon = useCallback((status: string) => {
    const icons = {
      running: '🟢',
      breakdown: '🔴',
      maintenance: '🟡',
      standby: '🔵',
      stopped: '⚪'
    }
    return icons[status as keyof typeof icons] || icons.stopped
  }, [])

  // 장비 아이템 렌더링
  const renderEquipmentItem = useCallback((item: Equipment, index: number) => {
    const actualIndex = virtualizedData.startIndex + index
    
    return (
      <div
        key={item.id}
        className="absolute left-0 right-0 px-4 py-2"
        style={{
          top: actualIndex * itemHeight,
          height: itemHeight
        }}
      >
        <div
          className="h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 
                     hover:shadow-md transition-all cursor-pointer p-4 flex items-center space-x-4"
          onClick={() => onEquipmentClick?.(item)}
        >
          {/* 상태 표시 */}
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(item.status)}`}>
              <span className="text-lg">{getStatusIcon(item.status)}</span>
            </div>
          </div>

          {/* 장비 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {item.equipment_number}
              </h4>
              {item.score && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">점수:</span>
                  <span className={`text-sm font-bold ${
                    item.score >= 90 ? 'text-green-600' :
                    item.score >= 80 ? 'text-blue-600' :
                    item.score >= 70 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {item.score}
                  </span>
                  {item.grade && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {item.grade}
                    </span>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {item.equipment_name}
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">📍 {item.location}</span>
              <span className="text-xs text-gray-500">🏷️ {item.category}</span>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex-shrink-0">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                // 상세보기 등 추가 액션
              }}
            >
              📋
            </Button>
          </div>
        </div>
      </div>
    )
  }, [virtualizedData.startIndex, itemHeight, onEquipmentClick, getStatusColor, getStatusIcon])

  return (
    <Card className={className}>
      <Card.Header>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              🏭 설비 목록 ({filteredEquipment.length})
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              가상화 렌더링으로 대용량 데이터 최적화
            </p>
          </div>
          
          {/* 성능 정보 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 text-right">
              <div>표시: {virtualizedData.visibleItems.length} / {filteredEquipment.length}</div>
              <div>메모리 절약: {Math.round((1 - virtualizedData.visibleItems.length / Math.max(filteredEquipment.length, 1)) * 100)}%</div>
            </div>
          )}
        </div>

        {/* 필터 및 검색 */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 검색 */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="장비번호, 장비명, 위치로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 
                         rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 상태 필터 */}
          <div className="flex space-x-2">
            {[
              { value: 'all', label: '전체', icon: '📋' },
              { value: 'running', label: '가동', icon: '🟢' },
              { value: 'breakdown', label: '고장', icon: '🔴' },
              { value: 'maintenance', label: '정비', icon: '🟡' },
              { value: 'standby', label: '대기', icon: '🔵' },
              { value: 'stopped', label: '정지', icon: '⚪' }
            ].map(status => (
              <button
                key={status.value}
                onClick={() => setFilterStatus(status.value)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center space-x-1 ${
                  filterStatus === status.value
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span>{status.icon}</span>
                <span>{status.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card.Header>

      <Card.Content className="p-0">
        {filteredEquipment.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <span className="text-4xl">🔍</span>
            <p className="mt-2">조건에 맞는 설비가 없습니다</p>
            <p className="text-sm">필터를 조정하거나 검색어를 변경해보세요</p>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="relative overflow-auto"
            style={{ height: virtualizedData.containerHeight }}
            onScroll={handleScroll}
          >
            {/* 가상 스크롤 컨테이너 */}
            <div style={{ height: virtualizedData.totalHeight, position: 'relative' }}>
              <div
                style={{
                  transform: `translateY(${virtualizedData.offsetY}px)`,
                  position: 'relative'
                }}
              >
                {virtualizedData.visibleItems.map((item, index) =>
                  renderEquipmentItem(item, index)
                )}
              </div>
            </div>
          </div>
        )}

        {/* 스크롤 상태 표시 */}
        {filteredEquipment.length > visibleCount && (
          <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>
                {virtualizedData.startIndex + 1} - {Math.min(virtualizedData.endIndex, filteredEquipment.length)} 
                of {filteredEquipment.length}
              </span>
              <span>
                {Math.round((scrollTop / Math.max(virtualizedData.totalHeight - virtualizedData.containerHeight, 1)) * 100)}% 스크롤됨
              </span>
            </div>
          </div>
        )}
      </Card.Content>
    </Card>
  )
}

// [LSP] Rule: 메모이제이션 컴포넌트는 원본과 동일한 인터페이스 제공
export const VirtualizedEquipmentList = memo(VirtualizedEquipmentListComponent, (prevProps, nextProps) => {
  return (
    prevProps.equipment.length === nextProps.equipment.length &&
    prevProps.itemHeight === nextProps.itemHeight &&
    prevProps.visibleCount === nextProps.visibleCount &&
    // 깊은 비교는 성능상 제외하고 길이만 비교
    prevProps.equipment === nextProps.equipment
  )
})

VirtualizedEquipmentList.displayName = 'VirtualizedEquipmentList'