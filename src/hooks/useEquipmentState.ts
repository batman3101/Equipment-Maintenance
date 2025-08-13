import { useState, useCallback, useMemo, useReducer } from 'react'
import { Equipment, EquipmentStatusInfo } from '@/types/equipment'

// [SRP] Rule: 설비 상태 관리만을 담당하는 단일 책임 훅

interface EquipmentFilters {
  searchTerm: string
  statusFilter: string
  categoryFilter: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface EquipmentUIState {
  showAddForm: boolean
  showDetailsModal: boolean
  showEditModal: boolean
  showDeleteModal: boolean
  selectedEquipment: Equipment | null
  loading: boolean
  error: string | null
}

// 상태 관리를 reducer 패턴으로 최적화
type UIAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SHOW_ADD_FORM'; payload: boolean }
  | { type: 'SHOW_DETAILS_MODAL'; payload: { show: boolean; equipment?: Equipment | null } }
  | { type: 'SHOW_EDIT_MODAL'; payload: { show: boolean; equipment?: Equipment | null } }
  | { type: 'SHOW_DELETE_MODAL'; payload: { show: boolean; equipment?: Equipment | null } }
  | { type: 'RESET_MODALS' }

const initialUIState: EquipmentUIState = {
  showAddForm: false,
  showDetailsModal: false,
  showEditModal: false,
  showDeleteModal: false,
  selectedEquipment: null,
  loading: true,
  error: null
}

function uiReducer(state: EquipmentUIState, action: UIAction): EquipmentUIState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SHOW_ADD_FORM':
      return { ...state, showAddForm: action.payload }
    case 'SHOW_DETAILS_MODAL':
      return { 
        ...state, 
        showDetailsModal: action.payload.show,
        selectedEquipment: action.payload.equipment || null
      }
    case 'SHOW_EDIT_MODAL':
      return { 
        ...state, 
        showEditModal: action.payload.show,
        selectedEquipment: action.payload.equipment || null
      }
    case 'SHOW_DELETE_MODAL':
      return { 
        ...state, 
        showDeleteModal: action.payload.show,
        selectedEquipment: action.payload.equipment || null
      }
    case 'RESET_MODALS':
      return { 
        ...state, 
        showAddForm: false,
        showDetailsModal: false,
        showEditModal: false,
        showDeleteModal: false,
        selectedEquipment: null
      }
    default:
      return state
  }
}

/**
 * [DIP] Rule: 구체적인 구현에 의존하지 않는 추상화된 상태 관리 훅
 * 13개의 개별 useState를 reducer와 필터 객체로 통합하여 리렌더링 최적화
 */
