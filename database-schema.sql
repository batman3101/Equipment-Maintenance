-- ================================================================
-- CNC 설비 관리 시스템 - 단순화된 데이터베이스 스키마
-- 사용자 요구사항에 맞는 6개 테이블 구조
-- ================================================================

-- 1. 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- 1. 사용자 프로필 테이블 (users)
-- ================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  full_name TEXT,
  phone TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- 2. 설비 정보 테이블 (카테고리, 설비번호)
-- ================================================================
CREATE TABLE public.equipment_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_number TEXT UNIQUE NOT NULL,  -- 설비번호
  equipment_name TEXT NOT NULL,           -- 설비명
  category TEXT NOT NULL,                 -- 카테고리 (밀링머신, 선반, 드릴링머신 등)
  location TEXT,                          -- 설치 위치
  manufacturer TEXT,                      -- 제조사
  model TEXT,                            -- 모델명
  installation_date DATE,                -- 설치일
  specifications TEXT,                   -- 사양 및 특징
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- 3. 설비 현황 테이블 (가동중, 고장중, 대기중 상태 등)
-- ================================================================
CREATE TABLE public.equipment_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES public.equipment_info(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'breakdown', 'standby', 'maintenance', 'stopped')),
  -- running: 가동중, breakdown: 고장중, standby: 대기중, maintenance: 정비중, stopped: 정지
  
  status_reason TEXT,                    -- 상태 변경 사유
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status_changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- 가동 관련 정보
  last_maintenance_date DATE,            -- 최근 정비일
  next_maintenance_date DATE,            -- 다음 정비 예정일
  operating_hours DECIMAL(10,2),        -- 누적 가동시간
  
  notes TEXT,                           -- 비고
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- 4. 고장 보고 테이블
-- ================================================================
CREATE TABLE public.breakdown_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES public.equipment_info(id) ON DELETE CASCADE NOT NULL,
  
  -- 고장 정보
  breakdown_title TEXT NOT NULL,         -- 고장 제목
  breakdown_description TEXT NOT NULL,   -- 고장 상세 설명
  breakdown_type TEXT,                   -- 고장 유형 (전기, 기계, 유압 등)
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- 발생 정보
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  reported_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- 상태 및 처리
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'assigned', 'in_progress', 'completed')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- 추가 정보
  symptoms TEXT,                         -- 증상
  images_urls TEXT[],                   -- 사진 URL 배열
  estimated_repair_time INTEGER,        -- 예상 수리 시간 (분)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- 5. 수리 완료 보고 테이블
-- ================================================================
CREATE TABLE public.repair_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  breakdown_report_id UUID REFERENCES public.breakdown_reports(id) ON DELETE CASCADE NOT NULL,
  equipment_id UUID REFERENCES public.equipment_info(id) ON DELETE CASCADE NOT NULL,
  
  -- 수리 작업 정보
  repair_title TEXT NOT NULL,           -- 수리 작업 제목
  repair_description TEXT NOT NULL,     -- 수리 작업 상세 내용
  repair_method TEXT,                   -- 수리 방법
  
  -- 작업자 및 시간
  technician_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  repair_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  repair_completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  actual_repair_time INTEGER,          -- 실제 수리 시간 (분)
  
  -- 부품 및 비용
  parts_used TEXT,                      -- 사용된 부품
  parts_cost DECIMAL(10,2),            -- 부품 비용
  labor_cost DECIMAL(10,2),            -- 인건비
  total_cost DECIMAL(10,2),            -- 총 비용
  
  -- 결과
  repair_result TEXT NOT NULL,          -- 수리 결과
  test_result TEXT,                     -- 테스트 결과
  quality_check BOOLEAN DEFAULT false,  -- 품질 검사 통과 여부
  
  -- 예방 조치
  root_cause TEXT,                      -- 근본 원인
  prevention_measures TEXT,             -- 예방 조치
  
  -- 추가 정보
  before_images_urls TEXT[],            -- 수리 전 사진 URL 배열
  after_images_urls TEXT[],             -- 수리 후 사진 URL 배열
  notes TEXT,                           -- 특이사항
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- 6. 시스템 설정 테이블
-- ================================================================
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type TEXT DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  category TEXT,
  is_public BOOLEAN DEFAULT false,      -- 일반 사용자에게 공개 여부
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- 인덱스 생성
-- ================================================================

