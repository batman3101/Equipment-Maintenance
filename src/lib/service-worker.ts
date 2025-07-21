// Service Worker 등록 및 관리 유틸리티

export interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

// Service Worker 등록
export async function registerServiceWorker(config?: ServiceWorkerConfig): Promise<ServiceWorkerRegistration | null> {
  // 브라우저가 Service Worker를 지원하는지 확인
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker를 지원하지 않는 브라우저입니다.');
    return null;
  }

  try {
    console.log('Service Worker 등록 중...');
    
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('Service Worker 등록 성공:', registration);

    // 업데이트 확인
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      console.log('새로운 Service Worker 발견');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // 새 버전 사용 가능
            console.log('새 버전의 앱이 사용 가능합니다.');
            config?.onUpdate?.(registration);
          } else {
            // 첫 설치
            console.log('앱이 오프라인에서 사용할 수 있도록 캐시되었습니다.');
            config?.onSuccess?.(registration);
          }
        }
      });
    });

    // 이미 활성화된 Service Worker가 있는 경우
    if (registration.active && !navigator.serviceWorker.controller) {
      config?.onSuccess?.(registration);
    }

    return registration;
  } catch (error) {
    console.error('Service Worker 등록 실패:', error);
    config?.onError?.(error as Error);
    return null;
  }
}

// Service Worker 업데이트
export async function updateServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      console.log('Service Worker 업데이트 확인 완료');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Service Worker 업데이트 실패:', error);
    return false;
  }
}

// Service Worker 메시지 전송
export function sendMessageToServiceWorker(message: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker.controller) {
      reject(new Error('Service Worker가 활성화되지 않았습니다.'));
      return;
    }

    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data);
      }
    };

    navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
  });
}

// 캐시 상태 확인
export async function getCacheStatus(): Promise<{
  staticCacheSize: number;
  dynamicCacheSize: number;
  apiCacheSize: number;
}> {
  if (!('caches' in window)) {
    return { staticCacheSize: 0, dynamicCacheSize: 0, apiCacheSize: 0 };
  }

  try {
    const cacheNames = await caches.keys();
    const status = {
      staticCacheSize: 0,
      dynamicCacheSize: 0,
      apiCacheSize: 0
    };

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      
      if (cacheName.includes('static')) {
        status.staticCacheSize = keys.length;
      } else if (cacheName.includes('dynamic')) {
        status.dynamicCacheSize = keys.length;
      } else if (cacheName.includes('api')) {
        status.apiCacheSize = keys.length;
      }
    }

    return status;
  } catch (error) {
    console.error('캐시 상태 확인 실패:', error);
    return { staticCacheSize: 0, dynamicCacheSize: 0, apiCacheSize: 0 };
  }
}

// 캐시 정리
export async function clearCache(): Promise<boolean> {
  if (!('caches' in window)) {
    return false;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('모든 캐시가 정리되었습니다.');
    return true;
  } catch (error) {
    console.error('캐시 정리 실패:', error);
    return false;
  }
}

// 백그라운드 동기화 등록
export async function registerBackgroundSync(tag: string = 'background-sync'): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker를 지원하지 않는 브라우저입니다.');
    return false;
  }

  try {
    // Service Worker가 활성화될 때까지 대기
    const waitForActiveServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
      const registration = await navigator.serviceWorker.ready;
      
      if (registration.active) {
        return registration;
      }
      
      return new Promise((resolve) => {
        // 활성화 이벤트 리스너 등록
        if (registration.installing) {
          registration.installing.addEventListener('statechange', (e) => {
            const sw = e.target as ServiceWorker;
            if (sw.state === 'activated') {
              resolve(registration);
            }
          });
        } else if (registration.waiting) {
          registration.waiting.addEventListener('statechange', (e) => {
            const sw = e.target as ServiceWorker;
            if (sw.state === 'activated') {
              resolve(registration);
            }
          });
        } else {
          // 이미 활성화된 경우
          resolve(registration);
        }
      });
    };
    
    // 활성화된 Service Worker 가져오기
    const registration = await waitForActiveServiceWorker();
    
    // sync API가 있는지 확인
    if ('sync' in registration) {
      // 약간의 지연을 추가하여 Service Worker가 완전히 활성화되도록 함
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await (registration as any).sync.register(tag);
      console.log('백그라운드 동기화 등록 완료:', tag);
      return true;
    } else {
      console.log('백그라운드 동기화를 지원하지 않는 브라우저입니다.');
      return false;
    }
  } catch (error) {
    console.error('백그라운드 동기화 등록 실패:', error);
    return false;
  }
}

// PWA 설치 가능 여부 확인
export function checkPWAInstallability(): {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
} {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isInstalled = isStandalone || (window.navigator as any).standalone === true;
  
  return {
    isInstallable: !isInstalled && 'serviceWorker' in navigator,
    isInstalled,
    isStandalone
  };
}

// PWA 설치 프롬프트 관리
let deferredPrompt: any = null;

export function setupPWAInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA 설치 프롬프트 준비됨');
    e.preventDefault();
    deferredPrompt = e;
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA 설치 완료');
    deferredPrompt = null;
  });
}

export async function showPWAInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('PWA 설치 프롬프트를 사용할 수 없습니다.');
    return false;
  }

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('PWA 설치 프롬프트 결과:', outcome);
    
    deferredPrompt = null;
    return outcome === 'accepted';
  } catch (error) {
    console.error('PWA 설치 프롬프트 오류:', error);
    return false;
  }
}

// 네트워크 상태 모니터링
export interface NetworkStatus {
  isOnline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export function getNetworkStatus(): NetworkStatus {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  return {
    isOnline: navigator.onLine,
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt
  };
}

export function onNetworkStatusChange(callback: (status: NetworkStatus) => void): () => void {
  const handleOnline = () => callback(getNetworkStatus());
  const handleOffline = () => callback(getNetworkStatus());
  const handleConnectionChange = () => callback(getNetworkStatus());

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (connection) {
    connection.addEventListener('change', handleConnectionChange);
  }

  // 정리 함수 반환
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (connection) {
      connection.removeEventListener('change', handleConnectionChange);
    }
  };
}