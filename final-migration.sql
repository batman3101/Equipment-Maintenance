-- ================================================================
-- CNC 설비 관리 시스템 - 최종 마이그레이션 스크립트
-- 모든 타입 오류 및 의존성 문제 해결
-- ================================================================

-- 1. 확장 기능 및 기본 설정
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- 2. 기존 뷰 의존성 정리
DROP VIEW IF EXISTS public.repair_reports_summary CASCADE;
DROP VIEW IF EXISTS public.v_repair_details CASCADE;
DROP VIEW IF EXISTS public.v_repair_equipment CASCADE;
DROP VIEW IF EXISTS public.v_unified_equipment_status CASCADE;

-- 3. 기존 테이블 정리 및 수정
-- profiles 테이블 role 값 표준화
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('system_admin', 'manager', 'user'));

UPDATE public.profiles 
SET role = 'system_admin' 
WHERE role = 'admin';

-- repair_reports에서 중복 equipment_id 안전하게 제거
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'repair_reports' AND column_name = 'equipment_id') THEN
        
        -- 데이터 불일치 검증
        IF EXISTS (
            SELECT 1 FROM repair_reports rr
            JOIN breakdown_reports br ON rr.breakdown_report_id = br.id
            WHERE rr.equipment_id != br.equipment_id
        ) THEN
            RAISE EXCEPTION '❌ repair_reports와 breakdown_reports 간 equipment_id 불일치 발견. 데이터 정리가 필요합니다.';
        END IF;
        
        -- 안전하게 컬럼 삭제 (CASCADE 사용)
        ALTER TABLE public.repair_reports DROP COLUMN equipment_id CASCADE;
        RAISE NOTICE '✅ repair_reports.equipment_id 중복 제거 완료';
    ELSE
        RAISE NOTICE '✅ repair_reports.equipment_id 이미 없음';
    END IF;
END $$;

-- 4. 새로운 핵심 테이블 생성
-- A. 상태 전환 이력 테이블
CREATE TABLE IF NOT EXISTS public.status_transition_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('equipment', 'breakdown', 'repair')),
  entity_id UUID NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  transition_reason TEXT,
  transition_metadata JSONB DEFAULT '{}',
  triggered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_automated BOOLEAN DEFAULT false,
  automation_rule TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- B. 통합 상태 정의 테이블
CREATE TABLE IF NOT EXISTS public.system_status_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status_code TEXT UNIQUE NOT NULL,
  status_group TEXT NOT NULL CHECK (status_group IN ('equipment', 'breakdown', 'repair', 'general')),
  label_ko TEXT NOT NULL,
  label_vi TEXT,
  label_en TEXT,
  color_class TEXT NOT NULL,
  icon_name TEXT,
  sort_order INTEGER DEFAULT 0,
  valid_transitions TEXT[] DEFAULT '{}'::TEXT[],
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- C. 실시간 알림 시스템 테이블
CREATE TABLE IF NOT EXISTS public.system_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('breakdown', 'repair', 'maintenance', 'system', 'user')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  related_entity_type TEXT CHECK (related_entity_type IN ('equipment', 'breakdown', 'repair', 'user')),
  related_entity_id UUID,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_role TEXT,
  is_broadcast BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  requires_action BOOLEAN DEFAULT false,
  action_url TEXT,
  auto_expire_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. 기존 테이블 확장
-- equipment_info 테이블 확장
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_info' AND column_name = 'asset_tag') THEN
        ALTER TABLE public.equipment_info ADD COLUMN asset_tag TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_info' AND column_name = 'serial_number') THEN
        ALTER TABLE public.equipment_info ADD COLUMN serial_number TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_info' AND column_name = 'custom_fields') THEN
        ALTER TABLE public.equipment_info ADD COLUMN custom_fields JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_info' AND column_name = 'equipment_tags') THEN
        ALTER TABLE public.equipment_info ADD COLUMN equipment_tags TEXT[];
    END IF;
    
    RAISE NOTICE '✅ equipment_info 테이블 확장 완료';
END $$;

