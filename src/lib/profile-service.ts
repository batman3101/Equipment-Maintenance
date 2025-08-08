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
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('ProfileService: Error fetching profile:', error)
        return null
      }

      return profile
    } catch (error) {
      console.error('ProfileService: Error in getProfile:', error)
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