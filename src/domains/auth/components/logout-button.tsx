'use client';

import { useState } from 'react';
import { useAuth } from '../hooks/use-auth';

// Logout button component (SRP - only handles logout UI)
interface LogoutButtonProps {
  className?: string;
  variant?: 'button' | 'link';
  showConfirmation?: boolean;
}

export function LogoutButton({ 
  className = '', 
  variant = 'button',
  showConfirmation = true 
}: LogoutButtonProps) {
  const { signOut, authState } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (showConfirmation && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            로그아웃 확인
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            정말 로그아웃하시겠습니까?
          </p>
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              style={{ minHeight: '44px' }}
            >
              취소
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex-1 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              style={{ minHeight: '44px' }}
            >
              {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const baseClasses = variant === 'button' 
    ? 'px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50'
    : 'text-red-600 hover:text-red-700 focus:outline-none focus:underline';

  return (
    <button
      onClick={handleLogout}
      disabled={authState.loading || isLoggingOut}
      className={`${baseClasses} ${className}`}
      style={variant === 'button' ? { minHeight: '44px' } : undefined}
    >
      {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
    </button>
  );
}