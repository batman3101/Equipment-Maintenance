'use client';

import { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';

interface PermissionGuardProps {
  permissions?: string | string[];
  requireAll?: boolean; // true면 모든 권한 필요, false면 하나라도 있으면 됨
  fallback?: ReactNode;
  children: ReactNode;
  loading?: ReactNode;
  showError?: boolean;
}

export function PermissionGuard({
  permissions = [],
  requireAll = false,
  fallback = null,
  children,
  loading = <LoadingSpinner size="sm" />,
  showError = false
}: PermissionGuardProps) {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    loading: permissionsLoading,
    error 
  } = usePermissions();

  // 권한이 로딩 중인 경우
  if (permissionsLoading) {
    return <>{loading}</>;
  }

  // 오류가 발생한 경우
  if (error && showError) {
    return (
      <div className="text-red-600 dark:text-red-400 text-sm">
        권한 확인 중 오류가 발생했습니다: {error}
      </div>
    );
  }

  // 권한이 지정되지 않은 경우 항상 허용
  if (!permissions || (Array.isArray(permissions) && permissions.length === 0)) {
    return <>{children}</>;
  }

  // 단일 권한 확인
  if (typeof permissions === 'string') {
    return hasPermission(permissions) ? <>{children}</> : <>{fallback}</>;
  }

  // 다중 권한 확인
  const hasRequiredPermissions = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  return hasRequiredPermissions ? <>{children}</> : <>{fallback}</>;
}

// 특정 권한이 있을 때만 보이는 컴포넌트
export function ProtectedComponent({
  permission,
  children,
  fallback = null
}: {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGuard permissions={permission} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

// 관리자만 볼 수 있는 컴포넌트
export function AdminOnly({
  children,
  fallback = null
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGuard 
      permissions={['users:create', 'users:delete', 'roles:create']}
      requireAll={false}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}

// 매니저 이상만 볼 수 있는 컴포넌트
export function ManagerOrAbove({
  children,
  fallback = null
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGuard 
      permissions={['users:approve', 'breakdowns:approve']}
      requireAll={false}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}