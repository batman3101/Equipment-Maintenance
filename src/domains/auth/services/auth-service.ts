import { supabase } from '@/lib/supabase';
import { authCache } from '@/lib/auth-cache';
import type { AuthService, LoginCredentials, User, SessionManager, UserRepository, UserPermissions } from '../types';

// Concrete implementation of SessionManager (SRP)
export class SupabaseSessionManager implements SessionManager {
  async getSession() {
    const cacheKey = 'current-session';
    
    // 캐시에서 먼저 확인
    const cached = authCache.get(cacheKey);
    if (cached) {
      console.log('세션 캐시 히트');
      return cached;
    }

    console.log('세션 캐시 미스 - Supabase에서 조회');
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    // 세션이 있으면 1분간 캐시
    if (data.session) {
      authCache.set(cacheKey, data.session, 60 * 1000);
    }
    
    return data.session;
  }

  async refreshSession() {
    // 기존 세션 캐시 무효화
    authCache.delete('current-session');
    
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    
    // 새 세션 캐시
    if (data.session) {
      authCache.set('current-session', data.session, 60 * 1000);
    }
    
    return data.session;
  }

  async clearSession() {
    // 모든 auth 관련 캐시 정리
    authCache.deleteByPattern('current-session|user-profile-.*');
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
}

// Concrete implementation of UserRepository (SRP)
export class SupabaseUserRepository implements UserRepository {
  async getUserProfile(userId: string): Promise<User | null> {
    const cacheKey = `user-profile-${userId}`;
    
    // 캐시에서 먼저 확인
    const cached = authCache.get<User>(cacheKey);
    if (cached) {
      console.log('사용자 프로필 캐시 히트:', userId);
      return cached;
    }

    console.log('사용자 프로필 캐시 미스 - DB에서 조회:', userId);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }

    // 프로필을 3분간 캐시
    if (data) {
      authCache.set(cacheKey, data, 3 * 60 * 1000);
    }

    return data;
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    // 기존 캐시 무효화
    authCache.delete(`user-profile-${userId}`);
    
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    
    // 업데이트된 프로필 캐시
    authCache.set(`user-profile-${userId}`, data, 3 * 60 * 1000);
    
    return data;
  }

  async getUserPermissions(userId: string): Promise<UserPermissions> {
    const cacheKey = `user-permissions-${userId}`;
    
    // 캐시에서 먼저 확인
    const cached = authCache.get<UserPermissions>(cacheKey);
    if (cached) {
      console.log('권한 캐시 히트:', userId);
      return cached;
    }

    // 실제 구현에서는 role_permissions 조인으로 권한 조회
    // 현재는 기본 구현으로 대체
    const userProfile = await this.getUserProfile(userId);
    const permissions: UserPermissions = {};

    // 역할에 따른 기본 권한 설정
    if (userProfile?.role === 'admin') {
      permissions['equipment:read'] = true;
      permissions['equipment:write'] = true;
      permissions['equipment:delete'] = true;
      permissions['equipment:manage'] = true;
      permissions['breakdown:read'] = true;
      permissions['breakdown:write'] = true;
      permissions['breakdown:delete'] = true;
      permissions['breakdown:assign'] = true;
      permissions['breakdown:approve'] = true;
      permissions['repair:read'] = true;
      permissions['repair:write'] = true;
      permissions['repair:complete'] = true;
      permissions['user:read'] = true;
      permissions['user:write'] = true;
      permissions['user:delete'] = true;
      permissions['user:approve'] = true;
      permissions['user:assign_role'] = true;
      permissions['permission:read'] = true;
      permissions['permission:write'] = true;
      permissions['permission:assign'] = true;
      permissions['system:admin'] = true;
      permissions['system:settings'] = true;
      permissions['system:logs'] = true;
    } else if (userProfile?.role === 'manager') {
      permissions['equipment:read'] = true;
      permissions['equipment:write'] = true;
      permissions['equipment:delete'] = true;
      permissions['equipment:manage'] = true;
      permissions['breakdown:read'] = true;
      permissions['breakdown:write'] = true;
      permissions['breakdown:delete'] = true;
      permissions['breakdown:assign'] = true;
      permissions['breakdown:approve'] = true;
      permissions['repair:read'] = true;
      permissions['repair:write'] = true;
      permissions['repair:complete'] = true;
      permissions['user:read'] = true;
      permissions['user:write'] = true;
      permissions['user:approve'] = true;
      permissions['user:assign_role'] = true;
    } else if (userProfile?.role === 'engineer') {
      permissions['equipment:read'] = true;
      permissions['equipment:write'] = true;
      permissions['breakdown:read'] = true;
      permissions['breakdown:write'] = true;
      permissions['breakdown:assign'] = true;
      permissions['repair:read'] = true;
      permissions['repair:write'] = true;
      permissions['repair:complete'] = true;
    } else if (userProfile?.role === 'operator') {
      permissions['equipment:read'] = true;
      permissions['breakdown:read'] = true;
      permissions['breakdown:write'] = true;
      permissions['repair:read'] = true;
    } else {
      permissions['equipment:read'] = true;
      permissions['breakdown:read'] = true;
      permissions['repair:read'] = true;
    }

    // 2분간 캐시
    authCache.set(cacheKey, permissions, 2 * 60 * 1000);

    return permissions;
  }

