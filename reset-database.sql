-- ================================================================
-- 데이터베이스 초기화 스크립트
-- ⚠️ 주의: 모든 데이터가 삭제됩니다!
-- ================================================================

-- 1. 기존 테이블 삭제 (CASCADE로 관련 객체도 함께 삭제)
DROP TABLE IF EXISTS public.repair_history CASCADE;
DROP TABLE IF EXISTS public.breakdown_reports CASCADE;
DROP TABLE IF EXISTS public.equipment_status CASCADE;
DROP TABLE IF EXISTS public.equipment_info CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. 트리거 함수 삭제
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- 3. 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 모든 테이블이 삭제되었습니다.';
  RAISE NOTICE '💡 이제 database-schema-safe.sql을 실행하여 테이블을 다시 생성하세요.';
END $$;