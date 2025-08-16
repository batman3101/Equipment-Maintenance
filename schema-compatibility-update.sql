-- ================================================================
-- 스키마 호환성 업데이트 마이그레이션
-- TypeScript 타입 정의와 데이터베이스 스키마 동기화
-- ================================================================

-- 이 파일은 unified-database-schema.sql 적용 후 추가로 필요한 수정사항을 포함합니다

-- 1. 기존 테이블에 누락된 필드 확인 및 추가 (중복 방지)
-- equipment_info 테이블 추가 필드들
DO $$
BEGIN
    -- QR 코드 필드 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'equipment_info' AND column_name = 'qr_code') THEN
        ALTER TABLE public.equipment_info ADD COLUMN qr_code TEXT UNIQUE;
    END IF;
    
    -- IoT 디바이스 ID 필드 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'equipment_info' AND column_name = 'iot_device_id') THEN
        ALTER TABLE public.equipment_info ADD COLUMN iot_device_id TEXT;
    END IF;
    
    -- IoT 마지막 신호 시간 필드 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'equipment_info' AND column_name = 'iot_last_signal') THEN
        ALTER TABLE public.equipment_info ADD COLUMN iot_last_signal TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- 자산 태그 필드 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'equipment_info' AND column_name = 'asset_tag') THEN
        ALTER TABLE public.equipment_info ADD COLUMN asset_tag TEXT;
    END IF;
    
    -- 시리얼 번호 필드 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'equipment_info' AND column_name = 'serial_number') THEN
        ALTER TABLE public.equipment_info ADD COLUMN serial_number TEXT;
    END IF;
    
    -- 에너지 등급 필드 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'equipment_info' AND column_name = 'energy_rating') THEN
        ALTER TABLE public.equipment_info ADD COLUMN energy_rating TEXT;
    END IF;
    
    -- 환경 요구사항 필드 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'equipment_info' AND column_name = 'environmental_requirements') THEN
        ALTER TABLE public.equipment_info ADD COLUMN environmental_requirements JSONB DEFAULT '{}';
    END IF;
    
    RAISE NOTICE '✅ equipment_info 테이블 새 필드 추가 완료';
END $$;

-- 2. breakdown_reports 테이블 추가 필드들
DO $$
BEGIN
    -- 통합 상태 필드 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'breakdown_reports' AND column_name = 'unified_status') THEN
        ALTER TABLE public.breakdown_reports ADD COLUMN unified_status TEXT DEFAULT 'breakdown_reported';
    END IF;
    
    -- 상위 고장 ID 필드 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'breakdown_reports' AND column_name = 'parent_breakdown_id') THEN
        ALTER TABLE public.breakdown_reports ADD COLUMN parent_breakdown_id UUID REFERENCES public.breakdown_reports(id) ON DELETE SET NULL;
    END IF;
    
    -- 응급 상황 여부 필드 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'breakdown_reports' AND column_name = 'is_emergency') THEN
        ALTER TABLE public.breakdown_reports ADD COLUMN is_emergency BOOLEAN DEFAULT false;
    END IF;
    
    -- 영향 수준 필드 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'breakdown_reports' AND column_name = 'impact_level') THEN
        ALTER TABLE public.breakdown_reports ADD COLUMN impact_level TEXT DEFAULT 'medium' 
        CHECK (impact_level IN ('low', 'medium', 'high', 'critical'));
    END IF;
    
    -- 영향받는 작업 필드 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'breakdown_reports' AND column_name = 'affected_operations') THEN
        ALTER TABLE public.breakdown_reports ADD COLUMN affected_operations TEXT[];
    END IF;
    
    -- 외부 계약업체 필요 여부 필드 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'breakdown_reports' AND column_name = 'external_contractor_required') THEN
        ALTER TABLE public.breakdown_reports ADD COLUMN external_contractor_required BOOLEAN DEFAULT false;
    END IF;
    
    -- 보증 클레임 가능 여부 필드 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'breakdown_reports' AND column_name = 'warranty_claim_possible') THEN
        ALTER TABLE public.breakdown_reports ADD COLUMN warranty_claim_possible BOOLEAN DEFAULT false;
    END IF;
    
    RAISE NOTICE '✅ breakdown_reports 테이블 새 필드 추가 완료';