  async getUserRoles(userId: string): Promise<import('../types').Role[]> {
    // 기본 구현 - 실제로는 user_role_assignments와 roles 테이블 조인
    const userProfile = await this.getUserProfile(userId);
    
    if (!userProfile) {
      return [];
    }

    // 임시로 기본 역할 반환
    return [{
      id: `role-${userProfile.role}`,
      name: userProfile.role,
      display_name: userProfile.role === 'admin' ? '관리자' :
                   userProfile.role === 'manager' ? '매니저' :
                   userProfile.role === 'engineer' ? '엔지니어' :
                   userProfile.role === 'operator' ? '운영자' : '사용자',
      description: `${userProfile.role} 역할`,
      is_system_role: true,
      plant_id: userProfile.plant_id,
      created_at: userProfile.created_at,
      updated_at: userProfile.updated_at
    }];
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

  /**
   * 백그라운드에서 사용자 프로필 동기화
   * 로그인 속도에 영향을 주지 않도록 비동기 처리
   */
  private async syncUserProfileInBackground(userId: string, basicUser: User): Promise<void> {
    try {
      console.log('백그라운드 프로필 동기화 시작:', userId);
      
      // 캐시된 프로필이 있으면 동기화 스킵
      if (authCache.has(`user-profile-${userId}`)) {
        console.log('캐시된 프로필 존재, 동기화 스킵');
        return;
      }

      const userProfile = await this.userRepository.getUserProfile(userId);
      
      if (!userProfile) {
        console.log('프로필 없음, 백그라운드에서 생성');
        // 프로필이 없으면 생성 (백그라운드에서)
        try {
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
              id: userId,
              email: basicUser.email,
              name: basicUser.name,
              role: basicUser.role,
              plant_id: basicUser.plant_id,
              created_at: basicUser.created_at,
              updated_at: basicUser.updated_at
            })
            .select()
            .single();

          if (!insertError && newUser) {
            console.log('백그라운드 프로필 생성 성공');
            // 생성된 프로필을 캐시에 저장
            authCache.set(`user-profile-${userId}`, newUser, 3 * 60 * 1000);
          }
        } catch (createError) {
          console.error('백그라운드 프로필 생성 실패:', createError);
          // 실패해도 로그인에는 영향 없음
        }
      } else {
        console.log('백그라운드 프로필 동기화 완료');
      }
    } catch (error) {
      console.error('백그라운드 동기화 실패:', error);
      // 백그라운드 작업 실패는 로그인에 영향 없음
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

      // 인증 성공 시 기본 사용자 객체 반환 (DB 조회 없이)
      const basicUser: User = {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
        role: 'engineer', // 기본 역할
        plant_id: '550e8400-e29b-41d4-a716-446655440001', // 기본 공장 ID
        created_at: data.user.created_at,
        updated_at: new Date().toISOString()
      };

      console.log('=== 기본 사용자 객체로 빠른 로그인 ===');
      console.log('기본 사용자:', basicUser);
      
      // 백그라운드에서 프로필 동기화 (비동기, 블로킹하지 않음)
      this.syncUserProfileInBackground(data.user.id, basicUser);
      
      return basicUser;
      
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
      
      // 캐시된 프로필 먼저 확인
      const cachedProfile = authCache.get<User>(`user-profile-${session.user.id}`);
      if (cachedProfile) {
        console.log('캐시된 프로필 사용');
        return cachedProfile;
      }

      // 캐시에 없으면 DB에서 조회
      const userProfile = await this.userRepository.getUserProfile(session.user.id);
      
      if (!userProfile) {
        // 프로필이 없으면 기본 사용자 객체 반환
        console.log('프로필 없음, 기본 객체 반환');
        const basicUser: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          role: 'engineer',
          plant_id: '550e8400-e29b-41d4-a716-446655440001',
          created_at: session.user.created_at,
          updated_at: new Date().toISOString()
        };
        
        // 백그라운드에서 프로필 생성
        this.syncUserProfileInBackground(session.user.id, basicUser);
        
        return basicUser;
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

  async checkPermission(permission: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions();
      return permissions[permission] === true;
    } catch (error) {
      console.error('checkPermission error:', error);
      return false;
    }
  }

