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

  private async testSupabaseConnection(): Promise<void> {
    try {
      console.log('Supabase 연결 테스트 시작...');
      const testPromise = fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
        }
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('연결 테스트 타임아웃')), 10000);
      });
      
      const response = await Promise.race([testPromise, timeoutPromise]) as Response;
      console.log('Supabase 연결 테스트 결과:', response.status, response.statusText);
      
      if (!response.ok && response.status !== 401) {
        throw new Error(`Supabase 서버 연결 실패: ${response.status} ${response.statusText}`);
      }
      
      console.log('Supabase 연결 성공');
    } catch (error) {
      console.error('Supabase 연결 테스트 실패:', error);
      throw new Error(`Supabase 서버에 연결할 수 없습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  async signIn(credentials: LoginCredentials): Promise<User> {
    console.log('=== Supabase 로그인 시작 ===');
    console.log('이메일:', credentials.email);
    console.log('비밀번호 길이:', credentials.password.length);
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    try {
      // 네트워크 연결 테스트 (임시로 비활성화 - 타임아웃 문제로 인해)
      console.log('연결 테스트 건너뛰고 직접 로그인 시도...');
      
      // 실제 Supabase 로그인 처리
      console.log('Supabase 인증 요청 전송 중...');
      
      // 타임아웃을 위한 Promise.race 사용
      const authPromise = supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('로그인 요청이 15초 내에 완료되지 않았습니다. 네트워크 연결이나 Supabase 서비스 상태를 확인해주세요.')), 15000);
      });
      
      const { data, error } = await Promise.race([authPromise, timeoutPromise]) as any;

      console.log('Supabase 응답 수신:', { 
        hasData: !!data, 
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        hasError: !!error 
      });

      if (error) {
        console.error('=== Supabase 로그인 오류 상세 ===');
        console.error('오류 코드:', error.status);
        console.error('오류 메시지:', error.message);
        console.error('전체 오류:', error);
        throw new Error(error.message);
      }

      if (!data.user) {
        console.error('사용자 데이터 없음');
        throw new Error('로그인에 실패했습니다.');
      }

      console.log('=== Supabase 인증 성공 ===');
      console.log('사용자 ID:', data.user.id);
      console.log('사용자 이메일:', data.user.email);
      console.log('이메일 인증 상태:', data.user.email_confirmed_at);
      console.log('세션 정보:', !!data.session);

      // Get user profile from our users table
      console.log('사용자 프로필 조회 시작...');
      
      try {
        const userProfile = await this.userRepository.getUserProfile(data.user.id);
        
        if (!userProfile) {
          console.log('=== 사용자 프로필 없음, 자동 생성 시도 ===');
          console.log('찾는 사용자 ID:', data.user.id);
          
          // users 테이블에 사용자가 없는 경우, 자동으로 생성
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Unknown User',
              role: 'engineer', // 기본 역할
              plant_id: '550e8400-e29b-41d4-a716-446655440001', // 기본 공장 ID
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (insertError) {
            console.error('사용자 프로필 생성 실패:', insertError);
            throw new Error(`사용자 프로필을 생성할 수 없습니다: ${insertError.message}`);
          }

          console.log('사용자 프로필 자동 생성 성공:', newUser);
          return newUser;
        }

        console.log('=== 사용자 프로필 로드 성공 ===');
        console.log('프로필:', userProfile);
        return userProfile;
        
      } catch (profileError) {
        console.error('사용자 프로필 처리 중 오류:', profileError);
        throw new Error(`사용자 프로필 처리 실패: ${profileError instanceof Error ? profileError.message : '알 수 없는 오류'}`);
      }
      
    } catch (error) {
      console.error('=== signIn 메서드 전체 오류 ===');
      console.error('오류 타입:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('오류 메시지:', error instanceof Error ? error.message : error);
      console.error('전체 오류 객체:', error);
      
      // 네트워크 오류인지 확인
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.');
      }
      
      // 타임아웃 오류의 경우 더 자세한 안내
      if (error instanceof Error && error.message.includes('15초 내에 완료되지 않았습니다')) {
        throw new Error('Supabase 서버 연결이 지연되고 있습니다. 잠시 후 다시 시도하거나 네트워크 상태를 확인해주세요.');
      }
      
      throw error;
    }
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
  // 환경 변수로 데모 모드 제어
  if (process.env.NEXT_PUBLIC_USE_DEMO_AUTH === 'true') {
    console.log('데모 인증 모드 활성화');
    const { DemoAuthService } = require('./demo-auth-service');
    return new DemoAuthService();
  }
  
  const sessionManager = new SupabaseSessionManager();
  const userRepository = new SupabaseUserRepository();
  return new SupabaseAuthService(sessionManager, userRepository);
}