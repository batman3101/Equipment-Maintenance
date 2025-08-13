import { useState, useEffect, useCallback, useMemo } from 'react'
import { Equipment, EquipmentStatusInfo } from '@/types/equipment'

/**
 * [ISP] Rule: 가상화된 리스트를 위한 전용 인터페이스
 * 대용량 데이터 처리를 위한 가상화 및 페이징 훅
 */

interface VirtualizedConfig {
  pageSize: number
  bufferSize: number
  totalHeight: number
  itemHeight: number
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface VirtualizedEquipmentState {
  visibleItems: Equipment[]
  allItems: Equipment[]
  loading: boolean
  error: string | null
  pagination: PaginationInfo
  virtualConfig: VirtualizedConfig
}

/**
 * [DIP] Rule: 추상화된 데이터 소스에 의존하는 가상화 훅
 * 메모리 효율성을 위한 가상 스크롤링과 서버 사이드 페이징 결합
 */
export function useVirtualizedEquipment(
  searchTerm: string = '',
  statusFilter: string = 'all',
  categoryFilter: string = 'all',
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  const [state, setState] = useState<VirtualizedEquipmentState>({
    visibleItems: [],
    allItems: [],
    loading: true,
    error: null,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      hasNextPage: false,
      hasPrevPage: false
    },
    virtualConfig: {
      pageSize: 50, // 한 번에 로드할 아이템 수
      bufferSize: 10, // 미리 로드할 아이템 수
      totalHeight: 400, // 컨테이너 높이
      itemHeight: 60 // 각 아이템 높이
    }
  })

  const [scrollTop, setScrollTop] = useState(0)
  const [equipmentStatuses, setEquipmentStatuses] = useState<EquipmentStatusInfo[]>([])

  // 가상화된 아이템 계산
  const virtualizedItems = useMemo(() => {
    const { itemHeight, totalHeight, bufferSize } = state.virtualConfig
    const visibleCount = Math.ceil(totalHeight / itemHeight)
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + visibleCount + bufferSize,
      state.allItems.length
    )
    const safeStartIndex = Math.max(0, startIndex - bufferSize)

    return {
      startIndex: safeStartIndex,
      endIndex,
      visibleItems: state.allItems.slice(safeStartIndex, endIndex),
      offsetY: safeStartIndex * itemHeight,
      totalHeight: state.allItems.length * itemHeight
    }
  }, [scrollTop, state.allItems, state.virtualConfig])

  // API 요청 함수 (서버 사이드 페이징)
  const fetchEquipment = useCallback(async (
    page: number = 1,
    append: boolean = false
  ) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      // 필터와 정렬을 포함한 API 요청
      const params = new URLSearchParams({
        page: page.toString(),
        limit: state.virtualConfig.pageSize.toString(),
        search: searchTerm,
        status: statusFilter,
        category: categoryFilter,
        sortBy,
        sortOrder
      })

      const response = await fetch(`/api/equipment/paginated?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch equipment data')
      }

      const { equipment, pagination, statuses } = result.data

      setState(prev => ({
        ...prev,
        allItems: append ? [...prev.allItems, ...equipment] : equipment,
        visibleItems: equipment.slice(0, Math.ceil(prev.virtualConfig.totalHeight / prev.virtualConfig.itemHeight)),
        pagination,
        loading: false
      }))

      if (statuses) {
        setEquipmentStatuses(statuses)
      }

    } catch (error) {
      console.error('Equipment fetch error:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false
      }))
    }
  }, [searchTerm, statusFilter, categoryFilter, sortBy, sortOrder, state.virtualConfig.pageSize, state.virtualConfig.totalHeight, state.virtualConfig.itemHeight])

  // 무한 스크롤을 위한 다음 페이지 로드
  const loadNextPage = useCallback(async () => {
    if (!state.pagination.hasNextPage || state.loading) return

    await fetchEquipment(state.pagination.currentPage + 1, true)
  }, [state.pagination.hasNextPage, state.pagination.currentPage, state.loading, fetchEquipment])

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop: newScrollTop, scrollHeight, clientHeight } = event.currentTarget
    setScrollTop(newScrollTop)

    // 무한 스크롤 트리거 (80% 지점에서)
    const scrollPercentage = (newScrollTop + clientHeight) / scrollHeight
    if (scrollPercentage > 0.8 && state.pagination.hasNextPage && !state.loading) {
      loadNextPage()
    }
  }, [state.pagination.hasNextPage, state.loading, loadNextPage])

  // 필터 변경 시 리셋
  useEffect(() => {
    setState(prev => ({ 
      ...prev, 
      allItems: [], 
      pagination: { ...prev.pagination, currentPage: 1 } 
    }))
    fetchEquipment(1, false)
  }, [searchTerm, statusFilter, categoryFilter, sortBy, sortOrder])

  // 가상화 설정 업데이트
  const updateVirtualConfig = useCallback((newConfig: Partial<VirtualizedConfig>) => {
    setState(prev => ({
      ...prev,
      virtualConfig: { ...prev.virtualConfig, ...newConfig }
    }))
  }, [])

  // 특정 아이템으로 스크롤
  const scrollToItem = useCallback((index: number) => {
    const { itemHeight } = state.virtualConfig
    const newScrollTop = index * itemHeight
    setScrollTop(newScrollTop)
  }, [state.virtualConfig])

  // 검색 결과 강조를 위한 필터링된 아이템
  const highlightedItems = useMemo(() => {
    if (!searchTerm) return virtualizedItems.visibleItems

    return virtualizedItems.visibleItems.map(item => {
      const searchLower = searchTerm.toLowerCase()
      const highlights = {
        equipmentNumber: item.equipmentNumber.toLowerCase().includes(searchLower),
        equipmentName: item.equipmentName.toLowerCase().includes(searchLower),
        category: item.category.toLowerCase().includes(searchLower),
        manufacturer: item.manufacturer?.toLowerCase().includes(searchLower) || false,
        model: item.model?.toLowerCase().includes(searchLower) || false,
        location: item.location?.toLowerCase().includes(searchLower) || false
      }

      return { ...item, highlights }
    })
  }, [virtualizedItems.visibleItems, searchTerm])

  // 성능 메트릭
  const performanceMetrics = useMemo(() => {
    const totalItems = state.pagination.totalItems
    const loadedItems = state.allItems.length
    const visibleItems = virtualizedItems.visibleItems.length
    const memoryUsage = loadedItems / totalItems * 100

    return {
      totalItems,
      loadedItems,
      visibleItems,
      memoryUsage: Math.round(memoryUsage),
      scrollPosition: Math.round(scrollTop),
      virtualizedRange: `${virtualizedItems.startIndex}-${virtualizedItems.endIndex}`
    }
  }, [state.pagination.totalItems, state.allItems.length, virtualizedItems, scrollTop])

  return {
    // 상태
    loading: state.loading,
    error: state.error,
    
    // 데이터
    items: highlightedItems,
    allItems: state.allItems,
    equipmentStatuses,
    
    // 가상화 정보
    virtualInfo: {
      ...virtualizedItems,
      containerHeight: state.virtualConfig.totalHeight,
      itemHeight: state.virtualConfig.itemHeight
    },
    
    // 페이징 정보
    pagination: state.pagination,
    
    // 액션
    handleScroll,
    loadNextPage,
    refetch: () => fetchEquipment(1, false),
    updateVirtualConfig,
    scrollToItem,
    
    // 메트릭
    performanceMetrics
  }
}

export default useVirtualizedEquipment