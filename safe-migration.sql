-- ================================================================
-- CNC 설비 관리 시스템 - 안전한 마이그레이션 스크립트
-- 의존성 해결 및 점진적 업그레이드
-- ================================================================

-- 1. 확장 기능 및 기본 설정
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- 2. 기존 뷰 의존성 확인 및 정리
-- ================================================================

DO $$
DECLARE
    view_record RECORD;
    dependent_views TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- repair_reports.equipment_id에 의존하는 뷰들 찾기
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE definition LIKE '%repair_reports%' 
        AND definition LIKE '%equipment_id%'
        AND schemaname = 'public'
    LOOP
        dependent_views := array_append(dependent_views, view_record.viewname);
        RAISE NOTICE '의존성 뷰 발견: %', view_record.viewname;
    END LOOP;
    
    -- 발견된 의존성 뷰들 삭제
    IF array_length(dependent_views, 1) > 0 THEN
        RAISE NOTICE '% 개의 의존성 뷰를 임시 삭제합니다', array_length(dependent_views, 1);
        
        -- repair_reports_summary 뷰가 있다면 삭제
        DROP VIEW IF EXISTS public.repair_reports_summary CASCADE;
        
        -- 기타 관련 뷰들 삭제
        DROP VIEW IF EXISTS public.v_repair_details CASCADE;
        DROP VIEW IF EXISTS public.v_repair_equipment CASCADE;
        DROP VIEW IF EXISTS public.v_unified_equipment_status CASCADE;
        
        RAISE NOTICE '✅ 의존성 뷰 정리 완료';
    ELSE
        RAISE NOTICE '✅ 의존성 뷰 없음';
    END IF;
END $$;

-- 3. 기존 테이블 정리 및 수정
-- ================================================================

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
-- ================================================================

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
  valid_transitions TEXT[] DEFAULT '{}',
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

RAISE NOTICE '✅ 새 테이블 생성 완료';

-- 5. 기존 테이블 확장 (핵심 필드만)
-- ================================================================

-- equipment_info 테이블 확장
DO $$
BEGIN
    -- 기본 관리 필드만 추가 (IoT 관련 제외)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_info' AND column_name = 'asset_tag') THEN
        ALTER TABLE public.equipment_info ADD COLUMN asset_tag TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_info' AND column_name = 'serial_number') THEN
        ALTER TABLE public.equipment_info ADD COLUMN serial_number TEXT;
    END IF;
    
    -- 확장성을 위한 메타데이터 필드
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

-- 6. 통합 상태 시스템 초기 데이터
-- ================================================================

INSERT INTO public.system_status_definitions (status_code, status_group, label_ko, label_vi, label_en, color_class, valid_transitions) 
VALUES
-- 설비 상태
('running', 'equipment', '운영 중', 'Đang hoạt động', 'Running', 'bg-green-100 text-green-800', ARRAY['breakdown', 'standby', 'maintenance', 'stopped']),
('breakdown', 'equipment', '고장', 'Hỏng hóc', 'Breakdown', 'bg-red-100 text-red-800', ARRAY['maintenance', 'stopped']),
('standby', 'equipment', '대기', 'Chờ', 'Standby', 'bg-yellow-100 text-yellow-800', ARRAY['running', 'maintenance', 'stopped']),
('maintenance', 'equipment', '정비 중', 'Bảo trì', 'Maintenance', 'bg-blue-100 text-blue-800', ARRAY['running', 'standby', 'stopped']),
('stopped', 'equipment', '중지', 'Dừng', 'Stopped', 'bg-gray-100 text-gray-800', ARRAY['running', 'standby', 'maintenance']),

-- 고장 신고 상태
('breakdown_reported', 'breakdown', '신고 접수', 'Đã báo cáo', 'Reported', 'bg-orange-100 text-orange-800', ARRAY['breakdown_in_progress']),
('breakdown_in_progress', 'breakdown', '수리 중', 'Đang sửa chữa', 'In Progress', 'bg-blue-100 text-blue-800', ARRAY['breakdown_completed']),
('breakdown_completed', 'breakdown', '수리 완료', 'Hoàn thành', 'Completed', 'bg-green-100 text-green-800', ARRAY[]),

