-- ================================================================
-- CNC 설비 관리 시스템 - 간단한 인증 문제 수정
-- 핵심만 빠르게 수정
-- ================================================================

-- 1. 긴급 메시지
DO $$
BEGIN
    RAISE NOTICE '인증 우회 문제를 즉시 수정합니다...';
END
$$;

-- 2. profiles 테이블 정책 완전 재설정
DROP POLICY IF EXISTS "allow_all_select_profiles" ON public.profiles;
DROP POLICY IF EXISTS "allow_own_update_profiles" ON public.profiles;
DROP POLICY IF EXISTS "allow_system_insert_profiles" ON public.profiles;

-- 인증된 사용자만 자신의 프로필 조회 가능
CREATE POLICY "auth_users_own_profile" ON public.profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- 관리자는 모든 프로필 조회 가능
CREATE POLICY "admin_all_profiles" ON public.profiles
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "users_update_own" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id);

-- 3. equipment_info 테이블 정책 수정
DROP POLICY IF EXISTS "allow_all_read_equipment" ON public.equipment_info;
DROP POLICY IF EXISTS "allow_authenticated_modify_equipment" ON public.equipment_info;

CREATE POLICY "auth_read_equipment" ON public.equipment_info
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);

-- 4. equipment_status 테이블 정책 수정
DROP POLICY IF EXISTS "allow_all_read_status" ON public.equipment_status;
DROP POLICY IF EXISTS "allow_authenticated_modify_status" ON public.equipment_status;

CREATE POLICY "auth_read_status" ON public.equipment_status
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_modify_status" ON public.equipment_status
    FOR ALL 
    USING (auth.uid() IS NOT NULL);

-- 5. breakdown_reports 테이블 정책 수정
DROP POLICY IF EXISTS "allow_all_read_breakdown" ON public.breakdown_reports;
DROP POLICY IF EXISTS "allow_all_insert_breakdown" ON public.breakdown_reports;
DROP POLICY IF EXISTS "allow_authenticated_update_breakdown" ON public.breakdown_reports;

CREATE POLICY "auth_read_breakdown" ON public.breakdown_reports
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_insert_breakdown" ON public.breakdown_reports
    FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- 6. repair_reports 테이블 정책 수정
DROP POLICY IF EXISTS "allow_all_read_repair" ON public.repair_reports;
DROP POLICY IF EXISTS "allow_authenticated_modify_repair" ON public.repair_reports;

CREATE POLICY "auth_read_repair" ON public.repair_reports
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_modify_repair" ON public.repair_reports
    FOR ALL 
    USING (auth.uid() IS NOT NULL);

-- 7. anon 역할 권한 완전 제거
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.equipment_info FROM anon;
REVOKE ALL ON public.equipment_status FROM anon;
REVOKE ALL ON public.breakdown_reports FROM anon;
REVOKE ALL ON public.repair_reports FROM anon;
REVOKE ALL ON public.system_settings FROM anon;

-- 8. authenticated 역할에만 기본 권한 부여
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.equipment_info TO authenticated;
GRANT ALL ON public.equipment_status TO authenticated;
GRANT ALL ON public.breakdown_reports TO authenticated;
GRANT ALL ON public.repair_reports TO authenticated;

-- 9. 간단한 테스트
SELECT 
    'RLS 정책 적용 완료' as status,
    auth.uid() as current_user,
    auth.role() as current_role;

-- 10. 정책 개수 확인
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'equipment_info', 'equipment_status', 'breakdown_reports', 'repair_reports')
GROUP BY tablename
ORDER BY tablename;

-- 11. 완료
DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '✅ 인증 필수 정책 적용 완료!';
    RAISE NOTICE '✅ anon 역할 권한 제거 완료!'; 
    RAISE NOTICE '';
    RAISE NOTICE '지금 즉시:';
    RAISE NOTICE '1. 브라우저 모든 데이터 삭제 (Ctrl+Shift+Delete)';
    RAISE NOTICE '2. 브라우저 재시작';
    RAISE NOTICE '3. 프로덕션 앱 접속 → 로그인 페이지 확인';
    RAISE NOTICE '=================================================================';
END
$$;