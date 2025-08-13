-- ================================================================
-- 개선된 RLS 정책 - 안정적이고 성능 최적화된 버전
-- ================================================================

-- 1. 모든 기존 정책 제거
DO $$
DECLARE
    policy_record RECORD;
BEGIN
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

-- 2. 개선된 profiles 테이블 정책
-- 2.1. SELECT 정책 - 단순하고 안전한 접근 제어
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (
    -- 인증된 사용자는 모든 프로필 읽기 가능 (관리 목적)
    auth.role() = 'authenticated'
  );

-- 2.2. UPDATE 정책 - 자신의 프로필 또는 관리자 권한
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (
    -- 자신의 프로필 수정
    auth.uid() = id 
    OR 
    -- 또는 시스템 관리자가 다른 사용자 프로필 수정
    (auth.uid() IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'system_admin'
      AND p.is_active = true
    ))
  );

-- 2.3. INSERT 정책 - 시스템 관리자만 새 사용자 생성
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'system_admin'
      AND p.is_active = true
    )
  );

-- 2.4. DELETE 정책 - 시스템 관리자만 사용자 삭제
CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE USING (
    auth.uid() IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'system_admin'
      AND p.is_active = true
    )
  );

-- 3. equipment_info 테이블 정책
CREATE POLICY "equipment_info_select_policy" ON public.equipment_info
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "equipment_info_modify_policy" ON public.equipment_info
  FOR ALL USING (
    auth.uid() IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('system_admin', 'manager')
      AND p.is_active = true
    )
  );

-- 4. equipment_status 테이블 정책
CREATE POLICY "equipment_status_select_policy" ON public.equipment_status
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "equipment_status_modify_policy" ON public.equipment_status
  FOR ALL USING (auth.role() = 'authenticated');

-- 5. breakdown_reports 테이블 정책
CREATE POLICY "breakdown_reports_select_policy" ON public.breakdown_reports
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "breakdown_reports_insert_policy" ON public.breakdown_reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "breakdown_reports_update_policy" ON public.breakdown_reports
  FOR UPDATE USING (
    -- 자신이 신고한 고장이거나 담당자이거나 관리자인 경우
    reported_by = auth.uid() 
    OR assigned_to = auth.uid() 
    OR auth.uid() IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('system_admin', 'manager')
      AND p.is_active = true
    )
  );

CREATE POLICY "breakdown_reports_delete_policy" ON public.breakdown_reports
  FOR DELETE USING (
    auth.uid() IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('system_admin', 'manager')
      AND p.is_active = true
    )
  );

-- 6. repair_reports 테이블 정책
CREATE POLICY "repair_reports_select_policy" ON public.repair_reports
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "repair_reports_modify_policy" ON public.repair_reports
  FOR ALL USING (
    -- 담당 기술자이거나 관리자인 경우
    technician_id = auth.uid() 
    OR auth.uid() IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('system_admin', 'manager')
      AND p.is_active = true
    )
  );

-- 7. system_settings 테이블 정책
CREATE POLICY "system_settings_select_policy" ON public.system_settings
  FOR SELECT USING (
    -- 공개 설정은 모든 인증된 사용자가 읽기 가능
    (is_public = true AND auth.role() = 'authenticated')
    OR 
    -- 관리자는 모든 설정 읽기 가능
    auth.uid() IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'system_admin'
      AND p.is_active = true
    )
  );

CREATE POLICY "system_settings_modify_policy" ON public.system_settings
  FOR ALL USING (
    auth.uid() IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'system_admin'
      AND p.is_active = true
    )
  );

-- 8. 성능 최적화를 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_profiles_role_active ON public.profiles(role, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_auth_lookup ON public.profiles(id) WHERE is_active = true;

-- 9. RLS 정책 확인
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

-- 10. 관리자 계정 확인/생성
DO $$
DECLARE
    admin_user_id UUID := 'b2600db8-300e-4c27-992a-f1cfcd6c3821';
    admin_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = admin_user_id) INTO admin_exists;
    
    IF NOT admin_exists THEN
        INSERT INTO public.profiles (
            id,
            email,
            role,
            full_name,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            admin_user_id,
            'admin@almustech.com',
            'system_admin',
            'System Administrator',
            true,
            timezone('utc'::text, now()),
            timezone('utc'::text, now())
        );
        
        RAISE NOTICE '시스템 관리자 계정이 생성되었습니다: %', admin_user_id;
    ELSE
        -- 기존 계정의 역할을 system_admin으로 업데이트
        UPDATE public.profiles 
        SET role = 'system_admin', is_active = true, updated_at = timezone('utc'::text, now())
        WHERE id = admin_user_id;
        
        RAISE NOTICE '기존 관리자 계정이 업데이트되었습니다: %', admin_user_id;
    END IF;
END
$$;

-- 11. 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '개선된 RLS 정책 적용 완료!';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '✅ 순환 참조 문제 해결됨';
    RAISE NOTICE '✅ 성능 최적화된 정책 적용됨';
    RAISE NOTICE '✅ 역할 기반 접근 제어 강화됨';
    RAISE NOTICE '✅ 시스템 관리자 계정 확인/생성 완료';
    RAISE NOTICE '✅ 인덱스 최적화 완료';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '이제 관리자 계정으로 로그인을 시도해보세요.';
    RAISE NOTICE 'ID: b2600db8-300e-4c27-992a-f1cfcd6c3821';
    RAISE NOTICE 'Email: admin@almustech.com';
    RAISE NOTICE '=================================================================';
END
$$;