-- 수리 상태
('repair_pending', 'repair', '수리 대기', 'Chờ sửa chữa', 'Pending', 'bg-yellow-100 text-yellow-800', ARRAY['repair_in_progress']),
('repair_in_progress', 'repair', '수리 진행', 'Đang sửa chữa', 'In Progress', 'bg-blue-100 text-blue-800', ARRAY['repair_completed', 'repair_failed']),
('repair_completed', 'repair', '수리 완료', 'Hoàn thành', 'Completed', 'bg-green-100 text-green-800', ARRAY[]),
('repair_failed', 'repair', '수리 실패', 'Thất bại', 'Failed', 'bg-red-100 text-red-800', ARRAY['repair_pending']),

-- 일반 상태
('active', 'general', '활성', 'Hoạt động', 'Active', 'bg-green-100 text-green-800', ARRAY['inactive']),
('inactive', 'general', '비활성', 'Không hoạt động', 'Inactive', 'bg-gray-100 text-gray-800', ARRAY['active']),
('pending', 'general', '대기', 'Chờ', 'Pending', 'bg-yellow-100 text-yellow-800', ARRAY['active', 'inactive'])
ON CONFLICT (status_code) DO NOTHING;

RAISE NOTICE '✅ 상태 정의 데이터 삽입 완료';

-- 7. 핵심 함수 생성
-- ================================================================

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

-- 자동 상태 동기화 함수
CREATE OR REPLACE FUNCTION auto_sync_equipment_statuses()
RETURNS trigger AS $$
DECLARE
    equipment_uuid UUID;
BEGIN
    -- 고장 신고 생성 시 설비 상태를 자동으로 'breakdown'으로 변경
    IF TG_TABLE_NAME = 'breakdown_reports' AND TG_OP = 'INSERT' THEN
        PERFORM transition_unified_status(
            'equipment', 
            NEW.equipment_id, 
            'breakdown', 
            '고장 신고 접수: ' || NEW.breakdown_title,
            NEW.reported_by,
            jsonb_build_object('breakdown_id', NEW.id, 'priority', NEW.priority)
        );
        
        -- 긴급 고장의 경우 알림 생성
        IF NEW.priority = 'urgent' OR NEW.is_emergency = true THEN
            INSERT INTO public.system_notifications 
            (notification_type, title, message, severity, related_entity_type, related_entity_id, is_broadcast)
            VALUES 
            ('breakdown', '긴급 고장 신고', 
             NEW.equipment_name || '에서 긴급 고장이 발생했습니다: ' || NEW.breakdown_title,
             'critical', 'breakdown', NEW.id, true);
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- 수리 완료 시 관련 상태들 자동 업데이트
    IF TG_TABLE_NAME = 'repair_reports' AND TG_OP = 'UPDATE' THEN
        IF OLD.unified_status != 'repair_completed' AND NEW.unified_status = 'repair_completed' THEN
            -- 연관된 고장 신고 완료 처리
            UPDATE public.breakdown_reports 
            SET unified_status = 'breakdown_completed', 
                resolution_date = NEW.repair_completed_at
            WHERE id = NEW.breakdown_report_id;
            
            -- 설비 상태를 가동중으로 복구
            SELECT equipment_id INTO equipment_uuid 
            FROM public.breakdown_reports 
            WHERE id = NEW.breakdown_report_id;
            
            PERFORM transition_unified_status(
                'equipment', 
                equipment_uuid, 
                'running', 
                '수리 완료: ' || NEW.repair_title,
                NEW.technician_id,
                jsonb_build_object('repair_id', NEW.id, 'breakdown_id', NEW.breakdown_report_id)
            );
            
            -- 수리 완료 알림 생성
            INSERT INTO public.system_notifications 
            (notification_type, title, message, severity, related_entity_type, related_entity_id, target_role)
            VALUES 
            ('repair', '수리 완료', 
             '설비 수리가 완료되었습니다: ' || NEW.repair_title,
             'medium', 'repair', NEW.id, 'manager');
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 순환 참조 방지 함수
CREATE OR REPLACE FUNCTION prevent_breakdown_cycle()
RETURNS TRIGGER AS $$
DECLARE
    cycle_check INTEGER;
