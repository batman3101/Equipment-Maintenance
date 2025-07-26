'use client';

import { useState } from 'react';
import { DataTable } from '@/shared/components/ui/DataTable';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import type { User, UserListFilters } from '../types';

interface UserManagementTableProps {
  users: User[];
  loading?: boolean;
  onEditUser: (user: User) => void;
  onDeleteUsers: (userIds: string[]) => void;
  onActivateUsers: (userIds: string[]) => void;
  onDeactivateUsers: (userIds: string[]) => void;
  onAssignRole: (userIds: string[]) => void;
  filters: UserListFilters;
  onFiltersChange: (filters: UserListFilters) => void;
}

export function UserManagementTable({
  users,
  loading = false,
  onEditUser,
  onDeleteUsers,
  onActivateUsers,
  onDeactivateUsers,
  onAssignRole,
  filters,
  onFiltersChange
}: UserManagementTableProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const columns = [
    {
      key: 'name',
      title: '이름',
      sortable: true,
      render: (value: string, record: User) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-white">
            {value}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {record.email}
          </span>
        </div>
      )
    },
    {
      key: 'department',
      title: '부서/직책',
      render: (value: string, record: User) => (
        <div className="flex flex-col">
          <span className="text-sm text-gray-900 dark:text-white">
            {record.department || '-'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {record.position || '-'}
          </span>
        </div>
      )
    },
    {
      key: 'role',
      title: '역할',
      render: (value: string) => (
        <Badge variant="secondary">
          {value}
        </Badge>
      )
    },
    {
      key: 'status',
      title: '상태',
      render: (value: string) => (
        <StatusBadge status={value} />
      )
    },
    {
      key: 'last_login_at',
      title: '마지막 접속',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {value ? new Date(value).toLocaleDateString('ko-KR') : '접속 기록 없음'}
        </span>
      )
    },
    {
      key: 'created_at',
      title: '가입일',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(value).toLocaleDateString('ko-KR')}
        </span>
      )
    },
    {
      key: 'actions',
      title: '작업',
      width: '120px',
      render: (_: any, record: User) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onEditUser(record)}
          >
            편집
          </Button>
        </div>
      )
    }
  ];

  const filterOptions = [
    {
      key: 'status',
      label: '상태',
      options: [
        { value: 'active', label: '활성' },
        { value: 'inactive', label: '비활성' },
        { value: 'pending', label: '대기' },
        { value: 'suspended', label: '정지' }
      ],
      value: filters.status || '',
      onChange: (value: string) => onFiltersChange({ ...filters, status: value })
    },
    {
      key: 'role',
      label: '역할',
      options: [
        { value: 'admin', label: '관리자' },
        { value: 'manager', label: '매니저' },
        { value: 'engineer', label: '엔지니어' },
        { value: 'technician', label: '기술자' },
        { value: 'viewer', label: '조회자' }
      ],
      value: filters.role || '',
      onChange: (value: string) => onFiltersChange({ ...filters, role: value })
    }
  ];

  const bulkActions = [
    {
      title: '활성화',
      onClick: onActivateUsers,
      variant: 'primary' as const
    },
    {
      title: '비활성화',
      onClick: onDeactivateUsers,
      variant: 'secondary' as const
    },
    {
      title: '역할 할당',
      onClick: onAssignRole,
      variant: 'secondary' as const
    },
    {
      title: '삭제',
      onClick: onDeleteUsers,
      variant: 'danger' as const
    }
  ];

  const handleSearch = (searchText: string) => {
    onFiltersChange({ ...filters, search: searchText });
  };

  return (
    <DataTable
      data={users}
      columns={columns}
      loading={loading}
      searchable
      searchPlaceholder="이름 또는 이메일로 검색..."
      onSearch={handleSearch}
      filters={filterOptions}
      selection={{
        selectedKeys: selectedUserIds,
        onChange: setSelectedUserIds,
        getRowKey: (user) => user.id
      }}
      actions={bulkActions}
      emptyText="등록된 사용자가 없습니다."
      className="bg-white dark:bg-gray-800 rounded-lg shadow"
    />
  );
}