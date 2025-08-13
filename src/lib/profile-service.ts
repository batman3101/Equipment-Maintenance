'use client'

import { supabase } from './supabase'
import type { Profile } from '@/contexts/AuthContext'

/**
 * [SRP] Rule: 프로필 관련 데이터 관리만 담당하는 서비스
 * 사용자 프로필 CRUD 작업의 단일 책임 담당
 */
export class ProfileService {
  /**
   * 사용자 ID로 프로필 조회
   */
  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      console.log('ProfileService: Fetching profile for user:', userId)
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('ProfileService: Supabase error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          userId
        })
        
        // 특정 에러 코드에 따른 처리
        if (error.code === 'PGRST116') {
          console.warn('ProfileService: No profile found for user:', userId)
          return null
        }
        
        // 500 에러나 RLS 정책 관련 에러 로깅
        if (error.message?.includes('500') || error.message?.includes('policy')) {
          console.error('ProfileService: RLS policy or server error detected')
        }
        
        return null
      }

      console.log('ProfileService: Profile fetched successfully for:', userId)
      return profile
    } catch (error) {
      console.error('ProfileService: Unexpected error in getProfile:', {
        error,
        userId,
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })
      return null
    }
  }

  /**
   * 프로필 업데이트
   */
  static async updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)

      if (error) {
        console.error('ProfileService: Error updating profile:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('ProfileService: Error in updateProfile:', error)
      return false
    }
  }

  /**
   * 프로필 존재 여부 확인
   */
  static async profileExists(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

      if (error || !data) {
        return false
      }

      return true
    } catch {
      return false
    }
  }
}