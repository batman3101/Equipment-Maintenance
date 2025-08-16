-- ================================================================
-- CNC 설비 관리 시스템 - 통합 상태 시스템 호환 데이터베이스 스키마
-- 기존 스키마 문제점 해결 및 통합 아키텍처 지원
-- ================================================================

-- 1. 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ================================================================
-- 1. 기존 테이블 수정 (호환성 개선)
-- ================================================================

-- profiles 테이블 role 값 통일
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('system_admin', 'manager', 'user'));

-- 기존 'admin' 값을 'system_admin'으로 변경
UPDATE public.profiles 
SET role = 'system_admin' 
WHERE role = 'admin';

-- ================================================================
-- 2. 통합 상태 시스템을 위한 새로운 테이블들
-- ================================================================

-- A. 상태 전환 이력 테이블 (모든 상태 변경 추적)
CREATE TABLE public.status_transition_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('equipment', 'breakdown', 'repair')),
  entity_id UUID NOT NULL,
  
  -- 상태 전환 정보
  from_status TEXT,
  to_status TEXT NOT NULL,
  transition_reason TEXT,
  transition_metadata JSONB DEFAULT '{}',
  
  -- 담당자 및 시간
  triggered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- 자동/수동 전환 구분
  is_automated BOOLEAN DEFAULT false,
  automation_rule TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- B. 통합 상태 정의 테이블 (SystemStatus enum을 DB에서 관리)
