-- ================================================================
-- CNC 설비 관리 시스템 - 종합적인 관계형 데이터베이스 스키마 (수정된 버전)
-- 고장 신고와 수리 관리 간의 완벽한 관계형 연결 구현
-- Supabase 호환성 개선 (한국어 텍스트 검색 설정 문제 해결)
-- ================================================================

-- 1. 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- 기존 테이블에 관계형 연결 강화를 위한 ALTER TABLE 및 새로운 필드 추가
-- ================================================================

-- repair_reports 테이블에 breakdown_reports와의 관계 강화
ALTER TABLE public.repair_reports 
ADD COLUMN IF NOT EXISTS repair_status TEXT DEFAULT 'pending' CHECK (repair_status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
ADD COLUMN IF NOT EXISTS estimated_completion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actual_completion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS follow_up_notes TEXT,
ADD COLUMN IF NOT EXISTS warranty_period_days INTEGER DEFAULT 30;

-- breakdown_reports 테이블에 수리 추적을 위한 필드 추가
ALTER TABLE public.breakdown_reports 
ADD COLUMN IF NOT EXISTS repair_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_repair_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS downtime_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS resolution_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS customer_satisfaction_rating INTEGER CHECK (customer_satisfaction_rating >= 1 AND customer_satisfaction_rating <= 5),
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS related_breakdown_id UUID REFERENCES public.breakdown_reports(id) ON DELETE SET NULL;

-- equipment_info 테이블에 통계 및 성능 추적 필드 추가
ALTER TABLE public.equipment_info 
ADD COLUMN IF NOT EXISTS total_breakdown_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_repair_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_downtime_hours DECIMAL(8,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_repair_cost DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_breakdown_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_repair_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS maintenance_score DECIMAL(3,1) DEFAULT 10.0 CHECK (maintenance_score >= 0 AND maintenance_score <= 10),
ADD COLUMN IF NOT EXISTS criticality_level TEXT DEFAULT 'medium' CHECK (criticality_level IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS warranty_end_date DATE,
ADD COLUMN IF NOT EXISTS supplier_contact TEXT,
ADD COLUMN IF NOT EXISTS purchase_cost DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS annual_maintenance_cost DECIMAL(10,2);

-- ================================================================
-- 새로운 관계형 연결을 위한 뷰 생성
-- ================================================================

-- 1. 설비 대시보드 종합 뷰
CREATE OR REPLACE VIEW v_equipment_dashboard AS
SELECT 
    e.id,
    e.equipment_number,
    e.equipment_name,
    e.category,
    e.location,
    e.manufacturer,
    e.model,
    e.installation_date,
    e.total_breakdown_count,
    e.total_repair_count,
    e.total_downtime_hours,
    e.total_repair_cost,
    e.last_breakdown_date,
    e.last_repair_date,
    e.maintenance_score,
    e.criticality_level,
    
    -- 현재 상태 정보
    es.status as current_status,
    es.status_changed_at as status_last_updated,
    es.status_reason as current_status_reason,
    es.next_maintenance_date,
    
    -- 실시간 계산 지표
    CASE 
        WHEN e.total_downtime_hours > 0 THEN 
            ROUND(GREATEST(0, 100 - (e.total_downtime_hours / 168 * 100)), 1)
        ELSE 95.0 
    END as availability_percentage,
    
    CASE 
        WHEN e.total_repair_count > 0 THEN 
            ROUND((e.total_repair_count::DECIMAL / GREATEST(e.total_breakdown_count, 1) * 100), 1)
        ELSE 0 
    END as repair_success_rate,
    
    -- 활성 문제 개수
    (SELECT COUNT(*) FROM public.breakdown_reports br 
     WHERE br.equipment_id = e.id AND br.status NOT IN ('completed')) as active_breakdown_count,
     
    (SELECT COUNT(*) FROM public.repair_reports rr 
     JOIN public.breakdown_reports br ON rr.breakdown_report_id = br.id
     WHERE br.equipment_id = e.id AND rr.repair_status IN ('pending', 'in_progress')) as pending_repair_count,
    
    e.created_at,
    e.updated_at
FROM public.equipment_info e
LEFT JOIN LATERAL (
    SELECT status, status_changed_at, status_reason, next_maintenance_date 
    FROM public.equipment_status es_inner 
    WHERE es_inner.equipment_id = e.id 
    ORDER BY es_inner.status_changed_at DESC 
    LIMIT 1
) es ON true;

-- 2. 고장-수리 이력 통합 뷰
CREATE OR REPLACE VIEW v_breakdown_repair_history AS
SELECT 
    br.id as breakdown_id,
    br.equipment_id,
    e.equipment_number,
    e.equipment_name,
    br.breakdown_title,
    br.breakdown_description,
    br.breakdown_type,
    br.priority,
    br.occurred_at as breakdown_occurred_at,
    br.status as breakdown_status,
    br.downtime_minutes,
    br.resolution_date,
    br.customer_satisfaction_rating,
    
    -- 연관된 수리 정보
    rr.id as repair_id,
    rr.repair_title,
    rr.repair_description,
    rr.repair_method,
    rr.repair_status,
    rr.completion_percentage,
    rr.repair_started_at,
    rr.repair_completed_at,
    rr.actual_repair_time,
    rr.total_cost as repair_cost,
    rr.parts_used,
    rr.root_cause,
    rr.prevention_measures,
    
    -- 담당자 정보
    br_reporter.full_name as reporter_name,
    br_assigned.full_name as assigned_to_name,
    rr_tech.full_name as technician_name,
    
    br.created_at as breakdown_created_at,
    rr.created_at as repair_created_at
FROM public.breakdown_reports br
JOIN public.equipment_info e ON br.equipment_id = e.id
LEFT JOIN public.repair_reports rr ON br.id = rr.breakdown_report_id
LEFT JOIN public.profiles br_reporter ON br.reported_by = br_reporter.id
LEFT JOIN public.profiles br_assigned ON br.assigned_to = br_assigned.id
LEFT JOIN public.profiles rr_tech ON rr.technician_id = rr_tech.id
ORDER BY br.occurred_at DESC;

-- 3. 설비별 통계 뷰
CREATE OR REPLACE VIEW v_equipment_statistics AS
SELECT 
    e.id as equipment_id,
    e.equipment_number,
    e.equipment_name,
    e.category,
    e.location,
    e.manufacturer,
    e.model,
    e.total_breakdown_count,
    e.total_repair_count,
    e.total_downtime_hours,
    e.total_repair_cost,
    
    -- 평균 수리 비용
    CASE 
        WHEN e.total_repair_count > 0 THEN 
            ROUND(e.total_repair_cost / e.total_repair_count, 2)
        ELSE 0 
    END as avg_repair_cost,
    
    -- 평균 다운타임 (분)
    CASE 
        WHEN e.total_breakdown_count > 0 THEN 
            ROUND((e.total_downtime_hours * 60) / e.total_breakdown_count, 1)
        ELSE 0 
    END as avg_downtime_minutes,
    
    -- 품질 통과율 (고객 만족도 기반)
    COALESCE((
        SELECT ROUND(AVG(customer_satisfaction_rating) * 20, 1)
        FROM public.breakdown_reports br 
        WHERE br.equipment_id = e.id 
        AND br.customer_satisfaction_rating IS NOT NULL
    ), 95.0) as quality_pass_rate,
    
    -- 평균 고객 만족도
    COALESCE((
        SELECT ROUND(AVG(customer_satisfaction_rating), 1)
        FROM public.breakdown_reports br 
        WHERE br.equipment_id = e.id 
        AND br.customer_satisfaction_rating IS NOT NULL
    ), 4.5) as avg_satisfaction_rating,
    
    e.maintenance_score,
    e.criticality_level,
    e.last_breakdown_date,
    e.last_repair_date
FROM public.equipment_info e;

-- 4. 월별 통계 뷰
CREATE OR REPLACE VIEW v_monthly_statistics AS
SELECT 
    DATE_TRUNC('month', br.occurred_at) as month,
    COUNT(DISTINCT br.id) as total_breakdowns,
    COUNT(DISTINCT br.equipment_id) as affected_equipment_count,
    COUNT(DISTINCT CASE WHEN br.priority = 'urgent' THEN br.id END) as urgent_breakdowns,
    COUNT(DISTINCT CASE WHEN br.status = 'completed' THEN br.id END) as resolved_breakdowns,
    
    -- 수리 통계
    COUNT(DISTINCT rr.id) as total_repairs,
    COUNT(DISTINCT CASE WHEN rr.repair_status = 'completed' THEN rr.id END) as completed_repairs,
    COALESCE(SUM(rr.total_cost), 0) as total_repair_costs,
    COALESCE(AVG(rr.actual_repair_time), 0) as avg_repair_time_minutes,
    
    -- 다운타임 통계
    COALESCE(SUM(br.downtime_minutes), 0) as total_downtime_minutes,
    COALESCE(AVG(br.downtime_minutes), 0) as avg_downtime_minutes,
    
    -- 고객 만족도
    COALESCE(AVG(br.customer_satisfaction_rating), 0) as avg_customer_satisfaction
FROM public.breakdown_reports br
LEFT JOIN public.repair_reports rr ON br.id = rr.breakdown_report_id
WHERE br.occurred_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
GROUP BY DATE_TRUNC('month', br.occurred_at)
ORDER BY month DESC;

-- ================================================================
-- 통계 및 분석을 위한 함수 생성
-- ================================================================

-- 1. 설비별 고장 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_equipment_breakdown_stats(equipment_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.equipment_info 
    SET 
        total_breakdown_count = (
            SELECT COUNT(*) 
            FROM public.breakdown_reports 
            WHERE equipment_id = equipment_uuid
        ),
        last_breakdown_date = (
            SELECT MAX(occurred_at) 
            FROM public.breakdown_reports 
            WHERE equipment_id = equipment_uuid
        ),
        updated_at = timezone('utc'::text, now())
    WHERE id = equipment_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 설비별 수리 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_equipment_repair_stats(equipment_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.equipment_info 
    SET 
        total_repair_count = (
            SELECT COUNT(DISTINCT rr.id)
            FROM public.repair_reports rr
            JOIN public.breakdown_reports br ON rr.breakdown_report_id = br.id
            WHERE br.equipment_id = equipment_uuid
        ),
        total_repair_cost = (
            SELECT COALESCE(SUM(rr.total_cost), 0)
            FROM public.repair_reports rr
            JOIN public.breakdown_reports br ON rr.breakdown_report_id = br.id
            WHERE br.equipment_id = equipment_uuid
        ),
        last_repair_date = (
            SELECT MAX(rr.repair_completed_at)
            FROM public.repair_reports rr
            JOIN public.breakdown_reports br ON rr.breakdown_report_id = br.id
            WHERE br.equipment_id = equipment_uuid
        ),
        updated_at = timezone('utc'::text, now())
    WHERE id = equipment_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 대시보드 통계 조회 함수
CREATE OR REPLACE FUNCTION get_dashboard_statistics(date_range_days INTEGER DEFAULT 30)
RETURNS TABLE (
    total_equipment INTEGER,
    active_equipment INTEGER,
    breakdown_equipment INTEGER,
    maintenance_equipment INTEGER,
    total_breakdowns_period INTEGER,
    urgent_breakdowns_period INTEGER,
    completed_repairs_period INTEGER,
    pending_repairs INTEGER,
    total_repair_cost_period DECIMAL,
    avg_repair_time_minutes DECIMAL,
    equipment_availability_percent DECIMAL,
    top_problematic_equipment JSON
) AS $$
BEGIN
    RETURN QUERY
    WITH date_filter AS (
        SELECT CURRENT_DATE - INTERVAL '1 day' * date_range_days AS start_date
    ),
    equipment_stats AS (
        SELECT 
            COUNT(*) as total_eq,
            COUNT(CASE WHEN es.status = 'running' THEN 1 END) as active_eq,
            COUNT(CASE WHEN es.status = 'breakdown' THEN 1 END) as breakdown_eq,
            COUNT(CASE WHEN es.status = 'maintenance' THEN 1 END) as maintenance_eq
        FROM public.equipment_info e
        LEFT JOIN LATERAL (
            SELECT status 
            FROM public.equipment_status es_inner 
            WHERE es_inner.equipment_id = e.id 
            ORDER BY es_inner.status_changed_at DESC 
            LIMIT 1
        ) es ON true
    ),
    breakdown_stats AS (
        SELECT 
            COUNT(*) as total_breakdowns,
            COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_breakdowns
        FROM public.breakdown_reports br, date_filter df
        WHERE br.occurred_at >= df.start_date
    ),
    repair_stats AS (
        SELECT 
            COUNT(CASE WHEN repair_status = 'completed' THEN 1 END) as completed_repairs,
            COUNT(CASE WHEN repair_status IN ('pending', 'in_progress') THEN 1 END) as pending_repairs,
            COALESCE(SUM(total_cost), 0) as total_cost,
            COALESCE(AVG(actual_repair_time), 0) as avg_repair_time
        FROM public.repair_reports rr
        JOIN public.breakdown_reports br ON rr.breakdown_report_id = br.id, date_filter df
        WHERE br.occurred_at >= df.start_date
    ),
    availability_stats AS (
        SELECT 
            ROUND(AVG(
                CASE 
                    WHEN total_downtime_hours > 0 THEN 
                        GREATEST(0, 100 - (total_downtime_hours / 168 * 100))
                    ELSE 95.0 
                END
            ), 1) as avg_availability
        FROM public.equipment_info
    ),
    top_problems AS (
        SELECT 
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'equipment_number', equipment_number,
                    'equipment_name', equipment_name,
                    'breakdown_count', breakdown_count,
                    'total_cost', total_repair_costs
                )
                ORDER BY breakdown_count DESC, total_repair_costs DESC
            ) as problematic_equipment
        FROM (
            SELECT 
                e.equipment_number,
                e.equipment_name,
                COUNT(DISTINCT br.id) as breakdown_count,
                COALESCE(SUM(rr.total_cost), 0) as total_repair_costs
            FROM public.equipment_info e
            JOIN public.breakdown_reports br ON e.id = br.equipment_id
            LEFT JOIN public.repair_reports rr ON br.id = rr.breakdown_report_id, date_filter df
            WHERE br.occurred_at >= df.start_date
            GROUP BY e.id, e.equipment_number, e.equipment_name
            ORDER BY breakdown_count DESC, total_repair_costs DESC
            LIMIT 5
        ) top_5
    )
    SELECT 
        es.total_eq::INTEGER,
        es.active_eq::INTEGER,
        es.breakdown_eq::INTEGER,
        es.maintenance_eq::INTEGER,
        bs.total_breakdowns::INTEGER,
        bs.urgent_breakdowns::INTEGER,
        rs.completed_repairs::INTEGER,
        rs.pending_repairs::INTEGER,
        rs.total_cost::DECIMAL,
        rs.avg_repair_time::DECIMAL,
        avs.avg_availability::DECIMAL,
        tp.problematic_equipment::JSON
    FROM equipment_stats es, breakdown_stats bs, repair_stats rs, availability_stats avs, top_problems tp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 자동 통계 업데이트를 위한 트리거 함수 및 트리거
-- ================================================================

-- 고장 신고 트리거 함수
CREATE OR REPLACE FUNCTION handle_breakdown_report_changes()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 설비 통계 업데이트
        UPDATE public.equipment_info 
        SET 
            total_breakdown_count = total_breakdown_count + 1,
            last_breakdown_date = NEW.occurred_at,
            updated_at = timezone('utc'::text, now())
        WHERE id = NEW.equipment_id;
        
        -- 설비 상태를 고장으로 변경
        INSERT INTO public.equipment_status (equipment_id, status, status_reason, updated_by, status_changed_at)
        VALUES (NEW.equipment_id, 'breakdown', '고장 신고 접수', NEW.reported_by, NEW.occurred_at);
        
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- 고장이 완료되면 다운타임 계산 및 업데이트
        IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
            UPDATE public.equipment_info 
            SET 
                total_downtime_hours = total_downtime_hours + (NEW.downtime_minutes / 60.0),
                updated_at = timezone('utc'::text, now())
            WHERE id = NEW.equipment_id;
            
            -- 설비 상태를 가동중으로 복구
            INSERT INTO public.equipment_status (equipment_id, status, status_reason, updated_by, status_changed_at)
            VALUES (NEW.equipment_id, 'running', '고장 수리 완료', NEW.assigned_to, NEW.resolution_date);
        END IF;
        
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.equipment_info 
        SET 
            total_breakdown_count = GREATEST(0, total_breakdown_count - 1),
            updated_at = timezone('utc'::text, now())
        WHERE id = OLD.equipment_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 수리 보고 트리거 함수
CREATE OR REPLACE FUNCTION handle_repair_report_changes()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 설비 수리 통계 업데이트
        PERFORM update_equipment_repair_stats(NEW.equipment_id);
        
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- 수리 완료 시 추가 통계 업데이트
        IF OLD.repair_status != 'completed' AND NEW.repair_status = 'completed' THEN
            PERFORM update_equipment_repair_stats(NEW.equipment_id);
        END IF;
        
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM update_equipment_repair_stats(OLD.equipment_id);
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_breakdown_stats_update ON public.breakdown_reports;
CREATE TRIGGER trigger_breakdown_stats_update
    AFTER INSERT OR UPDATE OR DELETE ON public.breakdown_reports
    FOR EACH ROW EXECUTE FUNCTION handle_breakdown_report_changes();

DROP TRIGGER IF EXISTS trigger_repair_stats_update ON public.repair_reports;
CREATE TRIGGER trigger_repair_stats_update
    AFTER INSERT OR UPDATE OR DELETE ON public.repair_reports
    FOR EACH ROW EXECUTE FUNCTION handle_repair_report_changes();

-- ================================================================
-- 인덱스 최적화 (한국어 텍스트 검색 제거, 기본 텍스트 검색 사용)
-- ================================================================

-- 기존 인덱스 제거 후 재생성
DROP INDEX IF EXISTS idx_equipment_info_search;
DROP INDEX IF EXISTS idx_breakdown_reports_search;

-- 기본 텍스트 검색을 위한 인덱스 (영어 설정 사용)
CREATE INDEX IF NOT EXISTS idx_equipment_info_search ON public.equipment_info USING gin(
    to_tsvector('english', equipment_name || ' ' || COALESCE(manufacturer, '') || ' ' || COALESCE(model, ''))
);

CREATE INDEX IF NOT EXISTS idx_breakdown_reports_search ON public.breakdown_reports USING gin(
    to_tsvector('english', breakdown_title || ' ' || breakdown_description)
);

-- 성능 최적화를 위한 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_breakdown_reports_equipment_status ON public.breakdown_reports(equipment_id, status);
CREATE INDEX IF NOT EXISTS idx_breakdown_reports_occurred_at ON public.breakdown_reports(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_repair_reports_status ON public.repair_reports(repair_status);
CREATE INDEX IF NOT EXISTS idx_repair_reports_completed_at ON public.repair_reports(repair_completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_equipment_status_equipment_status ON public.equipment_status(equipment_id, status);
CREATE INDEX IF NOT EXISTS idx_equipment_status_changed_at ON public.equipment_status(status_changed_at DESC);

-- ================================================================
-- RLS 정책 수정 (유연한 정책으로 개선)
-- ================================================================

-- breakdown_reports 테이블 RLS 정책 수정 (인증 없이도 INSERT 가능)
DROP POLICY IF EXISTS "인증된 사용자는 고장 보고 등록 가능" ON public.breakdown_reports;
CREATE POLICY "모든 사용자는 고장 보고 등록 가능" ON public.breakdown_reports
  FOR INSERT WITH CHECK (true); -- 인증 없이도 등록 가능

-- repair_reports 테이블도 유연하게 수정
DROP POLICY IF EXISTS "기술자와 관리자는 수리 보고 생성/수정 가능" ON public.repair_reports;
CREATE POLICY "인증된 사용자는 수리 보고 생성/수정 가능" ON public.repair_reports
  FOR ALL USING (auth.role() = 'authenticated');

-- equipment_info 테이블 읽기 정책을 더 유연하게
DROP POLICY IF EXISTS "인증된 사용자는 설비 정보 읽기 가능" ON public.equipment_info;
CREATE POLICY "모든 사용자는 설비 정보 읽기 가능" ON public.equipment_info
  FOR SELECT USING (true); -- 인증 없이도 읽기 가능

-- equipment_status 테이블 읽기 정책도 유연하게
DROP POLICY IF EXISTS "인증된 사용자는 설비 현황 읽기 가능" ON public.equipment_status;
CREATE POLICY "모든 사용자는 설비 현황 읽기 가능" ON public.equipment_status
  FOR SELECT USING (true); -- 인증 없이도 읽기 가능

-- ================================================================
-- 데이터 무결성을 위한 추가 제약 조건
-- ================================================================

-- repair_reports와 breakdown_reports 간의 데이터 일관성 체크
ALTER TABLE public.repair_reports 
ADD CONSTRAINT chk_repair_dates_logical 
CHECK (repair_started_at <= COALESCE(repair_completed_at, repair_started_at + INTERVAL '30 days'));

-- breakdown_reports의 다운타임과 해결 날짜 일관성 체크
ALTER TABLE public.breakdown_reports 
ADD CONSTRAINT chk_breakdown_resolution_logical 
CHECK (
    (status = 'completed' AND resolution_date IS NOT NULL) OR 
    (status != 'completed' AND resolution_date IS NULL)
);

-- equipment_info의 날짜 필드 일관성 체크
ALTER TABLE public.equipment_info 
ADD CONSTRAINT chk_equipment_dates_logical 
CHECK (
    installation_date IS NULL OR 
    installation_date <= CURRENT_DATE
);

-- ================================================================
-- 초기 데이터 마이그레이션 (기존 데이터가 있는 경우)
-- ================================================================

-- 기존 설비 데이터의 통계 필드를 실제 데이터로 업데이트
DO $$
DECLARE
    equipment_record RECORD;
BEGIN
    FOR equipment_record IN SELECT id FROM public.equipment_info LOOP
        PERFORM update_equipment_breakdown_stats(equipment_record.id);
        PERFORM update_equipment_repair_stats(equipment_record.id);
    END LOOP;
    
    RAISE NOTICE '기존 설비 데이터의 통계가 업데이트되었습니다.';
END
$$;

-- ================================================================
-- 뷰와 함수에 대한 권한 설정
-- ================================================================

-- 뷰에 대한 읽기 권한 부여
GRANT SELECT ON v_equipment_dashboard TO authenticated, anon;
GRANT SELECT ON v_breakdown_repair_history TO authenticated, anon;
GRANT SELECT ON v_equipment_statistics TO authenticated, anon;
GRANT SELECT ON v_monthly_statistics TO authenticated, anon;

-- 함수에 대한 실행 권한 부여
GRANT EXECUTE ON FUNCTION get_dashboard_statistics(INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_equipment_breakdown_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_equipment_repair_stats(UUID) TO authenticated;

-- ================================================================
-- 완료 메시지
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'CNC 설비 관리 시스템 - 향상된 데이터베이스 스키마 적용 완료';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '✅ 관계형 연결 강화 완료';
    RAISE NOTICE '✅ 통계 뷰 4개 생성 완료';
    RAISE NOTICE '✅ 분석 함수 3개 생성 완료';
    RAISE NOTICE '✅ 자동 업데이트 트리거 생성 완료';
    RAISE NOTICE '✅ 성능 최적화 인덱스 생성 완료';
    RAISE NOTICE '✅ RLS 정책 개선 완료';
    RAISE NOTICE '✅ 데이터 무결성 제약 조건 추가 완료';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '이제 시스템에서 실시간 통계와 관계형 데이터 분석이 가능합니다.';
    RAISE NOTICE '=================================================================';
END
$$;