-- profiles 테이블 인덱스
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_department ON public.profiles(department);

-- equipment_info 테이블 인덱스
CREATE INDEX idx_equipment_info_number ON public.equipment_info(equipment_number);
CREATE INDEX idx_equipment_info_category ON public.equipment_info(category);
CREATE INDEX idx_equipment_info_location ON public.equipment_info(location);

-- equipment_status 테이블 인덱스
CREATE INDEX idx_equipment_status_equipment_id ON public.equipment_status(equipment_id);
CREATE INDEX idx_equipment_status_status ON public.equipment_status(status);
CREATE INDEX idx_equipment_status_changed_at ON public.equipment_status(status_changed_at);

-- breakdown_reports 테이블 인덱스
CREATE INDEX idx_breakdown_reports_equipment_id ON public.breakdown_reports(equipment_id);
CREATE INDEX idx_breakdown_reports_status ON public.breakdown_reports(status);
CREATE INDEX idx_breakdown_reports_priority ON public.breakdown_reports(priority);
CREATE INDEX idx_breakdown_reports_reported_by ON public.breakdown_reports(reported_by);
CREATE INDEX idx_breakdown_reports_assigned_to ON public.breakdown_reports(assigned_to);
CREATE INDEX idx_breakdown_reports_occurred_at ON public.breakdown_reports(occurred_at);

-- repair_reports 테이블 인덱스
CREATE INDEX idx_repair_reports_breakdown_id ON public.repair_reports(breakdown_report_id);
CREATE INDEX idx_repair_reports_equipment_id ON public.repair_reports(equipment_id);
CREATE INDEX idx_repair_reports_technician_id ON public.repair_reports(technician_id);
CREATE INDEX idx_repair_reports_completed_at ON public.repair_reports(repair_completed_at);

-- system_settings 테이블 인덱스
CREATE INDEX idx_system_settings_key ON public.system_settings(setting_key);
CREATE INDEX idx_system_settings_category ON public.system_settings(category);

-- ================================================================
-- Row Level Security (RLS) 활성화
-- ================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breakdown_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- RLS 정책 설정
-- ================================================================

-- profiles 테이블 정책
CREATE POLICY "사용자는 자신의 프로필 읽기 가능" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "사용자는 자신의 프로필 업데이트 가능" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "관리자는 모든 프로필 접근 가능" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- equipment_info 테이블 정책
CREATE POLICY "인증된 사용자는 설비 정보 읽기 가능" ON public.equipment_info
  FOR SELECT USING (auth.role() = 'authenticated');

-- 인증된 사용자는 설비 정보 추가 가능
CREATE POLICY "인증된 사용자는 설비 정보 추가 가능" ON public.equipment_info
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 관리자만 설비 정보 수정/삭제 가능
CREATE POLICY "관리자만 설비 정보 수정/삭제 가능" ON public.equipment_info
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "관리자만 설비 정보 삭제 가능" ON public.equipment_info
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- equipment_status 테이블 정책
CREATE POLICY "인증된 사용자는 설비 현황 읽기 가능" ON public.equipment_status
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자는 설비 현황 업데이트 가능" ON public.equipment_status
  FOR ALL USING (auth.role() = 'authenticated');