  async getUserPermissions(): Promise<UserPermissions> {
    try {
      const session = await this.sessionManager.getSession();
      if (!session?.user) {
        return {};
      }

      // 캐시된 권한 확인
      const cacheKey = `user-permissions-${session.user.id}`;
      const cached = authCache.get<UserPermissions>(cacheKey);
      if (cached) {
        console.log('권한 캐시 히트:', session.user.id);
        return cached;
      }

      // 사용자 프로필 조회로 기본 권한 설정
      const userProfile = await this.userRepository.getUserProfile(session.user.id);
      const permissions: UserPermissions = {};

      // 기본 권한을 역할에 따라 설정 (임시로 하드코딩)
      if (userProfile?.role === 'admin') {
        // 관리자는 모든 권한
        permissions['equipment:read'] = true;
        permissions['equipment:write'] = true;
        permissions['equipment:delete'] = true;
        permissions['equipment:manage'] = true;
        permissions['breakdown:read'] = true;
        permissions['breakdown:write'] = true;
        permissions['breakdown:delete'] = true;
        permissions['breakdown:assign'] = true;
        permissions['breakdown:approve'] = true;
        permissions['repair:read'] = true;
        permissions['repair:write'] = true;
        permissions['repair:complete'] = true;
        permissions['user:read'] = true;
        permissions['user:write'] = true;
        permissions['user:delete'] = true;
        permissions['user:approve'] = true;
        permissions['user:assign_role'] = true;
        permissions['permission:read'] = true;
        permissions['permission:write'] = true;
        permissions['permission:assign'] = true;
        permissions['system:admin'] = true;
        permissions['system:settings'] = true;
        permissions['system:logs'] = true;
      } else if (userProfile?.role === 'manager') {
        // 매니저는 시스템 관리 제외한 권한
        permissions['equipment:read'] = true;
        permissions['equipment:write'] = true;
        permissions['equipment:delete'] = true;
        permissions['equipment:manage'] = true;
        permissions['breakdown:read'] = true;
        permissions['breakdown:write'] = true;
        permissions['breakdown:delete'] = true;
        permissions['breakdown:assign'] = true;
        permissions['breakdown:approve'] = true;
        permissions['repair:read'] = true;
        permissions['repair:write'] = true;
        permissions['repair:complete'] = true;
        permissions['user:read'] = true;
        permissions['user:write'] = true;
        permissions['user:approve'] = true;
        permissions['user:assign_role'] = true;
      } else if (userProfile?.role === 'engineer') {
        // 엔지니어는 설비, 고장, 수리 관리
        permissions['equipment:read'] = true;
        permissions['equipment:write'] = true;
        permissions['breakdown:read'] = true;
        permissions['breakdown:write'] = true;
        permissions['breakdown:assign'] = true;
        permissions['repair:read'] = true;
        permissions['repair:write'] = true;
        permissions['repair:complete'] = true;
      } else if (userProfile?.role === 'operator') {
        // 운영자는 조회 및 기본 등록
        permissions['equipment:read'] = true;
        permissions['breakdown:read'] = true;
        permissions['breakdown:write'] = true;
        permissions['repair:read'] = true;
      } else {
        // 기본 사용자는 조회만
        permissions['equipment:read'] = true;
        permissions['breakdown:read'] = true;
        permissions['repair:read'] = true;
      }

      // 2분간 캐시
      authCache.set(cacheKey, permissions, 2 * 60 * 1000);

      console.log('사용자 권한 설정:', permissions);
      return permissions;
    } catch (error) {
      console.error('getUserPermissions error:', error);
      return {};
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