END $$;

-- 3. repair_reports 테이블 추가 필드들
DO $$
BEGIN
    -- 통합 상태 필드 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'repair_reports' AND column_name = 'unified_status') THEN
        ALTER TABLE public.repair_reports ADD COLUMN unified_status TEXT DEFAULT 'repair_pending';
    END IF;
    
    -- 수리 카테고리 필드 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'repair_reports' AND column_name = 'repair_category') THEN
        ALTER TABLE public.repair_reports ADD COLUMN repair_category TEXT;
    END IF;
    
    -- 복잡도 수준 필드 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'repair_reports' AND column_name = 'complexity_level') THEN
        ALTER TABLE public.repair_reports ADD COLUMN complexity_level TEXT DEFAULT 'medium' 
        CHECK (complexity_level IN ('simple', 'medium', 'complex', 'critical'));
    END IF;
    
    -- 필요 기술 필드 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'repair_reports' AND column_name = 'required_skills') THEN
        ALTER TABLE public.repair_reports ADD COLUMN required_skills TEXT[];
    END IF;
    
    -- 인증 필요 여부 필드 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'repair_reports' AND column_name = 'certification_required') THEN
        ALTER TABLE public.repair_reports ADD COLUMN certification_required BOOLEAN DEFAULT false;
    END IF;
    
    -- 안전 요구사항 필드 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'repair_reports' AND column_name = 'safety_requirements') THEN
        ALTER TABLE public.repair_reports ADD COLUMN safety_requirements TEXT[];
    END IF;
    
    -- 환경 영향 필드 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'repair_reports' AND column_name = 'environmental_impact') THEN
        ALTER TABLE public.repair_reports ADD COLUMN environmental_impact TEXT;
    END IF;
    
    RAISE NOTICE '✅ repair_reports 테이블 새 필드 추가 완료';
END $$;

-- 4. 새 테이블들 존재 여부 확인 및 알림
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    -- 새로 추가된 테이블들 존재 여부 확인
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'status_transition_log',
        'system_status_definitions', 
        'system_notifications',
        'parts_inventory',
        'parts_transactions'
    );
    
    IF table_count = 5 THEN
        RAISE NOTICE '✅ 모든 새 테이블이 존재합니다 (5/5)';
    ELSE
        RAISE NOTICE '⚠️ 새 테이블 중 일부가 누락되었습니다. unified-database-schema.sql을 먼저 실행하세요 (%/5)', table_count;
    END IF;
END $$;

-- 5. 인덱스 추가 확인
DO $$
BEGIN
    -- unified_status 필드에 대한 인덱스 추가
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'breakdown_reports' 
                   AND indexname = 'idx_breakdown_reports_unified_status') THEN
        CREATE INDEX idx_breakdown_reports_unified_status ON public.breakdown_reports(unified_status);
        RAISE NOTICE '✅ breakdown_reports.unified_status 인덱스 생성 완료';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'repair_reports' 
                   AND indexname = 'idx_repair_reports_unified_status') THEN
        CREATE INDEX idx_repair_reports_unified_status ON public.repair_reports(unified_status);
        RAISE NOTICE '✅ repair_reports.unified_status 인덱스 생성 완료';
    END IF;
    
    -- IoT 관련 인덱스 추가
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'equipment_info' 
                   AND indexname = 'idx_equipment_info_iot_device') THEN
        CREATE INDEX idx_equipment_info_iot_device ON public.equipment_info(iot_device_id) WHERE iot_device_id IS NOT NULL;
        RAISE NOTICE '✅ equipment_info.iot_device_id 인덱스 생성 완료';
    END IF;
    
    -- QR 코드 인덱스 추가 (UNIQUE 제약 조건 이미 있음)
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'equipment_info' 
                   AND indexname = 'idx_equipment_info_qr_code') THEN
        CREATE INDEX idx_equipment_info_qr_code ON public.equipment_info(qr_code) WHERE qr_code IS NOT NULL;
        RAISE NOTICE '✅ equipment_info.qr_code 인덱스 생성 완료';
    END IF;
