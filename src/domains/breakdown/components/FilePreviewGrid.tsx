'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { formatFileSize, getFileType } from './CameraCapture';

export interface FilePreviewItem {
  file: File;
  preview?: string;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface FilePreviewGridProps {
  files: FilePreviewItem[];
  onRemove: (index: number) => void;
  onPreview?: (file: File, index: number) => void;
  maxFiles?: number;
  className?: string;
}

/**
 * 파일 미리보기 그리드 컴포넌트
 * - 이미지/동영상 미리보기
 * - 업로드 진행률 표시
 * - 파일 삭제 기능
 * - 모바일 최적화 그리드 레이아웃
 */
export const FilePreviewGrid: React.FC<FilePreviewGridProps> = ({
  files,
  onRemove,
  onPreview,
  maxFiles = 5,
  className
}) => {
  const [previews, setPreviews] = useState<{ [key: number]: string }>({});

  // 미리보기 URL 생성
  useEffect(() => {
    const newPreviews: { [key: number]: string } = {};

    files.forEach((item, index) => {
      if (getFileType(item.file) === 'image' && !previews[index]) {
        const url = URL.createObjectURL(item.file);
        newPreviews[index] = url;
      }
    });

    if (Object.keys(newPreviews).length > 0) {
      setPreviews(prev => ({ ...prev, ...newPreviews }));
    }

    // 클린업
    return () => {
      Object.values(newPreviews).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [files]);

  // 컴포넌트 언마운트 시 모든 미리보기 URL 해제
  useEffect(() => {
    return () => {
      Object.values(previews).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  if (files.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* 파일 개수 표시 */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">
          첨부된 파일 ({files.length}/{maxFiles})
        </h4>
        {files.length >= maxFiles && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
            최대 개수 도달
          </span>
        )}
      </div>

      {/* 파일 그리드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {files.map((item, index) => (
          <FilePreviewCard
            key={`${item.file.name}-${index}`}
            item={item}
            preview={previews[index]}
            onRemove={() => onRemove(index)}
            onPreview={() => onPreview?.(item.file, index)}
          />
        ))}
      </div>
    </div>
  );
};

interface FilePreviewCardProps {
  item: FilePreviewItem;
  preview?: string;
  onRemove: () => void;
  onPreview?: () => void;
}

/**
 * 개별 파일 미리보기 카드
 */
const FilePreviewCard: React.FC<FilePreviewCardProps> = ({
  item,
  preview,
  onRemove,
  onPreview
}) => {
  const fileType = getFileType(item.file);
  const isUploading = item.uploadStatus === 'uploading';
  const hasError = item.uploadStatus === 'error';
  const isCompleted = item.uploadStatus === 'completed';

  return (
    <div
      className={cn(
        'relative bg-white border border-gray-200 rounded-lg overflow-hidden',
        'hover:shadow-md transition-shadow',
        hasError && 'border-red-300 bg-red-50'
      )}
    >
      {/* 미리보기 영역 */}
      <div 
        className="aspect-square bg-gray-100 flex items-center justify-center cursor-pointer"
        onClick={onPreview}
      >
        {fileType === 'image' && preview ? (
          <img
            src={preview}
            alt={item.file.name}
            className="w-full h-full object-cover"
          />
        ) : fileType === 'video' ? (
          <div className="flex flex-col items-center space-y-2">
            <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
            <span className="text-xs text-gray-500">동영상</span>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-gray-500">파일</span>
          </div>
        )}

        {/* 업로드 진행률 오버레이 */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs">
                {item.uploadProgress ? `${Math.round(item.uploadProgress)}%` : '업로드 중...'}
              </span>
            </div>
          </div>
        )}

        {/* 완료 표시 */}
        {isCompleted && (
          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* 에러 표시 */}
        {hasError && (
          <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
      </div>

      {/* 파일 정보 */}
      <div className="p-3 space-y-1">
        <p className="text-xs font-medium text-gray-900 truncate" title={item.file.name}>
          {item.file.name}
        </p>
        <p className="text-xs text-gray-500">
          {formatFileSize(item.file.size)}
        </p>
        
        {/* 에러 메시지 */}
        {hasError && item.error && (
          <p className="text-xs text-red-600 mt-1">
            {item.error}
          </p>
        )}

        {/* 업로드 진행률 바 */}
        {isUploading && item.uploadProgress !== undefined && (
          <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
            <div 
              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${item.uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* 삭제 버튼 */}
      <button
        onClick={onRemove}
        disabled={isUploading}
        className={cn(
          'absolute -top-2 -right-2 bg-red-500 text-white rounded-full',
          'w-6 h-6 flex items-center justify-center',
          'hover:bg-red-600 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        aria-label={`${item.file.name} 삭제`}
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};