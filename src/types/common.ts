// 공통 타입 정의

export type SortOrder = 'asc' | 'desc'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export interface FilterOption {
  value: string
  label: string
}

export interface StatusBadgeVariant {
  variant: 'success' | 'warning' | 'danger' | 'secondary' | 'info'
}

export interface APIResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface LoadingState {
  loading: boolean
  error: string | null
}

// API 정렬 타입
export interface SortConfig {
  field: string
  order: SortOrder
}

// 검색 및 필터 상태
export interface FilterState {
  searchTerm: string
  statusFilter: string
  categoryFilter: string
  dateFilter?: {
    from: string
    to: string
  }
}