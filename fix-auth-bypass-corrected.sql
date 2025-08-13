-- ================================================================
-- CNC 설비 관리 시스템 - 인증 우회 문제 긴급 수정 (수정된 버전)
-- 인증 없이 로그인되는 문제 해결
-- ================================================================

-- 1. 현재 문제 상황 확인
DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '경고: 현재 인증 없이도 접근 가능한 상태입니다!';
    RAISE NOTICE '즉시 RLS 정책을 수정합니다.';
    RAISE NOTICE '=================================================================';
END
$$;

-- 2. profiles 테이블의 너무 관대한 정책 제거
DROP POLICY IF EXISTS "allow_all_select_profiles" ON public.profiles;
DROP POLICY IF EXISTS "allow_own_update_profiles" ON public.profiles;
DROP POLICY IF EXISTS "allow_system_insert_profiles" ON public.profiles;

-- 3. profiles 테이블에 적절한 인증 기반 정책 생성
-- 3.1 인증된 사용자만 profiles 조회 가능
CREATE POLICY "authenticated_select_profiles" ON public.profiles
    FOR SELECT 
    USING (
        -- 인증된 사용자는 자신의 프로필 조회 가능
        auth.uid() = id 
        OR 
        -- 관리자는 모든 프로필 조회 가능
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- 3.2 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "authenticated_update_own_profile" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 3.3 프로필 생성은 auth 트리거를 통해서만 가능
CREATE POLICY "system_insert_profiles" ON public.profiles
    FOR INSERT 
    WITH CHECK (
        -- 새 사용자 가입 시 auth.users 트리거가 생성
        auth.uid() = id
    );

-- 4. 다른 테이블들도 인증 필수로 수정

-- 4.1 equipment_info - 인증된 사용자만 접근
DROP POLICY IF EXISTS "allow_all_read_equipment" ON public.equipment_info;
DROP POLICY IF EXISTS "allow_authenticated_modify_equipment" ON public.equipment_info;

CREATE POLICY "authenticated_read_equipment" ON public.equipment_info
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);  -- 인증 필수

CREATE POLICY "managers_modify_equipment" ON public.equipment_info
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- 4.2 equipment_status - 인증된 사용자만 접근
DROP POLICY IF EXISTS "allow_all_read_status" ON public.equipment_status;
DROP POLICY IF EXISTS "allow_authenticated_modify_status" ON public.equipment_status;

CREATE POLICY "authenticated_read_status" ON public.equipment_status
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);  -- 인증 필수

CREATE POLICY "authenticated_modify_status" ON public.equipment_status
    FOR ALL 
    USING (auth.uid() IS NOT NULL);

-- 4.3 breakdown_reports - 인증된 사용자만 접근
DROP POLICY IF EXISTS "allow_all_read_breakdown" ON public.breakdown_reports;
DROP POLICY IF EXISTS "allow_all_insert_breakdown" ON public.breakdown_reports;
DROP POLICY IF EXISTS "allow_authenticated_update_breakdown" ON public.breakdown_reports;

CREATE POLICY "authenticated_read_breakdown" ON public.breakdown_reports
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);  -- 인증 필수

CREATE POLICY "authenticated_insert_breakdown" ON public.breakdown_reports
    FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authorized_update_breakdown" ON public.breakdown_reports
    FOR UPDATE 
    USING (
        auth.uid() = reported_by 
        OR auth.uid() = assigned_to
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- 4.4 repair_reports - 인증된 사용자만 접근
DROP POLICY IF EXISTS "allow_all_read_repair" ON public.repair_reports;
DROP POLICY IF EXISTS "allow_authenticated_modify_repair" ON public.repair_reports;

CREATE POLICY "authenticated_read_repair" ON public.repair_reports
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);  -- 인증 필수

CREATE POLICY "authorized_modify_repair" ON public.repair_reports
    FOR ALL 
    USING (
        auth.uid() = technician_id
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- 5. 권한 설정 수정 - anon 역할의 과도한 권한 제거
-- anon (인증되지 않은 사용자)는 아무것도 할 수 없어야 함
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.equipment_info FROM anon;
REVOKE ALL ON public.equipment_status FROM anon;
REVOKE ALL ON public.breakdown_reports FROM anon;
REVOKE ALL ON public.repair_reports FROM anon;
REVOKE ALL ON public.system_settings FROM anon;

-- authenticated 역할은 RLS 정책에 따라 접근
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.equipment_info TO authenticated;
GRANT ALL ON public.equipment_status TO authenticated;
GRANT ALL ON public.breakdown_reports TO authenticated;
GRANT SELECT ON public.repair_reports TO authenticated;
GRANT SELECT ON public.system_settings TO authenticated;

-- service_role은 모든 권한 (백엔드 작업용)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- 6. 인증 확인 함수 생성 (디버깅용) - 수정된 버전
CREATE OR REPLACE FUNCTION check_auth_status()
RETURNS TABLE (
    current_user_id UUID,
    user_role TEXT,
    is_authenticated BOOLEAN,
    profile_exists BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        auth.uid() as current_user_id,
        auth.role() as user_role,
        (auth.uid() IS NOT NULL) as is_authenticated,
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()) as profile_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 인증 테스트
SELECT * FROM check_auth_status();

-- 8. 최종 상태 확인
SELECT 
    'Final Auth Status' as status,
    tablename,
    COUNT(policyname) as policy_count,
    STRING_AGG(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'equipment_info', 'equipment_status', 'breakdown_reports', 'repair_reports')
GROUP BY tablename
ORDER BY tablename;

-- 9. anon 역할 권한 확인
SELECT 
    'Anon Permissions' as check_type,
    schemaname,
    tablename,
    privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'anon'
    AND schemaname = 'public'
    AND tablename IN ('profiles', 'equipment_info', 'equipment_status', 'breakdown_reports', 'repair_reports')
ORDER BY tablename, privilege_type;

-- 10. 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '인증 우회 문제 수정 완료!';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '✅ 모든 테이블에 인증 필수 정책 적용';
    RAISE NOTICE '✅ anon 역할의 모든 권한 제거';
    RAISE NOTICE '✅ 인증된 사용자만 시스템 접근 가능';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  중요: 브라우저 캐시와 쿠키를 완전히 삭제하세요!';
    RAISE NOTICE '';
    RAISE NOTICE '프로덕션 앱에서:';
    RAISE NOTICE '1. 브라우저의 모든 데이터 삭제 (Ctrl+Shift+Delete)';
    RAISE NOTICE '2. 브라우저 재시작';
    RAISE NOTICE '3. 로그인 페이지가 나타나는지 확인';
    RAISE NOTICE '4. 정상적으로 로그인 필요';
    RAISE NOTICE '=================================================================';
END
$$;