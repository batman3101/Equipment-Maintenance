'use client';

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/navigation';
import { EquipmentForm } from '@/domains/equipment/components/EquipmentForm';
import { EquipmentCard } from '@/domains/equipment/components/EquipmentCard';
import { EquipmentExcelUpload } from '@/domains/equipment/components/EquipmentExcelUpload';
import { Pagination } from '@/shared/components/ui';
import { CreateEquipmentRequest, Equipment } from '@/domains/equipment/types';
import { equipmentService } from '@/domains/equipment/services/EquipmentService';
import type { ParsedEquipmentData } from '@/domains/equipment/utils/excel-template';

const ITEMS_PER_PAGE = 20;

export default function EquipmentPage() {
  // State 관리
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExcelUploading, setIsExcelUploading] = useState(false);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isListLoading, setIsListLoading] = useState(true);

  // 설비 목록 로드
  const loadEquipmentList = async (page: number = currentPage, search: string = searchQuery) => {
    setIsListLoading(true);
    try {
      const result = await equipmentService.getEquipmentList({
        filter: { search: search || undefined },
        sort: { field: 'created_at', direction: 'desc' },
        page,
        limit: ITEMS_PER_PAGE
      });
      
      setEquipmentList(result.data);
      setTotalCount(result.total);
    } catch (error) {
      console.error('설비 목록 로드 실패:', error);
      setEquipmentList([]);
      setTotalCount(0);
    } finally {
      setIsListLoading(false);
    }
  };

  // 페이지 로드 시 초기 데이터 로드
  useEffect(() => {
    loadEquipmentList(1, searchQuery);
    setCurrentPage(1);
  }, [searchQuery]);

  // 페이지 변경 시 데이터 로드
  useEffect(() => {
    if (currentPage > 1) {
      loadEquipmentList(currentPage, searchQuery);
    }
  }, [currentPage]);

  // 개별 설비 등록
  const handleCreateEquipment = async (data: CreateEquipmentRequest) => {
    setIsLoading(true);
    try {
      const newEquipment = await equipmentService.createEquipment(data);
      console.log('생성된 설비:', newEquipment);
      
      alert('설비가 성공적으로 등록되었습니다!');
      setIsModalOpen(false);
      
      // 목록 새로고침
      await loadEquipmentList(1, searchQuery);
      setCurrentPage(1);
    } catch (error) {
      console.error('설비 등록 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '설비 등록에 실패했습니다.';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Excel 데이터 일괄 등록
  const handleExcelDataParsed = async (data: ParsedEquipmentData[]) => {
    // 파싱된 데이터를 CreateEquipmentRequest 형태로 변환
    const requestData: CreateEquipmentRequest[] = data.map(item => ({
      equipment_number: item.equipment_number,
      equipment_type: item.equipment_type,
      plant_id: '550e8400-e29b-41d4-a716-446655440001', // 기본 공장 ID
      status: item.status || 'active'
    }));

    setIsExcelUploading(true);
    try {
      const result = await equipmentService.createEquipmentBatch(requestData);
      
      const successCount = result.success.length;
      const failedCount = result.failed.length;
      
      if (failedCount === 0) {
        alert(`${successCount}개의 설비가 성공적으로 등록되었습니다!`);
      } else {
        const failedDetails = result.failed.map(f => 
          `${f.data.equipment_number}: ${f.error}`
        ).join('\n');
        
        alert(
          `총 ${data.length}개 중 ${successCount}개 성공, ${failedCount}개 실패\n\n` +
          `실패 목록:\n${failedDetails}`
        );
      }
      
      // 목록 새로고침
      await loadEquipmentList(1, searchQuery);
      setCurrentPage(1);
      
    } catch (error) {
      console.error('일괄 등록 실패:', error);
      alert('일괄 등록 중 오류가 발생했습니다.');
    } finally {
      setIsExcelUploading(false);
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

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

        {/* 검색 및 액션 버튼 */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="설비 번호, 종류로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <EquipmentExcelUpload
                onDataParsed={handleExcelDataParsed}
                onUploadComplete={() => {}}
                loading={isExcelUploading}
              />
              <button 
                onClick={openModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                개별 등록
              </button>
            </div>
          </div>
        </div>

        {/* 설비 통계 정보 */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              전체 <span className="font-semibold text-gray-900">{totalCount.toLocaleString()}</span>개의 설비
            </div>
            {isListLoading && (
              <div className="flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                로딩 중...
              </div>
            )}
          </div>
        </div>

        {/* 설비 목록 컨테이너 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {isListLoading ? (
              // 로딩 상태
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">설비 목록을 불러오는 중...</p>
                </div>
              </div>
            ) : equipmentList.length === 0 ? (
              // 빈 상태
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {searchQuery ? '검색 결과가 없습니다' : '설비가 없습니다'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery ? '다른 검색어를 사용해보세요.' : '새 설비를 등록하여 시작하세요.'}
                </p>
                {!searchQuery && (
                  <div className="mt-6">
                    <button 
                      onClick={openModal}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      설비 등록
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // 설비 목록 그리드 (20개씩 표시)
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {equipmentList.map((equipment) => (
                    <EquipmentCard
                      key={equipment.id}
                      equipment={equipment}
                      onView={(equipment) => {
                        console.log('설비 상세 보기:', equipment);
                        // TODO: 상세 페이지로 이동
                      }}
                      onEdit={(equipment) => {
                        console.log('설비 수정:', equipment);
                        // TODO: 수정 모달 열기
                      }}
                      onDelete={(equipment) => {
                        if (confirm(`설비 "${equipment.equipment_number}"를 삭제하시겠습니까?`)) {
                          console.log('설비 삭제:', equipment);
                          // TODO: 삭제 API 호출
                        }
                      }}
                      showActions={true}
                      compact={false}
                    />
                  ))}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="mt-8 border-t border-gray-200 pt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      showInfo={true}
                      totalItems={totalCount}
                      itemsPerPage={ITEMS_PER_PAGE}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 개별 설비 등록 모달 */}
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