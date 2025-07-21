'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  registerServiceWorker, 
  updateServiceWorker,
  checkPWAInstallability,
  setupPWAInstallPrompt,
  showPWAInstallPrompt,
  getNetworkStatus,
  onNetworkStatusChange,
  type NetworkStatus
} from '@/lib/service-worker';
import { ServiceWorkerRegistration } from './ServiceWorkerRegistration';

interface PWAContextType {
  // Service Worker 상태
  isServiceWorkerReady: boolean;
  isServiceWorkerUpdating: boolean;
  hasServiceWorkerUpdate: boolean;
  
  // PWA 설치 상태
  isPWAInstallable: boolean;
  isPWAInstalled: boolean;
  isStandalone: boolean;
  
  // 네트워크 상태
  networkStatus: NetworkStatus;
  
  // 액션
  updateApp: () => Promise<void>;
  installPWA: () => Promise<boolean>;
  reloadApp: () => void;
}

const PWAContext = createContext<PWAContextType | null>(null);

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  // Service Worker 상태
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [isServiceWorkerUpdating, setIsServiceWorkerUpdating] = useState(false);
  const [hasServiceWorkerUpdate, setHasServiceWorkerUpdate] = useState(false);
  
  // PWA 설치 상태
  const [isPWAInstallable, setIsPWAInstallable] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  // 네트워크 상태
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(getNetworkStatus());

  useEffect(() => {
    // 브라우저 환경에서만 실행
    if (typeof window === 'undefined') return;

    try {
      // PWA 설치 상태 확인
      const installStatus = checkPWAInstallability();
      setIsPWAInstallable(installStatus.isInstallable);
      setIsPWAInstalled(installStatus.isInstalled);
      setIsStandalone(installStatus.isStandalone);

      // PWA 설치 프롬프트 설정
      setupPWAInstallPrompt();

      // Service Worker 등록
      registerServiceWorker({
        onSuccess: (registration) => {
          console.log('Service Worker 등록 성공');
          setIsServiceWorkerReady(true);
        },
        onUpdate: (registration) => {
          console.log('Service Worker 업데이트 사용 가능');
          setHasServiceWorkerUpdate(true);
        },
        onError: (error) => {
          console.error('Service Worker 등록 실패:', error);
        }
      });

      // 네트워크 상태 모니터링
      const unsubscribeNetworkStatus = onNetworkStatusChange((status) => {
        setNetworkStatus(status);
        console.log('네트워크 상태 변경:', status);
      });

      return () => {
        unsubscribeNetworkStatus();
      };
    } catch (error) {
      console.error('PWA 초기화 오류:', error);
    }
  }, []);

  // 앱 업데이트
  const updateApp = async () => {
    setIsServiceWorkerUpdating(true);
    try {
      await updateServiceWorker();
      // 페이지 새로고침으로 새 버전 적용
      window.location.reload();
    } catch (error) {
      console.error('앱 업데이트 실패:', error);
    } finally {
      setIsServiceWorkerUpdating(false);
    }
  };

  // PWA 설치
  const installPWA = async (): Promise<boolean> => {
    try {
      const result = await showPWAInstallPrompt();
      if (result) {
        setIsPWAInstalled(true);
        setIsPWAInstallable(false);
      }
      return result;
    } catch (error) {
      console.error('PWA 설치 실패:', error);
      return false;
    }
  };

  // 앱 새로고침
  const reloadApp = () => {
    window.location.reload();
  };

  const contextValue: PWAContextType = {
    // Service Worker 상태
    isServiceWorkerReady,
    isServiceWorkerUpdating,
    hasServiceWorkerUpdate,
    
    // PWA 설치 상태
    isPWAInstallable,
    isPWAInstalled,
    isStandalone,
    
    // 네트워크 상태
    networkStatus,
    
    // 액션
    updateApp,
    installPWA,
    reloadApp
  };

  return (
    <PWAContext.Provider value={contextValue}>
      <ServiceWorkerRegistration />
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA는 PWAProvider 내에서 사용해야 합니다.');
  }
  return context;
}