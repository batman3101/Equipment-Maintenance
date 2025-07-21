'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/service-worker';
import { syncNotificationManager } from './SyncNotification';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // 개발 환경에서도 Service Worker 등록 (테스트용)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker({
        onSuccess: (registration) => {
          console.log('Service Worker 등록 성공:', registration);
          
          // 백그라운드 동기화 등록
          if ('sync' in window.ServiceWorkerRegistration.prototype) {
            registration.sync.register('background-sync').then(() => {
              console.log('백그라운드 동기화 등록 완료');
            }).catch((error) => {
              console.error('백그라운드 동기화 등록 실패:', error);
            });
          }
        },
        onUpdate: (registration) => {
          console.log('Service Worker 업데이트 사용 가능:', registration);
          syncNotificationManager.show(
            '앱 업데이트',
            '새로운 버전이 사용 가능합니다. 페이지를 새로고침해주세요.',
            'info',
            10000
          );
        },
        onError: (error) => {
          console.error('Service Worker 등록 실패:', error);
        }
      });

      // Service Worker 메시지 리스너 등록
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'SYNC_COMPLETE':
            if (data.syncedCount > 0) {
              syncNotificationManager.show(
                '동기화 완료',
                `${data.syncedCount}개의 데이터가 성공적으로 동기화되었습니다.`,
                'success'
              );
            }
            if (data.failedCount > 0) {
              syncNotificationManager.show(
                '동기화 일부 실패',
                `${data.failedCount}개의 데이터 동기화에 실패했습니다.`,
                'warning'
              );
            }
            break;
            
          case 'SYNC_ERROR':
            syncNotificationManager.show(
              '동기화 오류',
              '데이터 동기화 중 오류가 발생했습니다.',
              'error'
            );
            break;
        }
      });

      // 온라인 상태 변경 시 즉시 동기화 시도
      window.addEventListener('online', () => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SYNC_NOW'
          });
        }
      });
    }
  }, []);

  return null;
}