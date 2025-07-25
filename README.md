# CNC 설비 고장 관리 웹앱

현장 엔지니어들이 스마트폰을 통해 설비 고장을 실시간으로 등록하고 관리할 수 있는 모바일 최우선 PWA입니다.

## 기술 스택

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **State Management**: React Context + SWR
- **Code Quality**: ESLint, Prettier
- **Deployment**: Vercel

## 개발 환경 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local.example` 파일을 복사하여 `.env.local` 파일을 생성하고 Supabase 설정을 입력하세요:

```bash
cp .env.local.example .env.local
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 사용 가능한 스크립트

- `npm run dev` - 개발 서버 실행 (Turbopack 사용)
- `npm run build` - 프로덕션 빌드
- `npm run start` - 프로덕션 서버 실행
- `npm run lint` - ESLint 검사
- `npm run lint:fix` - ESLint 자동 수정
- `npm run format` - Prettier 포맷팅
- `npm run format:check` - Prettier 검사
- `npm run type-check` - TypeScript 타입 검사

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # 전역 스타일 및 디자인 시스템
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 홈 페이지
├── lib/                   # 유틸리티 및 설정
│   ├── constants.ts       # 앱 상수
│   ├── supabase.ts        # Supabase 클라이언트 설정
│   └── utils.ts           # 공통 유틸리티 함수
└── domains/               # 도메인별 코드 (향후 추가)
    ├── auth/
    ├── equipment/
    ├── breakdown/
    └── repair/
```

## 디자인 시스템

### 색상 팔레트

- **Primary**: Blue (#2563eb) - 주요 액션 및 브랜딩
- **Success**: Green (#10b981) - 완료 상태
- **Warning**: Amber (#f59e0b) - 진행 중 상태
- **Error**: Red (#ef4444) - 오류 및 위험 상태
- **Info**: Blue (#3b82f6) - 수리 중 상태

### 상태별 스타일

- `.status-in-progress` - 진행 중 (노란색)
- `.status-under-repair` - 수리 중 (파란색)
- `.status-completed` - 완료 (초록색)

### 모바일 최적화

- 최소 터치 영역: 44px
- 반응형 디자인
- PWA 지원

## 코드 품질

### ESLint 규칙

- TypeScript 엄격 모드
- React Hooks 규칙
- Import 정렬
- 코드 스타일 일관성

### Prettier 설정

- 세미콜론 사용
- 싱글 쿼트
- 80자 줄 길이 제한
- Tailwind CSS 클래스 정렬

## 환경 변수

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 다음 단계

1. Supabase 프로젝트 생성 및 데이터베이스 스키마 설정
2. 인증 시스템 구현
3. 고장 등록 기능 개발
4. 수리 내역 기록 기능 개발
5. 대시보드 및 조회 기능 구현

## 라이선스

MIT License# First Deploy
\n# Trigger redeploy
