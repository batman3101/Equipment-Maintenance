'use client';

import { useState, useEffect } from 'react';
import { useOffline } from '@/hooks/use-offline';

export function SyncStatus() {
  const { 
    isOnline, 
    syncStatus, 
    storageStats, 
    syncNow, 
    updateStatus 
  } = useOffline();
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncText, setLastSyncText] = useState<string>('');

  // 마지막 동기화 시간 텍스트 업데이트
  useEffect(() => {
    const updateLastSyncText = () => {
      if (!syncStatus.lastSyncTime) {
        setLastSyncText('동기화한 적 없음');
        return;
      }

      const now = Date.now();
      const diff = now - syncStatus.lastSyncTime;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) {
        setLastSyncText(`${days}일 전`);
      } else if (hours > 0) {
        setLastSyncText(`${hours}시간 전`);
      } else if (minutes > 0) {
        setLastSyncText(`${minutes}분 전`);
      } else {
        setLastSyncText('방금 전');
      }
    };

    updateLastSyncText();
    const interval = setInterval(updateLastSyncText, 60000); // 1분마다 업데이트

    return () => clearInterval(interval);
  }, [syncStatus.lastSyncTime]);

  // 상태 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      updateStatus();
    }, 10000); // 10초마다 상태 업데이트

    return () => clearInterval(interval);
  }, [updateStatus]);

  const handleSyncNow = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const result = await syncNow();
      console.log('수동 동기화 결과:', result);
    } catch (error) {
      console.error('수동 동기화 실패:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getSyncStatusColor = () => {
    if (!isOnline) return 'text-red-600';
    if (syncStatus.isRunning || isSyncing) return 'text-blue-600';
    if (syncStatus.failedCount > 0) return 'text-yellow-600';
    if (syncStatus.pendingCount > 0) return 'text-orange-600';
    return 'text-green-600';
  };

  const getSyncStatusText = () => {
    if (!isOnline) return '오프라인';
    if (syncStatus.isRunning || isSyncing) return '동기화 중...';
    if (syncStatus.failedCount > 0) return `실패 ${syncStatus.failedCount}개`;
    if (syncStatus.pendingCount > 0) return `대기 ${syncStatus.pendingCount}개`;
    return '동기화 완료';
  };

  return (
    <div className="flex items-center space-x-3 text-sm">
      {/* 네트워크 상태 표시 */}
      <div className="flex items-center space-x-1">
        <div className={`h-2 w-2 rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <span className={getSyncStatusColor()}>
          {getSyncStatusText()}
        </span>
      </div>

      {/* 동기화 정보 */}
      {(syncStatus.pendingCount > 0 || syncStatus.failedCount > 0) && (
        <div className="text-xs text-gray-500">
          {syncStatus.pendingCount > 0 && (
            <span>대기: {syncStatus.pendingCount}</span>
          )}
          {syncStatus.pendingCount > 0 && syncStatus.failedCount > 0 && (
            <span className="mx-1">|</span>
          )}
          {syncStatus.failedCount > 0 && (
            <span className="text-red-600">실패: {syncStatus.failedCount}</span>
          )}
        </div>
      )}

      {/* 마지막 동기화 시간 */}
      <div className="text-xs text-gray-400">
        {lastSyncText}
      </div>

      {/* 수동 동기화 버튼 */}
      {isOnline && syncStatus.pendingCount > 0 && (
        <button
          onClick={handleSyncNow}
          disabled={isSyncing || syncStatus.isRunning}
          className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSyncing ? '동기화 중...' : '지금 동기화'}
        </button>
      )}
    </div>
  );
}

export function SyncStatusCard() {
  const { 
    isOnline, 
    syncStatus, 
    storageStats, 
    syncNow,
    clearStorage,
    cleanExpiredCache
  } = useOffline();
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleSyncNow = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      await syncNow();
    } catch (error) {
      console.error('동기화 실패:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearStorage = async () => {
    if (isClearing) return;

    const confirmed = window.confirm('모든 오프라인 데이터를 삭제하시겠습니까?');
    if (!confirmed) return;

    setIsClearing(true);
    try {
      await clearStorage();
    } catch (error) {
      console.error('저장소 정리 실패:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleCleanCache = async () => {
    try {
      await cleanExpiredCache();
    } catch (error) {
      console.error('캐시 정리 실패:', error);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium">동기화 상태</h3>
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className={`text-sm font-medium ${
            isOnline ? 'text-green-600' : 'text-red-600'
          }`}>
            {isOnline ? '온라인' : '오프라인'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {/* 동기화 상태 */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">동기화 상태:</span>
          <span className={`font-medium ${
            syncStatus.isRunning ? 'text-blue-600' : 
            syncStatus.failedCount > 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {syncStatus.isRunning ? '진행 중' : 
             syncStatus.failedCount > 0 ? '일부 실패' : '완료'}
          </span>
        </div>

        {/* 대기 중인 항목 */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">대기 중인 항목:</span>
          <span className="font-medium">{syncStatus.pendingCount}개</span>
        </div>

        {/* 실패한 항목 */}
        {syncStatus.failedCount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">실패한 항목:</span>
            <span className="font-medium text-red-600">{syncStatus.failedCount}개</span>
          </div>
        )}

        {/* 저장소 통계 */}
        <div className="border-t pt-3">
          <div className="mb-2 text-sm font-medium text-gray-700">저장소 사용량</div>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>오프라인 데이터:</span>
              <span>{storageStats.offlineDataCount}개</span>
            </div>
            <div className="flex justify-between">
              <span>동기화 대기열:</span>
              <span>{storageStats.syncQueueCount}개</span>
            </div>
            <div className="flex justify-between">
              <span>캐시된 응답:</span>
              <span>{storageStats.cacheCount}개</span>
            </div>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex space-x-2 pt-3">
          <button
            onClick={handleSyncNow}
            disabled={!isOnline || isSyncing || syncStatus.isRunning}
            className="flex-1 rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSyncing ? '동기화 중...' : '지금 동기화'}
          </button>
          
          <button
            onClick={handleCleanCache}
            className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            캐시 정리
          </button>
          
          <button
            onClick={handleClearStorage}
            disabled={isClearing}
            className="rounded border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {isClearing ? '정리 중...' : '전체 삭제'}
          </button>
        </div>
      </div>
    </div>
  );
}