export function useEquipmentState() {
  // UI 상태를 reducer로 통합 (13개 -> 1개)
  const [uiState, dispatch] = useReducer(uiReducer, initialUIState)
  
  // 데이터 상태
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [equipmentStatuses, setEquipmentStatuses] = useState<EquipmentStatusInfo[]>([])
  const [isUploading, setIsUploading] = useState(false)
  
  // 필터 상태를 객체로 통합
  const [filters, setFilters] = useState<EquipmentFilters>({
    searchTerm: '',
    statusFilter: 'all',
    categoryFilter: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  // 폼 데이터 상태
  const [newEquipment, setNewEquipment] = useState<Partial<Equipment>>({
    equipmentName: '',
    equipmentNumber: '',
    category: '',
    location: null,
    manufacturer: null,
    model: null,
    installationDate: new Date().toISOString().split('T')[0],
    specifications: null
  })
  const [editFormData, setEditFormData] = useState<Partial<Equipment>>({})
  const [newEquipmentStatus, setNewEquipmentStatus] = useState<string>('running')
  const [editEquipmentStatus, setEditEquipmentStatus] = useState<string>('')

  // UI 상태 변경 액션들
  const actions = useMemo(() => ({
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    
    showAddForm: () => dispatch({ type: 'SHOW_ADD_FORM', payload: true }),
    hideAddForm: () => dispatch({ type: 'SHOW_ADD_FORM', payload: false }),
    
    showDetailsModal: (equipment: Equipment) => 
      dispatch({ type: 'SHOW_DETAILS_MODAL', payload: { show: true, equipment } }),
    hideDetailsModal: () => 
      dispatch({ type: 'SHOW_DETAILS_MODAL', payload: { show: false } }),
    
    showEditModal: (equipment: Equipment) => 
      dispatch({ type: 'SHOW_EDIT_MODAL', payload: { show: true, equipment } }),
    hideEditModal: () => 
      dispatch({ type: 'SHOW_EDIT_MODAL', payload: { show: false } }),
    
    showDeleteModal: (equipment: Equipment) => 
      dispatch({ type: 'SHOW_DELETE_MODAL', payload: { show: true, equipment } }),
    hideDeleteModal: () => 
      dispatch({ type: 'SHOW_DELETE_MODAL', payload: { show: false } }),
    
    resetModals: () => dispatch({ type: 'RESET_MODALS' })
  }), [])

  // 필터 업데이트 함수들 (메모이제이션)
  const updateFilter = useCallback((key: keyof EquipmentFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      statusFilter: 'all',
      categoryFilter: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc'
    })
  }, [])

  // 필터링된 설비 목록 (성능 최적화된 useMemo)
  const filteredAndSortedEquipments = useMemo(() => {
    let filtered = equipments

    // 검색어 필터링
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(equipment => 
        equipment.equipmentNumber.toLowerCase().includes(searchLower) ||
        equipment.equipmentName.toLowerCase().includes(searchLower) ||
        equipment.category.toLowerCase().includes(searchLower) ||
        (equipment.manufacturer?.toLowerCase().includes(searchLower)) ||
        (equipment.model?.toLowerCase().includes(searchLower)) ||
        (equipment.location?.toLowerCase().includes(searchLower))
      )
    }

    // 카테고리 필터링
    if (filters.categoryFilter !== 'all') {
      filtered = filtered.filter(equipment => equipment.category === filters.categoryFilter)
    }

    // 상태 필터링
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(equipment => {
        const status = equipmentStatuses.find(s => s.equipmentId === equipment.id)
        return status?.status === filters.statusFilter
      })
    }

    // 정렬
    return [...filtered].sort((a, b) => {
      let aValue: string | number | Date, bValue: string | number | Date

      switch (filters.sortBy) {
        case 'equipmentNumber':
          aValue = a.equipmentNumber
          bValue = b.equipmentNumber
          break
        case 'equipmentName':
          aValue = a.equipmentName
          bValue = b.equipmentName
          break
        case 'category':
          aValue = a.category
          bValue = b.category
          break
        case 'location':
          aValue = a.location || ''
          bValue = b.location || ''
          break
        case 'status':
          const statusA = equipmentStatuses.find(s => s.equipmentId === a.id)
          const statusB = equipmentStatuses.find(s => s.equipmentId === b.id)
          aValue = statusA?.status || ''
          bValue = statusB?.status || ''
          break
        default:
          aValue = new Date(a.createdAt || 0).getTime()
          bValue = new Date(b.createdAt || 0).getTime()
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return filters.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return filters.sortOrder === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number)
    })
  }, [equipments, equipmentStatuses, filters])

  // 통계 데이터 (메모이제이션)
  const statistics = useMemo(() => {
    const total = equipments.length
    const statusCounts = equipmentStatuses.reduce((acc, status) => {
      acc[status.status] = (acc[status.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      running: statusCounts.running || 0,
      breakdown: statusCounts.breakdown || 0,
      maintenance: statusCounts.maintenance || 0,
      standby: statusCounts.standby || 0,
      stopped: statusCounts.stopped || 0
    }
  }, [equipments, equipmentStatuses])

  return {
    // 상태
    ...uiState,
    equipments,
    equipmentStatuses,
    isUploading,
    filters,
    newEquipment,
    editFormData,
    newEquipmentStatus,
    editEquipmentStatus,

    // 계산된 값들
    filteredAndSortedEquipments,
    statistics,

    // 액션들
    ...actions,
    
    // 데이터 설정자들
    setEquipments,
    setEquipmentStatuses,
    setIsUploading,
    updateFilter,
    resetFilters,
    setNewEquipment,
    setEditFormData,
    setNewEquipmentStatus,
    setEditEquipmentStatus
  }
}

export default useEquipmentState