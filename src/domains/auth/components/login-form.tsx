'use client';

import { useState, Suspense } from 'react';
import { useAuth } from '../hooks/use-auth';
import type { LoginCredentials } from '../types';

// Login form content component
function LoginFormContent() {
  const { authState, signIn } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // 실제 Supabase 인증 사용
      console.log('Supabase 로그인 시도:', credentials.email);
      console.log('환경 변수 확인:', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      });
      
      await signIn(credentials);
      
      // 성공 시 홈페이지로 이동
      console.log('로그인 성공, 홈페이지로 이동');
      window.location.replace('/');
    } catch (error) {
      console.error('로그인 실패 상세:', error);
      
      // 로딩 상태 해제
      setIsSubmitting(false);
      
      // 에러 메시지 설정
      let errorMessage = '로그인에 실패했습니다.';
      
      if (error instanceof Error) {
        console.log('에러 메시지:', error.message);
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('Network')) {
          errorMessage = '네트워크 연결을 확인해주세요.';
        } else {
          errorMessage = `로그인 오류: ${error.message}`;
        }
      }
      
      // 에러 표시 (authState.error 대신 별도 상태 사용)
      setValidationErrors({ 
        email: errorMessage 
      });
    }
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
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
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-800 text-center">
                <strong>실제 Supabase 계정으로 로그인:</strong><br />
                이메일: zetooo1972@gmail.com<br />
                (실제 비밀번호 입력 필요)
              </p>
              <button
                type="button"
                onClick={() => {
                  setCredentials({
                    email: 'zetooo1972@gmail.com',
                    password: ''
                  });
                }}
                className="mt-2 w-full text-xs py-1 px-2 bg-blue-200 hover:bg-blue-300 rounded text-blue-800"
              >
                이메일 자동 입력
              </button>
            </div>
          )}
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

          {authState.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{authState.error}</p>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">로딩 중...</div>
      </div>
    </div>}>
      <LoginFormContent />
    </Suspense>
  );
}