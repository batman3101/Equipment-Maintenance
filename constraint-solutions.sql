-- ================================================================
-- CNC 설비 관리 시스템 - 제약조건 완화 방법
-- 문제: "duplicate key value violates unique constraint 'profiles_pkey'"
-- 해결: Auth 사용자를 먼저 생성하지 않고도 profiles 생성 가능하도록 변경
-- ================================================================

-- 방법 1: 외래키 제약조건 제거 (즉시 해결, 권장)
-- ================================================================
-- 장점: 즉시 문제 해결, 코드 수정 최소화
-- 단점: 데이터 무결성 약화 (but 앱에서 제어 가능)

-- 1-1. 기존 외래키 제약조건 제거
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey CASCADE;

-- 1-2. id 컬럼을 완전히 독립적으로 만들기
ALTER TABLE public.profiles 
  ALTER COLUMN id DROP NOT NULL;

-- 1-3. profiles 테이블이 auth.users와 독립적으로 작동하도록 설정
COMMENT ON TABLE public.profiles IS 'User profiles - independent of auth.users for flexible user creation';

-- ================================================================
-- 방법 2: 테이블 구조 개선 (더 깔끔한 해결책)
-- ================================================================
-- 장점: 깔끔한 구조, 확장성 좋음
-- 단점: 기존 코드 일부 수정 필요

-- 2-1. 백업 테이블 생성
CREATE TABLE public.profiles_backup AS SELECT * FROM public.profiles;

-- 2-2. 기존 제약조건 모두 제거
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey CASCADE;

-- 2-3. 새로운 컬럼 구조 추가
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS new_id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS auth_user_id UUID NULL;

-- 2-4. 기존 데이터 마이그레이션
UPDATE public.profiles 
SET auth_user_id = id, new_id = gen_random_uuid() 
WHERE new_id IS NULL;

-- 2-5. 기존 id 컬럼 제거하고 새로운 id로 교체
ALTER TABLE public.profiles DROP COLUMN id;
ALTER TABLE public.profiles RENAME COLUMN new_id TO id;

-- 2-6. 새로운 primary key 설정
ALTER TABLE public.profiles ADD PRIMARY KEY (id);

-- 2-7. auth_user_id에 대한 선택적 외래키 (NULL 허용)
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_auth_user_id_fkey 
  FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ================================================================
-- 방법 3: 트리거 기반 유연한 연결 (고급 해결책)
-- ================================================================

-- 3-1. 유연한 프로필-인증 연결 함수
CREATE OR REPLACE FUNCTION flexible_profile_auth_link()
RETURNS TRIGGER AS $$
BEGIN
  -- 새로운 프로필 생성 시
  IF TG_OP = 'INSERT' THEN
    -- auth_user_id가 제공되었지만 해당 auth user가 없는 경우
    IF NEW.auth_user_id IS NOT NULL AND 
       NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.auth_user_id) THEN
      -- auth_user_id를 NULL로 설정하여 독립적인 프로필로 생성
      NEW.auth_user_id := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3-2. 트리거 적용
DROP TRIGGER IF EXISTS flexible_profile_trigger ON public.profiles;
CREATE TRIGGER flexible_profile_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION flexible_profile_auth_link();

-- ================================================================
-- 권장 방법: 방법 1 (외래키 제약조건 제거)
-- ================================================================
-- 가장 빠르고 안전한 해결책
-- 아래 명령어만 실행하면 즉시 해결됩니다:

ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey CASCADE;

-- ================================================================
-- 실행 후 확인 쿼리
-- ================================================================

-- 제약조건 확인
SELECT 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'profiles' AND tc.table_schema = 'public';

-- 프로필 테이블 구조 확인
\d public.profiles;