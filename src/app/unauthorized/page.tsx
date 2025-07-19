'use client';

import Link from 'next/link';
import { useAuth } from '@/domains/auth/hooks/use-auth';

// Unauthorized access page (SRP - only handles unauthorized access UI)
export default function UnauthorizedPage() {
  const { authState } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto h-12 w-12 text-red-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            접근 권한이 없습니다
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            이 페이지에 접근할 권한이 없습니다.
          </p>
          {authState.user && (
            <p className="mt-1 text-xs text-gray-500">
              현재 권한: {authState.user.role}
            </p>
          )}
        </div>
        
        <div className="space-y-4">
          <Link
            href="/"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            style={{ minHeight: '44px' }}
          >
            홈으로 돌아가기
          </Link>
          
          <Link
            href="/login"
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            style={{ minHeight: '44px' }}
          >
            다른 계정으로 로그인
          </Link>
        </div>
      </div>
    </div>
  );
}