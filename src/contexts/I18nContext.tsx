'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 번역 리소스 임포트 (나중에 동적으로 로드)
import koCommon from '@/locales/ko/common.json'
import viCommon from '@/locales/vi/common.json'
import koAuth from '@/locales/ko/auth.json'
import viAuth from '@/locales/vi/auth.json'
import koDashboard from '@/locales/ko/dashboard.json'
import viDashboard from '@/locales/vi/dashboard.json'
import koEquipment from '@/locales/ko/equipment.json'
import viEquipment from '@/locales/vi/equipment.json'
import koBreakdown from '@/locales/ko/breakdown.json'
import viBreakdown from '@/locales/vi/breakdown.json'
import koRepair from '@/locales/ko/repair.json'
import viRepair from '@/locales/vi/repair.json'
import koStatistics from '@/locales/ko/statistics.json'
import viStatistics from '@/locales/vi/statistics.json'
import koSettings from '@/locales/ko/settings.json'
import viSettings from '@/locales/vi/settings.json'
import koAdmin from '@/locales/ko/admin.json'
import viAdmin from '@/locales/vi/admin.json'

// [SRP] Rule: 언어 관리 타입 정의
type Language = 'ko' | 'vi'

interface I18nContextType {
  currentLanguage: Language
  changeLanguage: (lang: Language) => void
  isChangingLanguage: boolean
}

// i18n 초기화
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ko: {
        common: koCommon,
        auth: koAuth,
        dashboard: koDashboard,
        equipment: koEquipment,
        breakdown: koBreakdown,
        repair: koRepair,
        statistics: koStatistics,
        settings: koSettings,
        admin: koAdmin,
      },
      vi: {
        common: viCommon,
        auth: viAuth,
        dashboard: viDashboard,
        equipment: viEquipment,
        breakdown: viBreakdown,
        repair: viRepair,
        statistics: viStatistics,
        settings: viSettings,
        admin: viAdmin,
      },
    },
    lng: 'ko',
    fallbackLng: 'ko',
    defaultNS: 'common',
    ns: ['common', 'auth', 'dashboard', 'equipment', 'breakdown', 'repair', 'statistics', 'settings', 'admin'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
    },
  })

const I18nContext = createContext<I18nContextType | undefined>(undefined)

// [SRP] Rule: i18n Provider 컴포넌트 - 언어 상태 관리만 담당
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    (i18n.language as Language) || 'ko'
  )
  const [isChangingLanguage, setIsChangingLanguage] = useState(false)

  // 언어 변경 핸들러
  const changeLanguage = useCallback(async (lang: Language) => {
    if (lang === currentLanguage) return

    setIsChangingLanguage(true)
    try {
      await i18n.changeLanguage(lang)
      setCurrentLanguage(lang)
      localStorage.setItem('i18nextLng', lang)
      
      // HTML lang 속성 업데이트
      document.documentElement.lang = lang
      
      // 폰트 최적화를 위한 클래스 추가
      document.documentElement.classList.remove('lang-ko', 'lang-vi')
      document.documentElement.classList.add(`lang-${lang}`)
    } catch (error) {
      console.error('Failed to change language:', error)
    } finally {
      setIsChangingLanguage(false)
    }
  }, [currentLanguage])

  // 초기 언어 설정
  useEffect(() => {
    const initializeLanguage = async () => {
      const savedLang = localStorage.getItem('i18nextLng') as Language
      if (savedLang && ['ko', 'vi'].includes(savedLang)) {
        await changeLanguage(savedLang)
      } else {
        // 브라우저 언어 감지
        const browserLang = navigator.language.toLowerCase()
        if (browserLang.startsWith('vi')) {
          await changeLanguage('vi')
        } else {
          await changeLanguage('ko')
        }
      }
    }
    
    initializeLanguage()
  }, [changeLanguage])

  return (
    <I18nContext.Provider value={{ currentLanguage, changeLanguage, isChangingLanguage }}>
      {children}
    </I18nContext.Provider>
  )
}

// [SRP] Rule: Custom Hook - Context 접근만 담당
export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}