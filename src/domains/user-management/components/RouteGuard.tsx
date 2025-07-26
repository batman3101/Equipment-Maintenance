'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';

// 권한이 필요한 경로와 필요한 권한 정의
const permissionPaths = [
  {
    path: '/admin/users',
    permissions: ['users:read'],
    requireAll: false
  },
  {
    path: '/admin/user-requests',
    permissions: ['users:approve'],
    requireAll: false
  },
  {
    path: '/admin/permissions',
    permissions: ['roles:read', 'permissions:assign'],
    requireAll: false
  },
  {
    path: '/breakdowns',
    permissions: ['breakdowns:read'],
    requireAll: false
  },
  {
    path: '/equipment',
    permissions: ['equipment:read'],
    requireAll: false
  },
  {
    path: '/settings',
    permissions: ['settings:read'],
    requireAll: false
  }
];

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading, error } = usePermissions();
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (loading) return;

    // 권한이 필요한 경로인지 확인
    const requiredRoute = permissionPaths.find(route => 
      pathname === route.path || pathname.startsWith(route.path + '/')
    );

    if (!requiredRoute) {
      // 권한이 필요하지 않은 경로는 통과
      setAccessDenied(false);
      return;
    }

    // 권한 확인
    const hasRequiredPermissions = requiredRoute.requireAll
      ? hasAllPermissions(requiredRoute.permissions)
      : hasAnyPermission(requiredRoute.permissions);

    if (!hasRequiredPermissions) {
      setAccessDenied(true);
    } else {
      setAccessDenied(false);
    }
  }, [pathname, loading, hasPermission, hasAnyPermission, hasAllPermissions]);

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="p-8 text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            권한을 확인하는 중입니다...
          </p>
        </Card>
      </div>
    );
  }

  // 권한 없음
  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            접근 권한 없음
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            이 페이지에 접근할 권한이 없습니다.<br />
            관리자에게 문의하여 필요한 권한을 요청하세요.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">
                권한 확인 중 오류가 발생했습니다: {error}
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            <Button
              variant="primary"
              onClick={() => router.push('/')}
              className="w-full"
            >
              대시보드로 이동
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.back()}
              className="w-full"
            >
              이전 페이지로
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 권한 있음 - 자식 컴포넌트 렌더링
  return <>{children}</>;
}