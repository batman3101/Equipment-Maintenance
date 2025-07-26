-- 설정 모듈을 위한 테이블 생성
-- 설비 종류 설정
CREATE TABLE IF NOT EXISTS equipment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 설비 상태 설정
CREATE TABLE IF NOT EXISTS equipment_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR DEFAULT '#6B7280', -- 상태별 색상 코드
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 고장 내용 대분류 설정
CREATE TABLE IF NOT EXISTS breakdown_main_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 고장 내용 소분류 설정
CREATE TABLE IF NOT EXISTS breakdown_sub_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  main_category_id UUID REFERENCES breakdown_main_categories(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(main_category_id, name)
);

-- breakdowns 테이블에 새로운 필드 추가
ALTER TABLE breakdowns 
ADD COLUMN IF NOT EXISTS breakdown_main_category_id UUID REFERENCES breakdown_main_categories(id),
ADD COLUMN IF NOT EXISTS breakdown_sub_category_id UUID REFERENCES breakdown_sub_categories(id);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_equipment_types_active ON equipment_types(is_active);
CREATE INDEX IF NOT EXISTS idx_equipment_types_order ON equipment_types(display_order);
CREATE INDEX IF NOT EXISTS idx_equipment_statuses_active ON equipment_statuses(is_active);
CREATE INDEX IF NOT EXISTS idx_equipment_statuses_order ON equipment_statuses(display_order);
CREATE INDEX IF NOT EXISTS idx_breakdown_main_categories_active ON breakdown_main_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_breakdown_main_categories_order ON breakdown_main_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_breakdown_sub_categories_active ON breakdown_sub_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_breakdown_sub_categories_main ON breakdown_sub_categories(main_category_id);
CREATE INDEX IF NOT EXISTS idx_breakdown_sub_categories_order ON breakdown_sub_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_breakdowns_main_category ON breakdowns(breakdown_main_category_id);
CREATE INDEX IF NOT EXISTS idx_breakdowns_sub_category ON breakdowns(breakdown_sub_category_id);

-- Row Level Security 설정
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdown_main_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdown_sub_categories ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 설정 데이터를 조회할 수 있음 (읽기 전용)
CREATE POLICY "Everyone can view equipment types" ON equipment_types
  FOR SELECT USING (true);

CREATE POLICY "Everyone can view equipment statuses" ON equipment_statuses
  FOR SELECT USING (true);

CREATE POLICY "Everyone can view breakdown main categories" ON breakdown_main_categories
  FOR SELECT USING (true);

CREATE POLICY "Everyone can view breakdown sub categories" ON breakdown_sub_categories
  FOR SELECT USING (true);

-- 관리자만 설정을 변경할 수 있음
CREATE POLICY "Only admins can modify equipment types" ON equipment_types
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Only admins can modify equipment statuses" ON equipment_statuses
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Only admins can modify breakdown main categories" ON breakdown_main_categories
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Only admins can modify breakdown sub categories" ON breakdown_sub_categories
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- 기본 데이터 삽입
INSERT INTO equipment_types (name, description, display_order) VALUES
  ('CNC 머시닝센터', 'CNC 머시닝센터 장비', 1),
  ('CNC 선반', 'CNC 선반 장비', 2),
  ('밀링머신', '범용 밀링머신', 3),
  ('드릴링머신', '드릴링 전용 장비', 4),
  ('그라인더', '연삭 장비', 5)
ON CONFLICT (name) DO NOTHING;

INSERT INTO equipment_statuses (name, description, color, display_order) VALUES
  ('정상', '정상 작동 중', '#10B981', 1),
  ('점검중', '정기점검 또는 예방정비 중', '#F59E0B', 2),
  ('고장', '고장으로 인한 작동 중단', '#EF4444', 3),
  ('수리중', '수리 작업 진행 중', '#8B5CF6', 4),
  ('대기', '작업 대기 상태', '#6B7280', 5)
ON CONFLICT (name) DO NOTHING;

INSERT INTO breakdown_main_categories (name, description, display_order) VALUES
  ('기계적 고장', '기계 부품의 물리적 고장', 1),
  ('전기적 고장', '전기 시스템 관련 고장', 2),
  ('유압 시스템', '유압 관련 고장', 3),
  ('냉각 시스템', '냉각수, 오일 관련 고장', 4),
  ('제어 시스템', 'CNC 제어기, 소프트웨어 관련', 5),
  ('안전 시스템', '안전장치 관련 고장', 6)
ON CONFLICT (name) DO NOTHING;

