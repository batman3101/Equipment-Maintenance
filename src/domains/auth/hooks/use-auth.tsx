'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { createAuthService } from '../services/auth-service';
import { SessionManager } from '../utils/session-manager';
import type { AuthState, User, LoginCredentials, AuthService } from '../types';

// Context for auth state (SRP - only manages auth state)
const AuthContext = createContext<{
  authState: AuthState;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
} | null>(null);

// Custom hook for auth operations (SRP - only provides auth interface)
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth provider component (SRP - only manages auth context)
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const authService: AuthService = createAuthService();

  // Initialize auth state (간소화된 초기화)
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        // 빠른 초기 상태 설정
        setAuthState(prev => ({ ...prev, loading: true }));
        
        const user = await authService.getCurrentUser();
        
        if (mounted) {
          setAuthState({
            user,
            loading: false,
            error: null,
          });
          
          // 사용자가 있으면 세션 자동 갱신 시작
          if (user) {
            SessionManager.startAutoRefresh();
          }
        }
      } catch (error) {
        console.error('Auth 초기화 실패:', error);
        if (mounted) {
          setAuthState({
            user: null,
            loading: false,
            error: null, // 초기화 에러는 사용자에게 표시하지 않음
          });
        }
      }
    }

    // 초기화를 약간 지연시켜 다른 초기화와 충돌 방지
    const timeoutId = setTimeout(initializeAuth, 100);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      SessionManager.stopAutoRefresh();
    };
  }, [authService]);

  // Listen for auth state changes (최적화된 리스너)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth 상태 변경:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // 로그인 시 기본 사용자 객체로 빠른 상태 업데이트
          const basicUser: User = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            role: 'engineer',
            plant_id: '550e8400-e29b-41d4-a716-446655440001',
            created_at: session.user.created_at,
            updated_at: new Date().toISOString()
          };
          
          setAuthState({
            user: basicUser,
            loading: false,
            error: null,
          });
          
          SessionManager.startAutoRefresh();
        } else if (event === 'SIGNED_OUT') {
          SessionManager.stopAutoRefresh();
          // 캐시 정리
          const { authCache } = await import('@/lib/auth-cache');
          authCache.clear();
          
          setAuthState({
            user: null,
            loading: false,
            error: null,
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // 토큰 갱신 시에는 상태를 유지하고 캐시만 갱신
          console.log('토큰 갱신됨');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (credentials: LoginCredentials) => {
    console.log('=== useAuth signIn 시작 ===');
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('authService.signIn 호출...');
      const user = await authService.signIn(credentials);
      
      console.log('authService.signIn 성공, 상태 업데이트...');
      setAuthState({
        user,
        loading: false,
        error: null,
      });
      
      console.log('세션 자동 갱신 시작...');
      // Start automatic session refresh after successful login
      SessionManager.startAutoRefresh();
      
      console.log('=== useAuth signIn 완료 ===');
    } catch (error) {
      console.error('=== useAuth signIn 실패 ===');
      console.error('에러:', error);
      
      setAuthState({
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : '로그인 실패',
      });
      throw error;
    }
  };

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      SessionManager.stopAutoRefresh();
      await authService.signOut();
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '로그아웃 실패',
      }));
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const user = await authService.refreshSession();
      setAuthState(prev => ({
        ...prev,
        user,
        error: null,
      }));
    } catch (error) {
      console.error('User refresh failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}