-- ================================================================
-- CNC 설비 관리 시스템 - 인증 및 RLS 문제 진단 스크립트
-- ================================================================

-- 1. profiles 테이블 상태 확인
DO $$
BEGIN
    RAISE NOTICE '=== PROFILES 테이블 진단 시작 ===';
END
$$;

-- 1.1 테이블 존재 및 구조 확인
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 1.2 현재 프로필 데이터 확인
SELECT 
    'profiles 데이터 현황' as info,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'manager' THEN 1 END) as manager_count,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count
FROM public.profiles;

-- 1.3 특정 사용자 ID 확인 (오류 발생한 ID)
SELECT 
    'specific_user' as type,
    id,
    email,
    role,
    full_name,
    is_active,
    created_at
FROM public.profiles 
WHERE id = 'b2600db8-300e-4c27-992a-f1cfcd6c3821'
UNION ALL
SELECT 
    'all_admins' as type,
    id,
    email,
    role,
    full_name,
    is_active,
    created_at
FROM public.profiles 
WHERE role = 'admin'
ORDER BY type, created_at;

-- 2. RLS 정책 상태 확인
DO $$
BEGIN
    RAISE NOTICE '=== RLS 정책 진단 시작 ===';
END
$$;

-- 2.1 profiles 테이블 RLS 활성화 상태
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') as policy_count
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 2.2 현재 적용된 RLS 정책 목록
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;

-- 3. 인증 관련 설정 확인
DO $$
BEGIN
    RAISE NOTICE '=== 인증 설정 진단 시작 ===';
END
$$;

-- 3.1 현재 인증 상태 확인
SELECT 
    'auth_info' as type,
    auth.uid() as current_user_id,
    auth.role() as current_role,
    current_setting('app.offline_mode', true) as offline_mode;

-- 3.2 auth.users 테이블 확인 (가능한 경우)
SELECT 
    'auth_users_count' as info,
    COUNT(*) as total_auth_users
FROM auth.users
WHERE deleted_at IS NULL;

-- 4. 오류 재현 테스트
DO $$
BEGIN
    RAISE NOTICE '=== 오류 재현 테스트 시작 ===';
END
$$;

-- 4.1 문제가 된 쿼리와 동일한 조건으로 테스트
BEGIN;
    -- 오프라인 모드 활성화하여 테스트
    SELECT set_config('app.offline_mode', 'true', true);
    
    -- 문제 쿼리 재현
    SELECT * FROM public.profiles WHERE id = 'b2600db8-300e-4c27-992a-f1cfcd6c3821';
    
    -- 오프라인 모드 비활성화하여 테스트
    SELECT set_config('app.offline_mode', 'false', true);
    
    -- 동일 쿼리 재테스트
    SELECT * FROM public.profiles WHERE id = 'b2600db8-300e-4c27-992a-f1cfcd6c3821';
    
ROLLBACK;

-- 5. 권한 및 접근성 테스트
DO $$
BEGIN
    RAISE NOTICE '=== 권한 테스트 시작 ===';
END
$$;

-- 5.1 다양한 방법으로 profiles 접근 시도
-- 전체 조회 테스트
SELECT 'count_test' as test, COUNT(*) as result FROM public.profiles;

-- 특정 컬럼만 조회 테스트
SELECT 'select_columns_test' as test, COUNT(*) as result 
FROM (SELECT id, email, role FROM public.profiles LIMIT 5) as sub;

-- 조건부 조회 테스트
SELECT 'where_test' as test, COUNT(*) as result 
FROM public.profiles WHERE role = 'admin';

-- 6. 잠재적 문제 탐지
DO $$
BEGIN
    RAISE NOTICE '=== 잠재적 문제 탐지 시작 ===';
END
$$;

-- 6.1 순환 참조 확인
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'profiles';

-- 6.2 인덱스 상태 확인
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- 7. 해결책 제안
DO $$
BEGIN
    RAISE NOTICE '=== 진단 완료 ===';
    RAISE NOTICE '결과를 확인하여 다음 중 해당하는 문제를 식별하세요:';
    RAISE NOTICE '1. profiles 테이블에 데이터가 없는 경우 → 관리자 계정 생성 필요';
    RAISE NOTICE '2. RLS 정책이 너무 제한적인 경우 → RLS 정책 수정 필요';
    RAISE NOTICE '3. 인증 토큰 문제인 경우 → 클라이언트 세션 초기화 필요';
    RAISE NOTICE '4. 테이블 구조 문제인 경우 → 스키마 재적용 필요';
END
$$;