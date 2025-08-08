'use client'

/**
 * [SRP] Rule: 토큰 관리만 담당하는 유틸리티 클래스
 * localStorage의 만료된 토큰 정리 및 관리 담당
 */
export class TokenManager {
  private static readonly SUPABASE_TOKEN_KEYS = [
    'supabase.auth.',
    'refresh_token',
    'access_token'
  ]

  /**
   * 만료된 Supabase 토큰들을 localStorage에서 정리
   */
  static clearExpiredTokens(): void {
    try {
      if (typeof window === 'undefined') {
        return // SSR 환경에서는 실행하지 않음
      }

      const keys = Object.keys(localStorage)
      const supabaseKeys = keys.filter(key => 
        this.SUPABASE_TOKEN_KEYS.some(tokenKey => 
          key.startsWith(tokenKey) || key.includes(tokenKey)
        )
      )
      
      supabaseKeys.forEach(key => {
        localStorage.removeItem(key)
        if (process.env.NODE_ENV !== 'production') {
          console.log('TokenManager: Cleared expired token:', key)
        }
      })

      if (supabaseKeys.length > 0 && process.env.NODE_ENV !== 'production') {
        console.log(`TokenManager: Cleared ${supabaseKeys.length} expired tokens`)
      }
    } catch (error) {
      console.error('TokenManager: Error clearing expired tokens:', error)
    }
  }

  /**
   * 모든 인증 관련 토큰 정리 (로그아웃 시 사용)
   */
  static clearAllAuthTokens(): void {
    try {
      if (typeof window === 'undefined') {
        return
      }

      // Supabase 토큰들 정리
      this.clearExpiredTokens()

      // 추가적인 인증 관련 정리가 필요한 경우 여기에 추가
      // 예: sessionStorage 정리, 쿠키 정리 등

    } catch (error) {
      console.error('TokenManager: Error clearing all auth tokens:', error)
    }
  }

  /**
   * 토큰 상태 검사
   */
  static hasValidTokens(): boolean {
    try {
      if (typeof window === 'undefined') {
        return false
      }

      const keys = Object.keys(localStorage)
      const supabaseAuthKeys = keys.filter(key => 
        key.startsWith('supabase.auth.') && key.includes('session')
      )

      return supabaseAuthKeys.length > 0
    } catch (error) {
      console.error('TokenManager: Error checking token validity:', error)
      return false
    }
  }
}