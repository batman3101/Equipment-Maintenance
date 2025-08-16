-- ================================================================
-- 스키마 최적화 및 관계성 개선
-- 테이블 간 관계 정리, 성능 최적화, 일관성 강화
-- ================================================================

-- 1. 중복 관계 정리: repair_reports.equipment_id 제거
-- repair_reports는 breakdown_reports를 통해서만 equipment와 연결되도록 수정

DO $$
BEGIN
    -- repair_reports에 equipment_id가 있다면 제거
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'repair_reports' AND column_name = 'equipment_id') THEN
        
        -- 기존 데이터 검증 (불일치 데이터 확인)
        IF EXISTS (
            SELECT 1 FROM repair_reports rr
            JOIN breakdown_reports br ON rr.breakdown_report_id = br.id
            WHERE rr.equipment_id != br.equipment_id
        ) THEN
            RAISE EXCEPTION '❌ repair_reports와 breakdown_reports 간 equipment_id 불일치 발견. 데이터 정리 후 다시 시도하세요.';
        END IF;
        
        -- equipment_id 컬럼 제거
        ALTER TABLE public.repair_reports DROP COLUMN equipment_id;
        RAISE NOTICE '✅ repair_reports.equipment_id 중복 제거 완료';
    ELSE
        RAISE NOTICE '✅ repair_reports.equipment_id 이미 정리됨';
    END IF;
END $$;

-- 2. 성능 최적화를 위한 복합 인덱스 추가

-- 설비별 상태 조회 최적화
CREATE INDEX IF NOT EXISTS idx_equipment_status_latest_per_equipment 
ON public.equipment_status(equipment_id, status_changed_at DESC);

-- 설비별 고장 상태 조회 최적화
CREATE INDEX IF NOT EXISTS idx_breakdown_equipment_status 
ON public.breakdown_reports(equipment_id, unified_status);

-- 고장별 수리 상태 조회 최적화
CREATE INDEX IF NOT EXISTS idx_repair_breakdown_status 
ON public.repair_reports(breakdown_report_id, unified_status);

-- 알림 조회 최적화
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.system_notifications(target_user_id, is_read, created_at DESC) 
WHERE target_user_id IS NOT NULL;

-- 상태 전환 로그 조회 최적화
CREATE INDEX IF NOT EXISTS idx_status_log_entity_time 
ON public.status_transition_log(entity_type, entity_id, triggered_at DESC);

RAISE NOTICE '✅ 성능 최적화 인덱스 생성 완료';

-- 3. 순환 참조 방지 함수 및 트리거

CREATE OR REPLACE FUNCTION prevent_breakdown_cycle()
RETURNS TRIGGER AS $$
DECLARE
    cycle_check INTEGER;
