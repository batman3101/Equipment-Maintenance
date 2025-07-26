'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { Badge } from '@/shared/components/ui/Badge';
import type { Role, Permission, PermissionsByModule } from '../types';

interface PermissionMatrixProps {
  roles: Role[];
  permissions: Permission[];
  permissionMatrix: { [roleId: string]: { [permissionId: string]: boolean } };
  loading?: boolean;
  onUpdateMatrix: (roleId: string, permissions: { [permissionId: string]: boolean }) => Promise<void>;
}

export function PermissionMatrix({
  roles,
  permissions,
  permissionMatrix,
  loading = false,
  onUpdateMatrix
}: PermissionMatrixProps) {
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [tempPermissions, setTempPermissions] = useState<{ [permissionId: string]: boolean }>({});
  const [saving, setSaving] = useState(false);

  // 모듈별로 권한 그룹화
  const permissionsByModule: PermissionsByModule = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as PermissionsByModule);

  const modules = Object.keys(permissionsByModule);

  const handleEditRole = (roleId: string) => {
    setEditingRole(roleId);
    setTempPermissions(permissionMatrix[roleId] || {});
  };

  const handleCancelEdit = () => {
    setEditingRole(null);
    setTempPermissions({});
  };

  const handleSaveRole = async (roleId: string) => {
    setSaving(true);
    try {
      await onUpdateMatrix(roleId, tempPermissions);
      setEditingRole(null);
      setTempPermissions({});
    } catch (error) {
      console.error('권한 매트릭스 저장 실패:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    setTempPermissions(prev => ({
      ...prev,
      [permissionId]: checked
    }));
  };

  const handleModuleToggle = (module: string, checked: boolean) => {
    const modulePermissions = permissionsByModule[module];
    const updates = modulePermissions.reduce((acc, permission) => {
      acc[permission.id] = checked;
      return acc;
    }, {} as { [permissionId: string]: boolean });

    setTempPermissions(prev => ({
      ...prev,
      ...updates
    }));
  };

  const isModuleChecked = (roleId: string, module: string): boolean => {
    const modulePermissions = permissionsByModule[module];
    const rolePermissions = editingRole === roleId ? tempPermissions : permissionMatrix[roleId] || {};
    
    return modulePermissions.every(permission => rolePermissions[permission.id]);
  };

  const isModuleIndeterminate = (roleId: string, module: string): boolean => {
    const modulePermissions = permissionsByModule[module];
    const rolePermissions = editingRole === roleId ? tempPermissions : permissionMatrix[roleId] || {};
    
    const checkedCount = modulePermissions.filter(permission => rolePermissions[permission.id]).length;
    return checkedCount > 0 && checkedCount < modulePermissions.length;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            권한 매트릭스
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            각 역할별로 권한을 할당하거나 제거할 수 있습니다.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="sticky left-0 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r dark:border-gray-600">
                  역할
                </th>
                {modules.map(module => (
                  <th key={module} className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r dark:border-gray-600">
                    <div className="space-y-1">
                      <div>{module.replace('_', ' ')}</div>
                      <div className="text-xs text-gray-400">
                        ({permissionsByModule[module].length}개)
                      </div>
                    </div>
                  </th>
                ))}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {roles.map(role => (
                <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="sticky left-0 bg-white dark:bg-gray-800 px-6 py-4 border-r dark:border-gray-600">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {role.display_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {role.name}
                        </div>
                      </div>
                      {role.is_system_role && (
                        <Badge variant="secondary" className="text-xs">
                          시스템
                        </Badge>
                      )}
                    </div>
                  </td>
                  
                  {modules.map(module => (
                    <td key={module} className="px-4 py-4 text-center border-r dark:border-gray-600">
                      <div className="space-y-2">
                        {/* 모듈 전체 선택 체크박스 */}
                        <div>
                          <input
                            type="checkbox"
                            checked={isModuleChecked(role.id, module)}
                            ref={(el) => {
                              if (el) {
                                el.indeterminate = isModuleIndeterminate(role.id, module);
                              }
                            }}
                            onChange={(e) => editingRole === role.id && handleModuleToggle(module, e.target.checked)}
                            disabled={editingRole !== role.id || role.is_system_role}
                            className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                          />
                        </div>
                        
                        {/* 세부 권한 표시 */}
                        {editingRole === role.id && (
                          <div className="space-y-1 text-xs">
                            {permissionsByModule[module].map(permission => (
                              <label key={permission.id} className="flex items-center gap-1 text-left">
                                <input
                                  type="checkbox"
                                  checked={tempPermissions[permission.id] || false}
                                  onChange={(e) => handlePermissionToggle(permission.id, e.target.checked)}
                                  disabled={role.is_system_role}
                                  className="w-3 h-3 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                />
                                <span className="text-gray-600 dark:text-gray-300 truncate">
                                  {permission.action}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                  
                  <td className="px-6 py-4 text-center">
                    {editingRole === role.id ? (
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleSaveRole(role.id)}
                          loading={saving}
                          disabled={role.is_system_role}
                        >
                          저장
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handleCancelEdit}
                          disabled={saving}
                        >
                          취소
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditRole(role.id)}
                        disabled={role.is_system_role}
                      >
                        편집
                      </Button>
                    )}
                    {role.is_system_role && (
                      <p className="text-xs text-gray-400 mt-1">
                        시스템 역할은 편집할 수 없습니다
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 권한 설명 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            권한 설명
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map(module => (
              <div key={module} className="space-y-2">
                <h5 className="font-medium text-gray-900 dark:text-white">
                  {module.replace('_', ' ')}
                </h5>
                <div className="space-y-1">
                  {permissionsByModule[module].map(permission => (
                    <div key={permission.id} className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {permission.action}:
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 ml-1">
                        {permission.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}