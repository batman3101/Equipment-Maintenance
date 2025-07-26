'use client';

import { useState, useEffect } from 'react';
import { PermissionMatrix } from '@/domains/user-management/components/PermissionMatrix';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { createRoleManagementService } from '@/domains/user-management/services';
import type { Role, Permission } from '@/domains/user-management/types';

export default function PermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionMatrix, setPermissionMatrix] = useState<{ [roleId: string]: { [permissionId: string]: boolean } }>({});
  const [loading, setLoading] = useState(true);

  const roleService = createRoleManagementService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesData, permissionsData, matrixData] = await Promise.all([
        roleService.getRoles(),
        roleService.getPermissions(),
        roleService.getPermissionMatrix()
      ]);
      
      setRoles(rolesData);
      setPermissions(permissionsData);
      setPermissionMatrix(matrixData);
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMatrix = async (roleId: string, permissions: { [permissionId: string]: boolean }) => {
    try {
      await roleService.updatePermissionMatrix(roleId, permissions);
      await loadData(); // 데이터 새로고침
    } catch (error) {
      console.error('권한 매트릭스 업데이트 실패:', error);
      throw error;
    }
  };

  // 통계 계산
  const statistics = {
    totalRoles: roles.length,
    systemRoles: roles.filter(role => role.is_system_role).length,
    customRoles: roles.filter(role => !role.is_system_role).length,
    totalPermissions: permissions.length,
    moduleCount: [...new Set(permissions.map(p => p.module))].length
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            권한 관리
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            역할별 권한을 설정하고 관리합니다.
          </p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {statistics.totalRoles}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            전체 역할
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {statistics.systemRoles}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            시스템 역할
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {statistics.customRoles}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            사용자 정의 역할
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {statistics.totalPermissions}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            전체 권한
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">
            {statistics.moduleCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            권한 모듈
          </div>
        </Card>
      </div>

      {/* 역할 목록 */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          역할 목록
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(role => (
            <div key={role.id} className="border dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {role.display_name}
                </h4>
                {role.is_system_role && (
                  <Badge variant="secondary">시스템</Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {role.description || '설명이 없습니다.'}
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                권한 개수: {Object.values(permissionMatrix[role.id] || {}).filter(Boolean).length}개
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 권한 매트릭스 */}
      <PermissionMatrix
        roles={roles}
        permissions={permissions}
        permissionMatrix={permissionMatrix}
        loading={loading}
        onUpdateMatrix={handleUpdateMatrix}
      />
    </div>
  );
}