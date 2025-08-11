'use client'

/**
 * [SRP] Rule: 토큰 관리만 담당하는 유틸리티 클래스
 * localStorage의 만료된 토큰 정리 및 관리 담당
 */
export class TokenManager {
  private static readonly SUPABASE_TOKEN_KEYS = [
    // 구버전/일반 키 패턴
    'supabase.auth.',
    'refresh_token',
    'access_token',
    // supabase-js v2 기본 localStorage 키 패턴: sb-<project-ref>-auth-token
    'sb-',
    '-auth-token'
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
      const supabaseKeys = keys.filter(key => {
        // 신형 키: sb-<project-ref>-auth-token
        const isNewStyleKey = key.startsWith('sb-') && key.endsWith('-auth-token')
        // 보편 키 포함 검사
        const matchesGeneralPatterns = this.SUPABASE_TOKEN_KEYS.some(tokenKey =>
          key.startsWith(tokenKey) || key.includes(tokenKey)
        )
        return isNewStyleKey || matchesGeneralPatterns
      })
      
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
   * 잘못된/손상된 Supabase 브라우저 세션 토큰 정리
   * - refresh_token 누락
   * - 만료 시간 경과
   */
  static sanitizeAuthTokens(): void {
    try {
      if (typeof window === 'undefined') return

      const keys = Object.keys(localStorage)
      const authTokenKeys = keys.filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'))

      let removed = 0
      for (const key of authTokenKeys) {
        const raw = localStorage.getItem(key)
        if (!raw) continue
        try {
          const parsed = JSON.parse(raw) as unknown
          const session = (parsed as { currentSession?: unknown })?.currentSession ?? parsed
          const sess = session as { refresh_token?: unknown; expires_at?: unknown }
          const refreshToken = typeof sess.refresh_token === 'string' ? sess.refresh_token : undefined
          const expiresAtSec: number | undefined = typeof sess.expires_at === 'number' ? sess.expires_at : undefined
          const nowSec = Math.floor(Date.now() / 1000)

          const isMissingRefresh = !refreshToken || typeof refreshToken !== 'string'
          const isExpired = typeof expiresAtSec === 'number' && expiresAtSec <= nowSec

          if (isMissingRefresh || isExpired) {
            localStorage.removeItem(key)
            removed++
            if (process.env.NODE_ENV !== 'production') {
              console.log('TokenManager: Sanitized invalid token:', key, {
                isMissingRefresh,
                isExpired,
              })
            }
          }
        } catch {
          // 파싱 실패 시 손상된 토큰으로 간주하고 삭제
          localStorage.removeItem(key)
          removed++
          if (process.env.NODE_ENV !== 'production') {
            console.log('TokenManager: Removed corrupted token:', key)
          }
        }
      }

      if (removed > 0 && process.env.NODE_ENV !== 'production') {
        console.log(`TokenManager: Sanitized ${removed} invalid/corrupted tokens`)
      }
    } catch (error) {
      console.error('TokenManager: Error sanitizing tokens:', error)
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
      const oldStyle = keys.some(key => key.startsWith('supabase.auth.') && key.includes('session'))
      const newStyle = keys.some(key => key.startsWith('sb-') && key.endsWith('-auth-token'))
      return oldStyle || newStyle
    } catch (error) {
      console.error('TokenManager: Error checking token validity:', error)
      return false
    }
  }
}