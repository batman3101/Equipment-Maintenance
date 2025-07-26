'use client';

import { useState, useEffect, useCallback } from 'react';
import { createUserManagementService } from '../services';
import { createAuthService } from '@/domains/auth/services/auth-service';
import type { UserPermissions } from '../types';

export function usePermissions() {
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authService = createAuthService();

  const loadPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userPermissions = await authService.getUserPermissions();
      setPermissions(userPermissions);
    } catch (err) {
      console.error('권한 로딩 실패:', err);
      setError(err instanceof Error ? err.message : '권한을 불러올 수 없습니다.');
      setPermissions({});
    } finally {
      setLoading(false);
    }
  }, [authService]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const hasPermission = useCallback((permission: string): boolean => {
    return permissions[permission] === true;
  }, [permissions]);

  const hasAnyPermission = useCallback((permissionList: string[]): boolean => {
    return permissionList.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissionList: string[]): boolean => {
    return permissionList.every(permission => hasPermission(permission));
  }, [hasPermission]);

  const checkPermission = useCallback(async (permission: string): Promise<boolean> => {
    try {
      return await authService.checkPermission(permission);
    } catch (err) {
      console.error('권한 확인 실패:', err);
      return false;
    }
  }, [authService]);

  const refreshPermissions = useCallback(() => {
    loadPermissions();
  }, [loadPermissions]);

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkPermission,
    refreshPermissions
  };
}