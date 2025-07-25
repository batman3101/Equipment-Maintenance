'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
}

/**
 * 페이지네이션 컴포넌트
 * - 페이지 번호 표시 및 네비게이션
 * - 현재 페이지 강조 표시
 * - 생략 표시 (...) 지원
 * - 반응형 디자인
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showInfo = true,
  totalItems,
  itemsPerPage,
  className
}) => {
  // 페이지 번호 생성 로직
  const generatePageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      // 전체 페이지가 7개 이하면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 전체 페이지가 7개 초과
      if (currentPage <= 4) {
        // 현재 페이지가 앞쪽에 있을 때
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // 현재 페이지가 뒤쪽에 있을 때
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 현재 페이지가 가운데 있을 때
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pages = generatePageNumbers();

  // 이전 페이지로 이동
  const goToPrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  // 다음 페이지로 이동
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // 페이지가 1개 이하면 표시하지 않음
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      {/* 페이지 정보 */}
      {showInfo && totalItems && itemsPerPage && (
        <div className="text-sm text-gray-600">
          전체 {totalItems.toLocaleString()}개 중{' '}
          {((currentPage - 1) * itemsPerPage + 1).toLocaleString()}-
          {Math.min(currentPage * itemsPerPage, totalItems).toLocaleString()}개 표시
        </div>
      )}

      {/* 페이지네이션 컨트롤 */}
      <div className="flex items-center space-x-1">
        {/* 이전 페이지 버튼 */}
        <button
          onClick={goToPrevPage}
          disabled={currentPage === 1}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg border',
            'transition-colors duration-200',
            currentPage === 1
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
          )}
          aria-label="이전 페이지"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* 페이지 번호 */}
        {pages.map((page, index) => (
          <React.Fragment key={index}>
            {page === 'ellipsis' ? (
              <div className="flex items-center justify-center w-8 h-8">
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </div>
            ) : (
              <button
                onClick={() => onPageChange(page)}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg border text-sm font-medium',
                  'transition-colors duration-200',
                  page === currentPage
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                )}
                aria-label={`페이지 ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        {/* 다음 페이지 버튼 */}
        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg border',
            'transition-colors duration-200',
            currentPage === totalPages
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
          )}
          aria-label="다음 페이지"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 모바일용 간단한 네비게이션 */}
      <div className="flex md:hidden items-center space-x-4">
        <button
          onClick={goToPrevPage}
          disabled={currentPage === 1}
          className={cn(
            'flex items-center px-3 py-2 text-sm font-medium rounded-lg',
            'transition-colors duration-200',
            currentPage === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:text-gray-900'
          )}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          이전
        </button>

        <span className="text-sm text-gray-600">
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className={cn(
            'flex items-center px-3 py-2 text-sm font-medium rounded-lg',
            'transition-colors duration-200',
            currentPage === totalPages
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:text-gray-900'
          )}
        >
          다음
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};