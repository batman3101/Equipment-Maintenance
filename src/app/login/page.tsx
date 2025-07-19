'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/domains/auth/components/login-form';
import { useAuth } from '@/domains/auth/hooks/use-auth';

// Login page component (SRP - only handles login page logic)
export default function LoginPage() {
  const { authState } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!authState.loading && authState.user) {
      router.push('/');
    }
  }, [authState.loading, authState.user, router]);

  // Don't show login form if already authenticated
  if (authState.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">이미 로그인되어 있습니다. 리다이렉트 중...</p>
        </div>
      </div>
    );
  }

  return <LoginForm />;
}