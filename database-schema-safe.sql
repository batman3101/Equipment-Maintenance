-- ================================================================
-- CNC 설비 관리 시스템 - 안전한 데이터베이스 스키마
-- 기존 테이블이 있어도 안전하게 처리
-- ================================================================

-- 1. 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- OPTION 1: 기존 테이블 삭제 후 재생성 (데이터 손실 주의!)
-- ================================================================
-- DROP TABLE IF EXISTS public.repair_history CASCADE;
-- DROP TABLE IF EXISTS public.breakdown_reports CASCADE;
-- DROP TABLE IF EXISTS public.equipment_status CASCADE;
-- DROP TABLE IF EXISTS public.equipment_info CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- ================================================================
-- OPTION 2: 테이블이 없을 때만 생성 (IF NOT EXISTS 사용)
-- ================================================================

-- 1. 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- 2. 설비 정보 테이블
CREATE TABLE IF NOT EXISTS public.equipment_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_number TEXT UNIQUE NOT NULL,
  equipment_name TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT,
  manufacturer TEXT,
  model TEXT,
  installation_date DATE,
  specifications TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 설비 현황 테이블
CREATE TABLE IF NOT EXISTS public.equipment_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES public.equipment_info(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('operational', 'maintenance', 'broken', 'idle')),
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  usage_hours DECIMAL(10,2),
  performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
  notes TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. 고장 신고 테이블
CREATE TABLE IF NOT EXISTS public.breakdown_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES public.equipment_info(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES public.profiles(id),
  urgency_level TEXT NOT NULL CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
  issue_description TEXT NOT NULL,
  issue_category TEXT,
  photos TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. 수리 이력 테이블
CREATE TABLE IF NOT EXISTS public.repair_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  breakdown_report_id UUID REFERENCES public.breakdown_reports(id) ON DELETE SET NULL,
  equipment_id UUID NOT NULL REFERENCES public.equipment_info(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES public.profiles(id),
  repair_type TEXT NOT NULL CHECK (repair_type IN ('corrective', 'preventive', 'emergency', 'upgrade')),
  work_description TEXT NOT NULL,
  parts_replaced TEXT[],
  time_spent DECIMAL(5,2),
  cost DECIMAL(10,2),
  completion_status TEXT NOT NULL CHECK (completion_status IN ('completed', 'partial', 'failed')),
  test_results TEXT,
  recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ================================================================
-- 인덱스 생성 (IF NOT EXISTS)
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_equipment_category ON public.equipment_info(category);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON public.equipment_status(status);
CREATE INDEX IF NOT EXISTS idx_breakdown_status ON public.breakdown_reports(status);
CREATE INDEX IF NOT EXISTS idx_breakdown_urgency ON public.breakdown_reports(urgency_level);
CREATE INDEX IF NOT EXISTS idx_repair_type ON public.repair_history(repair_type);

-- ================================================================
-- RLS (Row Level Security) 정책
-- ================================================================

-- profiles 테이블 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone'
  ) THEN
    CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- equipment_info 테이블 RLS
ALTER TABLE public.equipment_info ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'equipment_info' AND policyname = 'Equipment info viewable by authenticated users'
  ) THEN
    CREATE POLICY "Equipment info viewable by authenticated users" ON public.equipment_info
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'equipment_info' AND policyname = 'Only admins can modify equipment'
  ) THEN
    CREATE POLICY "Only admins can modify equipment" ON public.equipment_info
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('admin', 'manager')
        )
      );
  END IF;
END $$;

-- equipment_status 테이블 RLS
ALTER TABLE public.equipment_status ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'equipment_status' AND policyname = 'Status viewable by authenticated users'
  ) THEN
    CREATE POLICY "Status viewable by authenticated users" ON public.equipment_status
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'equipment_status' AND policyname = 'Authorized users can update status'
  ) THEN
    CREATE POLICY "Authorized users can update status" ON public.equipment_status
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- breakdown_reports 테이블 RLS
ALTER TABLE public.breakdown_reports ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'breakdown_reports' AND policyname = 'Reports viewable by authenticated users'
  ) THEN
    CREATE POLICY "Reports viewable by authenticated users" ON public.breakdown_reports
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'breakdown_reports' AND policyname = 'Users can create reports'
  ) THEN
    CREATE POLICY "Users can create reports" ON public.breakdown_reports
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'breakdown_reports' AND policyname = 'Users can update own reports'
  ) THEN
    CREATE POLICY "Users can update own reports" ON public.breakdown_reports
      FOR UPDATE USING (
        reported_by = auth.uid() OR 
        assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('admin', 'manager')
        )
      );
  END IF;
