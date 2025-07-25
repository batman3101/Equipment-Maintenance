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

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const user = await authService.getCurrentUser();
        if (mounted) {
          setAuthState({
            user,
            loading: false,
            error: null,
          });
          
          // Start automatic session refresh if user is authenticated
          if (user) {
            SessionManager.startAutoRefresh();
          }
        }
      } catch (error) {
        if (mounted) {
          setAuthState({
            user: null,
            loading: false,
            error: error instanceof Error ? error.message : '인증 초기화 실패',
          });
        }
      }
    }

    initializeAuth();

    return () => {
      mounted = false;
      SessionManager.stopAutoRefresh();
    };
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const user = await authService.getCurrentUser();
            setAuthState({
              user,
              loading: false,
              error: null,
            });
          } catch (error) {
            setAuthState({
              user: null,
              loading: false,
              error: error instanceof Error ? error.message : '사용자 정보 로드 실패',
            });
          }
        } else if (event === 'SIGNED_OUT') {
          SessionManager.stopAutoRefresh();
          setAuthState({
            user: null,
            loading: false,
            error: null,
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          try {
            const user = await authService.getCurrentUser();
            setAuthState(prev => ({
              ...prev,
              user,
              error: null,
            }));
          } catch (error) {
            console.error('Token refresh failed:', error);
          }
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