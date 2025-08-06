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
  const lastToggleTime = React.useRef(0)

  // 초기 테마 설정
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('cnc-theme') as Theme
      const initialTheme = savedTheme || 'light'
      console.log('ThemeContext: Setting initial theme to', initialTheme)
      setTheme(initialTheme)
    } catch (error) {
      console.error('ThemeContext: Error setting initial theme', error)
      setTheme('light')
    }
  }, [])

  // 테마 변경 시 DOM과 로컬 스토리지 업데이트
  useEffect(() => {
    console.log('ThemeContext: Applying theme', theme)
    
    const root = document.documentElement
    
    // 기존 테마 관련 클래스 모두 제거
    root.classList.remove('light', 'dark')
    
    // 새 테마 클래스 추가
    root.classList.add(theme)
    
    // 속성 설정
    root.setAttribute('data-theme', theme)
    root.style.colorScheme = theme
    
    // 배경색 즉시 적용 (FOUC 방지)
    root.style.backgroundColor = theme === 'dark' ? '#0f172a' : '#ffffff'

    try {
      localStorage.setItem('cnc-theme', theme)
      console.log('ThemeContext: Saved theme to localStorage', theme)
    } catch (error) {
      console.error('ThemeContext: Error saving theme to localStorage', error)
    }
  }, [theme])

  // [OCP] Rule: 새로운 테마 전환 로직이 추가되어도 기존 코드 수정 불필요
  const handleSetTheme = (newTheme: Theme) => {
    console.log('ThemeContext: Setting theme to', newTheme)
    setTheme(newTheme)
  }

  const toggleTheme = () => {
    const now = Date.now()
    
    // 300ms 내 중복 클릭 방지
    if (now - lastToggleTime.current < 300) {
      console.log('ThemeContext: Duplicate toggle prevented')
      return
    }
    
    lastToggleTime.current = now
    
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light'
      console.log('ThemeContext: Toggling theme from', prevTheme, 'to', newTheme)
      return newTheme
    })
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