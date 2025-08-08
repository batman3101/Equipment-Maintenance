'use client'

import React from 'react'
import { useI18n } from '@/contexts/I18nContext'
import { useTheme } from '@/contexts/ThemeContext'

interface LanguageToggleProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

// [SRP] Rule: 언어 토글 기능만 담당
export function LanguageToggle({ className = '', size = 'md' }: LanguageToggleProps) {
  const { currentLanguage, changeLanguage, isChangingLanguage } = useI18n()
  const { theme } = useTheme()

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs font-medium',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-12 h-12 text-base font-semibold',
  }

  const baseClasses = 'inline-flex items-center justify-center rounded-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 touch-target transform hover:scale-105 active:scale-95'
  
  // 테마별 스타일링 - ThemeToggle과 동일한 스타일 유지
  const themeClasses = theme === 'dark'
    ? 'bg-gray-800 hover:bg-gray-700 text-blue-400 focus:ring-blue-500 shadow-lg'
    : 'bg-white hover:bg-gray-50 text-gray-600 focus:ring-green-500 shadow-md border border-gray-200'

  const classes = `${baseClasses} ${themeClasses} ${sizeClasses[size]} ${className} ${isChangingLanguage ? 'opacity-75 cursor-wait' : ''}`

  const handleToggle = () => {
    if (!isChangingLanguage) {
      const nextLang = currentLanguage === 'ko' ? 'vi' : 'ko'
      changeLanguage(nextLang)
    }
  }

  // 언어별 플래그 이모지와 코드
  const languageDisplay = {
    ko: { code: 'KO', flag: '🇰🇷', name: '한국어' },
    vi: { code: 'VI', flag: '🇻🇳', name: 'Tiếng Việt' }
  }

  const nextLanguage = currentLanguage === 'ko' ? 'vi' : 'ko'
  const currentLangInfo = languageDisplay[currentLanguage]
  const nextLangInfo = languageDisplay[nextLanguage]

  return (
    <button
      onClick={handleToggle}
      className={classes}
      aria-label={`현재 ${currentLangInfo.name}, ${nextLangInfo.name}로 전환`}
      title={`${nextLangInfo.name}로 전환`}
      disabled={isChangingLanguage}
    >
      <span className="relative flex items-center justify-center">
        {/* 현재 언어 코드 표시 */}
        <span className="tracking-tight">
          {currentLangInfo.code}
        </span>
      </span>
    </button>
  )
}