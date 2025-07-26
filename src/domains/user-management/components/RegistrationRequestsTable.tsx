'use client';

import { useState } from 'react';
import { DataTable } from '@/shared/components/ui/DataTable';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { Button } from '@/shared/components/ui/Button';
import { Modal } from '@/shared/components/ui/Modal';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Select } from '@/shared/components/ui/Select';
import { FormField } from '@/shared/components/ui/FormField';
import type { UserRegistrationRequest, Role } from '../types';

interface RegistrationRequestsTableProps {
  requests: UserRegistrationRequest[];
  roles: Role[];
  loading?: boolean;
  onApprove: (requestId: string, approvedRole?: string) => Promise<void>;
  onReject: (requestId: string, reason: string) => Promise<void>;
}

export function RegistrationRequestsTable({
  requests,
  roles,
  loading = false,
  onApprove,
  onReject
}: RegistrationRequestsTableProps) {
  const [approveModal, setApproveModal] = useState<{
    isOpen: boolean;
    request: UserRegistrationRequest | null;
    selectedRole: string;
  }>({
    isOpen: false,
    request: null,
    selectedRole: ''
  });

  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    request: UserRegistrationRequest | null;
    reason: string;
  }>({
    isOpen: false,
    request: null,
    reason: ''
  });

  const [actionLoading, setActionLoading] = useState(false);

  const columns = [
    {
      key: 'name',
      title: '신청자 정보',
      render: (value: string, record: UserRegistrationRequest) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-white">
            {value}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {record.email}
          </span>
          {record.phone && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {record.phone}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'department',
      title: '부서/직책',
      render: (value: string, record: UserRegistrationRequest) => (
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
      key: 'requested_role',
      title: '요청 역할',
      render: (value: string) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {value}
        </span>
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
      key: 'created_at',
      title: '신청일',
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
      width: '180px',
      render: (_: any, record: UserRegistrationRequest) => (
        <div className="flex gap-2">
          {record.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleApproveClick(record)}
              >
                승인
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleRejectClick(record)}
              >
                거부
              </Button>
            </>
          )}
          {record.status === 'rejected' && record.rejection_reason && (
            <span className="text-xs text-red-600 dark:text-red-400 max-w-32 truncate">
              {record.rejection_reason}
            </span>
          )}
        </div>
      )
    }
  ];

  const handleApproveClick = (request: UserRegistrationRequest) => {
    setApproveModal({
      isOpen: true,
      request,
      selectedRole: request.requested_role
    });
  };

  const handleRejectClick = (request: UserRegistrationRequest) => {
    setRejectModal({
      isOpen: true,
      request,
      reason: ''
    });
  };

  const handleApprove = async () => {
    if (!approveModal.request) return;

    setActionLoading(true);
    try {
      await onApprove(
        approveModal.request.id,
        approveModal.selectedRole !== approveModal.request.requested_role 
          ? approveModal.selectedRole 
          : undefined
      );
      setApproveModal({ isOpen: false, request: null, selectedRole: '' });
    } catch (error) {
      console.error('승인 실패:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.request || !rejectModal.reason.trim()) return;

    setActionLoading(true);
    try {
      await onReject(rejectModal.request.id, rejectModal.reason);
      setRejectModal({ isOpen: false, request: null, reason: '' });
    } catch (error) {
      console.error('거부 실패:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const roleOptions = roles.map(role => ({
    value: role.name,
    label: role.display_name
  }));

  return (
    <>
      <DataTable
        data={requests}
        columns={columns}
        loading={loading}
        searchable
        searchPlaceholder="이름 또는 이메일로 검색..."
        emptyText="등록 요청이 없습니다."
        className="bg-white dark:bg-gray-800 rounded-lg shadow"
      />

      {/* 승인 모달 */}
      <Modal
        isOpen={approveModal.isOpen}
        onClose={() => setApproveModal({ isOpen: false, request: null, selectedRole: '' })}
        title="등록 요청 승인"
        maxWidth="md"
      >
        {approveModal.request && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                신청자 정보
              </h4>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <p><strong>이름:</strong> {approveModal.request.name}</p>
                <p><strong>이메일:</strong> {approveModal.request.email}</p>
                <p><strong>부서:</strong> {approveModal.request.department || '-'}</p>
                <p><strong>직책:</strong> {approveModal.request.position || '-'}</p>
                <p><strong>요청 역할:</strong> {approveModal.request.requested_role}</p>
              </div>
            </div>

            <FormField label="승인할 역할">
              <Select
                value={approveModal.selectedRole}
                onChange={(value) => setApproveModal(prev => ({ ...prev, selectedRole: value }))}
                options={roleOptions}
              />
            </FormField>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setApproveModal({ isOpen: false, request: null, selectedRole: '' })}
                disabled={actionLoading}
              >
                취소
              </Button>
              <Button
                variant="primary"
                onClick={handleApprove}
                loading={actionLoading}
              >
                승인
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 거부 모달 */}
      <Modal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, request: null, reason: '' })}
        title="등록 요청 거부"
        maxWidth="md"
      >
        {rejectModal.request && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                신청자 정보
              </h4>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <p><strong>이름:</strong> {rejectModal.request.name}</p>
                <p><strong>이메일:</strong> {rejectModal.request.email}</p>
              </div>
            </div>

            <FormField label="거부 사유" required>
              <Textarea
                value={rejectModal.reason}
                onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="거부 사유를 입력해주세요..."
                rows={4}
              />
            </FormField>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setRejectModal({ isOpen: false, request: null, reason: '' })}
                disabled={actionLoading}
              >
                취소
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                loading={actionLoading}
                disabled={!rejectModal.reason.trim()}
              >
                거부
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}