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
      // authService가 올바르게 생성되었는지 확인
      if (!authService) {
        throw new Error('AuthService가 초기화되지 않았습니다.');
      }

      // getUserPermissions 메서드가 존재하는지 확인
      if (typeof authService.getUserPermissions !== 'function') {
        console.error('AuthService 객체:', authService);
        console.error('사용 가능한 메서드들:', Object.keys(authService));
        throw new Error('AuthService에 getUserPermissions 메서드가 없습니다. 서비스 구현을 확인하세요.');
      }

      console.log('권한 로딩 시작...');
      const userPermissions = await authService.getUserPermissions();
      console.log('권한 로딩 성공:', userPermissions);
      setPermissions(userPermissions);
    } catch (err) {
      console.error('권한 로딩 실패:', err);
      const errorMessage = err instanceof Error ? err.message : '권한을 불러올 수 없습니다.';
      setError(`권한 로딩 실패: ${errorMessage}`);
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
      // authService와 메서드 존재 여부 확인
      if (!authService || typeof authService.checkPermission !== 'function') {
        console.error('AuthService checkPermission 메서드를 사용할 수 없습니다.');
        return false;
      }

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