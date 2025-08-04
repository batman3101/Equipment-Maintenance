'use client'

import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface ThemeToggleProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

// [SRP] Rule: 테마 토글 기능만 담당
export function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  }

  const baseClasses = 'inline-flex items-center justify-center rounded-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 touch-target transform hover:scale-105 active:scale-95'
  
  // 테마별 스타일링 - 더 부드러운 전환을 위한 개선된 색상
  const themeClasses = theme === 'dark'
    ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400 focus:ring-yellow-500 shadow-lg'
    : 'bg-white hover:bg-gray-50 text-gray-600 focus:ring-blue-500 shadow-md border border-gray-200'

  const classes = `${baseClasses} ${themeClasses} ${sizeClasses[size]} ${className}`

  return (
    <button
      onClick={toggleTheme}
      className={classes}
      aria-label={`현재 ${theme === 'light' ? '라이트' : '다크'} 모드, ${theme === 'light' ? '다크' : '라이트'} 모드로 전환`}
      title={`${theme === 'light' ? '다크' : '라이트'} 모드로 전환`}
    >
      {theme === 'light' ? (
        // 라이트 모드일 때 달 아이콘 (다크 모드로 전환)
        <svg 
          className="w-5 h-5" 
          fill="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
        </svg>
      ) : (
        // 다크 모드일 때 태양 아이콘 (라이트 모드로 전환)
        <svg 
          className="w-5 h-5" 
          fill="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12,7c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5S14.76,7,12,7L12,7z M2,13l2,0c0.55,0,1-0.45,1-1s-0.45-1-1-1l-2,0 c-0.55,0-1,0.45-1,1S1.45,13,2,13z M20,13l2,0c0.55,0,1-0.45,1-1s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S19.45,13,20,13z M11,2v2 c0,0.55,0.45,1,1,1s1-0.45,1-1V2c0-0.55-0.45-1-1-1S11,1.45,11,2z M11,20v2c0,0.55,0.45,1,1,1s1-0.45,1-1v-2c0-0.55-0.45-1-1-1 C11.45,19,11,19.45,11,20z M5.99,4.58c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06 c0.39,0.39,1.03,0.39,1.41,0s0.39-1.03,0-1.41L5.99,4.58z M18.36,16.95c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41 l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0c0.39-0.39,0.39-1.03,0-1.41L18.36,16.95z M19.42,5.99c0.39-0.39,0.39-1.03,0-1.41 c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06c-0.39,0.39-0.39,1.03,0,1.41s1.03,0.39,1.41,0L19.42,5.99z M7.05,18.36 c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06c-0.39,0.39-0.39,1.03,0,1.41s1.03,0.39,1.41,0L7.05,18.36z"/>
        </svg>
      )}
    </button>
  )
}