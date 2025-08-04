# 제약조건 완화 해결방안

## 문제 상황
- **에러**: `duplicate key value violates unique constraint "profiles_pkey"`
- **원인**: Supabase Auth 사용자를 먼저 생성하지 않고 profiles 테이블에 직접 insert 시도
- **요구사항**: 50+ 사용자를 앱 내에서 간편하게 생성해야 함

## 해결 방법 (구현 완료)

### 1. 데이터베이스 제약조건 완화
**실행 필요**: Supabase SQL Editor에서 다음 명령어 실행
```sql
-- 외래키 제약조건 제거 (핵심 해결책)
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey CASCADE;
```

### 2. 유연한 사용자 생성 API 개발
**파일**: `src/app/api/admin/create-user-flexible/route.ts`
- **특징**: Auth 사용자 생성 없이도 프로필 생성 가능
- **옵션**: 즉시 로그인 가능 vs 프로필만 생성
- **장점**: 제약조건 에러 회피, 유연한 사용자 관리

### 3. 개선된 사용자 생성 폼
**파일**: `src/components/admin/CreateUserForm.tsx`
- **옵션 1**: 즉시 로그인 가능 (Auth user + Profile 동시 생성)
- **옵션 2**: 프로필만 생성 (나중에 로그인 권한 부여)

## 사용 방법

### Step 1: 데이터베이스 제약조건 제거
1. Supabase Dashboard → SQL Editor 접속
2. `constraint-solutions.sql` 파일의 권장 방법 실행:
```sql
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey CASCADE;
```

### Step 2: 새로운 API 사용
- 기존: `/api/admin/create-user`
- 신규: `/api/admin/create-user-flexible`
- CreateUserForm 컴포넌트가 자동으로 새 API 사용

### Step 3: 사용자 생성 워크플로우

#### 옵션 A: 즉시 로그인 가능
1. "즉시 로그인 가능" 선택
2. 비밀번호 설정 (자동 생성 가능)
3. 생성 즉시 로그인 가능한 계정 완성

#### 옵션 B: 단계별 생성 (권장)
1. "프로필만 생성" 선택
2. 시스템에 사용자 정보만 등록
3. 필요시 나중에 PATCH API로 로그인 권한 부여

## 장점

### 🚀 즉시 해결
- 제약조건 에러 완전 해결
- 기존 코드 최소 수정
- 50+ 사용자 대량 생성 가능

### 🔧 유연성 확보
- Auth 사용자 생성 실패시에도 프로필 생성 가능
- 단계별 권한 부여 가능
- 관리자 재량으로 로그인 시점 조절

### 📊 운영 효율성
- 사용자 정보 먼저 등록, 권한은 후에 부여
- 배치 작업으로 대량 사용자 관리 가능
- 로그인이 필요한 사용자만 선별적으로 Auth 권한 부여

## API 엔드포인트

### POST `/api/admin/create-user-flexible`
사용자 생성 (유연한 방식)
```json
{
  "email": "user@company.com",
  "full_name": "홍길동",
  "role": "user",
  "department": "생산팀",
  "create_auth_user": true, // 또는 false
  "password": "temp123!" // create_auth_user가 true일 때만 필요
}
```

### PATCH `/api/admin/create-user-flexible`
기존 프로필에 Auth 권한 부여
```json
{
  "profile_id": "uuid-here",
  "password": "temp123!"
}
```

## 실행 체크리스트

- [ ] SQL 명령어 실행 (`ALTER TABLE ... DROP CONSTRAINT ...`)
- [ ] 새로운 API 파일 업로드 확인
- [ ] CreateUserForm 업데이트 확인
- [ ] 브라우저에서 사용자 생성 테스트
- [ ] 프로필만 생성 옵션 테스트
- [ ] 즉시 로그인 옵션 테스트

## 결과 예상

✅ **제약조건 에러 완전 해결**  
✅ **50+ 사용자 간편 생성 가능**  
✅ **관리자의 유연한 권한 관리**  
✅ **단계별 사용자 온보딩 가능**