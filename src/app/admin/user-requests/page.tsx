'use client';

import { useState, useEffect } from 'react';
import { RegistrationRequestsTable } from '@/domains/user-management/components/RegistrationRequestsTable';
import { Card } from '@/shared/components/ui/Card';
import { Select } from '@/shared/components/ui/Select';
import { createUserManagementService } from '@/domains/user-management/services';
import { createRoleManagementService } from '@/domains/user-management/services';
import type { 
  UserRegistrationRequest, 
  Role, 
  RegistrationRequestFilters 
} from '@/domains/user-management/types';

export default function UserRequestsPage() {
  const [requests, setRequests] = useState<UserRegistrationRequest[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState<RegistrationRequestFilters>({
    status: '',
    requested_role: ''
  });

  const userService = createUserManagementService();
  const roleService = createRoleManagementService();

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestsData, rolesData] = await Promise.all([
        userService.getRegistrationRequests(filters.status),
        roleService.getRoles()
      ]);
      
      let filteredRequests = requestsData;
      
      // 추가 필터링
      if (filters.requested_role) {
        filteredRequests = filteredRequests.filter(req => 
          req.requested_role === filters.requested_role
        );
      }
      
      setRequests(filteredRequests);
      setRoles(rolesData);
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, approvedRole?: string) => {
    try {
      await userService.approveRegistration(requestId, approvedRole);
      await loadData();
    } catch (error) {
      console.error('승인 실패:', error);
      throw error;
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    try {
      await userService.rejectRegistration(requestId, reason);
      await loadData();
    } catch (error) {
      console.error('거부 실패:', error);
      throw error;
    }
  };

  // 통계 계산
  const statistics = {
    total: requests.length,
    pending: requests.filter(req => req.status === 'pending').length,
    approved: requests.filter(req => req.status === 'approved').length,
    rejected: requests.filter(req => req.status === 'rejected').length
  };

  const statusOptions = [
    { value: '', label: '모든 상태' },
    { value: 'pending', label: '대기 중' },
    { value: 'approved', label: '승인됨' },
    { value: 'rejected', label: '거부됨' }
  ];

  const roleOptions = [
    { value: '', label: '모든 역할' },
    ...roles.map(role => ({
      value: role.name,
      label: role.display_name
    }))
  ];

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            사용자 등록 요청
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            신규 사용자 등록 요청을 검토하고 승인 또는 거부합니다.
          </p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {statistics.total}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            전체 요청
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
          <div className="text-2xl font-bold text-green-600">
            {statistics.approved}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            승인됨
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">
            {statistics.rejected}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            거부됨
          </div>
        </Card>
      </div>

      {/* 필터 */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              상태
            </label>
            <Select
              value={filters.status || ''}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}
              options={statusOptions}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              요청 역할
            </label>
            <Select
              value={filters.requested_role || ''}
              onChange={(value) => setFilters(prev => ({ ...prev, requested_role: value }))}
              options={roleOptions}
            />
          </div>
        </div>
      </Card>

      {/* 요청 테이블 */}
      <RegistrationRequestsTable
        requests={requests}
        roles={roles}
        loading={loading}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}