CREATE TABLE public.system_status_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status_code TEXT UNIQUE NOT NULL,
  status_group TEXT NOT NULL CHECK (status_group IN ('equipment', 'breakdown', 'repair', 'general')),
  
  -- 다국어 지원
  label_ko TEXT NOT NULL,
  label_vi TEXT,
  label_en TEXT,
  
  -- UI 표시 정보
  color_class TEXT NOT NULL,
  icon_name TEXT,
  sort_order INTEGER DEFAULT 0,
  
  -- 상태 전환 규칙
  valid_transitions TEXT[] DEFAULT '{}',
  
  -- 메타데이터
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- C. 실시간 알림 시스템 테이블
CREATE TABLE public.system_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 알림 기본 정보
  notification_type TEXT NOT NULL CHECK (notification_type IN ('breakdown', 'repair', 'maintenance', 'system', 'user')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- 연관 엔티티
  related_entity_type TEXT CHECK (related_entity_type IN ('equipment', 'breakdown', 'repair', 'user')),
  related_entity_id UUID,
  
  -- 수신자 정보
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_role TEXT, -- 특정 역할 전체에게 알림
  is_broadcast BOOLEAN DEFAULT false, -- 전체 알림
  
  -- 상태 정보
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  
  -- 알림 설정
  requires_action BOOLEAN DEFAULT false,
  action_url TEXT,
  auto_expire_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- D. 부품 재고 관리 테이블
CREATE TABLE public.parts_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 부품 기본 정보
  part_number TEXT UNIQUE NOT NULL,
  part_name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  
  -- 규격 및 사양
  specifications JSONB DEFAULT '{}',
  manufacturer TEXT,
  model TEXT,
  unit TEXT DEFAULT 'EA',
  
  -- 재고 정보
  current_stock INTEGER DEFAULT 0 CHECK (current_stock >= 0),
  min_stock_level INTEGER DEFAULT 0,
  max_stock_level INTEGER,
  reorder_point INTEGER DEFAULT 0,
  
  -- 비용 정보
  unit_cost DECIMAL(10,2),
  last_purchase_price DECIMAL(10,2),
  supplier TEXT,
  supplier_contact TEXT,
  
  -- 위치 정보
  storage_location TEXT,
  warehouse_section TEXT,
  shelf_position TEXT,
  
  -- 상태 정보
  is_active BOOLEAN DEFAULT true,
  is_critical BOOLEAN DEFAULT false,
  last_stock_check_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- E. 부품 입출고 이력 테이블
CREATE TABLE public.parts_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  part_id UUID REFERENCES public.parts_inventory(id) ON DELETE CASCADE NOT NULL,
  
  -- 거래 정보
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjust', 'transfer')),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  
  -- 연관 정보
  related_repair_id UUID REFERENCES public.repair_reports(id) ON DELETE SET NULL,
  related_maintenance_id UUID, -- 정비 스케줄과 연동 시 사용
  
  -- 거래 상세
  reason TEXT,
  reference_number TEXT,
  supplier TEXT,
  
  -- 담당자 및 승인
  handled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- 위치 정보
  from_location TEXT,
  to_location TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- 3. 기존 테이블 개선 (새 필드 추가)
-- ================================================================

-- equipment_info 테이블에 QR코드 및 IoT 연동 필드 추가
ALTER TABLE public.equipment_info 
ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS iot_device_id TEXT,
ADD COLUMN IF NOT EXISTS iot_last_signal TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS asset_tag TEXT,
ADD COLUMN IF NOT EXISTS serial_number TEXT,
ADD COLUMN IF NOT EXISTS energy_rating TEXT,
ADD COLUMN IF NOT EXISTS environmental_requirements JSONB DEFAULT '{}';

-- breakdown_reports 테이블에 새로운 상태 시스템 지원 필드 추가
ALTER TABLE public.breakdown_reports 
ADD COLUMN IF NOT EXISTS unified_status TEXT DEFAULT 'breakdown_reported',
ADD COLUMN IF NOT EXISTS parent_breakdown_id UUID REFERENCES public.breakdown_reports(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS impact_level TEXT DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS affected_operations TEXT[],
ADD COLUMN IF NOT EXISTS external_contractor_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS warranty_claim_possible BOOLEAN DEFAULT false;

-- repair_reports 테이블에 통합 상태 시스템 지원 필드 추가
ALTER TABLE public.repair_reports 
ADD COLUMN IF NOT EXISTS unified_status TEXT DEFAULT 'repair_pending',
ADD COLUMN IF NOT EXISTS repair_category TEXT,
ADD COLUMN IF NOT EXISTS complexity_level TEXT DEFAULT 'medium' CHECK (complexity_level IN ('simple', 'medium', 'complex', 'critical')),
ADD COLUMN IF NOT EXISTS required_skills TEXT[],
ADD COLUMN IF NOT EXISTS certification_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS safety_requirements TEXT[],
ADD COLUMN IF NOT EXISTS environmental_impact TEXT;

-- ================================================================
-- 4. 통합 상태 시스템 초기 데이터
-- ================================================================

-- 시스템 상태 정의 데이터 삽입
INSERT INTO public.system_status_definitions (status_code, status_group, label_ko, label_vi, label_en, color_class, valid_transitions) VALUES
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
('pending', 'general', '대기', 'Chờ', 'Pending', 'bg-yellow-100 text-yellow-800', ARRAY['active', 'inactive']);

-- ================================================================
-- 5. 통합 뷰 생성 (관계형 데이터 조회 최적화)
-- ================================================================

-- A. 통합 설비 현황 뷰 (모든 관련 정보 포함)
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
FROM public.equipment_info e

-- 최신 설비 상태
LEFT JOIN LATERAL (
    SELECT status, status_changed_at, status_reason, next_maintenance_date
    FROM public.equipment_status es 
    WHERE es.equipment_id = e.id 
    ORDER BY es.status_changed_at DESC 
    LIMIT 1
) latest_status ON true

-- 상태 정의와 조인
LEFT JOIN public.system_status_definitions esd ON latest_status.status = esd.status_code

-- 활성 고장 신고
LEFT JOIN LATERAL (
    SELECT id, breakdown_title, priority, occurred_at, unified_status
    FROM public.breakdown_reports br 
    WHERE br.equipment_id = e.id 
    AND br.status NOT IN ('completed')
    ORDER BY br.occurred_at DESC 
    LIMIT 1
) active_breakdown ON true

-- 활성 수리 작업
LEFT JOIN LATERAL (
    SELECT rr.id, rr.repair_title, rr.unified_status, rr.completion_percentage
    FROM public.repair_reports rr
    JOIN public.breakdown_reports br ON rr.breakdown_report_id = br.id
    WHERE br.equipment_id = e.id 
    AND rr.unified_status IN ('repair_pending', 'repair_in_progress')
    ORDER BY rr.created_at DESC 
    LIMIT 1
) active_repair ON true;

-- B. 실시간 대시보드 데이터 뷰
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
    timezone('utc'::text, now()) as last_updated
FROM v_unified_equipment_status;

-- ================================================================
-- 6. 통합 함수 생성 (상태 전환 및 동기화)
-- ================================================================

-- A. 통합 상태 전환 함수
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

-- B. 자동 상태 동기화 함수 (워크플로우 기반)
CREATE OR REPLACE FUNCTION auto_sync_related_statuses()
RETURNS trigger AS $$
DECLARE
    equipment_uuid UUID;
    breakdown_uuid UUID;
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
        IF NEW.priority = 'urgent' THEN
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

-- ================================================================
-- 7. 트리거 생성 (자동 동기화)
-- ================================================================

-- 자동 상태 동기화 트리거
CREATE OR REPLACE TRIGGER trigger_auto_sync_breakdown_status
    AFTER INSERT ON public.breakdown_reports
    FOR EACH ROW EXECUTE FUNCTION auto_sync_related_statuses();

CREATE OR REPLACE TRIGGER trigger_auto_sync_repair_status
    AFTER UPDATE ON public.repair_reports
    FOR EACH ROW EXECUTE FUNCTION auto_sync_related_statuses();

-- 알림 자동 만료 트리거
CREATE OR REPLACE FUNCTION auto_expire_notifications()
RETURNS trigger AS $$
BEGIN
    -- 자동 만료 시간이 지난 알림들을 자동으로 만료 처리
    UPDATE public.system_notifications 
    SET is_dismissed = true, dismissed_at = timezone('utc'::text, now())
    WHERE auto_expire_at IS NOT NULL 
    AND auto_expire_at < timezone('utc'::text, now())
    AND is_dismissed = false;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 정기적으로 알림 만료 처리 (매시간)
CREATE OR REPLACE TRIGGER trigger_auto_expire_notifications
    BEFORE INSERT ON public.system_notifications
    FOR EACH STATEMENT EXECUTE FUNCTION auto_expire_notifications();

-- ================================================================
-- 8. 인덱스 최적화 (성능 개선)
-- ================================================================

-- 상태 전환 로그 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_status_transition_log_entity ON public.status_transition_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_status_transition_log_triggered_at ON public.status_transition_log(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_transition_log_status ON public.status_transition_log(to_status);

-- 알림 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON public.system_notifications(target_user_id) WHERE target_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_target_role ON public.system_notifications(target_role) WHERE target_role IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.system_notifications(is_read, created_at DESC) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_severity ON public.system_notifications(severity, created_at DESC);

-- 부품 재고 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_parts_inventory_number ON public.parts_inventory(part_number);
CREATE INDEX IF NOT EXISTS idx_parts_inventory_category ON public.parts_inventory(category);
CREATE INDEX IF NOT EXISTS idx_parts_inventory_stock_level ON public.parts_inventory(current_stock) WHERE current_stock <= reorder_point;

-- 부품 거래 이력 인덱스
CREATE INDEX IF NOT EXISTS idx_parts_transactions_part_id ON public.parts_transactions(part_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parts_transactions_repair_id ON public.parts_transactions(related_repair_id) WHERE related_repair_id IS NOT NULL;

-- 통합 상태 필드 인덱스
CREATE INDEX IF NOT EXISTS idx_breakdown_reports_unified_status ON public.breakdown_reports(unified_status);
CREATE INDEX IF NOT EXISTS idx_repair_reports_unified_status ON public.repair_reports(unified_status);

-- ================================================================
-- 9. RLS 정책 개선 (보안 강화)
-- ================================================================

-- 새 테이블들에 RLS 활성화
ALTER TABLE public.status_transition_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_status_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_transactions ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성

-- 상태 전환 로그: 인증된 사용자는 읽기만 가능
CREATE POLICY "인증된 사용자는 상태 전환 로그 읽기 가능" ON public.status_transition_log
  FOR SELECT USING (auth.role() = 'authenticated');

-- 상태 정의: 모든 사용자 읽기 가능, 관리자만 수정 가능
CREATE POLICY "모든 사용자는 상태 정의 읽기 가능" ON public.system_status_definitions
  FOR SELECT USING (true);

CREATE POLICY "관리자만 상태 정의 수정 가능" ON public.system_status_definitions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'system_admin'
    )
  );

-- 알림: 사용자는 자신의 알림만, 관리자는 모든 알림 접근 가능
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

CREATE POLICY "사용자는 자신의 알림 상태 변경 가능" ON public.system_notifications
  FOR UPDATE USING (target_user_id = auth.uid())
  WITH CHECK (target_user_id = auth.uid());

-- 부품 재고: 인증된 사용자 읽기, 관리자 수정 가능
CREATE POLICY "인증된 사용자는 부품 재고 읽기 가능" ON public.parts_inventory
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "관리자만 부품 재고 수정 가능" ON public.parts_inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('system_admin', 'manager')
    )
  );

