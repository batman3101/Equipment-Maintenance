import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 개발 환경에서는 미들웨어를 완전히 비활성화
const isDev = process.env.NODE_ENV === 'development';

// 미들웨어 비활성화 (개발 환경에서 리다이렉트 문제 해결)
export async function middleware(req: NextRequest) {
  // 모든 환경에서 미들웨어 처리 건너뛰기
  return NextResponse.next();
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/unauthorized'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return response;
  }

  // Redirect to login if not authenticated and trying to access protected route
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to home if authenticated and trying to access login
  if (session && pathname === '/login') {
    const redirectUrl = req.nextUrl.searchParams.get('redirect') || '/';
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  // Role-based route protection can be added here
  // For now, we'll handle it in the components

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};