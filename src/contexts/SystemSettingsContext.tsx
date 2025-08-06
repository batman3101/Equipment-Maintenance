'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useToast } from './ToastContext'

// 시스템 설정 인터페이스 정의
export interface SystemSettings {
  // 일반 설정
  general: {
    systemName: string
    companyName: string
    offlineMode: boolean
    language: 'ko' | 'en' | 'vi'
    timezone: string
  }

  // 설비 관련 설정
  equipment: {
    categories: Array<{ value: string; label: string }>
    locations: Array<{ value: string; label: string }>
    statuses: Array<{ value: string; label: string; color: string }>
    defaultStatus: string
  }

  // 고장 신고 관련 설정
  breakdown: {
    urgencyLevels: Array<{ value: string; label: string; color: string }>
    issueTypes: Array<{ value: string; label: string }>
    defaultUrgency: string
    autoAssignment: boolean
    requirePhotos: boolean
  }

  // 수리 관련 설정
  repair: {
    repairTypes: Array<{ value: string; label: string }>
    completionStatuses: Array<{ value: string; label: string; color: string }>
    requireTestResults: boolean
    maxTimeSpent: number
    defaultTimeUnit: 'hours' | 'minutes'
  }

  // 알림 설정
  notifications: {
    toastDuration: number
    enableSound: boolean
    autoHide: boolean
    maxToasts: number
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  }

  // 데이터 설정
  data: {
    itemsPerPage: number
    exportFormat: 'xlsx' | 'csv' | 'json'
    autoSave: boolean
    autoSaveInterval: number // minutes
    dataRetentionDays: number
  }

  // UI 설정
  ui: {
    theme: 'light' | 'dark' | 'auto'
    fontSize: 'small' | 'medium' | 'large'
    compactMode: boolean
    showHelpTexts: boolean
    animationsEnabled: boolean
  }

  // 보안 설정
  security: {
    sessionTimeout: number // minutes
    requireTwoFactor: boolean
    passwordMinLength: number
    maxLoginAttempts: number
    lockoutDuration: number // minutes
  }
}

// 기본 설정값
export const defaultSettings: SystemSettings = {
  general: {
    systemName: 'CNC 설비 관리 시스템',
    companyName: 'Your Company',
    offlineMode: false,
    language: 'ko',
    timezone: 'Asia/Seoul'
  },

  equipment: {
    categories: [
      { value: 'CNC', label: 'CNC' },
      { value: 'CLEANING', label: 'CLEANING' },
      { value: 'DEBURRING', label: 'DEBURRING' },
      { value: 'TRI', label: 'TRI' },
      { value: 'AIR_DRYER', label: 'AIR DRYER' },
      { value: 'BOILER', label: 'BOILER' },
      { value: 'RO_WATER_MAKER', label: 'RO WATER MAKER' },
      { value: 'COOLANT_MIXING_UNIT', label: 'COOLANT MIXING UNIT' },
      { value: 'SCRAP_COMPACTOR', label: 'SCRAP COMPACTOR' },
      { value: 'SCRAP_WASHING_MACHINE', label: 'SCRAP WASHING MACHINE' }
    ],
    locations: [
      { value: 'BUILD_A', label: 'BUILD A' },
      { value: 'BUILD_B', label: 'BUILD B' }
    ],
    statuses: [
      { value: 'operational', label: '가동중', color: 'green' },
      { value: 'maintenance', label: '정비중', color: 'yellow' },
      { value: 'broken', label: '고장', color: 'red' },
      { value: 'test', label: 'TEST', color: 'blue' },
      { value: 'idle', label: '대기중', color: 'gray' }
    ],
    defaultStatus: 'operational'
  },

  breakdown: {
    urgencyLevels: [
      { value: 'low', label: '낮음 - 생산에 영향 없음', color: 'green' },
      { value: 'medium', label: '보통 - 부분적 영향', color: 'yellow' },
      { value: 'high', label: '높음 - 생산 중단', color: 'orange' },
      { value: 'critical', label: '긴급 - 안전 위험', color: 'red' }
    ],
    issueTypes: [
      { value: 'mechanical', label: '기계적 문제' },
      { value: 'electrical', label: '전기적 문제' },
      { value: 'software', label: '소프트웨어 문제' },
      { value: 'safety', label: '안전 문제' },
      { value: 'other', label: '기타' }
    ],
    defaultUrgency: 'medium',
    autoAssignment: false,
    requirePhotos: false
  },

  repair: {
    repairTypes: [
      { value: 'corrective', label: '사후 정비 (고장 수리)' },
      { value: 'preventive', label: '예방 정비 (정기 점검)' },
      { value: 'emergency', label: '긴급 수리' },
      { value: 'upgrade', label: '개선/업그레이드' }
    ],
    completionStatuses: [
      { value: 'completed', label: '완료', color: 'green' },
      { value: 'partial', label: '부분 완료', color: 'yellow' },
      { value: 'failed', label: '실패/보류', color: 'red' }
    ],
    requireTestResults: true,
    maxTimeSpent: 24,
    defaultTimeUnit: 'hours'
  },

  notifications: {
    toastDuration: 5000,
    enableSound: false,
    autoHide: true,
    maxToasts: 5,
    position: 'top-right'
  },

  data: {
    itemsPerPage: 10,
    exportFormat: 'xlsx',
    autoSave: false,
    autoSaveInterval: 5,
    dataRetentionDays: 365
  },

  ui: {
    theme: 'light',
    fontSize: 'medium',
    compactMode: false,
    showHelpTexts: true,
    animationsEnabled: true
  },

  security: {
    sessionTimeout: 30,
    requireTwoFactor: false,
    passwordMinLength: 8,
    maxLoginAttempts: 5,
    lockoutDuration: 15
  }
}

