'use client';

import React, { useState } from 'react';
import { 
  Button,
  Modal,
  ModalBody,
  ModalHeader,
  toast,
  ConfirmModal
} from '@/shared/components/ui';
import { 
  EquipmentList,
  EquipmentSearch,
  EquipmentForm,
  useEquipment
} from '@/domains/equipment';
import { Navigation } from '@/components/navigation';
import type { Equipment, EquipmentFilter, EquipmentStatus } from '@/domains/equipment/types';

export default function EquipmentPage() {
  const [filter, setFilter] = useState<EquipmentFilter>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const {
    createEquipment,
    updateEquipment,
    deleteEquipment,
    updateStatus,
    creating,
    updating,
    deleting
  } = useEquipment();

  // 검색 처리
  const handleSearch = (query: string) => {
    setFilter(prev => ({ ...prev, search: query }));
  };

  // 설비 생성
  const handleCreate = async (data: any) => {
    const result = await createEquipment(data);
    if (result) {
      toast.success('설비가 성공적으로 등록되었습니다.');
      setShowCreateModal(false);
    }
  };

  // 설비 수정
  const handleEdit = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setShowEditModal(true);
  };

  const handleUpdate = async (data: any) => {
    if (!selectedEquipment) return;
    
    const result = await updateEquipment(selectedEquipment.id, data);
    if (result) {
      toast.success('설비가 성공적으로 수정되었습니다.');
      setShowEditModal(false);
      setSelectedEquipment(null);
    }
  };

  // 설비 삭제
  const handleDelete = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEquipment) return;
    
    const success = await deleteEquipment(selectedEquipment.id);
    if (success) {
      toast.success('설비가 성공적으로 삭제되었습니다.');
      setShowDeleteModal(false);
      setSelectedEquipment(null);
    }
  };

  // 상태 변경
  const handleStatusChange = async (equipment: Equipment, status: EquipmentStatus) => {
    const result = await updateStatus(equipment.id, status);
    if (result) {
      toast.success('설비 상태가 변경되었습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 네비게이션 */}
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">설비 관리</h1>
          <p className="text-gray-600">설비 정보를 등록하고 관리할 수 있습니다.</p>
        </div>

      {/* 검색 및 필터 */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <EquipmentSearch
              onSearch={handleSearch}
              placeholder="설비 번호, 이름, 위치로 검색..."
            />
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            설비 등록
          </Button>
        </div>
      </div>

      {/* 설비 목록 */}
      <EquipmentList
        filter={filter}
        onEquipmentEdit={handleEdit}
        onEquipmentDelete={handleDelete}
        onEquipmentStatusChange={handleStatusChange}
        onCreateNew={() => setShowCreateModal(true)}
      />

      {/* 설비 생성 모달 */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="새 설비 등록"
        size="lg"
      >
        <ModalBody>
          <EquipmentForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
            loading={creating}
          />
        </ModalBody>
      </Modal>

      {/* 설비 수정 모달 */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="설비 정보 수정"
        size="lg"
      >
        <ModalBody>
          <EquipmentForm
            initialData={selectedEquipment || undefined}
            onSubmit={handleUpdate}
            onCancel={() => setShowEditModal(false)}
            loading={updating}
          />
        </ModalBody>
      </Modal>

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="설비 삭제"
        message={`'${selectedEquipment?.equipment_number} - ${selectedEquipment?.name}' 설비를 삭제하시겠습니까?`}
        confirmText="삭제"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}