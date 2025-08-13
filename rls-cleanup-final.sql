-- ================================================================
-- RLS 정책 완전 정리 - 모든 기존 정책 제거 후 새로운 정책만 적용
-- ================================================================

-- 1. 모든 기존 RLS 정책 완전 제거
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- 각 테이블의 모든 정책 제거
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'equipment_info', 'equipment_status', 'breakdown_reports', 'repair_reports', 'system_settings')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename);
        RAISE NOTICE '정책 제거됨: %.%', policy_record.tablename, policy_record.policyname;
    END LOOP;
    
    RAISE NOTICE '모든 기존 RLS 정책이 제거되었습니다.';
END
$$;

-- 2. 새로운 깔끔한 RLS 정책 생성
-- 2.1. profiles 테이블 정책
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (
    -- 인증된 사용자의 경우 자신의 프로필 또는 관리자인 경우 모든 프로필
    (auth.uid() IS NOT NULL AND (auth.uid() = id OR 
     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')))) OR
    -- 오프라인 모드에서는 모든 프로필 읽기 허용
    (auth.uid() IS NULL AND current_setting('app.offline_mode', true) = 'true')
  );

CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (
    (auth.uid() = id) OR
    (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))) OR
    (auth.uid() IS NULL AND current_setting('app.offline_mode', true) = 'true')
  );

CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))) OR
    (auth.uid() IS NULL AND current_setting('app.offline_mode', true) = 'true')
  );

-- 2.2. equipment_info 테이블 정책
CREATE POLICY "equipment_info_select_policy" ON public.equipment_info
  FOR SELECT USING (true); -- 모든 사용자가 설비 정보 읽기 가능

CREATE POLICY "equipment_info_modify_policy" ON public.equipment_info
  FOR ALL USING (
    (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))) OR
    (auth.uid() IS NULL AND current_setting('app.offline_mode', true) = 'true')
  );

-- 2.3. equipment_status 테이블 정책
CREATE POLICY "equipment_status_select_policy" ON public.equipment_status
  FOR SELECT USING (true); -- 모든 사용자가 설비 상태 읽기 가능

CREATE POLICY "equipment_status_modify_policy" ON public.equipment_status
  FOR ALL USING (
    (auth.uid() IS NOT NULL) OR
    (auth.uid() IS NULL AND current_setting('app.offline_mode', true) = 'true')
  );

-- 2.4. breakdown_reports 테이블 정책
CREATE POLICY "breakdown_reports_select_policy" ON public.breakdown_reports
  FOR SELECT USING (true); -- 모든 사용자가 고장 보고 읽기 가능

CREATE POLICY "breakdown_reports_insert_policy" ON public.breakdown_reports
  FOR INSERT WITH CHECK (true); -- 모든 사용자가 고장 보고 등록 가능

CREATE POLICY "breakdown_reports_update_policy" ON public.breakdown_reports
  FOR UPDATE USING (
    -- 자신이 신고한 고장이거나 담당자이거나 관리자인 경우
    (auth.uid() IS NOT NULL AND (reported_by = auth.uid() OR assigned_to = auth.uid() OR 
     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')))) OR
    -- 오프라인 모드에서는 모든 수정 허용
    (auth.uid() IS NULL AND current_setting('app.offline_mode', true) = 'true')
  );

CREATE POLICY "breakdown_reports_delete_policy" ON public.breakdown_reports
  FOR DELETE USING (
    (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))) OR
    (auth.uid() IS NULL AND current_setting('app.offline_mode', true) = 'true')
  );

-- 2.5. repair_reports 테이블 정책
CREATE POLICY "repair_reports_select_policy" ON public.repair_reports
  FOR SELECT USING (true); -- 모든 사용자가 수리 보고 읽기 가능

CREATE POLICY "repair_reports_modify_policy" ON public.repair_reports
  FOR ALL USING (
    -- 담당 기술자이거나 관리자인 경우
    (auth.uid() IS NOT NULL AND (technician_id = auth.uid() OR 
     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')))) OR
    -- 오프라인 모드에서는 모든 작업 허용
    (auth.uid() IS NULL AND current_setting('app.offline_mode', true) = 'true')
  );

-- 2.6. system_settings 테이블 정책
CREATE POLICY "system_settings_select_policy" ON public.system_settings
  FOR SELECT USING (
    -- 공개 설정은 모든 사용자가 읽기 가능
    is_public = true OR
    -- 관리자는 모든 설정 읽기 가능
    (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) OR
    -- 오프라인 모드에서는 모든 설정 읽기 허용
    (auth.uid() IS NULL AND current_setting('app.offline_mode', true) = 'true')
  );

CREATE POLICY "system_settings_modify_policy" ON public.system_settings
  FOR ALL USING (
    (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) OR
    (auth.uid() IS NULL AND current_setting('app.offline_mode', true) = 'true')
  );

-- 3. 최종 검증 쿼리 실행
SELECT 
  t.schemaname,
  t.tablename,
  t.rowsecurity as rls_enabled,
  COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.schemaname = p.schemaname AND t.tablename = p.tablename
WHERE t.schemaname = 'public' 
  AND t.tablename IN ('profiles', 'equipment_info', 'equipment_status', 'breakdown_reports', 'repair_reports', 'system_settings')
GROUP BY t.schemaname, t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- 4. 오프라인 모드 설정 (개발 환경용)
SELECT set_config('app.offline_mode', 'true', false) as offline_mode_enabled;

-- 5. 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'RLS 정책 완전 정리 완료!';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '✅ 모든 기존 정책 제거됨';
    RAISE NOTICE '✅ 새로운 깔끔한 정책 적용됨';
    RAISE NOTICE '✅ 각 테이블별 정책 개수:';
    RAISE NOTICE '   - profiles: 3개 정책';
    RAISE NOTICE '   - equipment_info: 2개 정책';
    RAISE NOTICE '   - equipment_status: 2개 정책';
    RAISE NOTICE '   - breakdown_reports: 4개 정책';
    RAISE NOTICE '   - repair_reports: 2개 정책';
    RAISE NOTICE '   - system_settings: 2개 정책';
    RAISE NOTICE '✅ 오프라인 모드 활성화됨';
    RAISE NOTICE '=================================================================';
END
$$;