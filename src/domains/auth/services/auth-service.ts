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
    console.log('로그인 시도:', credentials.email);
    
    // 개발 환경에서는 모든 로그인 시도를 성공으로 처리
    if (process.env.NODE_ENV === 'development') {
      console.log('개발 환경 모의 로그인 처리');
      
      // 테스트 사용자 데이터 생성
      const testUser: User = {
        id: 'dev-user-' + Date.now(),
        email: credentials.email,
        name: credentials.email.split('@')[0] || '테스트 사용자',
        role: 'engineer',
        plant_id: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      try {
        // 로컬 스토리지에 모의 세션 저장
        const sessionData = {
          currentSession: {
            access_token: 'dev-token-' + Date.now(),
            refresh_token: 'dev-refresh-token-' + Date.now(),
            user: {
              id: testUser.id,
              email: testUser.email,
              role: 'engineer'
            }
          }
        };
        
        localStorage.setItem('supabase.auth.token', JSON.stringify(sessionData));
        
        // 세션 스토리지에도 사용자 정보 저장 (백업)
        sessionStorage.setItem('dev_user', JSON.stringify(testUser));
        
        console.log('개발 환경 모의 로그인 성공:', testUser);
      } catch (e) {
        console.error('로컬 스토리지 저장 실패:', e);
      }
      
      return testUser;
    }
    
    // 실제 로그인 처리 (프로덕션 환경)
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

    // Get user profile from our users table
    const userProfile = await this.userRepository.getUserProfile(data.user.id);
    
    if (!userProfile) {
      throw new Error('사용자 프로필을 찾을 수 없습니다.');
    }

    return userProfile;
  }

  async signOut(): Promise<void> {
    // 개발 환경에서는 로컬 스토리지에서 모의 세션 제거
    if (process.env.NODE_ENV === 'development') {
      localStorage.removeItem('supabase.auth.token');
      return;
    }
    
    // 프로덕션 환경에서는 실제 세션 제거
    await this.sessionManager.clearSession();
  }

  async getCurrentUser(): Promise<User | null> {
    // 개발 환경에서는 세션 스토리지에서 모의 사용자 확인
    if (process.env.NODE_ENV === 'development') {
      try {
        // 세션 스토리지에서 먼저 확인 (더 안정적)
        const storedUser = sessionStorage.getItem('dev_user');
        if (storedUser) {
          return JSON.parse(storedUser);
        }
        
        // 로컬 스토리지에서 확인
        const storedSession = localStorage.getItem('supabase.auth.token');
        if (storedSession) {
          const sessionData = JSON.parse(storedSession);
          if (sessionData.currentSession?.user) {
            const user = sessionData.currentSession.user;
            const devUser = {
              id: user.id,
              email: user.email,
              name: user.email.split('@')[0] || '테스트 사용자',
              role: 'engineer',
              plant_id: '1',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            // 세션 스토리지에 저장 (백업)
            sessionStorage.setItem('dev_user', JSON.stringify(devUser));
            
            return devUser;
          }
        }
        
        return null;
      } catch (e) {
        console.error('모의 세션 확인 중 오류:', e);
        return null;
      }
    }
    
    // 프로덕션 환경에서는 실제 세션 확인
    const session = await this.sessionManager.getSession();
    
    if (!session?.user) {
      return null;
    }

    return await this.userRepository.getUserProfile(session.user.id);
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