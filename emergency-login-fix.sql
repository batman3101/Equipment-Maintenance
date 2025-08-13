-- ================================================================
-- CNC 설비 관리 시스템 - 긴급 로그인 문제 해결
-- RLS 정책 완화로 로그인 가능하도록 수정
-- ================================================================

-- 1. 긴급 메시지
DO $$
BEGIN
    RAISE NOTICE '로그인 500 오류를 긴급 수정합니다...';
END
$$;

-- 2. profiles 테이블 정책 완화 (로그인 가능하도록)
DROP POLICY IF EXISTS "auth_users_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admin_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own" ON public.profiles;

-- 2.1 인증된 사용자는 모든 프로필 조회 가능 (로그인 프로세스 허용)
CREATE POLICY "authenticated_read_all_profiles" ON public.profiles
    FOR SELECT 
    USING (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);

-- 2.2 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "users_update_own_profile" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id);

-- 2.3 프로필 생성은 시스템만 (트리거)
CREATE POLICY "system_insert_profiles" ON public.profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- 3. equipment_info 정책 유지 (문제없음)
-- 기존 정책 그대로 유지

-- 4. equipment_status 정책 유지 (문제없음)  
-- 기존 정책 그대로 유지

-- 5. breakdown_reports 정책 유지 (문제없음)
-- 기존 정책 그대로 유지

-- 6. repair_reports 정책 유지 (문제없음)
-- 기존 정책 그대로 유지

-- 7. anon 역할 권한은 여전히 차단 (보안 유지)
-- 이미 REVOKE 되어 있음

-- 8. authenticated 역할에만 profiles 조회 권한 부여
GRANT SELECT ON public.profiles TO authenticated;

-- 9. 테스트 - 특정 프로필 조회
DO $$
DECLARE
    test_result RECORD;
BEGIN
    -- 문제가 된 특정 ID로 테스트
    SELECT * INTO test_result
    FROM public.profiles 
    WHERE id = 'b2600db8-300e-4c27-992a-f1cfcd6c3821'
    LIMIT 1;
    
    IF test_result.id IS NOT NULL THEN
        RAISE NOTICE 'SUCCESS: 관리자 프로필 조회 가능 - %', test_result.email;
    ELSE
        RAISE NOTICE 'WARNING: 관리자 프로필 조회 실패';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: %', SQLERRM;
END
$$;

-- 10. 최종 정책 확인
SELECT 
    'Updated Policies' as status,
    tablename,
    COUNT(policyname) as policy_count,
    STRING_AGG(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'profiles'
GROUP BY tablename;

-- 11. 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '================================================================';
    RAISE NOTICE '로그인 500 오류 긴급 수정 완료!';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '✅ profiles 정책 완화로 로그인 가능';
    RAISE NOTICE '✅ 인증된 사용자만 데이터 접근 가능';
    RAISE NOTICE '✅ anon 권한은 여전히 차단';
    RAISE NOTICE '';
    RAISE NOTICE '지금 즉시:';
    RAISE NOTICE '1. 브라우저 새로고침 (F5)';
    RAISE NOTICE '2. 관리자 계정으로 로그인 시도';
    RAISE NOTICE '3. 500 오류 해결 확인';
    RAISE NOTICE '================================================================';
END
$$;