interface SystemSettingsContextType {
  settings: SystemSettings
  updateSettings: (updates: Partial<SystemSettings>) => void
  resetSettings: () => void
  exportSettings: () => void
  importSettings: (settingsJson: string) => boolean
  loading: boolean
}

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined)

interface SystemSettingsProviderProps {
  children: ReactNode
}

export function SystemSettingsProvider({ children }: SystemSettingsProviderProps) {
  // Safely handle toast context during SSR/SSG
  let showSuccess: (title: string, message: string) => void = () => {}
  let showError: (title: string, message: string) => void = () => {}
  
  try {
    const toast = useToast()
    showSuccess = toast.showSuccess
    showError = toast.showError
  } catch (error) {
    // useToast hook is not available during SSR/SSG
    console.warn('Toast context not available during server-side rendering')
  }

  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  // 설정 로드
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('cnc-system-settings')
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings)
          // 기본값과 병합하여 누락된 설정이 있어도 안전하게 처리
          setSettings(mergeWithDefaults(parsedSettings, defaultSettings))
        }
      } catch (error) {
        console.error('Failed to load system settings:', error)
        showError('설정 로드 실패', '시스템 설정을 불러오는데 실패했습니다. 기본값으로 설정됩니다.')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [showError])

  // 설정 업데이트
  const updateSettings = (updates: Partial<SystemSettings>) => {
    try {
      const newSettings = deepMerge(settings as unknown as Record<string, unknown>, updates as unknown as Record<string, unknown>) as unknown as SystemSettings
      setSettings(newSettings)
      localStorage.setItem('cnc-system-settings', JSON.stringify(newSettings))
      showSuccess('설정 저장', '시스템 설정이 성공적으로 저장되었습니다.')
    } catch (error) {
      console.error('Failed to update settings:', error)
      showError('설정 저장 실패', '시스템 설정 저장 중 오류가 발생했습니다.')
    }
  }

  // 설정 초기화
  const resetSettings = () => {
    try {
      setSettings(defaultSettings)
      localStorage.setItem('cnc-system-settings', JSON.stringify(defaultSettings))
      showSuccess('설정 초기화', '시스템 설정이 기본값으로 초기화되었습니다.')
    } catch (error) {
      console.error('Failed to reset settings:', error)
      showError('설정 초기화 실패', '시스템 설정 초기화 중 오류가 발생했습니다.')
    }
  }

  // 설정 내보내기
  const exportSettings = () => {
    try {
      const settingsJson = JSON.stringify(settings, null, 2)
      const blob = new Blob([settingsJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cnc-system-settings-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showSuccess('설정 내보내기', '시스템 설정이 파일로 내보내졌습니다.')
    } catch (error) {
      console.error('Failed to export settings:', error)
      showError('설정 내보내기 실패', '시스템 설정 내보내기 중 오류가 발생했습니다.')
    }
  }

  // 설정 가져오기
  const importSettings = (settingsJson: string): boolean => {
    try {
      const parsedSettings = JSON.parse(settingsJson)
      const mergedSettings = mergeWithDefaults(parsedSettings, defaultSettings)
      setSettings(mergedSettings)
      localStorage.setItem('cnc-system-settings', JSON.stringify(mergedSettings))
      showSuccess('설정 가져오기', '시스템 설정이 성공적으로 가져와졌습니다.')
      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      showError('설정 가져오기 실패', '잘못된 설정 파일입니다. 파일을 확인해주세요.')
      return false
    }
  }

  const value: SystemSettingsContextType = {
    settings,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    loading
  }

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  )
}

export function useSystemSettings() {
  const context = useContext(SystemSettingsContext)
  if (context === undefined) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider')
  }
  return context
}

// 유틸리티 함수들
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target }
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge((target[key] || {}) as Record<string, unknown>, source[key] as Record<string, unknown>)
    } else {
      result[key] = source[key]
    }
  }
  
  return result
}

function mergeWithDefaults(settings: Partial<SystemSettings>, defaults: SystemSettings): SystemSettings {
  return deepMerge(defaults as unknown as Record<string, unknown>, settings as unknown as Record<string, unknown>) as unknown as SystemSettings
}