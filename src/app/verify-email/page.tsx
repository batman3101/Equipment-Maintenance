'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { createUserRegistrationService } from '@/domains/user-management/services';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  const registrationService = createUserRegistrationService();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('유효하지 않은 인증 링크입니다.');
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    if (!token) return;

    try {
      const result = await registrationService.verifyEmail(token);
      
      if (result.success) {
        setStatus('success');
        setMessage(result.message);
      } else {
        setStatus('error');
        setMessage(result.message);
      }
    } catch (error) {
      console.error('이메일 인증 실패:', error);
      setStatus('error');
      setMessage('인증 처리 중 오류가 발생했습니다.');
    }
  };

  const handleResendVerification = async () => {
    // 재발송 기능은 이메일이 필요하므로 별도 페이지로 이동
    router.push('/resend-verification');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md w-full p-8 text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            이메일 인증 중...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            잠시만 기다려주세요.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full p-8 text-center">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
          status === 'success' 
            ? 'bg-green-100 dark:bg-green-900' 
            : 'bg-red-100 dark:bg-red-900'
        }`}>
          {status === 'success' ? (
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {status === 'success' ? '이메일 인증 완료' : '인증 실패'}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        
        <div className="space-y-3">
          {status === 'success' ? (
            <>
              <Button
                variant="primary"
                onClick={() => router.push('/login')}
                className="w-full"
              >
                로그인하기
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                관리자의 승인을 기다려주세요.
              </p>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                onClick={handleResendVerification}
                className="w-full"
              >
                인증 이메일 재발송
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push('/register')}
                className="w-full"
              >
                다시 가입하기
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}