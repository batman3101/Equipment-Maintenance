'use client';

import { useEffect, useState } from 'react';
import { useOffline } from '@/hooks/use-offline';
import { syncNotificationManager } from './SyncNotification';

/**
 * 동기화 상태 알림 컴포넌트
 * Service Worker와 동기화 매니저로부터 메시지를 받아 사용자에게 알림을 표시합니다.
 */
export function SyncStatusNotification() {
  const { syncStatus, isOnline } = useOffline();
  const [prevSyncStatus, setPrevSyncStatus] = useState(syncStatus);
  const [prevOnlineStatus, setPrevOnlineStatus] = useState(isOnline);

  // 동기화 상태 변경 감지 및 알림 표시
  useEffect(() => {
    // 동기화 완료 알림
    if (
      prevSyncStatus.isRunning &&
      !syncStatus.isRunning &&
      syncStatus.pendingCount < prevSyncStatus.pendingCount
    ) {
      const syncedCount = prevSyncStatus.pendingCount - syncStatus.pendingCount;
      if (syncedCount > 0) {
        syncNotificationManager.show(
          '동기화 완료',
          `${syncedCount}개의 항목이 성공적으로 동기화되었습니다.`,
          'success'
        );
      }
    }

    // 동기화 실패 알림
    if (syncStatus.failedCount > prevSyncStatus.failedCount) {
      const newFailedCount = syncStatus.failedCount - prevSyncStatus.failedCount;
      syncNotificationManager.show(
        '동기화 실패',
        `${newFailedCount}개의 항목 동기화에 실패했습니다. 자동으로 재시도합니다.`,
        'error'
      );
    }

    // 온라인 상태 변경 알림
    if (!prevOnlineStatus && isOnline) {
      syncNotificationManager.show(
        '온라인 상태 복구',
        '인터넷 연결이 복구되었습니다. 데이터 동기화를 시작합니다.',
        'info'
      );
    } else if (prevOnlineStatus && !isOnline) {
      syncNotificationManager.show(
        '오프라인 상태 감지',
        '인터넷 연결이 끊겼습니다. 데이터는 로컬에 저장되며 온라인 복구 시 자동으로 동기화됩니다.',
        'warning'
      );
    }

    // 상태 업데이트
    setPrevSyncStatus(syncStatus);
    setPrevOnlineStatus(isOnline);
  }, [syncStatus, isOnline, prevSyncStatus, prevOnlineStatus]);

  // Service Worker 메시지 리스너
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type, data } = event.data || {};

      if (!type) return;

      switch (type) {
        case 'SYNC_COMPLETE':
          if (data?.syncedCount > 0) {
            syncNotificationManager.show(
              '백그라운드 동기화 완료',
              `${data.syncedCount}개의 항목이 백그라운드에서 동기화되었습니다.`,
              'success'
            );
          }
          break;

        case 'SYNC_ERROR':
          syncNotificationManager.show(
            '백그라운드 동기화 오류',
            data?.error || '백그라운드 동기화 중 오류가 발생했습니다.',
            'error'
          );
          break;

        case 'SYNC_PROGRESS':
          // 진행 상황 알림 (선택적)
          if (data?.progress && data.progress % 25 === 0) { // 25%, 50%, 75%, 100%일 때만 알림
            syncNotificationManager.show(
              '동기화 진행 중',
              `동기화 진행률: ${data.progress}%`,
              'info',
              3000 // 짧은 시간만 표시
            );
          }
          break;
      }
    };

    // Service Worker 메시지 리스너 등록
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  // 렌더링할 UI가 없음 - 백그라운드에서만 동작
  return null;
}