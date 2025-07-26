-- 사용자 관리 및 RBAC 시스템 확장 스키마
-- 역할 기반 접근 제어(Role-Based Access Control) 구현

-- 기존 users 테이블 확장
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- 역할(Roles) 테이블 생성
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false, -- 시스템 기본 역할 여부
  plant_id UUID REFERENCES plants(id), -- NULL이면 전체 시스템 역할
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 권한(Permissions) 테이블 생성
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource VARCHAR(50) NOT NULL, -- 리소스 (예: 'equipment', 'breakdown', 'users')
  action VARCHAR(50) NOT NULL, -- 액션 (예: 'read', 'write', 'delete', 'approve')
  name VARCHAR(100) NOT NULL, -- 권한명 (resource:action 형태)
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  module VARCHAR(50) NOT NULL, -- 모듈 그룹 (예: 'equipment_management', 'user_management')
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(resource, action)
);

-- 역할-권한 매핑 테이블
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- 사용자-역할 할당 테이블
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- 역할 만료 시간 (선택적)
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role_id)
);

-- 사용자 등록 요청 테이블
CREATE TABLE IF NOT EXISTS user_registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  phone VARCHAR(20),
  department VARCHAR(100),
  position VARCHAR(100),
  requested_role VARCHAR(50), -- 요청한 역할
  plant_id UUID REFERENCES plants(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verification_token VARCHAR(255) UNIQUE,
  verification_expires_at TIMESTAMP,
  rejection_reason TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  rejected_by UUID REFERENCES users(id),
  rejected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 권한 변경 이력 테이블 (감사용)
CREATE TABLE IF NOT EXISTS permission_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('granted', 'revoked', 'role_assigned', 'role_removed')),
  old_value JSONB,
  new_value JSONB,
  changed_by UUID REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_plant_id ON users(plant_id);
CREATE INDEX IF NOT EXISTS idx_roles_plant_id ON roles(plant_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role_id ON user_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_user_registration_requests_status ON user_registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_permission_audit_logs_user_id ON permission_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_logs_created_at ON permission_audit_logs(created_at);

-- RLS 정책 설정
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_audit_logs ENABLE ROW LEVEL SECURITY;

-- 역할 테이블 RLS 정책
CREATE POLICY "Users can view roles in their plant" ON roles
  FOR SELECT USING (
    plant_id IS NULL OR -- 전체 시스템 역할
    plant_id IN (SELECT plant_id FROM users WHERE id = auth.uid())
  );

-- 관리자만 역할 생성/수정 가능
CREATE POLICY "Only admins can manage roles" ON roles
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM user_role_assignments ura
      JOIN roles r ON ura.role_id = r.id
      WHERE r.name = 'admin' AND ura.is_active = true
    )
  );

-- 권한 테이블 RLS 정책 (모든 사용자가 조회 가능)
CREATE POLICY "All authenticated users can view permissions" ON permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 관리자만 권한 관리 가능
CREATE POLICY "Only admins can manage permissions" ON permissions
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM user_role_assignments ura
      JOIN roles r ON ura.role_id = r.id
      WHERE r.name = 'admin' AND ura.is_active = true
    )
  );

-- 역할-권한 매핑 RLS 정책
CREATE POLICY "Users can view role permissions" ON role_permissions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_role_assignments
      WHERE role_id = role_permissions.role_id AND is_active = true
    ) OR
    auth.uid() IN (
      SELECT user_id FROM user_role_assignments ura
      JOIN roles r ON ura.role_id = r.id
      WHERE r.name = 'admin' AND ura.is_active = true
    )
  );

-- 관리자만 역할-권한 매핑 관리 가능
CREATE POLICY "Only admins can manage role permissions" ON role_permissions
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM user_role_assignments ura
      JOIN roles r ON ura.role_id = r.id
      WHERE r.name = 'admin' AND ura.is_active = true
    )
  );

-- 사용자-역할 할당 RLS 정책
CREATE POLICY "Users can view own role assignments" ON user_role_assignments
  FOR SELECT USING (
    user_id = auth.uid() OR
    auth.uid() IN (
      SELECT user_id FROM user_role_assignments ura
      JOIN roles r ON ura.role_id = r.id
      WHERE r.name IN ('admin', 'manager') AND ura.is_active = true
    )
  );

-- 관리자와 매니저만 역할 할당 관리 가능
CREATE POLICY "Admins and managers can manage role assignments" ON user_role_assignments
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM user_role_assignments ura
      JOIN roles r ON ura.role_id = r.id
      WHERE r.name IN ('admin', 'manager') AND ura.is_active = true
    )
  );

-- 사용자 등록 요청 RLS 정책
CREATE POLICY "Users can view registration requests in their plant" ON user_registration_requests
  FOR SELECT USING (
    plant_id IN (SELECT plant_id FROM users WHERE id = auth.uid()) OR
    auth.uid() IN (
      SELECT user_id FROM user_role_assignments ura
      JOIN roles r ON ura.role_id = r.id
      WHERE r.name = 'admin' AND ura.is_active = true
    )
  );

-- 권한 감사 로그 RLS 정책
CREATE POLICY "Users can view own audit logs" ON permission_audit_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    auth.uid() IN (
      SELECT user_id FROM user_role_assignments ura
      JOIN roles r ON ura.role_id = r.id
      WHERE r.name = 'admin' AND ura.is_active = true
    )
  );