-- 기계적 고장 소분류
INSERT INTO breakdown_sub_categories (main_category_id, name, description, display_order)
SELECT id, '베어링 손상', '베어링 마모 또는 손상', 1 FROM breakdown_main_categories WHERE name = '기계적 고장'
UNION ALL
SELECT id, '기어 손상', '기어 마모 또는 파손', 2 FROM breakdown_main_categories WHERE name = '기계적 고장'
UNION ALL
SELECT id, '벨트 끊어짐', '구동벨트 파손', 3 FROM breakdown_main_categories WHERE name = '기계적 고장'
UNION ALL
SELECT id, '축 손상', '회전축 손상 또는 변형', 4 FROM breakdown_main_categories WHERE name = '기계적 고장'
ON CONFLICT (main_category_id, name) DO NOTHING;

-- 전기적 고장 소분류
INSERT INTO breakdown_sub_categories (main_category_id, name, description, display_order)
SELECT id, '모터 과부하', '모터 과부하로 인한 정지', 1 FROM breakdown_main_categories WHERE name = '전기적 고장'
UNION ALL
SELECT id, '센서 오류', '각종 센서 고장', 2 FROM breakdown_main_categories WHERE name = '전기적 고장'
UNION ALL
SELECT id, '배선 단선', '전선 단선 또는 접촉 불량', 3 FROM breakdown_main_categories WHERE name = '전기적 고장'
UNION ALL
SELECT id, '퓨즈 단선', '퓨즈 또는 차단기 작동', 4 FROM breakdown_main_categories WHERE name = '전기적 고장'
ON CONFLICT (main_category_id, name) DO NOTHING;

-- 유압 시스템 소분류
INSERT INTO breakdown_sub_categories (main_category_id, name, description, display_order)
SELECT id, '유압 누유', '유압오일 누출', 1 FROM breakdown_main_categories WHERE name = '유압 시스템'
UNION ALL
SELECT id, '펌프 고장', '유압펌프 고장', 2 FROM breakdown_main_categories WHERE name = '유압 시스템'
UNION ALL
SELECT id, '밸브 고장', '유압밸브 작동 불량', 3 FROM breakdown_main_categories WHERE name = '유압 시스템'
UNION ALL
SELECT id, '실린더 고장', '유압실린더 작동 불량', 4 FROM breakdown_main_categories WHERE name = '유압 시스템'
ON CONFLICT (main_category_id, name) DO NOTHING;

-- 냉각 시스템 소분류
INSERT INTO breakdown_sub_categories (main_category_id, name, description, display_order)
SELECT id, '냉각수 부족', '냉각수 부족 또는 누출', 1 FROM breakdown_main_categories WHERE name = '냉각 시스템'
UNION ALL
SELECT id, '펌프 고장', '냉각수 펌프 고장', 2 FROM breakdown_main_categories WHERE name = '냉각 시스템'
UNION ALL
SELECT id, '필터 막힘', '냉각수 필터 막힘', 3 FROM breakdown_main_categories WHERE name = '냉각 시스템'
UNION ALL
SELECT id, '온도 센서 오류', '온도 센서 고장', 4 FROM breakdown_main_categories WHERE name = '냉각 시스템'
ON CONFLICT (main_category_id, name) DO NOTHING;

-- 제어 시스템 소분류
INSERT INTO breakdown_sub_categories (main_category_id, name, description, display_order)
SELECT id, 'NC 프로그램 오류', 'NC 프로그램 에러', 1 FROM breakdown_main_categories WHERE name = '제어 시스템'
UNION ALL
SELECT id, '통신 오류', '제어기 통신 장애', 2 FROM breakdown_main_categories WHERE name = '제어 시스템'
UNION ALL
SELECT id, '엔코더 오류', '위치 엔코더 고장', 3 FROM breakdown_main_categories WHERE name = '제어 시스템'
UNION ALL
SELECT id, '서보 드라이브 오류', '서보 드라이브 고장', 4 FROM breakdown_main_categories WHERE name = '제어 시스템'
ON CONFLICT (main_category_id, name) DO NOTHING;

-- 안전 시스템 소분류
INSERT INTO breakdown_sub_categories (main_category_id, name, description, display_order)
SELECT id, '비상정지 작동', '비상정지 버튼 작동', 1 FROM breakdown_main_categories WHERE name = '안전 시스템'
UNION ALL
SELECT id, '안전문 센서', '안전문 센서 오류', 2 FROM breakdown_main_categories WHERE name = '안전 시스템'
UNION ALL
SELECT id, '라이트 커튼', '라이트 커튼 차단', 3 FROM breakdown_main_categories WHERE name = '안전 시스템'
UNION ALL
SELECT id, '압력 스위치', '안전 압력 스위치 작동', 4 FROM breakdown_main_categories WHERE name = '안전 시스템'
ON CONFLICT (main_category_id, name) DO NOTHING;