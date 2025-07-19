'use client';

import { useState, useEffect } from 'react';

/**
 * 온라인/오프라인 상태를 추적하는 훅
 * - PWA 오프라인 기능에 필수
 * - 네트워크 상태 변화 감지
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * 네트워크 상태 변화 이벤트를 처리하는 훅
 */
export function useNetworkStatus() {
  const isOnline = useOnlineStatus();
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      // 온라인으로 복구되었을 때 처리
      setWasOffline(false);
      // 여기서 동기화 로직을 트리거할 수 있음
      window.dispatchEvent(new CustomEvent('network-restored'));
    }
  }, [isOnline, wasOffline]);

  return {
    isOnline,
    wasOffline,
    justCameOnline: isOnline && wasOffline
  };
}