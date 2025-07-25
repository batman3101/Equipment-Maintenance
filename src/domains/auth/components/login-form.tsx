'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/use-auth';
import { ErrorBoundary } from '@/components/error-boundary';
import type { LoginCredentials } from '../types';

// Login form content component
function LoginFormContent() {
  const { authState, signIn } = useAuth();
  const router = useRouter();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 로그인 성공 시 자동 리다이렉션
  useEffect(() => {
    if (authState.user && !authState.loading) {
      console.log('=== 인증된 사용자 감지, 리다이렉트 실행 ===');
      const redirectPath = new URLSearchParams(window.location.search).get('redirect') || '/';
      router.push(redirectPath);
    }
  }, [authState.user, authState.loading, router]);

  // Form validation (SRP - separated validation logic)
  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!credentials.email) {
      errors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      errors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    if (!credentials.password) {
      errors.password = '비밀번호를 입력해주세요.';
    } else if (credentials.password.length < 6) {
      errors.password = '비밀번호는 6자 이상이어야 합니다.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 기존 에러 메시지 초기화
      setValidationErrors({});
      
      console.log('=== 로그인 프로세스 시작 ===');
      console.log('이메일:', credentials.email);
      console.log('환경 변수 확인:', {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      });
      
      // 실제 Supabase 인증 사용
      await signIn(credentials);
      
      console.log('=== 로그인 성공 ===');
      // useEffect에서 authState.user 변경을 감지하여 자동 리다이렉션
      
    } catch (error) {
      console.error('=== 로그인 실패 ===');
      console.error('에러 상세:', error);
      
      // 로딩 상태 해제
      setIsSubmitting(false);
      
      // 명확한 에러 메시지 설정
      let errorMessage = '로그인에 실패했습니다. 다시 시도해주세요.';
      
      if (error instanceof Error) {
        console.log('에러 메시지:', error.message);
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = '네트워크 연결을 확인해주세요.';
        } else if (error.message.includes('사용자 프로필')) {
          errorMessage = '사용자 계정 설정에 문제가 있습니다. 관리자에게 문의하세요.';
        } else {
          errorMessage = `로그인 중 오류가 발생했습니다: ${error.message}`;
        }
      }
      
      // 에러 메시지 표시
      setValidationErrors({ 
        general: errorMessage 
      });
      
      // 비밀번호 필드 초기화 (보안상 이유)
      setCredentials(prev => ({ ...prev, password: '' }));
    }
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors when user starts typing
    if (validationErrors[field] || validationErrors.general) {
      setValidationErrors(prev => ({ 
        ...prev, 
        [field]: undefined,
        general: undefined 
      }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            CNC 설비 관리 시스템
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            로그인하여 시스템에 접속하세요
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-3 border ${
                  validationErrors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-base`}
                placeholder="이메일을 입력하세요"
                value={credentials.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                style={{ minHeight: '44px' }} // Mobile touch target
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-3 border ${
                  validationErrors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-base`}
                placeholder="비밀번호를 입력하세요"
                value={credentials.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                style={{ minHeight: '44px' }} // Mobile touch target
              />
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
              )}
            </div>
          </div>

          {/* 일반 에러 메시지 표시 */}
          {validationErrors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-600 font-medium">{validationErrors.general}</p>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: '44px' }} // Mobile touch target
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  로그인 중...
                </span>
              ) : (
                '로그인'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Login form component (SRP - only handles login form UI and validation)
export function LoginForm() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>}>
        <LoginFormContent />
      </Suspense>
    </ErrorBoundary>
  );
}