-- ================================================================
-- 정확한 해결책: 외래키 제약조건만 제거
-- ================================================================

-- 1. 외래키 제약조건 제거 (가장 중요)
ALTER TABLE public.profiles 
    DROP CONSTRAINT IF EXISTS profiles_id_fkey CASCADE;

-- 2. Primary Key는 그대로 유지 (NOT NULL 제거 시도하지 않음)
-- id 컬럼은 Primary Key이므로 NOT NULL을 제거할 수 없습니다.
-- 대신 외래키 제약조건만 제거하면 충분합니다.

-- 3. 확인: 외래키 제약조건이 제거되었는지 확인
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

-- 결과가 비어있으면 성공!
-- 이제 profiles 테이블은 auth.users에 의존하지 않고 독립적으로 작동합니다.