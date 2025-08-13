-- ================================================================
-- CNC 설비 관리 시스템 - 프로덕션 인증 문제 정식 해결
-- Supabase Auth와 profiles 테이블 동기화 및 RLS 정책 정상화
-- ================================================================

-- ================================================================
-- 1. AUTH.USERS와 PUBLIC.PROFILES 동기화
-- ================================================================

-- 1.1 auth.users에 있지만 profiles에 없는 사용자 찾기
INSERT INTO public.profiles (id, email, role, full_name, is_active, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    'user' as role,  -- 기본 역할
    COALESCE(au.raw_user_meta_data->>'full_name', 'New User') as full_name,
    true as is_active,
    au.created_at,
    timezone('utc'::text, now()) as updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
  AND au.deleted_at IS NULL;

-- 1.2 시스템 관리자 계정 확인 및 설정
-- 첫 번째 가입한 사용자를 관리자로 설정 (일반적인 패턴)
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
    SELECT id 
    FROM auth.users 
    WHERE deleted_at IS NULL
    ORDER BY created_at ASC 
    LIMIT 1
)
AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE role = 'admin'
);

-- 1.3 특정 이메일을 관리자로 지정 (실제 관리자 이메일로 변경 필요)
UPDATE public.profiles
SET role = 'admin'
WHERE email IN (
    'admin@cnc-system.com',  -- 실제 관리자 이메일로 변경
    'manager@cnc-system.com'  -- 필요시 추가
)
AND role != 'admin';

-- ================================================================
-- 2. RLS 정책 올바르게 재설정
-- ================================================================

-- 2.1 profiles 테이블 정책 재설정
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "emergency_profiles_access" ON public.profiles;

-- 인증된 사용자는 자신의 프로필 조회 가능, 관리자는 모든 프로필 조회 가능
CREATE POLICY "profiles_read_policy" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 관리자는 모든 프로필 수정 가능
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2.2 equipment_info 테이블 정책
DROP POLICY IF EXISTS "equipment_info_select_policy" ON public.equipment_info;
DROP POLICY IF EXISTS "equipment_info_modify_policy" ON public.equipment_info;
DROP POLICY IF EXISTS "emergency_equipment_access" ON public.equipment_info;

-- 모든 인증된 사용자가 설비 정보 읽기 가능
CREATE POLICY "equipment_read_authenticated" ON public.equipment_info
  FOR SELECT USING (auth.role() = 'authenticated');

-- 관리자와 매니저만 설비 정보 수정 가능
CREATE POLICY "equipment_modify_managers" ON public.equipment_info
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 2.3 equipment_status 테이블 정책
DROP POLICY IF EXISTS "equipment_status_select_policy" ON public.equipment_status;
DROP POLICY IF EXISTS "equipment_status_modify_policy" ON public.equipment_status;
DROP POLICY IF EXISTS "emergency_status_access" ON public.equipment_status;

-- 인증된 사용자는 상태 읽기 가능
CREATE POLICY "status_read_authenticated" ON public.equipment_status
  FOR SELECT USING (auth.role() = 'authenticated');

-- 인증된 사용자는 상태 업데이트 가능
CREATE POLICY "status_update_authenticated" ON public.equipment_status
  FOR ALL USING (auth.role() = 'authenticated');

-- 2.4 breakdown_reports 테이블 정책
DROP POLICY IF EXISTS "breakdown_reports_select_policy" ON public.breakdown_reports;
DROP POLICY IF EXISTS "breakdown_reports_insert_policy" ON public.breakdown_reports;
DROP POLICY IF EXISTS "breakdown_reports_update_policy" ON public.breakdown_reports;
DROP POLICY IF EXISTS "breakdown_reports_delete_policy" ON public.breakdown_reports;
DROP POLICY IF EXISTS "emergency_breakdown_access" ON public.breakdown_reports;

-- 인증된 사용자는 모든 고장 보고 읽기 가능
CREATE POLICY "breakdown_read_authenticated" ON public.breakdown_reports
  FOR SELECT USING (auth.role() = 'authenticated');

-- 인증된 사용자는 고장 보고 생성 가능
CREATE POLICY "breakdown_create_authenticated" ON public.breakdown_reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 작성자 또는 담당자는 수정 가능
CREATE POLICY "breakdown_update_authorized" ON public.breakdown_reports
  FOR UPDATE USING (
    auth.uid() = reported_by OR 
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 관리자만 삭제 가능
CREATE POLICY "breakdown_delete_admin" ON public.breakdown_reports
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2.5 repair_reports 테이블 정책
DROP POLICY IF EXISTS "repair_reports_select_policy" ON public.repair_reports;
DROP POLICY IF EXISTS "repair_reports_modify_policy" ON public.repair_reports;
DROP POLICY IF EXISTS "emergency_repair_access" ON public.repair_reports;

-- 인증된 사용자는 수리 보고 읽기 가능
CREATE POLICY "repair_read_authenticated" ON public.repair_reports
  FOR SELECT USING (auth.role() = 'authenticated');

-- 기술자 또는 관리자는 수리 보고 작성/수정 가능
CREATE POLICY "repair_modify_authorized" ON public.repair_reports
  FOR ALL USING (
    auth.uid() = technician_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 2.6 system_settings 테이블 정책
DROP POLICY IF EXISTS "system_settings_select_policy" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings_modify_policy" ON public.system_settings;
DROP POLICY IF EXISTS "emergency_settings_access" ON public.system_settings;

-- 공개 설정은 인증된 사용자가 읽기 가능
CREATE POLICY "settings_read_public" ON public.system_settings
  FOR SELECT USING (
    is_public = true AND auth.role() = 'authenticated'
  );

-- 관리자는 모든 설정 관리 가능
CREATE POLICY "settings_admin_all" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ================================================================
-- 3. 트리거 생성 - auth.users 생성 시 자동으로 profiles 생성
-- ================================================================

-- 트리거 함수 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, is_active, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    true,
    new.created_at,
    new.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = timezone('utc'::text, now());
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거 제거
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 새 트리거 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- 4. 검증 쿼리
-- ================================================================

-- 4.1 관리자 계정 확인
SELECT 
    'admin_accounts' as type,
    p.id,
    p.email,
    p.role,
    p.full_name,
    p.is_active,
    au.created_at as auth_created,
    p.created_at as profile_created
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.role = 'admin'
ORDER BY p.created_at;

-- 4.2 동기화 상태 확인
SELECT 
    'sync_status' as info,
    (SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL) as auth_users,
    (SELECT COUNT(*) FROM public.profiles) as profile_records,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') as admin_count,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'manager') as manager_count,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'user') as user_count;

-- 4.3 RLS 정책 상태
SELECT 
    tablename,
    policyname,
    permissive,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ================================================================
-- 5. 완료 메시지
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '프로덕션 인증 문제 정식 해결 완료!';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '✅ auth.users와 profiles 테이블 동기화됨';
    RAISE NOTICE '✅ 관리자 계정 설정됨';
    RAISE NOTICE '✅ RLS 정책 올바르게 재설정됨';
    RAISE NOTICE '✅ 자동 동기화 트리거 생성됨';
    RAISE NOTICE '';
    RAISE NOTICE '다음 단계:';
    RAISE NOTICE '1. 관리자 계정 이메일 확인 후 로그인 테스트';
    RAISE NOTICE '2. 필요시 Supabase Dashboard > Authentication에서 사용자 비밀번호 재설정';
    RAISE NOTICE '3. 애플리케이션에서 정상 작동 확인';
    RAISE NOTICE '=================================================================';
END
$$;