'use client'

import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

/**
 * [SRP] Rule: 인증 관련 비즈니스 로직만 담당하는 서비스
 * AuthContext에서 인증 로직을 분리하여 단일 책임 원칙 준수
 */
export class AuthService {
  /**
   * 이메일과 비밀번호로 로그인
   */
  static async signIn(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }
  }

  /**
   * 로그아웃
   */
  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw error
    }
  }

  /**
   * 현재 세션 가져오기 (타임아웃 포함)
   */
  static async getSession(timeoutMs: number = 1000): Promise<{ user: User | null; error: Error | null }> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Session check timeout')), timeoutMs)
      )
      
      const sessionPromise = supabase.auth.getSession()
      
      const result = await Promise.race([
        sessionPromise,
        timeoutPromise
      ])
      
      if (!result || typeof result !== 'object' || !('data' in result)) {
        throw new Error('Invalid session response')
      }
      
      const { data: { session }, error } = result as Awaited<typeof sessionPromise>
      
      if (error) {
        return { user: null, error }
      }

      return { user: session?.user || null, error: null }
    } catch (error) {
      return { user: null, error: error as Error }
    }
  }

  /**
   * 인증 상태 변경 리스너 등록
   */
  static onAuthStateChange(callback: (event: string, session: { user: User | null } | null) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}