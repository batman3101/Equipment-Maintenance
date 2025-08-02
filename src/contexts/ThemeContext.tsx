'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

// [SRP] Rule: 테마 타입과 상태만 관리하는 단일 책임
type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

// [DIP] Rule: 추상화된 컨텍스트 인터페이스에 의존
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
}

// [SRP] Rule: 테마 상태 관리와 로컬 스토리지 동기화만 담당
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('light')
  const [isInitialized, setIsInitialized] = useState(false)

  // 초기 테마 설정 - 로컬 스토리지에서 읽기 또는 시스템 설정 감지
  useEffect(() => {
    const savedTheme = localStorage.getItem('cnc-theme') as Theme
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    
    const initialTheme = savedTheme || systemTheme
    setTheme(initialTheme)
    setIsInitialized(true)
  }, [])

  // 테마 변경 시 DOM과 로컬 스토리지 업데이트
  useEffect(() => {
    if (!isInitialized) return

    // DOM에 클래스 적용
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)

    // 로컬 스토리지에 저장
    localStorage.setItem('cnc-theme', theme)
  }, [theme, isInitialized])

  // [OCP] Rule: 새로운 테마 전환 로직이 추가되어도 기존 코드 수정 불필요
  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  // 초기화 완료까지 렌더링 방지 (FOUC 방지)
  if (!isInitialized) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// [SRP] Rule: 테마 컨텍스트 접근만 담당하는 커스텀 훅
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}