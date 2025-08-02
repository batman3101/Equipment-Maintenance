# CNC 설비 관리 시스템

CNC 현장의 설비 고장을 실시간으로 등록하고 관리하는 시스템입니다.

## 🚀 주요 기능

- **단순화된 인증 시스템**: 시스템 관리자 → 일반 관리자 → 사용자 계층 구조
- **실시간 고장 등록**: 설비 고장을 즉시 등록하고 추적
- **수리 내역 관리**: 수리 과정과 결과를 체계적으로 기록
- **권한 기반 접근**: 역할에 따른 차등 권한 제공
- **모바일 최적화**: 스마트폰 우선 UI/UX 설계

## 🏗️ 기술 스택

- **Frontend**: Next.js 15 (TypeScript)
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **State Management**: React Context API
- **UI Components**: 커스텀 컴포넌트 라이브러리

## 📋 시작하기

### 1. 환경 설정

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.local.example .env.local
```

### 2. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. `.env.local` 파일에 Supabase URL과 anon key 입력:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. `supabase-schema.sql` 파일의 내용을 Supabase SQL Editor에서 실행

### 3. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000에서 애플리케이션을 확인할 수 있습니다.

## 👥 사용자 계층

1. **시스템 관리자** (admin)
   - 모든 기능 접근 가능
   - 사용자 계정 생성 및 관리
   - 시스템 설정 변경

2. **일반 관리자** (manager)
   - 사용자 계정 생성 (admin 제외)
   - 모든 고장/수리 내역 조회 및 수정
   - 설비 정보 관리

3. **사용자** (user)
   - 고장 등록 및 자신이 등록한 고장 수정
   - 수리 내역 등록 및 수정
   - 모든 데이터 조회

## 🔐 인증 시스템

### 단순화된 설계 원칙

- **미들웨어 미사용**: 복잡성 제거
- **Supabase 직접 연결**: 클라이언트에서 직접 API 호출
- **최소한의 RLS**: 필수 보안만 적용
- **Context 기반 상태 관리**: 간단한 전역 상태 관리

### 로그인 플로우

1. 사용자가 이메일/비밀번호 입력
2. Supabase Auth로 인증
3. 프로필 정보 자동 조회
4. 대시보드 리다이렉트

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
├── components/
│   ├── auth/              # 인증 관련 컴포넌트
│   ├── ui/                # 공통 UI 컴포넌트
│   └── Dashboard.tsx      # 메인 대시보드
├── contexts/
│   └── AuthContext.tsx    # 인증 상태 관리
├── lib/
│   ├── auth.ts           # 인증 서비스 함수
│   └── supabase.ts       # Supabase 클라이언트 설정
└── styles/
    └── globals.css       # 전역 스타일
```

## 🎨 UI/UX 특징

- **모바일 우선**: 터치 최적화 인터페이스
- **다크모드 지원**: 시스템 설정 기반 자동 전환
- **상태 표시**: 직관적인 상태 배지 시스템
- **반응형 디자인**: 다양한 화면 크기 지원

## 🔧 개발 가이드

### 컴포넌트 개발

```tsx
// UI 컴포넌트 예제
import { Button, Card, Input } from '@/components/ui'

export function MyComponent() {
  return (
    <Card>
      <Card.Header>
        <h2>제목</h2>
      </Card.Header>
      <Card.Content>
        <Input label="입력 필드" />
        <Button variant="primary">확인</Button>
      </Card.Content>
    </Card>
  )
}
```

### 인증 보호 페이지

```tsx
import { ProtectedRoute } from '@/components/auth'

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  )
}
```

## 📝 데이터베이스 스키마

- `profiles`: 사용자 프로필 정보
- `equipment`: 설비 정보
- `breakdowns`: 고장 보고
- `repairs`: 수리 내역

자세한 스키마는 `supabase-schema.sql` 파일을 참조하세요.

## 🚀 배포

### Vercel 배포

1. GitHub에 코드 push
2. Vercel에서 프로젝트 import
3. 환경 변수 설정
4. 자동 배포 완료

### 환경 변수

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📱 PWA 지원

추후 오프라인 지원 및 푸시 알림 기능을 추가할 예정입니다.

## 🤝 기여하기

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 지원

문제나 질문이 있으시면 Issue를 생성해 주세요.
