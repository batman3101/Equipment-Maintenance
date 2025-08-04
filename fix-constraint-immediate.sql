-- ================================================================
-- 즉시 실행 필요: 외래키 제약조건 제거
-- ================================================================

-- profiles 테이블의 외래키 제약조건 제거
-- 이를 통해 auth.users 없이도 profiles 생성 가능
ALTER TABLE public.profiles 
    DROP CONSTRAINT IF EXISTS profiles_id_fkey CASCADE;

-- id 컬럼이 NOT NULL이 아니도록 변경 (필요시)
ALTER TABLE public.profiles 
    ALTER COLUMN id DROP NOT NULL;

-- 확인: 제약조건이 제거되었는지 확인
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles' 
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'FOREIGN KEY';

-- 결과가 비어있으면 성공적으로 제거된 것입니다