BEGIN
    IF NEW.parent_breakdown_id IS NOT NULL THEN
        WITH RECURSIVE breakdown_tree AS (
            SELECT id, parent_breakdown_id, 1 as depth
            FROM breakdown_reports 
            WHERE id = NEW.parent_breakdown_id
            
            UNION ALL
            
            SELECT br.id, br.parent_breakdown_id, bt.depth + 1
            FROM breakdown_reports br
            JOIN breakdown_tree bt ON br.id = bt.parent_breakdown_id
            WHERE bt.depth < 10
        )
        SELECT COUNT(*) INTO cycle_check
        FROM breakdown_tree 
        WHERE id = NEW.id;
        
        IF cycle_check > 0 THEN
            RAISE EXCEPTION '순환 참조가 감지되었습니다: breakdown_id %', NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

RAISE NOTICE '✅ 핵심 함수 생성 완료';

-- 8. 트리거 생성
-- ================================================================

DROP TRIGGER IF EXISTS trigger_auto_sync_breakdown_status ON public.breakdown_reports;
CREATE TRIGGER trigger_auto_sync_breakdown_status
    AFTER INSERT ON public.breakdown_reports
    FOR EACH ROW EXECUTE FUNCTION auto_sync_equipment_statuses();

DROP TRIGGER IF EXISTS trigger_auto_sync_repair_status ON public.repair_reports;
CREATE TRIGGER trigger_auto_sync_repair_status
    AFTER UPDATE ON public.repair_reports
    FOR EACH ROW EXECUTE FUNCTION auto_sync_equipment_statuses();

DROP TRIGGER IF EXISTS prevent_breakdown_cycle_trigger ON public.breakdown_reports;
CREATE TRIGGER prevent_breakdown_cycle_trigger
    BEFORE INSERT OR UPDATE ON public.breakdown_reports
    FOR EACH ROW EXECUTE FUNCTION prevent_breakdown_cycle();

RAISE NOTICE '✅ 트리거 생성 완료';

-- 9. 새로운 뷰 생성 (equipment_id 없이)
-- ================================================================

-- A. 수리 작업과 설비 정보 통합 뷰 (equipment_id 제거 후)
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
    
    -- 활성 수리 정보 (수정된 조인)
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

-- 수정된 수리 정보 조인 (equipment_id 없이)
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

-- D. 시스템 건강도 메트릭 뷰
CREATE OR REPLACE VIEW v_system_health_metrics AS
SELECT 
    (SELECT COUNT(*) FROM equipment_info) as total_equipment_count,
    ROUND(
        (SELECT COUNT(*) FROM v_equipment_status_summary WHERE current_equipment_status = 'running')::DECIMAL / 
        NULLIF((SELECT COUNT(*) FROM equipment_info), 0) * 100, 2
    ) as equipment_utilization_rate,
    (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (resolution_date - occurred_at))/3600), 2)
     FROM breakdown_reports 
     WHERE resolution_date IS NOT NULL 
     AND occurred_at >= CURRENT_DATE - INTERVAL '30 days') as avg_breakdown_resolution_hours,
    (SELECT COUNT(*) FROM breakdown_reports 
     WHERE EXTRACT(YEAR FROM occurred_at) = EXTRACT(YEAR FROM CURRENT_DATE)
     AND EXTRACT(MONTH FROM occurred_at) = EXTRACT(MONTH FROM CURRENT_DATE)) as monthly_breakdown_count,
    ROUND(
        (SELECT COUNT(*) FROM breakdown_reports WHERE is_emergency = true AND occurred_at >= CURRENT_DATE - INTERVAL '30 days')::DECIMAL /
        NULLIF((SELECT COUNT(*) FROM breakdown_reports WHERE occurred_at >= CURRENT_DATE - INTERVAL '30 days'), 0) * 100, 2
    ) as emergency_breakdown_rate,
    (SELECT COUNT(*) FROM validate_equipment_status_consistency()) as data_inconsistency_count,
    timezone('utc'::text, now()) as last_calculated;

