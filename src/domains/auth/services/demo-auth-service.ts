import type { AuthService, LoginCredentials, User, UserPermissions } from '../types';

/**
 * 데모용 인증 서비스
 * Supabase 연결에 문제가 있을 때 사용하는 임시 대체 서비스
 */
export class DemoAuthService implements AuthService {
  private static readonly DEMO_USER: User = {
    id: 'demo-user-001',
    email: 'zetooo1972@gmail.com',
    name: '데모 사용자',
    role: 'engineer',
    plant_id: '550e8400-e29b-41d4-a716-446655440001',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  private static readonly VALID_CREDENTIALS = {
    email: 'zetooo1972@gmail.com',
    password: 'demo123'
  };

  async signIn(credentials: LoginCredentials): Promise<User> {
    console.log('=== 데모 인증 서비스 사용 ===');
    console.log('이메일:', credentials.email);
    
    // 간단한 인증 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (credentials.email === DemoAuthService.VALID_CREDENTIALS.email) {
      console.log('데모 로그인 성공');
      
      // 브라우저 쿠키에 데모 인증 토큰 설정
      document.cookie = 'demo-auth-token=valid; path=/; max-age=86400'; // 24시간
      
      return DemoAuthService.DEMO_USER;
    }
    
    throw new Error('데모 모드에서는 zetooo1972@gmail.com만 사용 가능합니다');
  }

  async signOut(): Promise<void> {
    console.log('데모 로그아웃');
    document.cookie = 'demo-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    // 캐시된 권한도 초기화
    DemoAuthService.permissions = null;
  }

  async getCurrentUser(): Promise<User | null> {
    // 쿠키에서 인증 토큰 확인
    const hasToken = document.cookie.includes('demo-auth-token=valid');
    
    if (hasToken) {
      console.log('데모 사용자 세션 유효');
      return DemoAuthService.DEMO_USER;
    }
    
    console.log('데모 사용자 세션 없음');
    return null;
  }

  async refreshSession(): Promise<User | null> {
    return this.getCurrentUser();
  }

  async checkPermission(permission: string): Promise<boolean> {
    console.log('데모 권한 확인:', permission);
    
    // 데모 모드에서는 엔지니어 권한으로 기본 권한 부여
    const permissions = await this.getUserPermissions();
    return permissions[permission] === true;
  }

  private static permissions: UserPermissions | null = null;

  async getUserPermissions(): Promise<UserPermissions> {
    // 캐시된 권한이 있으면 바로 반환 (무한 루프 방지)
    if (DemoAuthService.permissions) {
      return DemoAuthService.permissions;
    }
    
    console.log('데모 사용자 권한 조회');
    
    // 데모 모드에서는 엔지니어 역할의 기본 권한 반환
    const permissions: UserPermissions = {
      // 설비 관리 권한
      'equipment:read': true,
      'equipment:write': true,
      
      // 고장 관리 권한
      'breakdown:read': true,
      'breakdown:write': true,
      'breakdown:assign': true,
      
      // 수리 관리 권한
      'repair:read': true,
      'repair:write': true,
      'repair:complete': true,
      
      // 기본 조회 권한
      'dashboard:read': true,
      'settings:read': true
    };
    
    // 캐시에 저장하여 중복 호출 방지
    DemoAuthService.permissions = permissions;
    
    return permissions;
  }
}