END $$;

-- repair_history 테이블 RLS
ALTER TABLE public.repair_history ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'repair_history' AND policyname = 'History viewable by authenticated users'
  ) THEN
    CREATE POLICY "History viewable by authenticated users" ON public.repair_history
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'repair_history' AND policyname = 'Technicians can create repair records'
  ) THEN
    CREATE POLICY "Technicians can create repair records" ON public.repair_history
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'repair_history' AND policyname = 'Technicians can update own records'
  ) THEN
    CREATE POLICY "Technicians can update own records" ON public.repair_history
      FOR UPDATE USING (
        technician_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('admin', 'manager')
        )
      );
  END IF;
END $$;

-- ================================================================
-- 트리거 함수: updated_at 자동 업데이트
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (IF NOT EXISTS 방식)
DO $$ 
BEGIN
  -- profiles 테이블 트리거
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'handle_profiles_updated_at'
  ) THEN
    CREATE TRIGGER handle_profiles_updated_at 
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
  
  -- equipment_info 테이블 트리거
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'handle_equipment_info_updated_at'
  ) THEN
    CREATE TRIGGER handle_equipment_info_updated_at 
      BEFORE UPDATE ON public.equipment_info
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
  
  -- equipment_status 테이블 트리거
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'handle_equipment_status_updated_at'
  ) THEN
    CREATE TRIGGER handle_equipment_status_updated_at 
      BEFORE UPDATE ON public.equipment_status
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
  
  -- breakdown_reports 테이블 트리거
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'handle_breakdown_reports_updated_at'
  ) THEN
    CREATE TRIGGER handle_breakdown_reports_updated_at 
      BEFORE UPDATE ON public.breakdown_reports
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- ================================================================
-- 현재 Auth 사용자를 profiles 테이블에 동기화
-- ================================================================
INSERT INTO public.profiles (id, email, role, full_name, is_active)
SELECT 
  id,
  email,
  'admin',  -- 첫 번째 사용자는 관리자로 설정
  COALESCE(raw_user_meta_data->>'full_name', email),
  true
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE profiles.id = auth.users.id
);

-- ================================================================
-- 샘플 데이터 (선택사항 - 필요시 주석 해제)
-- ================================================================
/*
-- 샘플 설비 데이터
INSERT INTO public.equipment_info (equipment_number, equipment_name, category, location, manufacturer, model)
VALUES 
  ('CNC-001', 'CNC 밀링머신 #1', 'CNC', 'A동 1층', 'HAAS', 'VF-2SS'),
  ('CNC-002', 'CNC 선반 #1', 'CNC', 'A동 1층', 'MAZAK', 'QT-250'),
  ('CLN-001', '초음파 세척기', 'CLEANING', 'B동 2층', 'BRANSON', 'M8800'),
  ('DEB-001', '디버링 머신', 'DEBURRING', 'A동 2층', 'APEX', 'DB-500');

-- 샘플 설비 상태
INSERT INTO public.equipment_status (equipment_id, status, usage_hours, performance_score)
SELECT 
  id, 
  'operational',
  RANDOM() * 1000,
  80 + FLOOR(RANDOM() * 20)
FROM public.equipment_info;
*/

-- ================================================================
-- 완료 메시지
-- ================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ 데이터베이스 스키마 설정 완료!';
  RAISE NOTICE '📋 생성된 테이블: profiles, equipment_info, equipment_status, breakdown_reports, repair_history';
  RAISE NOTICE '🔐 RLS 정책 적용 완료';
  RAISE NOTICE '👤 Auth 사용자가 profiles 테이블에 동기화되었습니다.';
END $$;