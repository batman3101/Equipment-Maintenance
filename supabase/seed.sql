-- Seed data for CNC Equipment Maintenance MVP
-- This script creates test data for development and testing

-- Insert test plants
INSERT INTO plants (id, name, location) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '서울 공장', '서울특별시 강남구'),
  ('550e8400-e29b-41d4-a716-446655440002', '부산 공장', '부산광역시 해운대구')
ON CONFLICT (id) DO NOTHING;

-- Insert test users
INSERT INTO users (id, email, name, role, plant_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440011', 'admin@company.com', '관리자', 'admin', '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440012', 'manager@company.com', '현장관리자', 'manager', '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440013', 'engineer1@company.com', '김엔지니어', 'engineer', '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440014', 'engineer2@company.com', '박기술자', 'engineer', '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440015', 'engineer3@company.com', '이정비사', 'engineer', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (email) DO NOTHING;

-- Insert test equipment
INSERT INTO equipment (id, equipment_type, equipment_number, plant_id, status) VALUES
  ('550e8400-e29b-41d4-a716-446655440021', 'CNC 밀링머신', 'CNC-001', '550e8400-e29b-41d4-a716-446655440001', 'active'),
  ('550e8400-e29b-41d4-a716-446655440022', 'CNC 선반', 'CNC-002', '550e8400-e29b-41d4-a716-446655440001', 'active'),
  ('550e8400-e29b-41d4-a716-446655440023', 'CNC 밀링머신', 'CNC-003', '550e8400-e29b-41d4-a716-446655440001', 'active'),
  ('550e8400-e29b-41d4-a716-446655440024', '드릴링머신', 'DRILL-001', '550e8400-e29b-41d4-a716-446655440001', 'active'),
  ('550e8400-e29b-41d4-a716-446655440025', 'CNC 선반', 'CNC-004', '550e8400-e29b-41d4-a716-446655440002', 'active'),
  ('550e8400-e29b-41d4-a716-446655440026', '그라인더', 'GRIND-001', '550e8400-e29b-41d4-a716-446655440001', 'inactive')
ON CONFLICT (equipment_number, plant_id) DO NOTHING;

-- Insert test breakdowns
INSERT INTO breakdowns (id, equipment_id, equipment_type, equipment_number, occurred_at, symptoms, cause, status, reporter_id, plant_id) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440031',
    '550e8400-e29b-41d4-a716-446655440021',
    'CNC 밀링머신',
    'CNC-001',
    NOW() - INTERVAL '2 hours',
    '스핀들 모터에서 이상 소음 발생. 진동이 심하고 가공 정밀도가 떨어짐.',
    '베어링 마모로 추정',
    'in_progress',
    '550e8400-e29b-41d4-a716-446655440013',
    '550e8400-e29b-41d4-a716-446655440001'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440032',
    '550e8400-e29b-41d4-a716-446655440022',
    'CNC 선반',
    'CNC-002',
    NOW() - INTERVAL '1 day',
    '척 클램핑이 제대로 되지 않음. 워크피스가 미끄러짐.',
    '유압 시스템 압력 부족',
    'completed',
    '550e8400-e29b-41d4-a716-446655440014',
    '550e8400-e29b-41d4-a716-446655440001'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440033',
    '550e8400-e29b-41d4-a716-446655440023',
    'CNC 밀링머신',
    'CNC-003',
    NOW() - INTERVAL '3 hours',
    '냉각수 누수 발생. 바닥에 물이 고임.',
    '냉각수 호스 균열',
    'under_repair',
    '550e8400-e29b-41d4-a716-446655440013',
    '550e8400-e29b-41d4-a716-446655440001'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440034',
    '550e8400-e29b-41d4-a716-446655440024',
    '드릴링머신',
    'DRILL-001',
    NOW() - INTERVAL '30 minutes',
    '드릴 비트가 자주 부러짐. 가공 속도가 현저히 느려짐.',
    NULL,
    'in_progress',
    '550e8400-e29b-41d4-a716-446655440014',
    '550e8400-e29b-41d4-a716-446655440001'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440035',
    '550e8400-e29b-41d4-a716-446655440025',
    'CNC 선반',
    'CNC-004',
    NOW() - INTERVAL '2 days',
    '제어판 디스플레이가 깜빡임. 간헐적으로 화면이 꺼짐.',
    '전원 공급 장치 불안정',
    'completed',
    '550e8400-e29b-41d4-a716-446655440015',
    '550e8400-e29b-41d4-a716-446655440002'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert test repairs
INSERT INTO repairs (id, breakdown_id, action_taken, technician_id, completed_at, total_cost) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440041',
    '550e8400-e29b-41d4-a716-446655440032',
    '유압 펌프 교체 및 유압 오일 보충. 시스템 압력 재조정 완료.',
    '550e8400-e29b-41d4-a716-446655440014',
    NOW() - INTERVAL '23 hours',
    0
  ),
  (
    '550e8400-e29b-41d4-a716-446655440042',
    '550e8400-e29b-41d4-a716-446655440033',
    '냉각수 호스 교체 및 연결부 점검. 누수 테스트 완료.',
    '550e8400-e29b-41d4-a716-446655440013',
    NOW() - INTERVAL '1 hour',
    0
  ),
  (
    '550e8400-e29b-41d4-a716-446655440043',
    '550e8400-e29b-41d4-a716-446655440035',
    '전원 공급 장치 교체 및 전압 안정화 회로 점검.',
    '550e8400-e29b-41d4-a716-446655440015',
    NOW() - INTERVAL '1 day 12 hours',
    0
  )
