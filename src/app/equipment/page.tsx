'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/navigation';
import { EquipmentForm } from '@/domains/equipment/components/EquipmentForm';
import { EquipmentList } from '@/domains/equipment/components/EquipmentList';
import { CreateEquipmentRequest } from '@/domains/equipment/types';

export default function EquipmentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateEquipment = async (data: CreateEquipmentRequest) => {
    setIsLoading(true);
    try {
      console.log('설비 등록 데이터:', data);
      // TODO: 실제 API 호출 구현
      await new Promise(resolve => setTimeout(resolve, 1000)); // 시뮬레이션
      
      alert('설비가 성공적으로 등록되었습니다!');
      setIsModalOpen(false);
    } catch (error) {
      console.error('설비 등록 실패:', error);
      alert('설비 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

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
              <input
                type="text"
                placeholder="설비 번호, 이름, 위치로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button 
              onClick={openModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              설비 등록
            </button>
          </div>
        </div>

        {/* 설비 목록 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <EquipmentList 
              filter={{ search: searchQuery }}
              onCreateNew={openModal}
              showActions={true}
              enableInfiniteScroll={true}
            />
          </div>
        </div>
      </div>

      {/* 설비 등록 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">새 설비 등록</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <EquipmentForm
                onSubmit={handleCreateEquipment}
                onCancel={closeModal}
                loading={isLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}