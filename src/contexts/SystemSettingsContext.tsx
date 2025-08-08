'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useToast } from './ToastContext'
import { useTranslation } from 'react-i18next'

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
      { value: 'operational', label: '정상', color: 'green' },
      { value: 'maintenance', label: '점검중', color: 'yellow' },
      { value: 'broken', label: '고장', color: 'red' },
      { value: 'test', label: '수리중', color: 'blue' },
      { value: 'idle', label: '폐기', color: 'gray' }
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
  getTranslatedSettings: () => SystemSettings
}

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined)

interface SystemSettingsProviderProps {
  children: ReactNode
}

export function SystemSettingsProvider({ children }: SystemSettingsProviderProps) {
  // Always call useToast hook to follow rules of hooks
  const toast = useToast()
  const { t } = useTranslation(['common', 'equipment', 'breakdown'])
  // Note: i18n from useTranslation could be used for future language change handling
  
  const showSuccess = useCallback((title: string, message: string) => {
    try {
      toast.showSuccess(title, message)
    } catch (error) {
      console.warn('Toast not available:', error)
    }
  }, [toast])
  
  const showError = useCallback((title: string, message: string) => {
    try {
      toast.showError(title, message)
    } catch (error) {
      console.warn('Toast not available:', error)
    }
  }, [toast])

  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  // 번역된 설정을 가져오는 함수
  const getTranslatedSettings = useCallback((): SystemSettings => {
    return {
      ...settings,
      equipment: {
        ...settings.equipment,
        categories: settings.equipment.categories.map(category => ({
          ...category,
          label: t(`equipment:categories.${category.value}`, category.label)
        })),
        locations: settings.equipment.locations.map(location => ({
          ...location,
          label: t(`equipment:locations.${location.value}`, location.label)
        })),
        statuses: settings.equipment.statuses.map(status => ({
          ...status,
          label: t(`equipment:status.${status.value}`, status.label)
        }))
      },
      breakdown: {
        ...settings.breakdown,
        urgencyLevels: settings.breakdown.urgencyLevels.map(level => ({
          ...level,
          label: t(`breakdown:urgency.${level.value}`, level.label)
        })),
        issueTypes: settings.breakdown.issueTypes.map(type => ({
          ...type,
          label: t(`breakdown:issueTypes.${type.value}`, type.label)
        }))
      }
    }
  }, [settings, t])

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
  const updateSettings = useCallback((updates: Partial<SystemSettings>) => {
    try {
      const newSettings = deepMerge(settings as unknown as Record<string, unknown>, updates as unknown as Record<string, unknown>) as unknown as SystemSettings
      setSettings(newSettings)
      localStorage.setItem('cnc-system-settings', JSON.stringify(newSettings))
      showSuccess('설정 저장', '시스템 설정이 성공적으로 저장되었습니다.')
    } catch (error) {
      console.error('Failed to update settings:', error)
      showError('설정 저장 실패', '시스템 설정 저장 중 오류가 발생했습니다.')
    }
  }, [settings, showSuccess, showError])

  // 설정 초기화
  const resetSettings = useCallback(() => {
    try {
      setSettings(defaultSettings)
      localStorage.setItem('cnc-system-settings', JSON.stringify(defaultSettings))
      showSuccess('설정 초기화', '시스템 설정이 기본값으로 초기화되었습니다.')
    } catch (error) {
      console.error('Failed to reset settings:', error)
      showError('설정 초기화 실패', '시스템 설정 초기화 중 오류가 발생했습니다.')
    }
  }, [showSuccess, showError])

  // 설정 내보내기
  const exportSettings = useCallback(() => {
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
  }, [settings, showSuccess, showError])

  // 설정 가져오기
  const importSettings = useCallback((settingsJson: string): boolean => {
    try {
      // 1. 파일 크기 검증
      validateFileSize(settingsJson)
      
      // 2. JSON 파싱
      const parsedSettings = JSON.parse(settingsJson)
      
      // 3. 스키마 검증
      if (!validateSettingsSchema(parsedSettings)) {
        throw new Error('잘못된 설정 파일 형식입니다. 필수 필드가 누락되었거나 유효하지 않은 값이 있습니다.')
      }
      
      // 4. 기본값과 병합 및 적용
      const mergedSettings = mergeWithDefaults(parsedSettings, defaultSettings)
      setSettings(mergedSettings)
      localStorage.setItem('cnc-system-settings', JSON.stringify(mergedSettings))
      showSuccess('설정 가져오기', '시스템 설정이 성공적으로 가져와졌습니다.')
      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      
      // 구체적인 에러 메시지 제공
      let errorMessage = '설정 파일을 가져오는 중 오류가 발생했습니다.'
      
      if (error instanceof SyntaxError) {
        errorMessage = '설정 파일이 올바른 JSON 형식이 아닙니다.'
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      showError('설정 가져오기 실패', errorMessage)
      return false
    }
  }, [showSuccess, showError])

  const value: SystemSettingsContextType = {
    settings,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    loading,
    getTranslatedSettings
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

// 상수 정의
const SETTINGS_VALIDATION = {
  MAX_FILE_SIZE: 1024 * 1024, // 1MB
  MAX_STRING_LENGTH: 1000,
  MAX_ARRAY_LENGTH: 100
} as const

// 파일 크기 검증 함수
function validateFileSize(jsonString: string): void {
  const fileSizeBytes = new Blob([jsonString]).size
  if (fileSizeBytes > SETTINGS_VALIDATION.MAX_FILE_SIZE) {
    throw new Error(`설정 파일이 너무 큽니다. 최대 크기: ${SETTINGS_VALIDATION.MAX_FILE_SIZE / 1024 / 1024}MB`)
  }
}

// 스키마 검증 함수
function validateSettingsSchema(obj: unknown): obj is SystemSettings {
  try {
    // null 또는 undefined 체크
    if (!obj || typeof obj !== 'object') {
      return false
    }

    const settings = obj as Record<string, unknown>

    // 필수 최상위 속성 체크
    const requiredKeys = ['general', 'equipment', 'breakdown', 'repair', 'notifications', 'data', 'ui', 'security']
    for (const key of requiredKeys) {
      if (!(key in settings) || !settings[key] || typeof settings[key] !== 'object') {
        return false
      }
    }

    // general 섹션 검증
    const general = settings.general as Record<string, unknown>
    if (!general.systemName || typeof general.systemName !== 'string' || general.systemName.length > SETTINGS_VALIDATION.MAX_STRING_LENGTH) {
      return false
    }
    if (!general.companyName || typeof general.companyName !== 'string' || general.companyName.length > SETTINGS_VALIDATION.MAX_STRING_LENGTH) {
      return false
    }
    if (typeof general.offlineMode !== 'boolean') {
      return false
    }
    if (!['ko', 'en', 'vi'].includes(general.language as string)) {
      return false
    }
    if (!general.timezone || typeof general.timezone !== 'string') {
      return false
    }

    // equipment 섹션 검증
    const equipment = settings.equipment as Record<string, unknown>
    if (!Array.isArray(equipment.categories) || equipment.categories.length > SETTINGS_VALIDATION.MAX_ARRAY_LENGTH) {
      return false
    }
    if (!Array.isArray(equipment.locations) || equipment.locations.length > SETTINGS_VALIDATION.MAX_ARRAY_LENGTH) {
      return false
    }
    if (!Array.isArray(equipment.statuses) || equipment.statuses.length > SETTINGS_VALIDATION.MAX_ARRAY_LENGTH) {
      return false
    }
    
    // 배열 요소들의 구조 검증
    for (const item of equipment.categories as Array<unknown>) {
      const category = item as Record<string, unknown>
      if (!category.value || !category.label || typeof category.value !== 'string' || typeof category.label !== 'string') {
        return false
      }
    }

    // notifications 섹션 검증
    const notifications = settings.notifications as Record<string, unknown>
    if (typeof notifications.toastDuration !== 'number' || notifications.toastDuration < 1000 || notifications.toastDuration > 60000) {
      return false
    }
    if (typeof notifications.enableSound !== 'boolean') {
      return false
    }
    if (typeof notifications.autoHide !== 'boolean') {
      return false
    }
    if (typeof notifications.maxToasts !== 'number' || notifications.maxToasts < 1 || notifications.maxToasts > 20) {
      return false
    }
    if (!['top-right', 'top-left', 'bottom-right', 'bottom-left'].includes(notifications.position as string)) {
      return false
    }

    // security 섹션 검증
    const security = settings.security as Record<string, unknown>
    if (typeof security.sessionTimeout !== 'number' || security.sessionTimeout < 5 || security.sessionTimeout > 1440) {
      return false
    }
    if (typeof security.requireTwoFactor !== 'boolean') {
      return false
    }
    if (typeof security.passwordMinLength !== 'number' || security.passwordMinLength < 6 || security.passwordMinLength > 50) {
      return false
    }
    if (typeof security.maxLoginAttempts !== 'number' || security.maxLoginAttempts < 3 || security.maxLoginAttempts > 10) {
      return false
    }
    if (typeof security.lockoutDuration !== 'number' || security.lockoutDuration < 5 || security.lockoutDuration > 1440) {
      return false
    }

    return true
  } catch {
    return false
  }
}

function mergeWithDefaults(settings: Partial<SystemSettings>, defaults: SystemSettings): SystemSettings {
  return deepMerge(defaults as unknown as Record<string, unknown>, settings as unknown as Record<string, unknown>) as unknown as SystemSettings
}