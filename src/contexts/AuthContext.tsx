'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

export interface Profile {
  id: string
  email: string
  role: 'admin' | 'manager' | 'user'
  full_name: string | null
  phone: string | null
  department: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface User {
  id: string
  email: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 개발용 하드코딩된 사용자 데이터
const DEV_USERS = {
  'admin': {
    password: '1234',
    user: {
      id: 'dev-admin-001',
      email: 'admin'
    },
    profile: {
      id: 'dev-admin-001',
      email: 'admin',
      role: 'admin' as const,
      full_name: '시스템 관리자',
      phone: '010-1234-5678',
      department: 'IT팀',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      return
    }

    // 개발 모드에서는 로컬 스토리지에서 프로필 정보를 가져옴
    const storedProfile = localStorage.getItem('dev_profile')
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile))
    }
  }, [user])

  useEffect(() => {
    // 페이지 로드 시 로컬 스토리지에서 로그인 상태 확인
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('dev_user')
        const storedProfile = localStorage.getItem('dev_profile')
        
        if (storedUser && storedProfile) {
          setUser(JSON.parse(storedUser))
          setProfile(JSON.parse(storedProfile))
        }
      } catch (error) {
        console.error('Error checking auth state:', error)
        localStorage.removeItem('dev_user')
        localStorage.removeItem('dev_profile')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    refreshProfile()
  }, [user, refreshProfile])

  const signIn = async (email: string, password: string) => {
    try {
      const userData = DEV_USERS[email as keyof typeof DEV_USERS]
      
      if (!userData || userData.password !== password) {
        throw new Error('잘못된 이메일 또는 비밀번호입니다.')
      }

      // 로컬 스토리지에 사용자 정보 저장
      localStorage.setItem('dev_user', JSON.stringify(userData.user))
      localStorage.setItem('dev_profile', JSON.stringify(userData.profile))
      
      setUser(userData.user)
      setProfile(userData.profile)
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      // 로컬 스토리지에서 사용자 정보 제거
      localStorage.removeItem('dev_user')
      localStorage.removeItem('dev_profile')
      
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}