-- breakdown_reports 테이블 정책
CREATE POLICY "인증된 사용자는 고장 보고 읽기 가능" ON public.breakdown_reports
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자는 고장 보고 등록 가능" ON public.breakdown_reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "사용자는 자신이 등록한 고장 수정 가능, 관리자는 모든 고장 수정 가능" ON public.breakdown_reports
  FOR UPDATE USING (
    reported_by = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- repair_reports 테이블 정책
CREATE POLICY "인증된 사용자는 수리 보고 읽기 가능" ON public.repair_reports
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "기술자와 관리자는 수리 보고 생성/수정 가능" ON public.repair_reports
  FOR ALL USING (
    technician_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- system_settings 테이블 정책
CREATE POLICY "공개 설정은 모든 사용자가 읽기 가능" ON public.system_settings
  FOR SELECT USING (is_public = true AND auth.role() = 'authenticated');

CREATE POLICY "관리자만 시스템 설정 관리 가능" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ================================================================
-- 트리거 함수 생성
-- ================================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 새 사용자 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 설비 상태 변경 시 설비 현황 업데이트 함수
CREATE OR REPLACE FUNCTION public.handle_equipment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 새로운 상태가 기존 상태와 다를 때만 새 레코드 생성
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.equipment_status (
      equipment_id,
      status,
      status_reason,
      updated_by,
      status_changed_at
    ) VALUES (
      NEW.id,
      NEW.status,
      '시스템 자동 업데이트',
      auth.uid(),
      timezone('utc'::text, now())
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 트리거 생성
-- ================================================================

-- updated_at 자동 업데이트 트리거들
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_equipment_info
  BEFORE UPDATE ON public.equipment_info
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_equipment_status
  BEFORE UPDATE ON public.equipment_status
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_breakdown_reports
  BEFORE UPDATE ON public.breakdown_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_repair_reports
  BEFORE UPDATE ON public.repair_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_system_settings
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 새 사용자 프로필 자동 생성 트리거
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- 초기 데이터 삽입
-- ================================================================

-- 시스템 설정 초기값
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, category, is_public) VALUES
('app_name', 'CNC 설비 관리 시스템', 'string', '애플리케이션 이름', 'general', true),
('app_version', '1.0.0', 'string', '애플리케이션 버전', 'general', true),
('company_name', '회사명을 입력하세요', 'string', '회사 이름', 'general', true),
('maintenance_alert_days', '7', 'number', '정비 알림 일수', 'maintenance', false),
('default_work_hours_start', '08:00', 'string', '기본 작업 시작 시간', 'general', false),
('default_work_hours_end', '18:00', 'string', '기본 작업 종료 시간', 'general', false),
('emergency_contact_phone', '119', 'string', '비상 연락처', 'emergency', true),
('auto_status_update', 'true', 'boolean', '설비 상태 자동 업데이트', 'system', false);

-- 샘플 설비 정보 데이터
INSERT INTO public.equipment_info (equipment_number, equipment_name, category, location, manufacturer, model) VALUES
('CNC-ML-001', 'CNC 밀링머신 #1', '밀링머신', '1공장 A라인', 'HAAS', 'VF-2'),
('CNC-LT-001', 'CNC 선반 #1', '선반', '1공장 B라인', 'OKUMA', 'LB-3000'),
('CNC-DR-001', 'CNC 드릴링머신 #1', '드릴링머신', '2공장 A라인', 'BROTHER', 'TC-S2A'),
('CNC-GR-001', 'CNC 그라인딩머신 #1', '그라인딩머신', '2공장 B라인', 'STUDER', 'S33'),
('CNC-LC-001', 'CNC 레이저커터 #1', '레이저커터', '3공장 A라인', 'TRUMPF', 'TruLaser 3030');

-- 샘플 설비 현황 데이터 (초기 상태는 모두 가동중)
INSERT INTO public.equipment_status (equipment_id, status, status_reason, status_changed_at) 
SELECT 
  id, 
  'running',
  '초기 설정',
  timezone('utc'::text, now())
FROM public.equipment_info;

-- ================================================================
-- 스키마 생성 완료!
-- ================================================================

-- 생성된 테이블 확인
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'profiles' THEN '사용자 프로필'
        WHEN table_name = 'equipment_info' THEN '설비 정보'
        WHEN table_name = 'equipment_status' THEN '설비 현황'
        WHEN table_name = 'breakdown_reports' THEN '고장 보고'
        WHEN table_name = 'repair_reports' THEN '수리 완료 보고'
        WHEN table_name = 'system_settings' THEN '시스템 설정'
        ELSE table_name
    END as description
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY 
  CASE table_name
    WHEN 'profiles' THEN 1
    WHEN 'equipment_info' THEN 2
    WHEN 'equipment_status' THEN 3
    WHEN 'breakdown_reports' THEN 4
    WHEN 'repair_reports' THEN 5
    WHEN 'system_settings' THEN 6
    ELSE 7
  END;

-- profiles 테이블 인덱스
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_department ON public.profiles(department);

-- equipment 테이블 인덱스
CREATE INDEX idx_equipment_number ON public.equipment(equipment_number);
CREATE INDEX idx_equipment_type ON public.equipment(equipment_type);
CREATE INDEX idx_equipment_location ON public.equipment(location);
CREATE INDEX idx_equipment_status ON public.equipment(status);

-- breakdowns 테이블 인덱스
CREATE INDEX idx_breakdowns_equipment_id ON public.breakdowns(equipment_id);
CREATE INDEX idx_breakdowns_status ON public.breakdowns(status);
CREATE INDEX idx_breakdowns_priority ON public.breakdowns(priority);
CREATE INDEX idx_breakdowns_reporter_id ON public.breakdowns(reporter_id);
CREATE INDEX idx_breakdowns_assigned_to ON public.breakdowns(assigned_to);
CREATE INDEX idx_breakdowns_reported_at ON public.breakdowns(reported_at);
CREATE INDEX idx_breakdowns_status_priority ON public.breakdowns(status, priority);

-- repair_logs 테이블 인덱스
CREATE INDEX idx_repair_logs_breakdown_id ON public.repair_logs(breakdown_id);
CREATE INDEX idx_repair_logs_technician_id ON public.repair_logs(technician_id);
CREATE INDEX idx_repair_logs_started_at ON public.repair_logs(started_at);

-- parts 테이블 인덱스
CREATE INDEX idx_parts_number ON public.parts(part_number);
CREATE INDEX idx_parts_category ON public.parts(category);
CREATE INDEX idx_parts_stock_level ON public.parts(current_stock);

-- maintenance_schedules 테이블 인덱스
CREATE INDEX idx_maintenance_schedules_equipment_id ON public.maintenance_schedules(equipment_id);
CREATE INDEX idx_maintenance_schedules_next_due ON public.maintenance_schedules(next_due_at);
CREATE INDEX idx_maintenance_schedules_assigned_to ON public.maintenance_schedules(assigned_to);

-- system_settings 테이블 인덱스
CREATE INDEX idx_system_settings_key ON public.system_settings(setting_key);
CREATE INDEX idx_system_settings_category ON public.system_settings(category);

-- ================================================================
-- Row Level Security (RLS) 활성화
-- ================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- RLS 정책 설정
-- ================================================================

-- profiles 테이블 정책
CREATE POLICY "사용자는 자신의 프로필 읽기 가능" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "사용자는 자신의 프로필 업데이트 가능" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "관리자는 모든 프로필 접근 가능" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- equipment 테이블 정책
CREATE POLICY "인증된 사용자는 설비 정보 읽기 가능" ON public.equipment
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "관리자만 설비 정보 수정 가능" ON public.equipment
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- breakdowns 테이블 정책
CREATE POLICY "인증된 사용자는 고장 정보 읽기 가능" ON public.breakdowns
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자는 고장 등록 가능" ON public.breakdowns
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "사용자는 자신이 등록한 고장 수정 가능, 관리자는 모든 고장 수정 가능" ON public.breakdowns
  FOR UPDATE USING (
    reporter_id = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- repair_logs 테이블 정책
CREATE POLICY "인증된 사용자는 수리 로그 읽기 가능" ON public.repair_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "기술자와 관리자는 수리 로그 생성/수정 가능" ON public.repair_logs
  FOR ALL USING (
    technician_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- parts 테이블 정책
CREATE POLICY "인증된 사용자는 부품 정보 읽기 가능" ON public.parts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "관리자만 부품 정보 수정 가능" ON public.parts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- maintenance_schedules 테이블 정책
CREATE POLICY "인증된 사용자는 정비 스케줄 읽기 가능" ON public.maintenance_schedules
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "관리자와 담당자는 정비 스케줄 수정 가능" ON public.maintenance_schedules
  FOR ALL USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- system_settings 테이블 정책
CREATE POLICY "공개 설정은 모든 사용자가 읽기 가능" ON public.system_settings
  FOR SELECT USING (is_public = true AND auth.role() = 'authenticated');

CREATE POLICY "관리자만 시스템 설정 관리 가능" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ================================================================
-- 트리거 함수 생성
-- ================================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 새 사용자 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 트리거 생성
-- ================================================================

-- updated_at 자동 업데이트 트리거들
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_equipment
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_breakdowns
  BEFORE UPDATE ON public.breakdowns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_repair_logs
  BEFORE UPDATE ON public.repair_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_parts
  BEFORE UPDATE ON public.parts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_maintenance_schedules
  BEFORE UPDATE ON public.maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_system_settings
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 새 사용자 프로필 자동 생성 트리거
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- 초기 데이터 삽입
-- ================================================================

-- 시스템 설정 초기값
INSERT INTO public.system_settings (setting_key, setting_value, description, category, is_public) VALUES
('app_name', '"CNC 설비 관리 시스템"', '애플리케이션 이름', 'general', true),
('app_version', '"1.0.0"', '애플리케이션 버전', 'general', true),
('maintenance_reminder_days', '7', '정비 알림 일수', 'maintenance', false),
('default_work_hours', '{"start": "08:00", "end": "18:00"}', '기본 작업 시간', 'general', false),
('emergency_contact', '{"phone": "119", "email": "emergency@company.com"}', '비상 연락처', 'emergency', true);

-- 샘플 설비 데이터
INSERT INTO public.equipment (equipment_number, equipment_name, equipment_type, manufacturer, location, status) VALUES
('CNC-ML-001', 'CNC 밀링머신 #1', 'Milling Machine', 'HAAS', '1공장 A라인', 'active'),
('CNC-LT-001', 'CNC 선반 #1', 'Lathe', 'OKUMA', '1공장 B라인', 'active'),
('CNC-DR-001', 'CNC 드릴링머신 #1', 'Drilling Machine', 'BROTHER', '2공장 A라인', 'active'),
('CNC-GR-001', 'CNC 그라인딩머신 #1', 'Grinding Machine', 'STUDER', '2공장 B라인', 'active'),
('CNC-LC-001', 'CNC 레이저커터 #1', 'Laser Cutter', 'TRUMPF', '3공장 A라인', 'active');

-- 샘플 부품 데이터
INSERT INTO public.parts (part_number, part_name, category, unit_price, current_stock, min_stock_level) VALUES
('BRG-001', '베어링 6205', '베어링', 15000, 50, 10),
('BLT-001', 'V벨트 A형', '벨트', 8000, 30, 5),
('FLT-001', '오일 필터', '필터', 25000, 20, 5),
('OIL-001', '절삭유 20L', '오일/절삭유', 45000, 15, 3),
('SPR-001', '스프링 압축형', '스프링', 5000, 100, 20);

-- ================================================================
-- 스키마 생성 완료!
-- ================================================================

-- 생성된 테이블 확인
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'profiles' THEN '사용자 프로필'
        WHEN table_name = 'equipment' THEN '설비 정보'
        WHEN table_name = 'breakdowns' THEN '고장 보고'
        WHEN table_name = 'repair_logs' THEN '수리 작업 로그'
        WHEN table_name = 'parts' THEN '부품 재고'
        WHEN table_name = 'maintenance_schedules' THEN '정비 스케줄'
        WHEN table_name = 'system_settings' THEN '시스템 설정'
        ELSE table_name
    END as description
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;