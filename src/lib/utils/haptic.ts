/**
 * 햅틱 피드백 유틸리티
 * 모바일 디바이스에서 터치 인터랙션 향상을 위한 함수
 */

/**
 * 햅틱 피드백 타입
 */
export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * 햅틱 피드백 실행 함수
 * @param type 햅틱 피드백 타입
 * @returns 햅틱 피드백 지원 여부
 */
export function triggerHapticFeedback(type: HapticFeedbackType = 'light'): boolean {
  // 브라우저 환경이 아니면 실행하지 않음
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  try {
    // iOS 13+ 햅틱 엔진 지원 확인
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate(30);
          break;
        case 'success':
          navigator.vibrate([10, 30, 10]);
          break;
        case 'warning':
          navigator.vibrate([30, 50, 30]);
          break;
        case 'error':
          navigator.vibrate([50, 100, 50]);
          break;
        default:
          navigator.vibrate(10);
      }
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Haptic feedback error:', error);
    return false;
  }
}

/**
 * 터치 이벤트에 햅틱 피드백 추가 함수
 * @param callback 원래 콜백 함수
 * @param type 햅틱 피드백 타입
 * @returns 햅틱 피드백이 추가된 콜백 함수
 */
export function withHapticFeedback<T extends (...args: any[]) => any>(
  callback: T,
  type: HapticFeedbackType = 'light'
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>) => {
    triggerHapticFeedback(type);
    return callback(...args);
  };
}