-- breakdown_reports 테이블 확장
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'breakdown_reports' AND column_name = 'unified_status') THEN
        ALTER TABLE public.breakdown_reports ADD COLUMN unified_status TEXT DEFAULT 'breakdown_reported';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'breakdown_reports' AND column_name = 'parent_breakdown_id') THEN
        ALTER TABLE public.breakdown_reports ADD COLUMN parent_breakdown_id UUID REFERENCES public.breakdown_reports(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'breakdown_reports' AND column_name = 'is_emergency') THEN
        ALTER TABLE public.breakdown_reports ADD COLUMN is_emergency BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'breakdown_reports' AND column_name = 'impact_level') THEN
        ALTER TABLE public.breakdown_reports ADD COLUMN impact_level TEXT DEFAULT 'medium' 
        CHECK (impact_level IN ('low', 'medium', 'high', 'critical'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'breakdown_reports' AND column_name = 'affected_operations') THEN
        ALTER TABLE public.breakdown_reports ADD COLUMN affected_operations TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'breakdown_reports' AND column_name = 'external_contractor_required') THEN
        ALTER TABLE public.breakdown_reports ADD COLUMN external_contractor_required BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'breakdown_reports' AND column_name = 'resolution_date') THEN
        ALTER TABLE public.breakdown_reports ADD COLUMN resolution_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    RAISE NOTICE '✅ breakdown_reports 테이블 확장 완료';
END $$;

