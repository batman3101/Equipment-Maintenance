'use client';

import { useState, useEffect } from 'react';
import { UserManagementTable } from '@/domains/user-management/components/UserManagementTable';
import { UserForm } from '@/domains/user-management/components/UserForm';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { createUserManagementService } from '@/domains/user-management/services';
import { createRoleManagementService } from '@/domains/user-management/services';
import type { 
  User, 
  UserListFilters, 
  UserFormData, 
  Role, 
  UserStatistics 
} from '@/domains/user-management/types';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [filters, setFilters] = useState<UserListFilters>({
    status: '',
    role: '',
    department: '',
    search: ''
  });

  const userService = createUserManagementService();
  const roleService = createRoleManagementService();

  // 모의 공장 데이터 (실제 구현에서는 API에서 가져옴)
  const plants = [
    { id: '550e8400-e29b-41d4-a716-446655440001', name: '1공장' },
    { id: '550e8400-e29b-41d4-a716-446655440002', name: '2공장' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData, statsData] = await Promise.all([
        userService.getUsers(),
        roleService.getRoles(),
        userService.getUserStatistics()
      ]);
      
      setUsers(usersData);
      setRoles(rolesData);
      setStatistics(statsData);
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setUserFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserFormOpen(true);
  };

  const handleUserSubmit = async (userData: UserFormData) => {
    setFormLoading(true);
    try {
      if (editingUser) {
        await userService.updateUser(editingUser.id, userData);
      } else {
        await userService.createUser({
          ...userData,
          role: 'engineer', // 기본 역할
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      
      await loadData();
      setUserFormOpen(false);
    } catch (error) {
      console.error('사용자 저장 실패:', error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUsers = async (userIds: string[]) => {
    if (!confirm(`선택한 ${userIds.length}명의 사용자를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await Promise.all(userIds.map(id => userService.deleteUser(id)));
      await loadData();
    } catch (error) {
      console.error('사용자 삭제 실패:', error);
    }
  };

  const handleActivateUsers = async (userIds: string[]) => {
    try {
      await Promise.all(userIds.map(id => userService.activateUser(id)));
      await loadData();
    } catch (error) {
      console.error('사용자 활성화 실패:', error);
    }
  };

  const handleDeactivateUsers = async (userIds: string[]) => {
    try {
      await Promise.all(userIds.map(id => userService.deactivateUser(id)));
      await loadData();
    } catch (error) {
      console.error('사용자 비활성화 실패:', error);
    }
  };

  const handleAssignRole = async (userIds: string[]) => {
    // TODO: 역할 할당 모달 구현
    console.log('역할 할당:', userIds);
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            사용자 관리
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            시스템 사용자를 관리하고 권한을 할당합니다.
          </p>
        </div>
        <Button variant="primary" onClick={handleCreateUser}>
          새 사용자 추가
        </Button>
      </div>

      {/* 통계 카드 */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {statistics.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              전체 사용자
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {statistics.active}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              활성 사용자
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-gray-600">
              {statistics.inactive}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              비활성 사용자
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {statistics.pending}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              대기 중
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {statistics.suspended}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              정지된 사용자
            </div>
          </Card>
        </div>
      )}

      {/* 사용자 테이블 */}
      <UserManagementTable
        users={users}
        loading={loading}
        onEditUser={handleEditUser}
        onDeleteUsers={handleDeleteUsers}
        onActivateUsers={handleActivateUsers}
        onDeactivateUsers={handleDeactivateUsers}
        onAssignRole={handleAssignRole}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* 사용자 폼 모달 */}
      <UserForm
        user={editingUser}
        roles={roles}
        plants={plants}
        isOpen={userFormOpen}
        onClose={() => setUserFormOpen(false)}
        onSubmit={handleUserSubmit}
        loading={formLoading}
      />
    </div>
  );
}