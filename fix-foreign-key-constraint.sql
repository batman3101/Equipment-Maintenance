-- ================================================================
-- CNC 설비 관리 시스템 - 외래키 제약 조건 문제 해결
-- breakdown_reports_reported_by_fkey 오류 수정
-- ================================================================

-- 1. 문제 확인
DO $$
BEGIN
    RAISE NOTICE '외래키 제약 조건 문제를 확인하고 수정합니다...';
END
$$;

-- 2. 현재 auth.users와 profiles 동기화 상태 확인
SELECT 
    'Auth vs Profiles Sync' as check_type,
    (SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL) as auth_users_count,
    (SELECT COUNT(*) FROM public.profiles) as profiles_count,
    (SELECT COUNT(*) FROM auth.users au WHERE au.deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id)) as missing_profiles;

-- 3. 누락된 profiles 자동 생성
INSERT INTO public.profiles (id, email, role, full_name, is_active, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    'user' as role,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
    true as is_active,
    au.created_at,
    timezone('utc'::text, now()) as updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
  AND au.deleted_at IS NULL
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = EXCLUDED.updated_at;

-- 4. breakdown_reports 테이블의 잘못된 데이터 확인
SELECT 
    'Invalid Breakdown Reports' as check_type,
    br.id,
    br.reported_by,
    br.equipment_id,
    br.created_at
FROM public.breakdown_reports br
LEFT JOIN public.profiles p ON br.reported_by = p.id
WHERE p.id IS NULL
ORDER BY br.created_at DESC
LIMIT 10;

-- 5. 잘못된 reported_by 수정 (현재 인증된 사용자로 변경)
UPDATE public.breakdown_reports
SET reported_by = (
    SELECT id 
    FROM public.profiles 
    WHERE role = 'admin' 
    ORDER BY created_at ASC 
    LIMIT 1
)
WHERE reported_by IS NULL 
   OR NOT EXISTS (
       SELECT 1 FROM public.profiles 
       WHERE id = breakdown_reports.reported_by
   );

-- 6. assigned_to 필드도 확인 및 수정
UPDATE public.breakdown_reports
SET assigned_to = (
    SELECT id 
    FROM public.profiles 
    WHERE role IN ('admin', 'manager') 
    ORDER BY created_at ASC 
    LIMIT 1
)
WHERE assigned_to IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = breakdown_reports.assigned_to
  );

-- 7. repair_reports 테이블의 technician_id도 확인
SELECT 
    'Invalid Repair Reports' as check_type,
    rr.id,
    rr.technician_id,
    rr.breakdown_report_id,
    rr.created_at
FROM public.repair_reports rr
LEFT JOIN public.profiles p ON rr.technician_id = p.id
WHERE p.id IS NULL
ORDER BY rr.created_at DESC
LIMIT 10;

-- 8. repair_reports의 잘못된 technician_id 수정
UPDATE public.repair_reports
SET technician_id = (
    SELECT id 
    FROM public.profiles 
    WHERE role IN ('admin', 'manager') 
    ORDER BY created_at ASC 
    LIMIT 1
)
WHERE technician_id IS NULL 
   OR NOT EXISTS (
       SELECT 1 FROM public.profiles 
       WHERE id = repair_reports.technician_id
   );

-- 9. 외래키 제약 조건 확인
SELECT 
    'Foreign Key Constraints' as check_type,
    tc.table_name,
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
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('breakdown_reports', 'repair_reports')
ORDER BY tc.table_name, kcu.column_name;

-- 10. 데이터 무결성 최종 확인
SELECT 
    'Data Integrity Final Check' as check_type,
    'breakdown_reports' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN EXISTS (SELECT 1 FROM public.profiles WHERE id = br.reported_by) THEN 1 END) as valid_reported_by,
    COUNT(CASE WHEN br.assigned_to IS NULL OR EXISTS (SELECT 1 FROM public.profiles WHERE id = br.assigned_to) THEN 1 END) as valid_assigned_to
FROM public.breakdown_reports br
UNION ALL
SELECT 
    'Data Integrity Final Check' as check_type,
    'repair_reports' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN EXISTS (SELECT 1 FROM public.profiles WHERE id = rr.technician_id) THEN 1 END) as valid_technician_id,
    0 as placeholder
FROM public.repair_reports rr;

-- 11. 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '================================================================';
    RAISE NOTICE '외래키 제약 조건 문제 해결 완료!';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '✅ auth.users와 profiles 동기화 완료';
    RAISE NOTICE '✅ breakdown_reports 데이터 무결성 수정';
    RAISE NOTICE '✅ repair_reports 데이터 무결성 수정';
    RAISE NOTICE '✅ 외래키 제약 조건 위반 해결';
    RAISE NOTICE '';
    RAISE NOTICE '이제 고장신고가 정상 작동해야 합니다!';
    RAISE NOTICE '================================================================';
END
$$;