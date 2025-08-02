-- CNC 설비 관리 시스템 데이터베이스 스키마
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. 사용자 프로필 테이블
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 설비 정보 테이블
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_number TEXT UNIQUE NOT NULL,
  equipment_type TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 고장 보고 테이블
CREATE TABLE breakdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'in_progress', 'under_repair', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  breakdown_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. 수리 내역 테이블
CREATE TABLE repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breakdown_id UUID REFERENCES breakdowns(id) ON DELETE CASCADE NOT NULL,
  technician_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  repair_description TEXT NOT NULL,
  parts_used TEXT,
  repair_cost DECIMAL(10,2),
  repair_time INTEGER, -- 수리 소요 시간 (분)
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. 인덱스 생성
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_equipment_number ON equipment(equipment_number);
CREATE INDEX idx_breakdowns_equipment_id ON breakdowns(equipment_id);
CREATE INDEX idx_breakdowns_status ON breakdowns(status);
CREATE INDEX idx_breakdowns_created_at ON breakdowns(created_at);
CREATE INDEX idx_repairs_breakdown_id ON repairs(breakdown_id);
CREATE INDEX idx_repairs_technician_id ON repairs(technician_id);

-- 6. Row Level Security (RLS) 정책 설정
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;

-- 7. 프로필 테이블 정책
-- 사용자는 자신의 프로필만 읽기 가능
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 업데이트 가능
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 관리자와 매니저는 모든 프로필 읽기 가능
CREATE POLICY "Admins and managers can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- 8. 설비 테이블 정책
-- 모든 인증된 사용자는 설비 정보 읽기 가능
CREATE POLICY "Authenticated users can read equipment" ON equipment
  FOR SELECT USING (auth.role() = 'authenticated');

-- 관리자와 매니저만 설비 정보 수정 가능
CREATE POLICY "Admins and managers can modify equipment" ON equipment
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- 9. 고장 보고 테이블 정책
-- 모든 인증된 사용자는 고장 정보 읽기 가능
CREATE POLICY "Authenticated users can read breakdowns" ON breakdowns
  FOR SELECT USING (auth.role() = 'authenticated');

-- 모든 인증된 사용자는 고장 등록 가능
CREATE POLICY "Authenticated users can create breakdowns" ON breakdowns
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 사용자는 자신이 등록한 고장만 수정 가능, 관리자/매니저는 모든 고장 수정 가능
CREATE POLICY "Users can update own breakdowns, admins can update all" ON breakdowns
  FOR UPDATE USING (
    reporter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- 10. 수리 내역 테이블 정책
-- 모든 인증된 사용자는 수리 내역 읽기 가능
CREATE POLICY "Authenticated users can read repairs" ON repairs
  FOR SELECT USING (auth.role() = 'authenticated');

-- 모든 인증된 사용자는 수리 내역 등록 가능
CREATE POLICY "Authenticated users can create repairs" ON repairs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 수리자와 관리자/매니저만 수리 내역 수정 가능
CREATE POLICY "Technicians and admins can update repairs" ON repairs
  FOR UPDATE USING (
    technician_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- 11. 자동 업데이트 시간 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. 트리거 설정
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at 
  BEFORE UPDATE ON equipment 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_breakdowns_updated_at 
  BEFORE UPDATE ON breakdowns 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repairs_updated_at 
  BEFORE UPDATE ON repairs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. 프로필 자동 생성 함수 (회원가입 시 자동으로 프로필 생성)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (NEW.id, NEW.email, 'user', NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. 프로필 자동 생성 트리거
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 15. 샘플 데이터 삽입 (선택사항)
-- 첫 번째 관리자 계정을 위해서는 Supabase Auth에서 직접 사용자를 생성한 후
-- 아래 쿼리로 역할을 admin으로 변경하세요:
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';

-- 샘플 설비 데이터
INSERT INTO equipment (equipment_number, equipment_type, location) VALUES
('CNC-001', 'CNC 밀링머신', '1공장 A라인'),
('CNC-002', 'CNC 선반', '1공장 B라인'),
('CNC-003', 'CNC 드릴링머신', '2공장 A라인'),
('CNC-004', 'CNC 그라인딩머신', '2공장 B라인'),
('CNC-005', 'CNC 레이저커터', '3공장 A라인');

-- 스키마 생성 완료!