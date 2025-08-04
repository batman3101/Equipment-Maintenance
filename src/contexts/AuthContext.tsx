'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  
  // 개발 모드에서 빠른 시작을 위한 설정
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isOfflineMode = process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true'

  // 만료된 토큰 정리 유틸리티 함수
  const clearExpiredTokens = () => {
    try {
      // Supabase 관련 localStorage 항목들 정리
      const keys = Object.keys(localStorage)
      const supabaseKeys = keys.filter(key => 
        key.startsWith('supabase.auth.') || 
        key.includes('refresh_token') ||
        key.includes('access_token')
      )
      
      supabaseKeys.forEach(key => {
        localStorage.removeItem(key)
        console.log('AuthContext: Cleared expired token:', key)
      })
    } catch (error) {
      console.error('AuthContext: Error clearing expired tokens:', error)
    }
  }

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      return
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      setProfile(profile)
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }, [user])

  useEffect(() => {
    // 오프라인 모드에서는 빠른 로딩
    if (isOfflineMode) {
      console.log('AuthContext: Running in offline mode, skipping Supabase auth')
      setLoading(false)
      return
    }

    // 초기 세션 확인 - 타임아웃을 짧게 설정
    const checkInitialSession = async () => {
      try {
        // 빠른 타임아웃으로 설정 (1초)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), 1000)
        )
        
        const sessionPromise = supabase.auth.getSession()
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any
        
        if (error) {
          // refresh token 에러는 일반적이므로 경고 레벨로 처리
          if (error.message.includes('refresh token') || error.message.includes('Invalid Refresh Token')) {
            console.warn('AuthContext: Refresh token expired, user needs to login again')
            clearExpiredTokens() // 만료된 토큰 정리
          } else {
            console.error('AuthContext: Error getting session:', error)
          }
          return
        }

        if (session?.user) {
          setUser(session.user)
        }
      } catch (error) {
        if (error.message === 'Session check timeout') {
          console.warn('AuthContext: Session check timed out, proceeding with no user')
        } else {
          console.error('AuthContext: Error checking initial session:', error)
        }
      } finally {
        setLoading(false)
      }
    }

    checkInitialSession()

    // 오프라인 모드가 아닐 때만 인증 상태 변경 리스너 설정
    if (!isOfflineMode) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('AuthContext: Auth state changed:', event, session?.user?.email)
          
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
  }, [isOfflineMode])

  useEffect(() => {
    refreshProfile()
  }, [user, refreshProfile])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      // 사용자는 onAuthStateChange에서 자동으로 설정됨
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      // 사용자 상태는 onAuthStateChange에서 자동으로 null로 설정됨
    } catch (error) {
      console.error('AuthContext: Error signing out:', error)
      // 로그아웃 에러가 발생해도 로컬 상태는 정리
      setUser(null)
      setProfile(null)
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