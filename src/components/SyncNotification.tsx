'use client';

import { useState, useEffect } from 'react';

interface SyncNotificationProps {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

export function SyncNotification({ 
  title, 
  message, 
  type, 
  duration = 5000, 
  onClose 
}: SyncNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // 애니메이션 시작
    setTimeout(() => setIsAnimating(true), 100);

    // 자동 닫기
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          icon: 'text-green-600',
          title: 'text-green-800',
          message: 'text-green-700',
          iconPath: (
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          )
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          title: 'text-red-800',
          message: 'text-red-700',
          iconPath: (
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          )
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600',
          title: 'text-yellow-800',
          message: 'text-yellow-700',
          iconPath: (
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          )
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-800',
          message: 'text-blue-700',
          iconPath: (
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          )
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ${
        isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`rounded-lg border p-4 shadow-lg ${styles.bg}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className={`h-5 w-5 ${styles.icon}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              {styles.iconPath}
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-medium ${styles.title}`}>
              {title}
            </h3>
            <p className={`mt-1 text-sm ${styles.message}`}>
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className={`inline-flex rounded-md text-sm ${styles.icon} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              <span className="sr-only">닫기</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
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
    </div>
  );
}

// 토스트 알림 관리자
class SyncNotificationManager {
  private notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
  }> = [];
  
  private listeners: Array<(notifications: typeof this.notifications) => void> = [];

  show(
    title: string, 
    message: string, 
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration: number = 5000
  ) {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const notification = {
      id,
      title,
      message,
      type,
      duration
    };

    this.notifications.push(notification);
    this.notifyListeners();

    // 자동 제거
    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  remove(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  subscribe(listener: (notifications: typeof this.notifications) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }
}

export const syncNotificationManager = new SyncNotificationManager();

// 토스트 알림 컨테이너 컴포넌트
export function SyncNotificationContainer() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
  }>>([]);

  useEffect(() => {
    const unsubscribe = syncNotificationManager.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // 커스텀 이벤트 리스너 등록
    const handleOfflineNotification = (event: CustomEvent) => {
      const { title, message, type } = event.detail;
      syncNotificationManager.show(title, message, type);
    };

    window.addEventListener('offline-notification', handleOfflineNotification as EventListener);
    
    return () => {
      window.removeEventListener('offline-notification', handleOfflineNotification as EventListener);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{ transform: `translateY(${index * 10}px)` }}
        >
          <SyncNotification
            title={notification.title}
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            onClose={() => syncNotificationManager.remove(notification.id)}
          />
        </div>
      ))}
    </div>
  );
}