import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 보호된 경로 목록
const protectedPaths = [
  '/',
  '/breakdowns',
  '/equipment',
  '/admin',
  '/api'
];

// 권한이 필요한 경로와 필요한 권한 정의
const permissionPaths = [
  {
    path: '/admin/users',
    permissions: ['users:read']
  },
  {
    path: '/admin/user-requests',
    permissions: ['users:approve']
  },
  {
    path: '/admin/permissions',
    permissions: ['roles:read', 'permissions:assign']
  },
  {
    path: '/breakdowns',
    permissions: ['breakdowns:read']
  },
  {
    path: '/equipment',
    permissions: ['equipment:read']
  },
  {
    path: '/settings',
    permissions: ['settings:read']
  }
];

// 공개 경로 목록
const publicPaths = [
  '/login',
  '/register',
  '/verify-email',
  '/resend-verification',
  '/unauthorized'
];

// 정적 자산 경로 패턴
const staticAssetPatterns = [
  /\/_next\//,
  /\/favicon\.ico$/,
  /\/manifest\.json$/,
  /\.(png|jpg|jpeg|gif|svg|ico|webp)$/,
  /\.(css|js|woff|woff2|ttf|eot)$/
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 자산은 미들웨어 처리 건너뛰기
  if (staticAssetPatterns.some(pattern => pattern.test(pathname))) {
    return NextResponse.next();
  }

  // 개발 환경에서의 간단한 인증 체크
  if (process.env.NODE_ENV === 'development') {
    // Supabase 연결 문제가 있을 때 임시로 인증 우회
    if (process.env.BYPASS_AUTH === 'true') {
      console.log('BYPASS_AUTH enabled - 인증 우회');
      return NextResponse.next();
    }
    return handleDevAuth(request);
  }

  // 프로덕션 환경에서의 Supabase 인증 체크
  return handleProdAuth(request);
}

/**
 * 경로별 필요한 권한 확인
 */
function getRequiredPermissions(pathname: string): string[] {
  // 정확한 경로 매칭
  const exactMatch = permissionPaths.find(p => p.path === pathname);
  if (exactMatch) {
    return exactMatch.permissions;
  }

  // 경로 시작 부분 매칭 (하위 경로 포함)
  const pathMatch = permissionPaths.find(p => pathname.startsWith(p.path + '/') || pathname.startsWith(p.path));
  if (pathMatch) {
    return pathMatch.permissions;
  }

  return [];
}

/**
 * 개발 환경 인증 처리
 */
function handleDevAuth(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 경로는 통과
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 보호된 경로 체크
  if (protectedPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    // 데모 인증 토큰 확인
    const demoToken = request.cookies.get('demo-auth-token')?.value;
    
    // Supabase 세션 토큰 확인
    const supabaseAccessToken = request.cookies.get('sb-access-token')?.value ||
                               request.cookies.get('supabase-auth-token')?.value ||
                               request.cookies.get('sb-mlkvoizulowopmxckcmg-auth-token')?.value;
    
    if (!supabaseAccessToken && !demoToken) {
      // 인증되지 않은 경우 로그인 페이지로 리다이렉트
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

/**
 * 프로덕션 환경 인증 처리
 */
function handleProdAuth(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 경로는 통과
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 보호된 경로 체크
  if (protectedPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    // 데모 인증 토큰 확인
    const demoToken = request.cookies.get('demo-auth-token')?.value;
    
    // Supabase 세션 토큰 확인
    const supabaseToken = request.cookies.get('sb-access-token')?.value ||
                         request.cookies.get('supabase-auth-token')?.value ||
                         request.cookies.get('sb-mlkvoizulowopmxckcmg-auth-token')?.value;
    
    if (!supabaseToken && !demoToken) {
      // 인증되지 않은 경우 로그인 페이지로 리다이렉트
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// 미들웨어가 실행될 경로 설정
export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청에 대해 실행:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};