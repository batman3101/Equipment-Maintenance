'use client';

import { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import type { LoginCredentials } from '../types';

// Login form component (SRP - only handles login form UI and validation)
export function LoginForm() {
  const { authState, signIn } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

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

    try {
      await signIn(credentials);
    } catch (error) {
      // Error is handled by the auth context
      console.error('Login failed:', error);
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
              disabled={authState.loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: '44px' }} // Mobile touch target
            >
              {authState.loading ? (
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