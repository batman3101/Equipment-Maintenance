'use client';

import { useState, useEffect } from 'react';
import { usePWA } from './PWAProvider';

export function NetworkStatus() {
  const { networkStatus } = usePWA();
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!networkStatus.isOnline) {
      setShowOfflineMessage(true);
      setWasOffline(true);
    } else if (wasOffline && networkStatus.isOnline) {
      // 온라인으로 복구되었을 때 잠시 메시지 표시
      setShowOfflineMessage(true);
      const timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowOfflineMessage(false);
    }
  }, [networkStatus.isOnline, wasOffline]);

  if (!showOfflineMessage) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className={`px-4 py-2 text-center text-sm font-medium text-white ${
        networkStatus.isOnline ? 'bg-green-600' : 'bg-red-600'
      }`}>
        {networkStatus.isOnline ? (
          <div className="flex items-center justify-center space-x-2">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>온라인 상태로 복구되었습니다</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>오프라인 상태입니다</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function NetworkIndicator() {
  const { networkStatus } = usePWA();

  return (
    <div className="flex items-center space-x-2 text-xs text-gray-500">
      <div className={`h-2 w-2 rounded-full ${
        networkStatus.isOnline ? 'bg-green-500' : 'bg-red-500'
      }`} />
      <span>
        {networkStatus.isOnline ? '온라인' : '오프라인'}
        {networkStatus.effectiveType && (
          <span className="ml-1">({networkStatus.effectiveType})</span>
        )}
      </span>
    </div>
  );
}

export function ConnectionQuality() {
  const { networkStatus } = usePWA();

  if (!networkStatus.isOnline) {
    return (
      <div className="flex items-center space-x-2 text-xs text-red-600">
        <div className="h-2 w-2 rounded-full bg-red-500" />
        <span>오프라인</span>
      </div>
    );
  }

  const getConnectionQuality = () => {
    if (!networkStatus.effectiveType) return { label: '알 수 없음', color: 'gray' };

    switch (networkStatus.effectiveType) {
      case 'slow-2g':
        return { label: '매우 느림', color: 'red' };
      case '2g':
        return { label: '느림', color: 'orange' };
      case '3g':
        return { label: '보통', color: 'yellow' };
      case '4g':
        return { label: '빠름', color: 'green' };
      default:
        return { label: '알 수 없음', color: 'gray' };
    }
  };

  const quality = getConnectionQuality();

  return (
    <div className="flex items-center space-x-2 text-xs">
      <div className={`h-2 w-2 rounded-full bg-${quality.color}-500`} />
      <span className={`text-${quality.color}-600`}>
        {quality.label}
        {networkStatus.downlink && (
          <span className="ml-1">({networkStatus.downlink} Mbps)</span>
        )}
      </span>
    </div>
  );
}