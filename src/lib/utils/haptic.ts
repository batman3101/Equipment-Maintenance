// 햅틱 피드백 타입 정의
export enum HapticFeedbackType {
  light = 'light',
  medium = 'medium',
  heavy = 'heavy',
  success = 'success',
  warning = 'warning',
  error = 'error',
}

// 햅틱 피드백 트리거 함수
export function triggerHapticFeedback(type: HapticFeedbackType | keyof typeof HapticFeedbackType) {
  // 브라우저에서 햅틱 피드백 지원 여부 확인
  if ('vibrate' in navigator) {
    let pattern: number | number[];
    
    switch (type) {
      case HapticFeedbackType.light:
      case 'light':
        pattern = 10;
        break;
      case HapticFeedbackType.medium:
      case 'medium':
        pattern = 20;
        break;
      case HapticFeedbackType.heavy:
      case 'heavy':
        pattern = 50;
        break;
      case HapticFeedbackType.success:
      case 'success':
        pattern = [10, 50, 10];
        break;
      case HapticFeedbackType.warning:
      case 'warning':
        pattern = [20, 100, 20];
        break;
      case HapticFeedbackType.error:
      case 'error':
        pattern = [50, 100, 50, 100, 50];
        break;
      default:
        pattern = 10;
    }
    
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      // 햅틱 피드백 실패 시 무시
      console.debug('Haptic feedback not supported or failed:', error);
    }
  }
}