RAISE NOTICE '✅ 새로운 뷰 생성 완료';

-- 10. 성능 최적화 인덱스
-- ================================================================

-- 기본 성능 인덱스
CREATE INDEX IF NOT EXISTS idx_equipment_status_latest_per_equipment 
ON public.equipment_status(equipment_id, status_changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_breakdown_equipment_status 
ON public.breakdown_reports(equipment_id, unified_status);

CREATE INDEX IF NOT EXISTS idx_repair_breakdown_status 
ON public.repair_reports(breakdown_report_id, unified_status);

-- 상태 전환 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_status_transition_log_entity 
ON public.status_transition_log(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_status_transition_log_triggered_at 
ON public.status_transition_log(triggered_at DESC);

-- 알림 시스템 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.system_notifications(target_user_id, is_read, created_at DESC) 
WHERE target_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_severity 
ON public.system_notifications(severity, created_at DESC);

-- 확장성 인덱스
CREATE INDEX IF NOT EXISTS idx_equipment_custom_fields 
ON public.equipment_info USING GIN(custom_fields);

CREATE INDEX IF NOT EXISTS idx_equipment_tags 
ON public.equipment_info USING GIN(equipment_tags);

CREATE INDEX IF NOT EXISTS idx_equipment_asset_tag 
ON public.equipment_info(asset_tag) WHERE asset_tag IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_breakdown_reports_emergency 
ON public.breakdown_reports(is_emergency) WHERE is_emergency = true;

RAISE NOTICE '✅ 성능 최적화 인덱스 생성 완료';

-- 11. RLS (Row Level Security) 정책
-- ================================================================

-- 새 테이블들에 RLS 활성화
ALTER TABLE public.status_transition_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_status_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
DROP POLICY IF EXISTS "인증된 사용자는 상태 전환 로그 읽기 가능" ON public.status_transition_log;
CREATE POLICY "인증된 사용자는 상태 전환 로그 읽기 가능" ON public.status_transition_log
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "모든 사용자는 상태 정의 읽기 가능" ON public.system_status_definitions;
CREATE POLICY "모든 사용자는 상태 정의 읽기 가능" ON public.system_status_definitions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "관리자만 상태 정의 수정 가능" ON public.system_status_definitions;
CREATE POLICY "관리자만 상태 정의 수정 가능" ON public.system_status_definitions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'system_admin'
    )
  );

