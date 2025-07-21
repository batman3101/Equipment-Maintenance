'use client';

import { useState, useEffect } from 'react';
import { usePWA } from './PWAProvider';

export function PWAUpdateNotification() {
  const { hasServiceWorkerUpdate, isServiceWorkerUpdating, updateApp } = usePWA();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (hasServiceWorkerUpdate) {
      setIsVisible(true);
    }
  }, [hasServiceWorkerUpdate]);

  if (!isVisible) {
    return null;
  }

  const handleUpdate = async () => {
    await updateApp();
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="rounded-lg bg-blue-600 p-4 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium">새 버전 사용 가능</h3>
            <p className="mt-1 text-xs text-blue-100">
              앱의 새 버전이 준비되었습니다. 업데이트하시겠습니까?
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-2 text-blue-200 hover:text-white"
            aria-label="알림 닫기"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        
        <div className="mt-3 flex space-x-2">
          <button
            onClick={handleUpdate}
            disabled={isServiceWorkerUpdating}
            className="flex-1 rounded bg-white px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
          >
            {isServiceWorkerUpdating ? '업데이트 중...' : '업데이트'}
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 rounded border border-blue-400 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500"
          >
            나중에
          </button>
        </div>
      </div>
    </div>
  );
}

export function PWAInstallPrompt() {
  const { isPWAInstallable, installPWA } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // 설치 가능하고 이전에 거부하지 않았다면 표시
    if (isPWAInstallable && !localStorage.getItem('pwa-install-dismissed')) {
      // 3초 후에 표시 (사용자가 앱을 둘러볼 시간 제공)
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isPWAInstallable]);

  if (!isVisible || !isPWAInstallable) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await installPWA();
      if (success) {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('PWA 설치 오류:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="rounded-lg bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              홈 화면에 추가
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              CNC 관리 앱을 홈 화면에 추가하여 더 빠르게 접근하세요.
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isInstalling ? '설치 중...' : '설치'}
              </button>
              <button
                onClick={handleDismiss}
                className="rounded border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                나중에
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-2 text-gray-400 hover:text-gray-600"
            aria-label="알림 닫기"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}