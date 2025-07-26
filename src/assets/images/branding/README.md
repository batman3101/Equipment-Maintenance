# 브랜딩 에셋 가이드

이 디렉토리는 CNC 설비 관리 시스템의 브랜딩 관련 이미지 에셋을 관리합니다.

## 폴더 구조

### `/logos`
회사 로고 파일들을 저장합니다.
- `logo-full.svg` - 전체 로고 (텍스트 포함)
- `logo-full-dark.svg` - 다크모드용 전체 로고
- `logo-horizontal.svg` - 가로 버전 로고
- `logo-horizontal-dark.svg` - 다크모드용 가로 버전 로고
- `logo-stacked.svg` - 세로 버전 로고
- `logo-stacked-dark.svg` - 다크모드용 세로 버전 로고

### `/symbols`
회사 심볼/아이콘 파일들을 저장합니다.
- `symbol.svg` - 기본 심볼
- `symbol-dark.svg` - 다크모드용 심볼
- `favicon.ico` - 파비콘
- `symbol-16x16.png` - 16x16 픽셀 심볼
- `symbol-32x32.png` - 32x32 픽셀 심볼
- `symbol-64x64.png` - 64x64 픽셀 심볼

## 사용 가이드라인

### 색상 모드 지원
- 라이트 모드: 기본 파일명 사용
- 다크 모드: `-dark` 접미사 파일 사용
- 시스템 모드: 브라우저 설정에 따라 자동 선택

### 파일 형식
- **SVG**: 벡터 그래픽, 확대/축소 시 품질 유지
- **PNG**: 래스터 이미지, 고정 크기
- **ICO**: 파비콘 전용

### 사용 예시
```typescript
import { useTheme } from '@/contexts/ThemeContext';

const Logo = () => {
  const { theme } = useTheme();
  const logoSrc = theme === 'dark' 
    ? '/assets/images/branding/logos/logo-full-dark.svg'
    : '/assets/images/branding/logos/logo-full.svg';
    
  return <img src={logoSrc} alt="Company Logo" />;
};
```

## 파일 추가 시 주의사항
1. 파일명은 kebab-case 사용
2. 다크모드 버전은 반드시 `-dark` 접미사 사용
3. SVG 파일은 최적화된 형태로 저장
4. 저작권 및 라이선스 확인 필수