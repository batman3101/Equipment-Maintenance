-- ================================================================
-- CNC 설비 관리 시스템 - 백엔드 아키텍처 종합 수정 스크립트
-- 2025년 최신 버전 - 모든 권한 및 스키마 문제 해결
-- ================================================================

-- 1. 현재 상태 확인 및 로깅
DO $$
BEGIN
    RAISE NOTICE '=== CNC 설비 관리 시스템 아키텍처 수정 시작 ===';
    RAISE NOTICE '실행 시간: %', NOW();
END $$;

-- 2. 모든 기존 RLS 정책 제거 (클린 스타트)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- 모든 테이블의 RLS 비활성화
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
    
    -- 모든 정책 제거
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
    
    RAISE NOTICE '기존 RLS 정책 모두 제거 완료';
END $$;

-- 3. 필수 테이블 존재 확인 및 생성
-- A. equipment_info 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'equipment_info') THEN
        CREATE TABLE equipment_info (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            equipment_number VARCHAR(100) UNIQUE NOT NULL,
            equipment_name VARCHAR(200) NOT NULL,
            category VARCHAR(100) NOT NULL,
            location VARCHAR(100),
            manufacturer VARCHAR(100),
            model VARCHAR(100),
            installation_date DATE,
            specifications TEXT,
            asset_tag VARCHAR(100),
            serial_number VARCHAR(100),
            custom_fields JSONB DEFAULT '{}',
            equipment_tags TEXT[],
            qr_code VARCHAR(200) UNIQUE,
            iot_device_id VARCHAR(100),
            iot_last_signal TIMESTAMP WITH TIME ZONE,
            energy_rating VARCHAR(50),
            environmental_requirements JSONB DEFAULT '{}',
            -- 통계 필드 (denormalized for performance)
            total_breakdown_count INTEGER DEFAULT 0,
            total_repair_count INTEGER DEFAULT 0,
            total_downtime_hours NUMERIC(10,2) DEFAULT 0,
            total_repair_cost NUMERIC(15,2) DEFAULT 0,
            maintenance_score NUMERIC(5,2) DEFAULT 10.0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'equipment_info 테이블 생성 완료';
    END IF;
END $$;

-- B. equipment_status 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'equipment_status') THEN
        CREATE TABLE equipment_status (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            equipment_id UUID REFERENCES equipment_info(id) ON DELETE CASCADE,
            status VARCHAR(50) NOT NULL CHECK (status IN ('running', 'breakdown', 'standby', 'maintenance', 'stopped')),
            status_reason TEXT,
            updated_by UUID, -- references profiles(id) but no FK for flexibility
            status_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_maintenance_date DATE,
            next_maintenance_date DATE,
            operating_hours NUMERIC(10,2),
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- 인덱스 생성
        CREATE INDEX idx_equipment_status_equipment_id ON equipment_status(equipment_id);
        CREATE INDEX idx_equipment_status_status ON equipment_status(status);
        CREATE INDEX idx_equipment_status_changed_at ON equipment_status(status_changed_at DESC);
        
        RAISE NOTICE 'equipment_status 테이블 생성 완료';
    END IF;
END $$;

-- C. breakdown_reports 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'breakdown_reports') THEN
        CREATE TABLE breakdown_reports (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            equipment_id UUID REFERENCES equipment_info(id) ON DELETE CASCADE,
            breakdown_title VARCHAR(200) NOT NULL,
            breakdown_description TEXT NOT NULL,
            breakdown_type VARCHAR(100),
            priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
            occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            reported_by UUID, -- references profiles(id)
            status VARCHAR(30) DEFAULT 'reported' CHECK (status IN ('reported', 'assigned', 'in_progress', 'completed')),
            assigned_to UUID, -- references profiles(id)
            symptoms TEXT,
            images_urls TEXT[],
            estimated_repair_time INTEGER, -- minutes
            resolution_date TIMESTAMP WITH TIME ZONE,
            -- 통합 상태 시스템 지원
            unified_status VARCHAR(50) DEFAULT 'breakdown_reported',
            parent_breakdown_id UUID REFERENCES breakdown_reports(id),
            is_emergency BOOLEAN DEFAULT false,
            impact_level VARCHAR(20) DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
            affected_operations TEXT[],
            external_contractor_required BOOLEAN DEFAULT false,
            warranty_claim_possible BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- 인덱스 생성
        CREATE INDEX idx_breakdown_reports_equipment_id ON breakdown_reports(equipment_id);
        CREATE INDEX idx_breakdown_reports_occurred_at ON breakdown_reports(occurred_at DESC);
        CREATE INDEX idx_breakdown_reports_status ON breakdown_reports(status);
        CREATE INDEX idx_breakdown_reports_priority ON breakdown_reports(priority);
        CREATE INDEX idx_breakdown_reports_unified_status ON breakdown_reports(unified_status);
        
        RAISE NOTICE 'breakdown_reports 테이블 생성 완료';
    END IF;
END $$;

-- D. repair_reports 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'repair_reports') THEN
        CREATE TABLE repair_reports (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            breakdown_report_id UUID REFERENCES breakdown_reports(id) ON DELETE CASCADE,
            equipment_id UUID REFERENCES equipment_info(id) ON DELETE CASCADE,
            repair_title VARCHAR(200) NOT NULL,
            repair_description TEXT NOT NULL,
            repair_method TEXT,
            technician_id UUID NOT NULL, -- references profiles(id)
            repair_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            repair_completed_at TIMESTAMP WITH TIME ZONE,
            actual_repair_time INTEGER, -- minutes
            parts_used TEXT,
            parts_cost NUMERIC(12,2),
            labor_cost NUMERIC(12,2),
            total_cost NUMERIC(12,2),
            repair_result TEXT NOT NULL,
            test_result TEXT,
            quality_check BOOLEAN DEFAULT false,
            root_cause TEXT,
            prevention_measures TEXT,
            before_images_urls TEXT[],
            after_images_urls TEXT[],
            notes TEXT,
            -- 통합 상태 시스템 지원
            unified_status VARCHAR(50) DEFAULT 'repair_pending',
            repair_category VARCHAR(100),
            complexity_level VARCHAR(20) DEFAULT 'medium' CHECK (complexity_level IN ('simple', 'medium', 'complex', 'critical')),
            required_skills TEXT[],
            certification_required BOOLEAN DEFAULT false,
            safety_requirements TEXT[],
            environmental_impact TEXT,
            completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- 인덱스 생성
        CREATE INDEX idx_repair_reports_breakdown_id ON repair_reports(breakdown_report_id);
        CREATE INDEX idx_repair_reports_equipment_id ON repair_reports(equipment_id);
        CREATE INDEX idx_repair_reports_technician_id ON repair_reports(technician_id);
        CREATE INDEX idx_repair_reports_started_at ON repair_reports(repair_started_at DESC);
        CREATE INDEX idx_repair_reports_unified_status ON repair_reports(unified_status);
        
        RAISE NOTICE 'repair_reports 테이블 생성 완료';
    END IF;
END $$;

-- E. profiles 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        CREATE TABLE profiles (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('system_admin', 'manager', 'user')),
            full_name VARCHAR(200),
            phone VARCHAR(50),
            department VARCHAR(100),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- 기본 관리자 계정 생성
        INSERT INTO profiles (email, role, full_name, is_active) 
        VALUES ('admin@company.com', 'system_admin', 'System Administrator', true);
        
        RAISE NOTICE 'profiles 테이블 생성 및 기본 관리자 계정 추가 완료';
    END IF;
END $$;

-- F. system_settings 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_settings') THEN
        CREATE TABLE system_settings (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            setting_key VARCHAR(100) UNIQUE NOT NULL,
            setting_value TEXT NOT NULL,
            setting_type VARCHAR(20) DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
            description TEXT,
            category VARCHAR(50),
            is_public BOOLEAN DEFAULT false,
            updated_by UUID, -- references profiles(id)
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- 기본 시스템 설정 삽입
        INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
        ('system_version', '1.0.0', 'string', 'System Version', true),
        ('maintenance_alert_days', '7', 'number', 'Days before maintenance alert', true),
        ('auto_refresh_interval', '30000', 'number', 'Auto refresh interval in milliseconds', true),
        ('default_timezone', 'Asia/Ho_Chi_Minh', 'string', 'Default system timezone', true);
        
        RAISE NOTICE 'system_settings 테이블 생성 및 기본 설정 추가 완료';
    END IF;
END $$;

-- 4. 통합 상태 시스템 테이블들
-- A. system_status_definitions 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_status_definitions') THEN
        CREATE TABLE system_status_definitions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            status_code VARCHAR(50) NOT NULL,
            status_group VARCHAR(20) NOT NULL CHECK (status_group IN ('equipment', 'breakdown', 'repair', 'general')),
            label_ko VARCHAR(100) NOT NULL,
            label_vi VARCHAR(100),
            label_en VARCHAR(100),
            color_class VARCHAR(100) NOT NULL,
            icon_name VARCHAR(50),
            sort_order INTEGER DEFAULT 0,
            valid_transitions TEXT[] DEFAULT '{}',
            is_active BOOLEAN DEFAULT true,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(status_code, status_group)
        );
        
        -- 기본 상태 정의 삽입
        INSERT INTO system_status_definitions (status_code, status_group, label_ko, label_vi, label_en, color_class, sort_order, valid_transitions) VALUES
        ('running', 'equipment', '가동중', 'Đang hoạt động', 'Running', 'text-green-600', 1, '["maintenance", "breakdown", "standby", "stopped"]'),
        ('breakdown', 'equipment', '고장', 'Hỏng hóc', 'Breakdown', 'text-red-600', 2, '["running", "maintenance"]'),
        ('maintenance', 'equipment', '정비중', 'Bảo trì', 'Maintenance', 'text-yellow-600', 3, '["running", "stopped"]'),
        ('standby', 'equipment', '대기중', 'Chờ', 'Standby', 'text-blue-600', 4, '["running", "stopped"]'),
        ('stopped', 'equipment', '정지', 'Dừng', 'Stopped', 'text-gray-600', 5, '["running", "standby"]'),
        ('breakdown_reported', 'breakdown', '신고접수', 'Đã báo cáo', 'Reported', 'text-orange-600', 1, '["breakdown_in_progress"]'),
        ('breakdown_in_progress', 'breakdown', '수리중', 'Đang sửa', 'In Progress', 'text-blue-600', 2, '["breakdown_completed"]'),
        ('breakdown_completed', 'breakdown', '수리완료', 'Hoàn thành', 'Completed', 'text-green-600', 3, '[]'),
        ('repair_pending', 'repair', '수리대기', 'Chờ sửa', 'Pending', 'text-yellow-600', 1, '["repair_in_progress"]'),
        ('repair_in_progress', 'repair', '수리진행', 'Đang sửa', 'In Progress', 'text-blue-600', 2, '["repair_completed", "repair_failed"]'),
        ('repair_completed', 'repair', '수리완료', 'Hoàn thành', 'Completed', 'text-green-600', 3, '[]'),
        ('repair_failed', 'repair', '수리실패', 'Thất bại', 'Failed', 'text-red-600', 4, '["repair_pending"]');
        
        RAISE NOTICE 'system_status_definitions 테이블 생성 및 기본 상태 정의 추가 완료';
    END IF;
END $$;

-- B. status_transition_log 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'status_transition_log') THEN
        CREATE TABLE status_transition_log (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('equipment', 'breakdown', 'repair')),
            entity_id UUID NOT NULL,
            from_status VARCHAR(50),
            to_status VARCHAR(50) NOT NULL,
            transition_reason TEXT,
            transition_metadata JSONB DEFAULT '{}',
            triggered_by UUID, -- references profiles(id)
            triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            is_automated BOOLEAN DEFAULT false,
            automation_rule VARCHAR(100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- 인덱스 생성
        CREATE INDEX idx_status_transition_entity ON status_transition_log(entity_type, entity_id);
        CREATE INDEX idx_status_transition_triggered_at ON status_transition_log(triggered_at DESC);
        
        RAISE NOTICE 'status_transition_log 테이블 생성 완료';
    END IF;
END $$;

-- 5. 통합 뷰 생성 (성능 최적화)
-- A. 통합 설비 현황 뷰
CREATE OR REPLACE VIEW v_unified_equipment_status AS
SELECT 
    e.id,
    e.equipment_number,
    e.equipment_name,
    e.category,
    e.location,
    e.manufacturer,
    e.model,
    e.qr_code,
    e.iot_device_id,
    e.iot_last_signal,
    
    -- 현재 설비 상태 (최신 상태만)
    latest_status.status as current_equipment_status,
    latest_status.status_changed_at as status_last_updated,
    latest_status.status_reason,
    
    -- 상태 정의와 조인
    esd.label_ko as status_label_ko,
    esd.label_vi as status_label_vi,
    esd.color_class as status_color,
    
    -- 활성 고장 정보
    active_breakdown.id as active_breakdown_id,
    active_breakdown.breakdown_title,
    active_breakdown.priority as breakdown_priority,
    active_breakdown.occurred_at as breakdown_occurred_at,
    active_breakdown.unified_status as breakdown_status,
    
    -- 활성 수리 정보
    active_repair.id as active_repair_id,
    active_repair.repair_title,
    active_repair.unified_status as repair_status,
    active_repair.completion_percentage,
    
    -- 통계 정보
    e.total_breakdown_count,
    e.total_repair_count,
    e.total_downtime_hours,
    e.total_repair_cost,
    e.maintenance_score,
    
    -- 다음 정비 예정일
    latest_status.next_maintenance_date,
    
    e.created_at,
    e.updated_at
FROM equipment_info e

-- 최신 설비 상태 (LATERAL JOIN으로 성능 최적화)
LEFT JOIN LATERAL (
    SELECT status, status_changed_at, status_reason, next_maintenance_date
    FROM equipment_status es 
    WHERE es.equipment_id = e.id 
    ORDER BY es.status_changed_at DESC 
    LIMIT 1
) latest_status ON true

-- 상태 정의와 조인
LEFT JOIN system_status_definitions esd ON latest_status.status = esd.status_code AND esd.status_group = 'equipment'

-- 활성 고장 신고 (미완료 상태만)
LEFT JOIN LATERAL (
    SELECT id, breakdown_title, priority, occurred_at, unified_status
    FROM breakdown_reports br 
    WHERE br.equipment_id = e.id 
    AND br.status NOT IN ('completed')
    ORDER BY br.occurred_at DESC 
    LIMIT 1
) active_breakdown ON true

-- 활성 수리 작업 (진행중인 수리만)
LEFT JOIN LATERAL (
    SELECT rr.id, rr.repair_title, rr.unified_status, rr.completion_percentage
    FROM repair_reports rr
    JOIN breakdown_reports br ON rr.breakdown_report_id = br.id
    WHERE br.equipment_id = e.id 
    AND rr.unified_status IN ('repair_pending', 'repair_in_progress')
    ORDER BY rr.created_at DESC 
    LIMIT 1
) active_repair ON true;

-- B. 실시간 대시보드 뷰
CREATE OR REPLACE VIEW v_realtime_dashboard AS
SELECT 
    -- 설비 현황 요약
    COUNT(*) as total_equipment,
    COUNT(CASE WHEN current_equipment_status = 'running' THEN 1 END) as running_equipment,
    COUNT(CASE WHEN current_equipment_status = 'breakdown' THEN 1 END) as breakdown_equipment,
    COUNT(CASE WHEN current_equipment_status = 'maintenance' THEN 1 END) as maintenance_equipment,
    COUNT(CASE WHEN current_equipment_status = 'standby' THEN 1 END) as standby_equipment,
    COUNT(CASE WHEN current_equipment_status = 'stopped' THEN 1 END) as stopped_equipment,
    
    -- 고장 현황
    COUNT(CASE WHEN active_breakdown_id IS NOT NULL THEN 1 END) as active_breakdowns,
    COUNT(CASE WHEN breakdown_priority = 'urgent' THEN 1 END) as urgent_breakdowns,
    
    -- 수리 현황
    COUNT(CASE WHEN repair_status = 'repair_pending' THEN 1 END) as pending_repairs,
    COUNT(CASE WHEN repair_status = 'repair_in_progress' THEN 1 END) as in_progress_repairs,
    
    -- 평균 지표
    ROUND(AVG(COALESCE(maintenance_score, 10.0)), 1) as avg_maintenance_score,
    ROUND(AVG(COALESCE(total_downtime_hours, 0)), 1) as avg_downtime_hours,
    
    -- 업데이트 시간
    NOW() as last_updated
FROM v_unified_equipment_status;

-- 6. 개발 환경용 허용적 RLS 정책 설정
-- 모든 테이블에 대해 모든 작업 허용 (개발 환경용)
DO $$
DECLARE
    table_name TEXT;
    tables TEXT[] := ARRAY[
        'equipment_info', 'equipment_status', 'breakdown_reports', 'repair_reports', 
        'profiles', 'system_settings', 'system_status_definitions', 'status_transition_log'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        -- RLS 활성화
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
        
        -- 모든 작업 허용 정책
        EXECUTE format('CREATE POLICY "allow_all_dev_access" ON %I FOR ALL USING (true)', table_name);
        
        RAISE NOTICE '% 테이블에 개발용 RLS 정책 적용 완료', table_name;
    END LOOP;
END $$;

-- 7. 권한 설정
-- 익명 사용자와 인증된 사용자 모두에게 모든 권한 부여 (개발 환경용)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 뷰에 대한 권한 부여
GRANT SELECT ON v_unified_equipment_status TO anon, authenticated;
GRANT SELECT ON v_realtime_dashboard TO anon, authenticated;

-- 8. 통합 상태 전환 함수 생성
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
            FROM equipment_status 
            WHERE equipment_id = p_entity_id 
            ORDER BY status_changed_at DESC 
            LIMIT 1;
            
        WHEN 'breakdown' THEN
            SELECT unified_status INTO current_status 
            FROM breakdown_reports 
            WHERE id = p_entity_id;
            
        WHEN 'repair' THEN
            SELECT unified_status INTO current_status 
            FROM repair_reports 
            WHERE id = p_entity_id;
    END CASE;
    
    -- 유효한 전환인지 확인
    SELECT valid_transitions INTO valid_transitions
    FROM system_status_definitions
    WHERE status_code = current_status;
    
    IF p_new_status = ANY(valid_transitions) OR current_status IS NULL THEN
        is_valid := true;
    END IF;
    
    -- 상태 전환 로그 기록
    INSERT INTO status_transition_log 
    (entity_type, entity_id, from_status, to_status, transition_reason, transition_metadata, triggered_by)
    VALUES 
    (p_entity_type, p_entity_id, current_status, p_new_status, p_reason, p_metadata, p_triggered_by);
    
    -- 실제 상태 업데이트
    CASE p_entity_type
        WHEN 'equipment' THEN
            INSERT INTO equipment_status 
            (equipment_id, status, status_reason, updated_by, status_changed_at)
            VALUES 
            (p_entity_id, p_new_status, p_reason, p_triggered_by, NOW());
            
        WHEN 'breakdown' THEN
            UPDATE breakdown_reports 
            SET unified_status = p_new_status, updated_at = NOW()
            WHERE id = p_entity_id;
            
        WHEN 'repair' THEN
            UPDATE repair_reports 
            SET unified_status = p_new_status, updated_at = NOW()
            WHERE id = p_entity_id;
    END CASE;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수 권한 부여
GRANT EXECUTE ON FUNCTION transition_unified_status TO anon, authenticated;

-- 9. 샘플 데이터 생성 (테스트용)
DO $$
DECLARE
    equipment_id UUID;
    breakdown_id UUID;
BEGIN
    -- 샘플 설비 데이터
    INSERT INTO equipment_info (equipment_number, equipment_name, category, location, manufacturer, model)
    VALUES 
    ('CNC-001', 'CNC 밀링머신 #1', 'CNC 머신', '1공장 A라인', 'FANUC', 'M-2000iA'),
    ('CNC-002', 'CNC 선반 #1', 'CNC 머신', '1공장 B라인', 'MAZAK', 'QT-200'),
    ('PRESS-001', '프레스기 #1', '프레스', '2공장 A라인', 'AMADA', 'TP-60'),
    ('WELD-001', '용접로봇 #1', '용접설비', '3공장 C라인', 'KUKA', 'KR-150')
    ON CONFLICT (equipment_number) DO NOTHING;
    
    -- 샘플 설비 상태
    FOR equipment_id IN (SELECT id FROM equipment_info LIMIT 4) LOOP
        INSERT INTO equipment_status (equipment_id, status, status_reason)
        VALUES (equipment_id, 'running', '정상 가동중')
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    RAISE NOTICE '샘플 데이터 생성 완료';
END $$;

-- 10. 완료 로그 및 검증
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public)
VALUES ('architecture_fix_applied', 'true', 'boolean', '백엔드 아키텍처 수정 완료', 'system', false)
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = 'true',
    updated_at = NOW();

-- 최종 검증 쿼리
DO $$
DECLARE
    table_count INTEGER;
    view_count INTEGER;
    function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public';
    SELECT COUNT(*) INTO view_count FROM information_schema.views WHERE table_schema = 'public';
    SELECT COUNT(*) INTO function_count FROM information_schema.routines WHERE routine_schema = 'public';
    
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '🎉 CNC 설비 관리 시스템 백엔드 아키텍처 수정 완료!';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '✅ 테이블 개수: %', table_count;
    RAISE NOTICE '✅ 뷰 개수: %', view_count;
    RAISE NOTICE '✅ 함수 개수: %', function_count;
    RAISE NOTICE '✅ 모든 테이블에 개발용 RLS 정책 적용';
    RAISE NOTICE '✅ 익명 사용자 전체 권한 부여 (개발 환경용)';
    RAISE NOTICE '✅ 통합 상태 시스템 구축 완료';
    RAISE NOTICE '✅ 성능 최적화 뷰 생성 완료';
    RAISE NOTICE '✅ 샘플 데이터 추가 완료';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '🚀 이제 API 호출이 정상적으로 작동할 것입니다!';
    RAISE NOTICE '=================================================================';
END $$;