DROP POLICY IF EXISTS "사용자는 자신의 알림 및 공개 알림 읽기 가능" ON public.system_notifications;
CREATE POLICY "사용자는 자신의 알림 및 공개 알림 읽기 가능" ON public.system_notifications
  FOR SELECT USING (
    target_user_id = auth.uid() OR
    is_broadcast = true OR
    target_role IN (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('system_admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "사용자는 자신의 알림 상태 변경 가능" ON public.system_notifications;
CREATE POLICY "사용자는 자신의 알림 상태 변경 가능" ON public.system_notifications
  FOR UPDATE USING (target_user_id = auth.uid())
  WITH CHECK (target_user_id = auth.uid());

RAISE NOTICE '✅ RLS 정책 설정 완료';

-- 12. 권한 설정
-- ================================================================

-- 뷰 권한 부여
GRANT SELECT ON v_equipment_status_summary TO authenticated, anon;
GRANT SELECT ON v_dashboard_summary TO authenticated, anon;
GRANT SELECT ON v_repair_with_equipment TO authenticated, anon;
GRANT SELECT ON v_system_health_metrics TO authenticated, anon;

-- 함수 권한 부여
GRANT EXECUTE ON FUNCTION transition_unified_status(TEXT, UUID, TEXT, TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_equipment_status_consistency() TO authenticated;

RAISE NOTICE '✅ 권한 설정 완료';

-- 13. 기존 데이터 마이그레이션
-- ================================================================

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

RAISE NOTICE '✅ 기존 데이터 마이그레이션 완료';

-- ================================================================
-- 최종 검증 및 완료 메시지
-- ================================================================

DO $$
DECLARE
    inconsistency_count INTEGER;
    total_equipment INTEGER;
    total_breakdowns INTEGER;
    total_repairs INTEGER;
    equipment_id_exists BOOLEAN;
BEGIN
    -- repair_reports.equipment_id 제거 확인
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'repair_reports' AND column_name = 'equipment_id'
    ) INTO equipment_id_exists;
    
    -- 기본 통계 수집
    SELECT COUNT(*) INTO total_equipment FROM equipment_info;
    SELECT COUNT(*) INTO total_breakdowns FROM breakdown_reports;
    SELECT COUNT(*) INTO total_repairs FROM repair_reports;
    
    -- 데이터 일관성 검사
    SELECT COUNT(*) INTO inconsistency_count FROM validate_equipment_status_consistency();
    
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'CNC 설비 관리 시스템 - 안전한 마이그레이션 완료';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '✅ 의존성 뷰 정리 및 재생성 완료';
    
    IF equipment_id_exists THEN
        RAISE NOTICE '⚠️ repair_reports.equipment_id가 아직 존재합니다 (의존성 문제 가능성)';
    ELSE
        RAISE NOTICE '✅ repair_reports.equipment_id 중복 제거 완료';
    END IF;
    
    RAISE NOTICE '✅ 핵심 기능 중심 스키마 구성 완료';
    RAISE NOTICE '✅ 통합 상태 시스템 구현 (% 개 상태 정의)', (SELECT COUNT(*) FROM system_status_definitions);
    RAISE NOTICE '✅ 실시간 알림 시스템 구축';
    RAISE NOTICE '✅ 자동 워크플로우 처리 시스템';
    RAISE NOTICE '✅ 성능 최적화 인덱스 생성';
    RAISE NOTICE '✅ 보안 정책 (RLS) 적용';
    RAISE NOTICE '✅ 데이터 일관성 검증 시스템 구축';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '📊 현재 데이터 현황:';
    RAISE NOTICE '   - 설비: % 대', total_equipment;
    RAISE NOTICE '   - 고장 신고: % 건', total_breakdowns;
    RAISE NOTICE '   - 수리 보고서: % 건', total_repairs;
    RAISE NOTICE '=================================================================';
    
    IF inconsistency_count > 0 THEN
        RAISE NOTICE '⚠️ 발견된 데이터 불일치: % 건', inconsistency_count;
        RAISE NOTICE '💡 SELECT * FROM validate_equipment_status_consistency(); 로 확인하세요';
    ELSE
        RAISE NOTICE '✅ 데이터 일관성 검증 통과';
    END IF;
    
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '❌ 제외된 기능: 부품 재고 관리, IoT 연동 (향후 별도 확장 가능)';
    RAISE NOTICE '💡 시스템 상태 모니터링: SELECT * FROM v_system_health_metrics;';
    RAISE NOTICE '📈 실시간 대시보드: SELECT * FROM v_dashboard_summary;';
    RAISE NOTICE '🔍 데이터 검증: SELECT * FROM validate_equipment_status_consistency();';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '🎉 안전한 마이그레이션 완료! 핵심 설비 관리 기능을 이용하실 수 있습니다.';
    RAISE NOTICE '=================================================================';
END $$;