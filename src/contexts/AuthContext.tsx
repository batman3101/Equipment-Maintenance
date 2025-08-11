'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { AuthService } from '@/lib/auth-service'
import { ProfileService } from '@/lib/profile-service'
import { TokenManager } from '@/lib/token-manager'

export interface Profile {
  id: string
  email: string
  role: 'system_admin' | 'manager' | 'user'
  full_name: string | null
  phone: string | null
  department: string | null
  is_active: boolean
  created_at: string
  updated_at: string
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

/**
 * [SRP] Rule: AuthProvider는 상태 관리와 컨텍스트 제공만 담당
 * 실제 비즈니스 로직은 별도 서비스들에서 처리
 */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  
  // 개발 모드에서 빠른 시작을 위한 설정
  // const isDevelopment = process.env.NODE_ENV === 'development'
  const isOfflineMode = process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true'

  // [DIP] Rule: TokenManager 서비스에 의존하여 토큰 관리

  // [DIP] Rule: ProfileService에 의존하여 프로필 데이터 관리
  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      return
    }

    const profile = await ProfileService.getProfile(user.id)
    setProfile(profile)
  }, [user])

  useEffect(() => {
    // 브라우저 진입 시 손상/만료 토큰을 사전 정리하여 리프레시 실패를 예방
    TokenManager.sanitizeAuthTokens()
    // 오프라인 모드에서는 빠른 로딩
    if (isOfflineMode) {
      console.log('AuthContext: Running in offline mode, skipping Supabase auth')
      setLoading(false)
      return
    }

    // [DIP] Rule: AuthService에 의존하여 세션 확인
    const checkInitialSession = async () => {
      try {
        const { user, error } = await AuthService.getSession(1000)
        
        if (error) {
          // refresh token 에러는 일반적이므로 경고 레벨로 처리
          if (error.message.includes('refresh token') || error.message.includes('Invalid Refresh Token')) {
            console.warn('AuthContext: Refresh token expired, user needs to login again')
            TokenManager.clearExpiredTokens() // 만료된 토큰 정리
          } else if (error.message !== 'Session check timeout') {
            console.error('AuthContext: Error getting session:', error)
          }
          return
        }

        if (user) {
          setUser(user)
        }
      } catch (error) {
        console.error('AuthContext: Error checking initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    checkInitialSession()

    // [DIP] Rule: AuthService에 의존하여 인증 상태 변경 리스너 설정
    if (!isOfflineMode) {
      const { data: { subscription } } = AuthService.onAuthStateChange(
        async (event, session) => {
          if (process.env.NODE_ENV !== 'production') {
            console.log('AuthContext: Auth state changed:', event, session?.user?.email)
          }
          
          if (session?.user) {
            setUser(session.user)
          } else {
            setUser(null)
            setProfile(null)
          }
          
          setLoading(false)
        }
      )

      return () => subscription.unsubscribe()
    }
    
    // 오프라인 모드일 때는 클린업 함수가 필요하지 않음
    return
  }, [isOfflineMode])

  useEffect(() => {
    refreshProfile()
  }, [user, refreshProfile])

  // [DIP] Rule: AuthService에 의존하여 인증 관련 작업 수행
  const signIn = async (email: string, password: string) => {
    try {
      await AuthService.signIn(email, password)
      // 사용자는 onAuthStateChange에서 자동으로 설정됨
    } catch (error) {
      console.error('AuthContext: Error signing in:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await AuthService.signOut()
      // 사용자 상태는 onAuthStateChange에서 자동으로 null로 설정됨
      TokenManager.clearAllAuthTokens()
    } catch (error) {
      console.error('AuthContext: Error signing out:', error)
      // 로그아웃 에러가 발생해도 로컬 상태는 정리
      setUser(null)
      setProfile(null)
      TokenManager.clearAllAuthTokens()
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