-- ================================================================
-- 10. 초기 샘플 데이터 (테스트용)
-- ================================================================

-- 부품 재고 샘플 데이터
INSERT INTO public.parts_inventory (part_number, part_name, category, current_stock, min_stock_level, unit_cost) VALUES
('BRG-6205', '베어링 6205', '베어링', 50, 10, 15000),
('BLT-A100', 'V벨트 A형 100mm', '벨트', 30, 5, 8000),
('FLT-OIL-20', '오일 필터 20micron', '필터', 20, 5, 25000),
('OIL-CUT-20L', '절삭유 20L', '오일/절삭유', 15, 3, 45000),
('SPR-COMP-M8', '스프링 압축형 M8', '스프링', 100, 20, 5000);

-- ================================================================
-- 11. 권한 설정
-- ================================================================

-- 뷰 권한 부여
GRANT SELECT ON v_unified_equipment_status TO authenticated, anon;
GRANT SELECT ON v_realtime_dashboard TO authenticated, anon;

-- 함수 권한 부여
GRANT EXECUTE ON FUNCTION transition_unified_status(TEXT, UUID, TEXT, TEXT, UUID, JSONB) TO authenticated;

-- ================================================================
-- 완료 메시지
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'CNC 설비 관리 시스템 - 통합 상태 시스템 호환 스키마 적용 완료';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '✅ 통합 상태 시스템 완전 지원';
    RAISE NOTICE '✅ 실시간 상태 동기화 구현';
    RAISE NOTICE '✅ 알림 시스템 구축';
    RAISE NOTICE '✅ 부품 재고 관리 시스템 추가';
    RAISE NOTICE '✅ 관계형 데이터 통합 뷰 생성';
    RAISE NOTICE '✅ 자동 워크플로우 처리';
    RAISE NOTICE '✅ 성능 최적화 인덱스 생성';
    RAISE NOTICE '✅ 보안 정책 강화';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '이제 시스템이 통합 아키텍처와 완전히 호환됩니다.';
    RAISE NOTICE '=================================================================';
END
$$;