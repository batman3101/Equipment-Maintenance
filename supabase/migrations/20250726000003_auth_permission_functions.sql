-- 권한 관리 함수들 생성

-- 기존 함수들 삭제 (존재할 경우)
DROP FUNCTION IF EXISTS check_user_permission(UUID, TEXT);
DROP FUNCTION IF EXISTS get_user_permissions(UUID);
DROP FUNCTION IF EXISTS get_user_roles(UUID);
DROP FUNCTION IF EXISTS get_permission_matrix();

-- 사용자 권한 확인 함수
CREATE FUNCTION check_user_permission(user_uuid UUID, required_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_permission BOOLEAN := FALSE;
BEGIN
    -- 사용자의 활성 역할을 통해 권한 확인
    SELECT EXISTS(
        SELECT 1
        FROM user_role_assignments ura
        JOIN role_permissions rp ON ura.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ura.user_id = user_uuid
        AND ura.is_active = true
        AND p.name = required_permission
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$;

-- 사용자의 모든 권한 조회 함수
CREATE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS TABLE(permission_name TEXT, permission_display_name TEXT, module TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.name as permission_name, 
           p.display_name as permission_display_name,
           p.module
    FROM user_role_assignments ura
    JOIN role_permissions rp ON ura.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ura.user_id = user_uuid
    AND ura.is_active = true;
END;
$$;

-- 사용자의 역할 조회 함수
CREATE FUNCTION get_user_roles(user_uuid UUID)
RETURNS TABLE(role_id UUID, role_name TEXT, role_display_name TEXT, is_active BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT r.id as role_id,
           r.name as role_name,
           r.display_name as role_display_name,
           ura.is_active
    FROM user_role_assignments ura
    JOIN roles r ON ura.role_id = r.id
    WHERE ura.user_id = user_uuid;
END;
$$;

-- 권한 매트릭스 조회 함수
CREATE FUNCTION get_permission_matrix()
RETURNS TABLE(
    role_id UUID,
    role_name TEXT,
    role_display_name TEXT,
    permission_id UUID,
    permission_name TEXT,
    permission_display_name TEXT,
    module TEXT,
    has_permission BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT r.id as role_id,
           r.name as role_name,
           r.display_name as role_display_name,
           p.id as permission_id,
           p.name as permission_name,
           p.display_name as permission_display_name,
           p.module,
           CASE WHEN rp.role_id IS NOT NULL THEN true ELSE false END as has_permission
    FROM roles r
    CROSS JOIN permissions p
    LEFT JOIN role_permissions rp ON r.id = rp.role_id AND p.id = rp.permission_id
    ORDER BY r.display_name, p.module, p.display_name;
END;
$$;

-- 기본 권한 데이터 삽입 (없을 경우에만)
INSERT INTO permissions (resource, action, name, display_name, description, module) VALUES
-- 설비 관리 권한
('equipment', 'read', 'equipment:read', '설비 조회', '설비 목록 및 상세 정보 조회', 'equipment_management'),
('equipment', 'write', 'equipment:write', '설비 편집', '설비 정보 생성 및 수정', 'equipment_management'),
('equipment', 'delete', 'equipment:delete', '설비 삭제', '설비 정보 삭제', 'equipment_management'),
('equipment', 'manage', 'equipment:manage', '설비 관리', '설비 전체 관리 권한', 'equipment_management'),

-- 고장 관리 권한
('breakdown', 'read', 'breakdown:read', '고장 조회', '고장 신고 내역 조회', 'breakdown_management'),
('breakdown', 'write', 'breakdown:write', '고장 등록', '고장 신고 등록 및 수정', 'breakdown_management'),
('breakdown', 'delete', 'breakdown:delete', '고장 삭제', '고장 신고 삭제', 'breakdown_management'),
('breakdown', 'assign', 'breakdown:assign', '수리 배정', '수리 담당자 배정', 'breakdown_management'),
('breakdown', 'approve', 'breakdown:approve', '고장 승인', '고장 신고 승인 처리', 'breakdown_management'),

-- 수리 관리 권한
('repair', 'read', 'repair:read', '수리 조회', '수리 내역 조회', 'repair_management'),
('repair', 'write', 'repair:write', '수리 기록', '수리 작업 기록 및 수정', 'repair_management'),
('repair', 'complete', 'repair:complete', '수리 완료', '수리 작업 완료 처리', 'repair_management'),

-- 사용자 관리 권한
('user', 'read', 'user:read', '사용자 조회', '사용자 목록 및 정보 조회', 'user_management'),
('user', 'write', 'user:write', '사용자 편집', '사용자 정보 생성 및 수정', 'user_management'),
('user', 'delete', 'user:delete', '사용자 삭제', '사용자 계정 삭제', 'user_management'),
('user', 'approve', 'user:approve', '사용자 승인', '사용자 등록 승인', 'user_management'),
('user', 'assign_role', 'user:assign_role', '역할 할당', '사용자 역할 할당', 'user_management'),

-- 권한 관리 권한
('permission', 'read', 'permission:read', '권한 조회', '권한 목록 조회', 'permission_management'),
('permission', 'write', 'permission:write', '권한 편집', '권한 생성 및 수정', 'permission_management'),
('permission', 'assign', 'permission:assign', '권한 할당', '역할에 권한 할당', 'permission_management'),

-- 시스템 관리 권한
('system', 'admin', 'system:admin', '시스템 관리', '시스템 전체 관리 권한', 'system_management'),
('system', 'settings', 'system:settings', '시스템 설정', '시스템 설정 관리', 'system_management'),
('system', 'logs', 'system:logs', '로그 조회', '시스템 로그 조회', 'system_management')

ON CONFLICT (resource, action) DO NOTHING;

-- 기본 역할 생성 (없을 경우에만)
INSERT INTO roles (name, display_name, description, is_system_role, plant_id) VALUES
('admin', '시스템 관리자', '시스템 전체 관리 권한', true, NULL),
('manager', '관리자', '공장 관리 권한', true, NULL),
('engineer', '엔지니어', '설비 및 수리 관리 권한', true, NULL),
('operator', '운영자', '기본 조회 및 신고 권한', true, NULL),
('viewer', '조회자', '조회 전용 권한', true, NULL)
ON CONFLICT (name) DO NOTHING;

-- 기본 역할-권한 할당
DO $$
DECLARE
    admin_role_id UUID;
    manager_role_id UUID;
    engineer_role_id UUID;
    operator_role_id UUID;
    viewer_role_id UUID;
BEGIN
    -- 역할 ID 조회
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    SELECT id INTO manager_role_id FROM roles WHERE name = 'manager';
    SELECT id INTO engineer_role_id FROM roles WHERE name = 'engineer';
    SELECT id INTO operator_role_id FROM roles WHERE name = 'operator';
    SELECT id INTO viewer_role_id FROM roles WHERE name = 'viewer';

    -- 시스템 관리자: 모든 권한
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT admin_role_id, id FROM permissions
    ON CONFLICT DO NOTHING;

    -- 관리자: 시스템 관리 제외한 모든 권한
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT manager_role_id, id FROM permissions 
    WHERE module != 'system_management'
    ON CONFLICT DO NOTHING;

    -- 엔지니어: 설비, 고장, 수리 관리 권한
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT engineer_role_id, id FROM permissions 
    WHERE module IN ('equipment_management', 'breakdown_management', 'repair_management')
    ON CONFLICT DO NOTHING;

    -- 운영자: 조회 및 기본 등록 권한
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT operator_role_id, id FROM permissions 
    WHERE name IN ('equipment:read', 'breakdown:read', 'breakdown:write', 'repair:read')
    ON CONFLICT DO NOTHING;

    -- 조회자: 조회 권한만
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT viewer_role_id, id FROM permissions 
    WHERE action = 'read'
    ON CONFLICT DO NOTHING;
END $$;

-- 함수 권한 설정
GRANT EXECUTE ON FUNCTION check_user_permission(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_permissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_roles(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_permission_matrix() TO authenticated;