BEGIN
    -- 상위 고장이 있는 경우 순환 참조 검사
    IF NEW.parent_breakdown_id IS NOT NULL THEN
        WITH RECURSIVE breakdown_tree AS (
            SELECT id, parent_breakdown_id, 1 as depth
            FROM breakdown_reports 
            WHERE id = NEW.parent_breakdown_id
            
            UNION ALL
            
            SELECT br.id, br.parent_breakdown_id, bt.depth + 1
            FROM breakdown_reports br
            JOIN breakdown_tree bt ON br.id = bt.parent_breakdown_id
            WHERE bt.depth < 10  -- 최대 깊이 제한
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

-- 트리거 생성 (이미 있다면 재생성)
DROP TRIGGER IF EXISTS prevent_breakdown_cycle_trigger ON public.breakdown_reports;
CREATE TRIGGER prevent_breakdown_cycle_trigger
    BEFORE INSERT OR UPDATE ON public.breakdown_reports
    FOR EACH ROW EXECUTE FUNCTION prevent_breakdown_cycle();

RAISE NOTICE '✅ 순환 참조 방지 시스템 구축 완료';

-- 4. 데이터 일관성 검증 함수

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

RAISE NOTICE '✅ 데이터 일관성 검증 함수 생성 완료';

-- 5. 최적화된 뷰 재생성 (equipment_id 제거 반영)

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

-- 기존 통합 뷰 업데이트 (성능 최적화)
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
    
    -- 현재 설비 상태 (최신 1개만)
    latest_status.status as current_equipment_status,
    latest_status.status_changed_at as status_last_updated,
    latest_status.status_reason,
    
    -- 통합 상태 정의와 조인
    esd.label_ko as status_label_ko,
    esd.label_vi as status_label_vi,
    esd.color_class as status_color,
    
    -- 활성 고장 정보 (미완료만)
    active_breakdown.id as active_breakdown_id,
    active_breakdown.breakdown_title,
    active_breakdown.priority as breakdown_priority,
    active_breakdown.occurred_at as breakdown_occurred_at,
    active_breakdown.unified_status as breakdown_status,
    active_breakdown.is_emergency,
    
    -- 활성 수리 정보 (진행 중만)
    active_repair.id as active_repair_id,
    active_repair.repair_title,
    active_repair.unified_status as repair_status,
    active_repair.completion_percentage,
    
    -- 다음 정비 예정일
    latest_status.next_maintenance_date,
    
    e.created_at,
    e.updated_at
FROM public.equipment_info e

-- 최신 설비 상태 (인덱스 활용 최적화)
LEFT JOIN LATERAL (
    SELECT status, status_changed_at, status_reason, next_maintenance_date
    FROM public.equipment_status es 
    WHERE es.equipment_id = e.id 
    ORDER BY es.status_changed_at DESC 
    LIMIT 1
) latest_status ON true

-- 상태 정의와 조인
LEFT JOIN public.system_status_definitions esd ON latest_status.status = esd.status_code

-- 활성 고장 신고 (완료되지 않은 것만, 인덱스 활용)
LEFT JOIN LATERAL (
    SELECT id, breakdown_title, priority, occurred_at, unified_status, is_emergency
    FROM public.breakdown_reports br 
    WHERE br.equipment_id = e.id 
    AND br.unified_status NOT IN ('breakdown_completed')
    ORDER BY br.occurred_at DESC 
    LIMIT 1
) active_breakdown ON true

-- 활성 수리 작업 (진행 중인 것만, 수정된 조인)
LEFT JOIN LATERAL (
    SELECT rr.id, rr.repair_title, rr.unified_status, rr.completion_percentage
    FROM public.repair_reports rr
    JOIN public.breakdown_reports br ON rr.breakdown_report_id = br.id
    WHERE br.equipment_id = e.id 
    AND rr.unified_status IN ('repair_pending', 'repair_in_progress')
    ORDER BY rr.created_at DESC 
    LIMIT 1
) active_repair ON true;

RAISE NOTICE '✅ 최적화된 뷰 재생성 완료';

-- 6. 확장성을 위한 메타데이터 필드 추가

DO $$
BEGIN
    -- equipment_info에 동적 필드 지원 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'equipment_info' AND column_name = 'custom_fields') THEN
        ALTER TABLE public.equipment_info ADD COLUMN custom_fields JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'equipment_info' AND column_name = 'equipment_tags') THEN
        ALTER TABLE public.equipment_info ADD COLUMN equipment_tags TEXT[];
    END IF;
    
    -- JSONB 인덱스 추가
    CREATE INDEX IF NOT EXISTS idx_equipment_custom_fields 
    ON public.equipment_info USING GIN(custom_fields);
    
    -- 배열 인덱스 추가
    CREATE INDEX IF NOT EXISTS idx_equipment_tags 
    ON public.equipment_info USING GIN(equipment_tags);
    
    RAISE NOTICE '✅ 확장성 메타데이터 필드 추가 완료';
END $$;

-- 7. 데이터 타입 최적화 및 제약조건 강화

-- completion_percentage 제약조건 확인 및 추가
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name LIKE '%completion_percentage%') THEN
        ALTER TABLE public.repair_reports 
        ADD CONSTRAINT check_completion_percentage 
        CHECK (completion_percentage >= 0 AND completion_percentage <= 100);
    END IF;
    
    -- priority 값 검증 강화
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name LIKE '%priority_check%') THEN
        ALTER TABLE public.breakdown_reports 
        ADD CONSTRAINT priority_check 
        CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
    END IF;
    
    RAISE NOTICE '✅ 데이터 타입 제약조건 강화 완료';
END $$;

