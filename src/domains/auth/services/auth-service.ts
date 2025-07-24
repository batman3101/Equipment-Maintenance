import { supabase } from '@/lib/supabase';
import type { AuthService, LoginCredentials, User, SessionManager, UserRepository } from '../types';

// Concrete implementation of SessionManager (SRP)
export class SupabaseSessionManager implements SessionManager {
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data.session;
  }

  async clearSession() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
}

// Concrete implementation of UserRepository (SRP)
export class SupabaseUserRepository implements UserRepository {
  async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }

    return data;
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// Main AuthService implementation (DIP - depends on abstractions)
export class SupabaseAuthService implements AuthService {
  constructor(
    private sessionManager: SessionManager,
    private userRepository: UserRepository
  ) {}

  async signIn(credentials: LoginCredentials): Promise<User> {
    console.log('Supabase 로그인 시도:', credentials.email);
    
    // 실제 Supabase 로그인 처리
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      console.error('Supabase 로그인 오류:', error);
      throw new Error(error.message);
    }

    if (!data.user) {
      console.error('사용자 데이터 없음');
      throw new Error('로그인에 실패했습니다.');
    }

    console.log('Supabase 인증 성공:', data.user.email);

    // Get user profile from our users table
    const userProfile = await this.userRepository.getUserProfile(data.user.id);
    
    if (!userProfile) {
      console.error('사용자 프로필을 찾을 수 없습니다. ID:', data.user.id);
      throw new Error('사용자 프로필을 찾을 수 없습니다.');
    }

    console.log('사용자 프로필 로드 성공:', userProfile);
    return userProfile;
  }

  async signOut(): Promise<void> {
    // 실제 Supabase 세션 제거
    await this.sessionManager.clearSession();
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // 실제 Supabase 세션 확인
      const session = await this.sessionManager.getSession();
      
      if (!session?.user) {
        console.log('세션이 없습니다.');
        return null;
      }

      console.log('세션 확인됨:', session.user.email);
      
      // 사용자 프로필 조회
      const userProfile = await this.userRepository.getUserProfile(session.user.id);
      
      if (!userProfile) {
        console.error('사용자 프로필을 찾을 수 없습니다. ID:', session.user.id);
        return null;
      }

      console.log('현재 사용자:', userProfile);
      return userProfile;
    } catch (error) {
      console.error('현재 사용자 조회 실패:', error);
      return null;
    }
  }

  async refreshSession(): Promise<User | null> {
    try {
      const session = await this.sessionManager.refreshSession();
      
      if (!session?.user) {
        return null;
      }

      return await this.userRepository.getUserProfile(session.user.id);
    } catch (error) {
      console.error('Session refresh failed:', error);
      return null;
    }
  }
}

// Factory function for dependency injection (DIP)
export function createAuthService(): AuthService {
  const sessionManager = new SupabaseSessionManager();
  const userRepository = new SupabaseUserRepository();
  return new SupabaseAuthService(sessionManager, userRepository);
}