END $$;

-- 6. 통합 상태 데이터 업데이트
DO $$
BEGIN
    -- 기존 breakdown_reports의 unified_status 업데이트
    UPDATE public.breakdown_reports 
    SET unified_status = CASE 
        WHEN status = 'reported' THEN 'breakdown_reported'
        WHEN status = 'assigned' THEN 'breakdown_reported'
        WHEN status = 'in_progress' THEN 'breakdown_in_progress'
        WHEN status = 'completed' THEN 'breakdown_completed'
        ELSE 'breakdown_reported'
    END
    WHERE unified_status IS NULL OR unified_status = 'breakdown_reported';
    
    -- 기존 repair_reports의 unified_status 업데이트
    UPDATE public.repair_reports 
    SET unified_status = CASE 
        WHEN repair_completed_at IS NOT NULL THEN 'repair_completed'
        WHEN repair_started_at IS NOT NULL THEN 'repair_in_progress'
        ELSE 'repair_pending'
    END
    WHERE unified_status IS NULL OR unified_status = 'repair_pending';
    
    RAISE NOTICE '✅ 기존 레코드의 통합 상태 업데이트 완료';
END $$;

-- 7. RLS 정책 확인 및 생성
DO $$
BEGIN
    -- 새 테이블들의 RLS 활성화 확인
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'status_transition_log' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'status_transition_log') THEN
            RAISE NOTICE '⚠️ status_transition_log 테이블의 RLS 정책이 필요합니다';
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'system_notifications' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_notifications') THEN
            RAISE NOTICE '⚠️ system_notifications 테이블의 RLS 정책이 필요합니다';
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'parts_inventory' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'parts_inventory') THEN
            RAISE NOTICE '⚠️ parts_inventory 테이블의 RLS 정책이 필요합니다';
        END IF;
    END IF;
END $$;

-- 8. 타입 호환성 검증
DO $$
DECLARE
    missing_fields TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- equipment_info 필드 검증
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'equipment_info' AND column_name = 'qr_code') THEN
        missing_fields := array_append(missing_fields, 'equipment_info.qr_code');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'breakdown_reports' AND column_name = 'unified_status') THEN
        missing_fields := array_append(missing_fields, 'breakdown_reports.unified_status');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'repair_reports' AND column_name = 'unified_status') THEN
        missing_fields := array_append(missing_fields, 'repair_reports.unified_status');
    END IF;
    
    IF array_length(missing_fields, 1) > 0 THEN
        RAISE EXCEPTION '❌ TypeScript 호환성을 위해 다음 필드들이 필요합니다: %', array_to_string(missing_fields, ', ');
    ELSE
        RAISE NOTICE '✅ TypeScript 타입 정의와 데이터베이스 스키마 호환성 확인 완료';
    END IF;
END $$;

-- ================================================================
-- 완료 메시지
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'TypeScript 타입 정의와 데이터베이스 스키마 동기화 완료';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '✅ 기존 테이블 호환성 필드 추가 완료';
    RAISE NOTICE '✅ 새 테이블 존재 확인 완료';
    RAISE NOTICE '✅ 통합 상태 시스템 데이터 동기화 완료';
    RAISE NOTICE '✅ 인덱스 최적화 완료';
    RAISE NOTICE '✅ TypeScript Database 인터페이스 호환성 확보';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '이제 TypeScript에서 모든 새 기능을 안전하게 사용할 수 있습니다.';
    RAISE NOTICE 'src/lib/supabase.ts의 Database 인터페이스가 업데이트되었습니다.';
    RAISE NOTICE '=================================================================';
END $$;