-- 8. 권한 최적화

-- 새로운 뷰에 대한 권한 부여
GRANT SELECT ON v_repair_with_equipment TO authenticated, anon;

-- 일관성 검증 함수 권한 (관리자만)
GRANT EXECUTE ON FUNCTION validate_equipment_status_consistency() TO authenticated;

-- 9. 통계 및 모니터링을 위한 추가 뷰

CREATE OR REPLACE VIEW v_system_health_metrics AS
SELECT 
    -- 전체 설비 수
    (SELECT COUNT(*) FROM equipment_info) as total_equipment_count,
    
    -- 현재 가동률
    ROUND(
        (SELECT COUNT(*) FROM v_equipment_status_summary WHERE current_equipment_status = 'running')::DECIMAL / 
        NULLIF((SELECT COUNT(*) FROM equipment_info), 0) * 100, 2
    ) as equipment_utilization_rate,
    
    -- 평균 고장 해결 시간 (시간 단위)
    (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (resolution_date - occurred_at))/3600), 2)
     FROM breakdown_reports 
     WHERE resolution_date IS NOT NULL 
     AND occurred_at >= CURRENT_DATE - INTERVAL '30 days') as avg_breakdown_resolution_hours,
    
    -- 이번 달 고장 건수
    (SELECT COUNT(*) FROM breakdown_reports 
     WHERE EXTRACT(YEAR FROM occurred_at) = EXTRACT(YEAR FROM CURRENT_DATE)
     AND EXTRACT(MONTH FROM occurred_at) = EXTRACT(MONTH FROM CURRENT_DATE)) as monthly_breakdown_count,
    
    -- 긴급 고장 비율
    ROUND(
        (SELECT COUNT(*) FROM breakdown_reports WHERE is_emergency = true AND occurred_at >= CURRENT_DATE - INTERVAL '30 days')::DECIMAL /
        NULLIF((SELECT COUNT(*) FROM breakdown_reports WHERE occurred_at >= CURRENT_DATE - INTERVAL '30 days'), 0) * 100, 2
    ) as emergency_breakdown_rate,
    
    -- 데이터 불일치 건수
    (SELECT COUNT(*) FROM validate_equipment_status_consistency()) as data_inconsistency_count,
    
    -- 마지막 업데이트 시간
    timezone('utc'::text, now()) as last_calculated
;

GRANT SELECT ON v_system_health_metrics TO authenticated, anon;

RAISE NOTICE '✅ 시스템 건강도 모니터링 뷰 생성 완료';

-- ================================================================
-- 완료 메시지 및 추천사항
-- ================================================================

DO $$
DECLARE
    inconsistency_count INTEGER;
BEGIN
    -- 데이터 일관성 검사
    SELECT COUNT(*) INTO inconsistency_count 
    FROM validate_equipment_status_consistency();
    
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '스키마 최적화 및 관계성 개선 완료';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '✅ 중복 관계 정리 (repair_reports.equipment_id 제거)';
    RAISE NOTICE '✅ 성능 최적화 인덱스 추가';
    RAISE NOTICE '✅ 순환 참조 방지 시스템 구축';
    RAISE NOTICE '✅ 데이터 일관성 검증 함수 생성';
    RAISE NOTICE '✅ 최적화된 뷰 재생성';
    RAISE NOTICE '✅ 확장성 메타데이터 필드 추가';
    RAISE NOTICE '✅ 데이터 타입 제약조건 강화';
    RAISE NOTICE '✅ 시스템 건강도 모니터링 구축';
    RAISE NOTICE '=================================================================';
    
    IF inconsistency_count > 0 THEN
        RAISE NOTICE '⚠️ 발견된 데이터 불일치: % 건', inconsistency_count;
        RAISE NOTICE '💡 SELECT * FROM validate_equipment_status_consistency(); 로 확인 가능';
    ELSE
        RAISE NOTICE '✅ 데이터 일관성 검증 통과';
    END IF;
    
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '📊 시스템 상태 모니터링: SELECT * FROM v_system_health_metrics;';
    RAISE NOTICE '🔍 데이터 검증: SELECT * FROM validate_equipment_status_consistency();';
    RAISE NOTICE '=================================================================';
END $$;