/**
 * 애니메이션 최적화 유틸리티
 * 모바일 성능 최적화를 위한 애니메이션 관련 함수
 */

/**
 * 애니메이션 성능 최적화 설정
 * 디바이스 성능에 따라 애니메이션 품질 조정
 */
export function setupAnimationOptimization(): void {
  if (typeof window === 'undefined') return;

  // 디바이스 성능 감지
  const isLowEndDevice = isLowPerformanceDevice();
  
  // 저사양 디바이스인 경우 애니메이션 최적화
  if (isLowEndDevice) {
    // CSS 변수로 애니메이션 설정 제어
    document.documentElement.style.setProperty('--enable-animations', '0');
    document.documentElement.style.setProperty('--transition-duration', '0ms');
    document.documentElement.classList.add('reduce-motion');
  } else {
    document.documentElement.style.setProperty('--enable-animations', '1');
    document.documentElement.style.setProperty('--transition-duration', '300ms');
  }
}

/**
 * 저사양 디바이스 감지
 * 디바이스 메모리, CPU 코어 수, 네트워크 상태 등을 기준으로 판단
 */
export function isLowPerformanceDevice(): boolean {
  if (typeof window === 'undefined') return false;

  // 메모리 확인 (2GB 이하면 저사양으로 간주)
  const lowMemory = 'deviceMemory' in navigator && (navigator as any).deviceMemory < 2;

  // CPU 코어 수 확인 (2개 이하면 저사양으로 간주)
  const lowCPU = 'hardwareConcurrency' in navigator && navigator.hardwareConcurrency < 3;

  // 네트워크 상태 확인
  const connection = (navigator as any).connection;
  const slowNetwork = connection && 
    (connection.effectiveType === 'slow-2g' || 
     connection.effectiveType === '2g' || 
     connection.effectiveType === '3g');

  // 저사양 디바이스 판단 (메모리, CPU, 네트워크 중 2개 이상 해당되면 저사양)
  const factors = [lowMemory, lowCPU, slowNetwork].filter(Boolean).length;
  return factors >= 2;
}

/**
 * 애니메이션 프레임 제한
 * 저사양 디바이스에서 애니메이션 프레임 레이트 제한
 */
export function limitAnimationFrames(callback: FrameRequestCallback): () => void {
  if (typeof window === 'undefined') return () => {};

  const isLowEnd = isLowPerformanceDevice();
  let frameId: number;
  let lastTime = 0;
  
  // 저사양 디바이스는 30fps로 제한, 고사양은 60fps
  const frameLimit = isLowEnd ? 33.33 : 16.66; // 30fps: ~33.33ms, 60fps: ~16.66ms
  
  const animate = (time: number) => {
    frameId = requestAnimationFrame(animate);
    
    const delta = time - lastTime;
    if (delta >= frameLimit) {
      lastTime = time;
      callback(time);
    }
  };
  
  frameId = requestAnimationFrame(animate);
  
  return () => {
    cancelAnimationFrame(frameId);
  };
}

/**
 * 애니메이션 일시 중지
 * 백그라운드 탭이나 저전력 모드에서 애니메이션 일시 중지
 */
export function setupAnimationPause(): () => void {
  if (typeof window === 'undefined') return () => {};

  let animationsPaused = false;
  
  // 페이지 가시성 변경 시 애니메이션 제어
  const handleVisibilityChange = () => {
    if (document.hidden) {
      document.documentElement.classList.add('animations-paused');
      animationsPaused = true;
    } else {
      document.documentElement.classList.remove('animations-paused');
      animationsPaused = false;
    }
  };
  
  // 배터리 상태 확인 (저전력 모드에서 애니메이션 제한)
  const handleBatteryChange = (battery: any) => {
    if (battery.charging === false && battery.level < 0.15) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // 배터리 API 지원 확인
  if ('getBattery' in navigator) {
    (navigator as any).getBattery().then((battery: any) => {
      handleBatteryChange(battery);
      
      battery.addEventListener('chargingchange', () => handleBatteryChange(battery));
      battery.addEventListener('levelchange', () => handleBatteryChange(battery));
    });
  }
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}