-- repair_reports 테이블 확장 
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_reports' AND column_name = 'unified_status') THEN
        ALTER TABLE public.repair_reports ADD COLUMN unified_status TEXT DEFAULT 'repair_pending';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_reports' AND column_name = 'repair_category') THEN
        ALTER TABLE public.repair_reports ADD COLUMN repair_category TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_reports' AND column_name = 'complexity_level') THEN
        ALTER TABLE public.repair_reports ADD COLUMN complexity_level TEXT DEFAULT 'medium' 
        CHECK (complexity_level IN ('simple', 'medium', 'complex', 'critical'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_reports' AND column_name = 'required_skills') THEN
        ALTER TABLE public.repair_reports ADD COLUMN required_skills TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_reports' AND column_name = 'completion_percentage') THEN
        ALTER TABLE public.repair_reports ADD COLUMN completion_percentage INTEGER DEFAULT 0 
        CHECK (completion_percentage >= 0 AND completion_percentage <= 100);
    END IF;
    
    RAISE NOTICE '✅ repair_reports 테이블 확장 완료';
END $$;

-- 6. 통합 상태 시스템 초기 데이터 (타입 명시적 지정)
-- 설비 상태
INSERT INTO public.system_status_definitions (status_code, status_group, label_ko, label_vi, label_en, color_class, valid_transitions) 
VALUES ('running', 'equipment', '운영 중', 'Đang hoạt động', 'Running', 'bg-green-100 text-green-800', '{breakdown,standby,maintenance,stopped}'::TEXT[])
ON CONFLICT (status_code) DO NOTHING;

INSERT INTO public.system_status_definitions (status_code, status_group, label_ko, label_vi, label_en, color_class, valid_transitions) 
VALUES ('breakdown', 'equipment', '고장', 'Hỏng hóc', 'Breakdown', 'bg-red-100 text-red-800', '{maintenance,stopped}'::TEXT[])
ON CONFLICT (status_code) DO NOTHING;

INSERT INTO public.system_status_definitions (status_code, status_group, label_ko, label_vi, label_en, color_class, valid_transitions) 
VALUES ('standby', 'equipment', '대기', 'Chờ', 'Standby', 'bg-yellow-100 text-yellow-800', '{running,maintenance,stopped}'::TEXT[])
ON CONFLICT (status_code) DO NOTHING;

INSERT INTO public.system_status_definitions (status_code, status_group, label_ko, label_vi, label_en, color_class, valid_transitions) 
VALUES ('maintenance', 'equipment', '정비 중', 'Bảo trì', 'Maintenance', 'bg-blue-100 text-blue-800', '{running,standby,stopped}'::TEXT[])
ON CONFLICT (status_code) DO NOTHING;

INSERT INTO public.system_status_definitions (status_code, status_group, label_ko, label_vi, label_en, color_class, valid_transitions) 
VALUES ('stopped', 'equipment', '중지', 'Dừng', 'Stopped', 'bg-gray-100 text-gray-800', '{running,standby,maintenance}'::TEXT[])
ON CONFLICT (status_code) DO NOTHING;

-- 고장 신고 상태
INSERT INTO public.system_status_definitions (status_code, status_group, label_ko, label_vi, label_en, color_class, valid_transitions) 
VALUES ('breakdown_reported', 'breakdown', '신고 접수', 'Đã báo cáo', 'Reported', 'bg-orange-100 text-orange-800', '{breakdown_in_progress}'::TEXT[])
ON CONFLICT (status_code) DO NOTHING;

INSERT INTO public.system_status_definitions (status_code, status_group, label_ko, label_vi, label_en, color_class, valid_transitions) 
VALUES ('breakdown_in_progress', 'breakdown', '수리 중', 'Đang sửa chữa', 'In Progress', 'bg-blue-100 text-blue-800', '{breakdown_completed}'::TEXT[])
ON CONFLICT (status_code) DO NOTHING;

INSERT INTO public.system_status_definitions (status_code, status_group, label_ko, label_vi, label_en, color_class, valid_transitions) 
VALUES ('breakdown_completed', 'breakdown', '수리 완료', 'Hoàn thành', 'Completed', 'bg-green-100 text-green-800', '{}'::TEXT[])
ON CONFLICT (status_code) DO NOTHING;

-- 수리 상태
INSERT INTO public.system_status_definitions (status_code, status_group, label_ko, label_vi, label_en, color_class, valid_transitions) 
VALUES ('repair_pending', 'repair', '수리 대기', 'Chờ sửa chữa', 'Pending', 'bg-yellow-100 text-yellow-800', '{repair_in_progress}'::TEXT[])
ON CONFLICT (status_code) DO NOTHING;

INSERT INTO public.system_status_definitions (status_code, status_group, label_ko, label_vi, label_en, color_class, valid_transitions) 
VALUES ('repair_in_progress', 'repair', '수리 진행', 'Đang sửa chữa', 'In Progress', 'bg-blue-100 text-blue-800', '{repair_completed,repair_failed}'::TEXT[])
ON CONFLICT (status_code) DO NOTHING;

INSERT INTO public.system_status_definitions (status_code, status_group, label_ko, label_vi, label_en, color_class, valid_transitions) 
VALUES ('repair_completed', 'repair', '수리 완료', 'Hoàn thành', 'Completed', 'bg-green-100 text-green-800', '{}'::TEXT[])
ON CONFLICT (status_code) DO NOTHING;

INSERT INTO public.system_status_definitions (status_code, status_group, label_ko, label_vi, label_en, color_class, valid_transitions) 
VALUES ('repair_failed', 'repair', '수리 실패', 'Thất bại', 'Failed', 'bg-red-100 text-red-800', '{repair_pending}'::TEXT[])
ON CONFLICT (status_code) DO NOTHING;

-- 일반 상태
INSERT INTO public.system_status_definitions (status_code, status_group, label_ko, label_vi, label_en, color_class, valid_transitions) 
VALUES ('active', 'general', '활성', 'Hoạt động', 'Active', 'bg-green-100 text-green-800', '{inactive}'::TEXT[])
ON CONFLICT (status_code) DO NOTHING;

INSERT INTO public.system_status_definitions (status_code, status_group, label_ko, label_vi, label_en, color_class, valid_transitions) 
VALUES ('inactive', 'general', '비활성', 'Không hoạt động', 'Inactive', 'bg-gray-100 text-gray-800', '{active}'::TEXT[])
ON CONFLICT (status_code) DO NOTHING;

INSERT INTO public.system_status_definitions (status_code, status_group, label_ko, label_vi, label_en, color_class, valid_transitions) 
VALUES ('pending', 'general', '대기', 'Chờ', 'Pending', 'bg-yellow-100 text-yellow-800', '{active,inactive}'::TEXT[])
ON CONFLICT (status_code) DO NOTHING;

-- 7. 핵심 함수 생성
-- 통합 상태 전환 함수
CREATE OR REPLACE FUNCTION transition_unified_status(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_new_status TEXT,
    p_reason TEXT DEFAULT NULL,
    p_triggered_by UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
    current_status TEXT;
    valid_transitions TEXT[];
    is_valid BOOLEAN := false;
BEGIN
    -- 현재 상태 확인
    CASE p_entity_type
        WHEN 'equipment' THEN
            SELECT status INTO current_status 
            FROM public.equipment_status 
            WHERE equipment_id = p_entity_id 
            ORDER BY status_changed_at DESC 
            LIMIT 1;
            
        WHEN 'breakdown' THEN
            SELECT unified_status INTO current_status 
            FROM public.breakdown_reports 
            WHERE id = p_entity_id;
            
        WHEN 'repair' THEN
            SELECT unified_status INTO current_status 
            FROM public.repair_reports 
            WHERE id = p_entity_id;
    END CASE;
    
    -- 유효한 전환인지 확인
    SELECT valid_transitions INTO valid_transitions
    FROM public.system_status_definitions
    WHERE status_code = current_status;
    
    IF p_new_status = ANY(valid_transitions) OR current_status IS NULL THEN
        is_valid := true;
    END IF;
    
    -- 유효하지 않은 전환인 경우 오류
    IF NOT is_valid THEN
        RAISE EXCEPTION 'Invalid status transition from % to % for % %', 
            current_status, p_new_status, p_entity_type, p_entity_id;
    END IF;
    
    -- 상태 전환 로그 기록
    INSERT INTO public.status_transition_log 
    (entity_type, entity_id, from_status, to_status, transition_reason, transition_metadata, triggered_by)
    VALUES 
    (p_entity_type, p_entity_id, current_status, p_new_status, p_reason, p_metadata, p_triggered_by);
    
    -- 실제 상태 업데이트
    CASE p_entity_type
        WHEN 'equipment' THEN
            INSERT INTO public.equipment_status 
            (equipment_id, status, status_reason, updated_by, status_changed_at)
            VALUES 
            (p_entity_id, p_new_status, p_reason, p_triggered_by, timezone('utc'::text, now()));
            
        WHEN 'breakdown' THEN
            UPDATE public.breakdown_reports 
            SET unified_status = p_new_status, updated_at = timezone('utc'::text, now())
            WHERE id = p_entity_id;
            
        WHEN 'repair' THEN
            UPDATE public.repair_reports 
            SET unified_status = p_new_status, updated_at = timezone('utc'::text, now())
            WHERE id = p_entity_id;
    END CASE;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 데이터 일관성 검증 함수
CREATE OR REPLACE FUNCTION validate_equipment_status_consistency()
RETURNS TABLE(equipment_id UUID, equipment_name TEXT, inconsistency_type TEXT, details TEXT) AS $$
BEGIN
    RETURN QUERY
    -- 가동중인데 활성 고장이 있는 경우
    SELECT 
        e.id,
        e.equipment_name,
        'active_breakdown_while_running'::TEXT,
        '설비가 가동중이지만 미완료 고장이 있습니다'::TEXT
    FROM equipment_info e
    JOIN LATERAL (
        SELECT status FROM equipment_status es 
        WHERE es.equipment_id = e.id 
        ORDER BY status_changed_at DESC LIMIT 1
    ) latest_status ON true
    JOIN breakdown_reports br ON e.id = br.equipment_id
    WHERE latest_status.status = 'running' 
    AND br.unified_status IN ('breakdown_reported', 'breakdown_in_progress')
    
    UNION ALL
    
    -- 고장 상태인데 활성 고장이 없는 경우
    SELECT 
        e.id,
        e.equipment_name,
        'breakdown_status_without_active_breakdown'::TEXT,
        '설비가 고장 상태이지만 활성 고장이 없습니다'::TEXT
    FROM equipment_info e
    JOIN LATERAL (
        SELECT status FROM equipment_status es 
        WHERE es.equipment_id = e.id 
        ORDER BY status_changed_at DESC LIMIT 1
    ) latest_status ON true
    LEFT JOIN breakdown_reports br ON e.id = br.equipment_id 
        AND br.unified_status IN ('breakdown_reported', 'breakdown_in_progress')
    WHERE latest_status.status = 'breakdown' 
    AND br.id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 새로운 뷰 생성 (equipment_id 없이)
-- A. 수리 작업과 설비 정보 통합 뷰
CREATE OR REPLACE VIEW v_repair_with_equipment AS
SELECT 
    rr.*,
    br.equipment_id,
    ei.equipment_name,
    ei.equipment_number,
    ei.category as equipment_category
FROM public.repair_reports rr
JOIN public.breakdown_reports br ON rr.breakdown_report_id = br.id
JOIN public.equipment_info ei ON br.equipment_id = ei.id;

-- B. 통합 설비 현황 뷰
CREATE OR REPLACE VIEW v_equipment_status_summary AS
SELECT 
    e.id,
    e.equipment_number,
    e.equipment_name,
    e.category,
    e.location,
    e.manufacturer,
    e.model,
    e.asset_tag,
    e.serial_number,
    
    -- 현재 설비 상태
    latest_status.status as current_equipment_status,
    latest_status.status_changed_at as status_last_updated,
    latest_status.status_reason,
    
    -- 통합 상태 정의와 조인
    esd.label_ko as status_label_ko,
    esd.label_vi as status_label_vi,
    esd.color_class as status_color,
    
    -- 활성 고장 정보
    active_breakdown.id as active_breakdown_id,
    active_breakdown.breakdown_title,
    active_breakdown.priority as breakdown_priority,
    active_breakdown.occurred_at as breakdown_occurred_at,
    active_breakdown.unified_status as breakdown_status,
    active_breakdown.is_emergency,
    
    -- 활성 수리 정보
    active_repair.id as active_repair_id,
    active_repair.repair_title,
    active_repair.unified_status as repair_status,
    active_repair.completion_percentage,
    
    -- 다음 정비 예정일
    latest_status.next_maintenance_date,
    
    e.created_at,
    e.updated_at
FROM public.equipment_info e

LEFT JOIN LATERAL (
    SELECT status, status_changed_at, status_reason, next_maintenance_date
    FROM public.equipment_status es 
    WHERE es.equipment_id = e.id 
    ORDER BY es.status_changed_at DESC 
    LIMIT 1
) latest_status ON true

LEFT JOIN public.system_status_definitions esd ON latest_status.status = esd.status_code

LEFT JOIN LATERAL (
    SELECT id, breakdown_title, priority, occurred_at, unified_status, is_emergency
    FROM public.breakdown_reports br 
    WHERE br.equipment_id = e.id 
    AND br.unified_status NOT IN ('breakdown_completed')
    ORDER BY br.occurred_at DESC 
    LIMIT 1
) active_breakdown ON true

LEFT JOIN LATERAL (
    SELECT rr.id, rr.repair_title, rr.unified_status, rr.completion_percentage
    FROM public.repair_reports rr
    JOIN public.breakdown_reports br ON rr.breakdown_report_id = br.id
    WHERE br.equipment_id = e.id 
    AND rr.unified_status IN ('repair_pending', 'repair_in_progress')
    ORDER BY rr.created_at DESC 
    LIMIT 1
) active_repair ON true;

-- C. 실시간 대시보드 뷰
CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT 
    COUNT(*) as total_equipment,
    COUNT(CASE WHEN current_equipment_status = 'running' THEN 1 END) as running_equipment,
    COUNT(CASE WHEN current_equipment_status = 'breakdown' THEN 1 END) as breakdown_equipment,
    COUNT(CASE WHEN current_equipment_status = 'maintenance' THEN 1 END) as maintenance_equipment,
    COUNT(CASE WHEN current_equipment_status = 'standby' THEN 1 END) as standby_equipment,
    COUNT(CASE WHEN current_equipment_status = 'stopped' THEN 1 END) as stopped_equipment,
    COUNT(CASE WHEN active_breakdown_id IS NOT NULL THEN 1 END) as active_breakdowns,
    COUNT(CASE WHEN breakdown_priority = 'urgent' THEN 1 END) as urgent_breakdowns,
    COUNT(CASE WHEN is_emergency = true THEN 1 END) as emergency_breakdowns,
    COUNT(CASE WHEN repair_status = 'repair_pending' THEN 1 END) as pending_repairs,
    COUNT(CASE WHEN repair_status = 'repair_in_progress' THEN 1 END) as in_progress_repairs,
    timezone('utc'::text, now()) as last_updated
FROM v_equipment_status_summary;

-- 9. 성능 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_equipment_status_latest_per_equipment 
ON public.equipment_status(equipment_id, status_changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_breakdown_equipment_status 
ON public.breakdown_reports(equipment_id, unified_status);

CREATE INDEX IF NOT EXISTS idx_repair_breakdown_status 
ON public.repair_reports(breakdown_report_id, unified_status);

CREATE INDEX IF NOT EXISTS idx_status_transition_log_entity 
ON public.status_transition_log(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.system_notifications(target_user_id, is_read, created_at DESC) 
WHERE target_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_equipment_custom_fields 
ON public.equipment_info USING GIN(custom_fields);

CREATE INDEX IF NOT EXISTS idx_equipment_tags 
ON public.equipment_info USING GIN(equipment_tags);

-- 10. RLS 정책
ALTER TABLE public.status_transition_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_status_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "인증된 사용자는 상태 전환 로그 읽기 가능" ON public.status_transition_log
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "모든 사용자는 상태 정의 읽기 가능" ON public.system_status_definitions
  FOR SELECT USING (true);

CREATE POLICY "사용자는 자신의 알림 및 공개 알림 읽기 가능" ON public.system_notifications
  FOR SELECT USING (
    target_user_id = auth.uid() OR
    is_broadcast = true OR
    target_role IN (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 11. 권한 설정
GRANT SELECT ON v_equipment_status_summary TO authenticated, anon;
GRANT SELECT ON v_dashboard_summary TO authenticated, anon;
GRANT SELECT ON v_repair_with_equipment TO authenticated, anon;
GRANT EXECUTE ON FUNCTION transition_unified_status(TEXT, UUID, TEXT, TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_equipment_status_consistency() TO authenticated;

-- 12. 기존 데이터 마이그레이션
UPDATE public.breakdown_reports 
SET unified_status = CASE 
    WHEN status = 'reported' THEN 'breakdown_reported'
    WHEN status = 'assigned' THEN 'breakdown_reported'
    WHEN status = 'in_progress' THEN 'breakdown_in_progress'
    WHEN status = 'completed' THEN 'breakdown_completed'
    ELSE 'breakdown_reported'
END
WHERE unified_status IS NULL OR unified_status = 'breakdown_reported';

UPDATE public.repair_reports 
SET unified_status = CASE 
    WHEN repair_completed_at IS NOT NULL THEN 'repair_completed'
    WHEN repair_started_at IS NOT NULL THEN 'repair_in_progress'
    ELSE 'repair_pending'
END
WHERE unified_status IS NULL OR unified_status = 'repair_pending';

-- ================================================================
-- 완료 메시지
-- ================================================================

DO $$
DECLARE
    total_equipment INTEGER;
    total_breakdowns INTEGER;
    total_repairs INTEGER;
    inconsistency_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_equipment FROM equipment_info;
    SELECT COUNT(*) INTO total_breakdowns FROM breakdown_reports;
    SELECT COUNT(*) INTO total_repairs FROM repair_reports;
    SELECT COUNT(*) INTO inconsistency_count FROM validate_equipment_status_consistency();
    
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'CNC 설비 관리 시스템 - 최종 마이그레이션 완료';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '✅ 의존성 문제 해결 완료';
    RAISE NOTICE '✅ 타입 오류 수정 완료';
    RAISE NOTICE '✅ 핵심 기능 중심 스키마 구성';
    RAISE NOTICE '✅ 통합 상태 시스템 구현 (% 개 상태)', (SELECT COUNT(*) FROM system_status_definitions);
    RAISE NOTICE '✅ 실시간 알림 시스템 구축';
    RAISE NOTICE '✅ 성능 최적화 인덱스 생성';
    RAISE NOTICE '✅ 보안 정책 적용';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '📊 현재 데이터: 설비 % 대, 고장 % 건, 수리 % 건', total_equipment, total_breakdowns, total_repairs;
    
    IF inconsistency_count > 0 THEN
        RAISE NOTICE '⚠️ 데이터 불일치: % 건 (SELECT * FROM validate_equipment_status_consistency();)', inconsistency_count;
    ELSE
        RAISE NOTICE '✅ 데이터 일관성 검증 통과';
    END IF;
    
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '🎉 마이그레이션 완료! 시스템을 사용하실 수 있습니다.';
    RAISE NOTICE '=================================================================';
END $$;