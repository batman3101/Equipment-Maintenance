-- 초기 스키마 생성
CREATE TABLE IF NOT EXISTS plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  location VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  role VARCHAR CHECK (role IN ('engineer', 'manager', 'admin')),
  plant_id UUID REFERENCES plants(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_type VARCHAR NOT NULL,
  equipment_number VARCHAR NOT NULL,
  plant_id UUID REFERENCES plants(id),
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(equipment_number, plant_id)
);

-- Breakdowns table
CREATE TABLE IF NOT EXISTS breakdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES equipment(id),
  equipment_type VARCHAR NOT NULL,
  equipment_number VARCHAR NOT NULL,
  occurred_at TIMESTAMP NOT NULL,
  symptoms TEXT NOT NULL,
  cause TEXT,
  status VARCHAR DEFAULT 'in_progress',
  reporter_id UUID REFERENCES users(id),
  plant_id UUID REFERENCES plants(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Breakdown attachments table
CREATE TABLE IF NOT EXISTS breakdown_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breakdown_id UUID REFERENCES breakdowns(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type VARCHAR NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Repairs table
CREATE TABLE IF NOT EXISTS repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breakdown_id UUID REFERENCES breakdowns(id) ON DELETE CASCADE,
  action_taken TEXT NOT NULL,
  technician_id UUID REFERENCES users(id),
  completed_at TIMESTAMP NOT NULL,
  total_cost DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Repair parts table
CREATE TABLE IF NOT EXISTS repair_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id UUID REFERENCES repairs(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_equipment_plant_id ON equipment(plant_id);
CREATE INDEX IF NOT EXISTS idx_breakdowns_equipment_id ON breakdowns(equipment_id);
CREATE INDEX IF NOT EXISTS idx_breakdowns_reporter_id ON breakdowns(reporter_id);
CREATE INDEX IF NOT EXISTS idx_breakdowns_plant_id ON breakdowns(plant_id);
CREATE INDEX IF NOT EXISTS idx_breakdowns_status ON breakdowns(status);
CREATE INDEX IF NOT EXISTS idx_repairs_breakdown_id ON repairs(breakdown_id);
CREATE INDEX IF NOT EXISTS idx_repairs_technician_id ON repairs(technician_id);
CREATE INDEX IF NOT EXISTS idx_repair_parts_repair_id ON repair_parts(repair_id);

-- Row Level Security 정책 설정
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdown_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_parts ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 공장 데이터만 볼 수 있음
CREATE POLICY "Users can view own plant data" ON plants
  FOR SELECT USING (id IN (SELECT plant_id FROM users WHERE id = auth.uid()));

-- 사용자는 자신의 공장에 속한 설비만 볼 수 있음
CREATE POLICY "Users can view own plant equipment" ON equipment
  FOR SELECT USING (plant_id IN (SELECT plant_id FROM users WHERE id = auth.uid()));

-- 사용자는 자신의 공장에 속한 고장만 볼 수 있음
CREATE POLICY "Users can view own plant breakdowns" ON breakdowns
  FOR SELECT USING (plant_id IN (SELECT plant_id FROM users WHERE id = auth.uid()));

-- 엔지니어는 고장을 등록할 수 있음
CREATE POLICY "Engineers can create breakdowns" ON breakdowns
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'engineer') AND
    reporter_id = auth.uid()
  );

-- 엔지니어는 자신이 등록한 고장만 수정할 수 있음
CREATE POLICY "Engineers can update own breakdowns" ON breakdowns
  FOR UPDATE USING (
    reporter_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM users WHERE role IN ('manager', 'admin'))
  );

-- 기술자는 수리 기록을 생성할 수 있음
CREATE POLICY "Technicians can create repairs" ON repairs
  FOR INSERT WITH CHECK (
    technician_id = auth.uid() AND
    breakdown_id IN (
      SELECT id FROM breakdowns WHERE plant_id IN (
        SELECT plant_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- 사용자는 자신의 공장에 속한 수리 기록만 볼 수 있음
CREATE POLICY "Users can view own plant repairs" ON repairs
  FOR SELECT USING (
    breakdown_id IN (
      SELECT id FROM breakdowns WHERE plant_id IN (
        SELECT plant_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- 사용자는 자신의 공장에 속한 고장의 첨부 파일만 볼 수 있음
CREATE POLICY "Users can view own plant breakdown attachments" ON breakdown_attachments
  FOR SELECT USING (
    breakdown_id IN (
      SELECT id FROM breakdowns WHERE plant_id IN (
        SELECT plant_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- 사용자는 자신의 공장에 속한 수리의 부품 정보만 볼 수 있음
CREATE POLICY "Users can view own plant repair parts" ON repair_parts
  FOR SELECT USING (
    repair_id IN (
      SELECT id FROM repairs WHERE breakdown_id IN (
        SELECT id FROM breakdowns WHERE plant_id IN (
          SELECT plant_id FROM users WHERE id = auth.uid()
        )
      )
    )
  );