import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Breakdown } from '../types';

interface NotificationPayload {
  breakdown_id: string;
  equipment_type: string;
  equipment_number: string;
  symptoms: string;
  occurred_at: string;
  reporter_id: string;
}

interface StatusChangePayload {
  breakdown_id: string;
  equipment_number: string;
  old_status: string;
  new_status: string;
}

interface UseRealtimeNotificationsOptions {
  onBreakdownCreated?: (payload: NotificationPayload) => void;
  onStatusChanged?: (payload: StatusChangePayload) => void;
  onError?: (error: Error) => void;
}

/**
 * 실시간 알림 관리를 위한 커스텀 훅
 */
export function useRealtimeNotifications(options: UseRealtimeNotificationsOptions = {}) {
  const { onBreakdownCreated, onStatusChanged, onError } = options;

  // 실시간 채널 구독
  useEffect(() => {
    const channel = supabase.channel('breakdown-notifications');

    // 고장 등록 알림 구독
    channel.on('broadcast', { event: 'breakdown-created' }, (payload) => {
      try {
        onBreakdownCreated?.(payload.payload as NotificationPayload);
        
        // 브라우저 알림 표시
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification('새로운 고장 신고', {
            body: `${payload.payload.equipment_type} ${payload.payload.equipment_number}에서 고장이 발생했습니다.`,
            icon: '/icons/breakdown-notification.png',
            tag: `breakdown-${payload.payload.breakdown_id}`,
            requireInteraction: true
          });

          notification.onclick = () => {
            window.focus();
            // 고장 상세 페이지로 이동
            window.location.href = `/breakdowns/${payload.payload.breakdown_id}`;
          };
        }
      } catch (error) {
        onError?.(error as Error);
      }
    });

    // 상태 변경 알림 구독
    channel.on('broadcast', { event: 'breakdown-status-changed' }, (payload) => {
      try {
        onStatusChanged?.(payload.payload as StatusChangePayload);
        
        // 브라우저 알림 표시
        if ('Notification' in window && Notification.permission === 'granted') {
          const statusText = getStatusText(payload.payload.new_status);
          const notification = new Notification('고장 상태 변경', {
            body: `${payload.payload.equipment_number}의 고장 상태가 '${statusText}'로 변경되었습니다.`,
            icon: '/icons/status-notification.png',
            tag: `status-${payload.payload.breakdown_id}`
          });

          notification.onclick = () => {
            window.focus();
            window.location.href = `/breakdowns/${payload.payload.breakdown_id}`;
          };
        }
      } catch (error) {
        onError?.(error as Error);
      }
    });

    // 채널 구독
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('실시간 알림 구독 완료');
      } else if (status === 'CHANNEL_ERROR') {
        onError?.(new Error('실시간 알림 채널 오류'));
      }
    });

    // 정리
    return () => {
      channel.unsubscribe();
    };
  }, [onBreakdownCreated, onStatusChanged, onError]);

  // 브라우저 알림 권한 요청
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('이 브라우저는 알림을 지원하지 않습니다.');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  // 테스트 알림 발송
  const sendTestNotification = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('테스트 알림', {
        body: '실시간 알림이 정상적으로 작동합니다.',
        icon: '/icons/test-notification.png'
      });
    }
  }, []);

  return {
    requestNotificationPermission,
    sendTestNotification
  };
}

/**
 * 상태 텍스트 변환 유틸리티
 */
function getStatusText(status: string): string {
  switch (status) {
    case 'in_progress':
      return '진행 중';
    case 'under_repair':
      return '수리 중';
    case 'completed':
      return '완료';
    default:
      return status;
  }
}

/**
 * 실시간 알림 발송 유틸리티
 */
export const sendBreakdownNotification = async (breakdown: Breakdown): Promise<void> => {
  try {
    const channel = supabase.channel('breakdown-notifications');
    
    await channel.send({
      type: 'broadcast',
      event: 'breakdown-created',
      payload: {
        breakdown_id: breakdown.id,
        equipment_type: breakdown.equipment_type,
        equipment_number: breakdown.equipment_number,
        symptoms: breakdown.symptoms,
        occurred_at: breakdown.occurred_at,
        reporter_id: breakdown.reporter_id
      }
    });
  } catch (error) {
    console.error('실시간 알림 발송 실패:', error);
    throw error;
  }
};

/**
 * 상태 변경 알림 발송 유틸리티
 */
export const sendStatusChangeNotification = async (
  breakdown: Breakdown, 
  newStatus: Breakdown['status']
): Promise<void> => {
  try {
    const channel = supabase.channel('breakdown-notifications');
    
    await channel.send({
      type: 'broadcast',
      event: 'breakdown-status-changed',
      payload: {
        breakdown_id: breakdown.id,
        equipment_number: breakdown.equipment_number,
        old_status: breakdown.status,
        new_status: newStatus
      }
    });
  } catch (error) {
    console.error('상태 변경 알림 발송 실패:', error);
    throw error;
  }
};