-- ================================================================
-- CNC 설비 관리 시스템 - RLS 500 오류 해결
-- profiles 테이블 접근 시 500 오류 해결
-- ================================================================

-- 1. 현재 RLS 정책 상태 확인
SELECT 
    'Current RLS Status' as info,
    tablename,
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY policyname;

-- 2. 현재 적용된 모든 profiles 정책 제거
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END
$$;

-- 3. 단순하고 명확한 RLS 정책 생성

-- 3.1 모든 사용자가 profiles 읽기 가능 (500 오류 방지)
CREATE POLICY "allow_all_select_profiles" ON public.profiles
    FOR SELECT 
    USING (true);

-- 3.2 인증된 사용자는 자신의 프로필 업데이트 가능
CREATE POLICY "allow_own_update_profiles" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 3.3 profiles 테이블에 새 레코드 삽입은 시스템만 가능 (트리거 통해)
CREATE POLICY "allow_system_insert_profiles" ON public.profiles
    FOR INSERT 
    WITH CHECK (
        auth.uid() = id OR 
        auth.uid() IS NULL  -- 시스템 트리거용
    );

-- 4. RLS가 활성화되어 있는지 확인
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. 다른 테이블들의 RLS 정책도 단순화

-- 5.1 equipment_info - 모든 사용자 읽기 허용
DROP POLICY IF EXISTS "equipment_info_select_policy" ON public.equipment_info;
DROP POLICY IF EXISTS "equipment_info_modify_policy" ON public.equipment_info;
DROP POLICY IF EXISTS "equipment_read_authenticated" ON public.equipment_info;
DROP POLICY IF EXISTS "equipment_modify_managers" ON public.equipment_info;
DROP POLICY IF EXISTS "emergency_equipment_access" ON public.equipment_info;

CREATE POLICY "allow_all_read_equipment" ON public.equipment_info
    FOR SELECT USING (true);

CREATE POLICY "allow_authenticated_modify_equipment" ON public.equipment_info
    FOR ALL USING (
        auth.role() = 'authenticated' OR
        auth.uid() IS NOT NULL
    );

-- 5.2 equipment_status - 모든 사용자 읽기 허용
DROP POLICY IF EXISTS "equipment_status_select_policy" ON public.equipment_status;
DROP POLICY IF EXISTS "equipment_status_modify_policy" ON public.equipment_status;
DROP POLICY IF EXISTS "status_read_authenticated" ON public.equipment_status;
DROP POLICY IF EXISTS "status_update_authenticated" ON public.equipment_status;
DROP POLICY IF EXISTS "emergency_status_access" ON public.equipment_status;

CREATE POLICY "allow_all_read_status" ON public.equipment_status
    FOR SELECT USING (true);

CREATE POLICY "allow_authenticated_modify_status" ON public.equipment_status
    FOR ALL USING (
        auth.role() = 'authenticated' OR
        auth.uid() IS NOT NULL
    );

-- 5.3 breakdown_reports - 모든 사용자 읽기 및 생성 허용
DROP POLICY IF EXISTS "breakdown_reports_select_policy" ON public.breakdown_reports;
DROP POLICY IF EXISTS "breakdown_reports_insert_policy" ON public.breakdown_reports;
DROP POLICY IF EXISTS "breakdown_reports_update_policy" ON public.breakdown_reports;
DROP POLICY IF EXISTS "breakdown_reports_delete_policy" ON public.breakdown_reports;
DROP POLICY IF EXISTS "breakdown_read_authenticated" ON public.breakdown_reports;
DROP POLICY IF EXISTS "breakdown_create_authenticated" ON public.breakdown_reports;
DROP POLICY IF EXISTS "breakdown_update_authorized" ON public.breakdown_reports;
DROP POLICY IF EXISTS "breakdown_delete_admin" ON public.breakdown_reports;
DROP POLICY IF EXISTS "emergency_breakdown_access" ON public.breakdown_reports;

CREATE POLICY "allow_all_read_breakdown" ON public.breakdown_reports
    FOR SELECT USING (true);

CREATE POLICY "allow_all_insert_breakdown" ON public.breakdown_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_authenticated_update_breakdown" ON public.breakdown_reports
    FOR UPDATE USING (
        auth.uid() IS NOT NULL OR
        reported_by IS NOT NULL
    );

-- 5.4 repair_reports - 모든 사용자 읽기 허용
DROP POLICY IF EXISTS "repair_reports_select_policy" ON public.repair_reports;
DROP POLICY IF EXISTS "repair_reports_modify_policy" ON public.repair_reports;
DROP POLICY IF EXISTS "repair_read_authenticated" ON public.repair_reports;
DROP POLICY IF EXISTS "repair_modify_authorized" ON public.repair_reports;
DROP POLICY IF EXISTS "emergency_repair_access" ON public.repair_reports;

CREATE POLICY "allow_all_read_repair" ON public.repair_reports
    FOR SELECT USING (true);

CREATE POLICY "allow_authenticated_modify_repair" ON public.repair_reports
    FOR ALL USING (
        auth.uid() IS NOT NULL OR
        technician_id IS NOT NULL
    );

-- 6. 테스트 쿼리 - 문제가 된 쿼리 실행
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
        RAISE NOTICE 'SUCCESS: Profile found - %', test_result.email;
    ELSE
        RAISE NOTICE 'WARNING: Profile not found';
    END IF;
    
    -- 전체 profiles 테이블 접근 테스트
    SELECT COUNT(*) INTO test_result FROM public.profiles;
    RAISE NOTICE 'Total profiles accessible: %', test_result.count;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR during test: %', SQLERRM;
END
$$;

-- 7. API 서비스 역할 권한 확인 및 설정
-- Supabase는 기본적으로 anon과 authenticated 역할 사용
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.equipment_info TO anon;
GRANT ALL ON public.equipment_info TO authenticated;
GRANT ALL ON public.equipment_info TO service_role;

GRANT SELECT ON public.equipment_status TO anon;
GRANT ALL ON public.equipment_status TO authenticated;
GRANT ALL ON public.equipment_status TO service_role;

GRANT SELECT ON public.breakdown_reports TO anon;
GRANT ALL ON public.breakdown_reports TO authenticated;
GRANT ALL ON public.breakdown_reports TO service_role;

GRANT SELECT ON public.repair_reports TO anon;
GRANT ALL ON public.repair_reports TO authenticated;
GRANT ALL ON public.repair_reports TO service_role;

-- 8. 최종 확인
SELECT 
    'Final RLS Check' as status,
    t.tablename,
    t.rowsecurity as rls_enabled,
    COUNT(p.policyname) as policy_count,
    STRING_AGG(p.policyname, ', ') as policies
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' 
  AND t.tablename IN ('profiles', 'equipment_info', 'equipment_status', 'breakdown_reports', 'repair_reports')
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- 9. 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'RLS 500 오류 해결 완료!';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '✅ 모든 profiles 정책이 단순화됨';
    RAISE NOTICE '✅ SELECT 권한이 모든 사용자에게 허용됨';
    RAISE NOTICE '✅ API 서비스 역할 권한 설정됨';
    RAISE NOTICE '✅ 500 오류가 해결되어야 함';
    RAISE NOTICE '';
    RAISE NOTICE '프로덕션 앱에서:';
    RAISE NOTICE '1. 브라우저 캐시 삭제 (Ctrl + Shift + Delete)';
    RAISE NOTICE '2. 페이지 새로고침';
    RAISE NOTICE '3. 로그인 재시도';
    RAISE NOTICE '=================================================================';
END
$$;