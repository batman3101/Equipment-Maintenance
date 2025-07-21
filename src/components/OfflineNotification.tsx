'use client';

import { useState, useEffect } from 'react';
import { useOffline } from '@/hooks/use-offline';

export function OfflineNotification() {
  const { isOnline, syncStatus } = useOffline();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'offline' | 'online' | 'sync-error'>('offline');
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      // 오프라인 상태
      setNotificationType('offline');
      setShowNotification(true);
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      // 온라인으로 복구됨
      setNotificationType('online');
      setShowNotification(true);
      setWasOffline(false);
      
      // 3초 후 알림 숨김
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else if (syncStatus.failedCount > 0) {
      // 동기화 오류
      setNotificationType('sync-error');
      setShowNotification(true);
    } else {
      setShowNotification(false);
    }
  }, [isOnline, wasOffline, syncStatus.failedCount]);

  if (!showNotification) {
    return null;
  }

  const getNotificationConfig = () => {
    switch (notificationType) {
      case 'offline':
        return {
          bgColor: 'bg-red-600',
          icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ),
          title: '오프라인 상태',
          message: '인터넷 연결을 확인해주세요. 입력한 데이터는 온라인 복구 시 자동으로 동기화됩니다.',
          showClose: false
        };

      case 'online':
        return {
          bgColor: 'bg-green-600',
          icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ),
          title: '온라인 복구',
          message: '인터넷 연결이 복구되었습니다. 데이터 동기화를 시작합니다.',
          showClose: true
        };

      case 'sync-error':
        return {
          bgColor: 'bg-yellow-600',
          icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ),
          title: '동기화 오류',
          message: `${syncStatus.failedCount}개의 데이터 동기화에 실패했습니다. 나중에 다시 시도됩니다.`,
          showClose: true
        };

      default:
        return null;
    }
  };

  const config = getNotificationConfig();
  if (!config) return null;

  const handleClose = () => {
    setShowNotification(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className={`${config.bgColor} px-4 py-3 text-white shadow-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {config.icon}
            <div>
              <div className="font-medium">{config.title}</div>
              <div className="text-sm opacity-90">{config.message}</div>
            </div>
          </div>
          
          {config.showClose && (
            <button
              onClick={handleClose}
              className="ml-4 text-white hover:text-gray-200"
              aria-label="알림 닫기"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function OfflineBanner() {
  const { isOnline, syncStatus } = useOffline();

  if (isOnline && syncStatus.pendingCount === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
      <div className="flex items-center justify-center space-x-2 text-sm">
        {!isOnline ? (
          <>
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-red-700">
              오프라인 모드 - 데이터는 로컬에 저장되며 온라인 복구 시 동기화됩니다
            </span>
          </>
        ) : syncStatus.pendingCount > 0 ? (
          <>
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-orange-700">
              {syncStatus.pendingCount}개의 데이터가 동기화 대기 중입니다
            </span>
            {syncStatus.isRunning && (
              <div className="ml-2 flex items-center space-x-1">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
                <span className="text-xs text-orange-600">동기화 중...</span>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}