-- 기본 시스템 역할 생성
INSERT INTO roles (name, display_name, description, is_system_role) VALUES 
('admin', '시스템 관리자', '모든 시스템 기능에 대한 완전한 권한을 가진 관리자', true),
('manager', '현장 관리자', '현장 운영 및 사용자 관리 권한을 가진 관리자', true),
('engineer', '현장 엔지니어', '설비 고장 등록 및 수리 기록 관리 권한을 가진 엔지니어', true),
('technician', '기술자', '수리 작업 및 부품 관리 권한을 가진 기술자', true),
('viewer', '조회자', '데이터 조회만 가능한 사용자', true)
ON CONFLICT (name) DO NOTHING;

-- 기본 권한 생성
INSERT INTO permissions (resource, action, name, display_name, description, module) VALUES 
-- 사용자 관리 권한
('users', 'read', 'users:read', '사용자 조회', '사용자 목록 및 정보 조회', 'user_management'),
('users', 'write', 'users:write', '사용자 편집', '사용자 정보 수정', 'user_management'),
('users', 'create', 'users:create', '사용자 생성', '새 사용자 계정 생성', 'user_management'),
('users', 'delete', 'users:delete', '사용자 삭제', '사용자 계정 삭제', 'user_management'),
('users', 'approve', 'users:approve', '사용자 승인', '사용자 등록 요청 승인', 'user_management'),

-- 역할 및 권한 관리
('roles', 'read', 'roles:read', '역할 조회', '역할 목록 및 정보 조회', 'role_management'),
('roles', 'write', 'roles:write', '역할 편집', '역할 정보 수정', 'role_management'),
('roles', 'create', 'roles:create', '역할 생성', '새 역할 생성', 'role_management'),
('roles', 'delete', 'roles:delete', '역할 삭제', '역할 삭제', 'role_management'),
('permissions', 'assign', 'permissions:assign', '권한 할당', '사용자 및 역할에 권한 할당', 'role_management'),

-- 설비 관리 권한
('equipment', 'read', 'equipment:read', '설비 조회', '설비 목록 및 정보 조회', 'equipment_management'),
('equipment', 'write', 'equipment:write', '설비 편집', '설비 정보 수정', 'equipment_management'),
('equipment', 'create', 'equipment:create', '설비 등록', '새 설비 등록', 'equipment_management'),
('equipment', 'delete', 'equipment:delete', '설비 삭제', '설비 정보 삭제', 'equipment_management'),

-- 고장 관리 권한
('breakdowns', 'read', 'breakdowns:read', '고장 조회', '고장 목록 및 정보 조회', 'breakdown_management'),
('breakdowns', 'write', 'breakdowns:write', '고장 편집', '고장 정보 수정', 'breakdown_management'),
('breakdowns', 'create', 'breakdowns:create', '고장 등록', '새 고장 등록', 'breakdown_management'),
('breakdowns', 'delete', 'breakdowns:delete', '고장 삭제', '고장 정보 삭제', 'breakdown_management'),
('breakdowns', 'approve', 'breakdowns:approve', '고장 승인', '고장 처리 승인', 'breakdown_management'),

-- 수리 관리 권한
('repairs', 'read', 'repairs:read', '수리 조회', '수리 기록 조회', 'repair_management'),
('repairs', 'write', 'repairs:write', '수리 편집', '수리 기록 수정', 'repair_management'),
('repairs', 'create', 'repairs:create', '수리 등록', '수리 기록 등록', 'repair_management'),
('repairs', 'delete', 'repairs:delete', '수리 삭제', '수리 기록 삭제', 'repair_management'),

-- 리포트 및 분석 권한
('reports', 'read', 'reports:read', '리포트 조회', '분석 리포트 조회', 'analytics'),
('reports', 'export', 'reports:export', '리포트 내보내기', '리포트 데이터 내보내기', 'analytics'),

-- 설정 관리 권한
('settings', 'read', 'settings:read', '설정 조회', '시스템 설정 조회', 'system_management'),
('settings', 'write', 'settings:write', '설정 편집', '시스템 설정 수정', 'system_management')

ON CONFLICT (resource, action) DO NOTHING;

-- 기본 역할에 권한 할당

-- 관리자: 모든 권한
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 매니저: 사용자 관리 및 승인 권한, 모든 조회 권한
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'manager' AND (
  p.action = 'read' OR
  p.name IN ('users:approve', 'users:write', 'breakdowns:approve')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 엔지니어: 고장 관리 및 설비 조회 권한
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'engineer' AND (
  p.module IN ('breakdown_management', 'repair_management') OR
  p.name IN ('equipment:read', 'reports:read')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 기술자: 수리 관리 및 관련 조회 권한
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'technician' AND (
  p.module = 'repair_management' OR
  p.name IN ('equipment:read', 'breakdowns:read')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 조회자: 모든 조회 권한만
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'viewer' AND p.action = 'read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 기존 사용자들에게 역할 할당 (기존 role 컬럼 기반)
INSERT INTO user_role_assignments (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.name = u.role
WHERE u.role IS NOT NULL
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 함수: 사용자 권한 확인
CREATE OR REPLACE FUNCTION check_user_permission(
  user_uuid UUID,
  required_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN := false;
BEGIN
  SELECT COUNT(*) > 0 INTO has_permission
  FROM user_role_assignments ura
  JOIN role_permissions rp ON ura.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE ura.user_id = user_uuid
    AND ura.is_active = true
    AND (ura.expires_at IS NULL OR ura.expires_at > NOW())
    AND p.name = required_permission;
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수: 사용자의 모든 권한 조회
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS TABLE(permission_name TEXT, display_name TEXT, module TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.name, p.display_name, p.module
  FROM user_role_assignments ura
  JOIN role_permissions rp ON ura.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE ura.user_id = user_uuid
    AND ura.is_active = true
    AND (ura.expires_at IS NULL OR ura.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;