ON CONFLICT (id) DO NOTHING;

-- Insert test repair parts
INSERT INTO repair_parts (repair_id, part_name, quantity, unit_price) VALUES
  ('550e8400-e29b-41d4-a716-446655440041', '유압 펌프', 1, 450000.00),
  ('550e8400-e29b-41d4-a716-446655440041', '유압 오일 (20L)', 1, 85000.00),
  ('550e8400-e29b-41d4-a716-446655440041', '오일 필터', 2, 25000.00),
  
  ('550e8400-e29b-41d4-a716-446655440042', '냉각수 호스 (2m)', 1, 35000.00),
  ('550e8400-e29b-41d4-a716-446655440042', '호스 클램프', 4, 3000.00),
  ('550e8400-e29b-41d4-a716-446655440042', '실링 테이프', 1, 8000.00),
  
  ('550e8400-e29b-41d4-a716-446655440043', '전원 공급 장치', 1, 320000.00),
  ('550e8400-e29b-41d4-a716-446655440043', '전압 안정화 모듈', 1, 180000.00),
  ('550e8400-e29b-41d4-a716-446655440043', '전선 커넥터', 6, 5000.00)
ON CONFLICT (id) DO NOTHING;

-- Insert some breakdown attachments (simulated file paths)
INSERT INTO breakdown_attachments (breakdown_id, file_name, file_path, file_type, file_size) VALUES
  ('550e8400-e29b-41d4-a716-446655440031', 'spindle_noise.mp4', 'breakdowns/550e8400-e29b-41d4-a716-446655440031/spindle_noise.mp4', 'video/mp4', 2048000),
  ('550e8400-e29b-41d4-a716-446655440031', 'bearing_damage.jpg', 'breakdowns/550e8400-e29b-41d4-a716-446655440031/bearing_damage.jpg', 'image/jpeg', 512000),
  ('550e8400-e29b-41d4-a716-446655440032', 'chuck_problem.jpg', 'breakdowns/550e8400-e29b-41d4-a716-446655440032/chuck_problem.jpg', 'image/jpeg', 768000),
  ('550e8400-e29b-41d4-a716-446655440033', 'coolant_leak.jpg', 'breakdowns/550e8400-e29b-41d4-a716-446655440033/coolant_leak.jpg', 'image/jpeg', 1024000),
  ('550e8400-e29b-41d4-a716-446655440034', 'broken_drill_bits.jpg', 'breakdowns/550e8400-e29b-41d4-a716-446655440034/broken_drill_bits.jpg', 'image/jpeg', 640000)
ON CONFLICT (id) DO NOTHING;

-- Update breakdown statuses based on repairs
UPDATE breakdowns 
SET status = 'completed' 
WHERE id IN (
  SELECT DISTINCT breakdown_id 
  FROM repairs 
  WHERE breakdown_id IN ('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440035')
);

UPDATE breakdowns 
SET status = 'under_repair' 
WHERE id = '550e8400-e29b-41d4-a716-446655440033';

-- Create some additional equipment for testing
INSERT INTO equipment (equipment_type, equipment_number, plant_id, status) VALUES
  ('CNC 머시닝센터', 'MC-001', '550e8400-e29b-41d4-a716-446655440001', 'active'),
  ('CNC 머시닝센터', 'MC-002', '550e8400-e29b-41d4-a716-446655440001', 'active'),
  ('레이저 커터', 'LASER-001', '550e8400-e29b-41d4-a716-446655440001', 'active'),
  ('프레스', 'PRESS-001', '550e8400-e29b-41d4-a716-446655440002', 'active'),
  ('용접기', 'WELD-001', '550e8400-e29b-41d4-a716-446655440002', 'active')
ON CONFLICT (equipment_number, plant_id) DO NOTHING;