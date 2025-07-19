'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { FileUploadProgress } from '../types';

export interface UploadProgressProps {
  files: FileUploadProgress[];
  className?: string;
}

/**
 * 파일 업로드 진행률 표시 컴포넌트
 * - 개별 파일별 진행률 표시
 * - 전체 진행률 요약
 * - 에러 상태 표시
 */
export const UploadProgress: React.FC<UploadProgressProps> = ({
  files,
  className
}) => {
  if (files.length === 0) {
    return null;
  }

  // 전체 진행률 계산
  const totalProgress = files.reduce((sum, file) => sum + file.progress, 0) / files.length;
  const completedCount = files.filter(file => file.status === 'completed').length;
  const errorCount = files.filter(file => file.status === 'error').length;
  const uploadingCount = files.filter(file => file.status === 'uploading').length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* 전체 진행률 요약 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-blue-900">
            파일 업로드 진행률
          </h4>
          <span className="text-sm text-blue-700">
            {completedCount}/{files.length} 완료
          </span>
        </div>

        {/* 전체 진행률 바 */}
        <div className="w-full bg-blue-100 rounded-full h-2 mb-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${totalProgress}%` }}
          />
        </div>

        {/* 상태 요약 */}
        <div className="flex items-center space-x-4 text-xs">
          {uploadingCount > 0 && (
            <span className="text-blue-600">
              업로드 중: {uploadingCount}개
            </span>
          )}
          {completedCount > 0 && (
            <span className="text-green-600">
              완료: {completedCount}개
            </span>
          )}
          {errorCount > 0 && (
            <span className="text-red-600">
              실패: {errorCount}개
            </span>
          )}
        </div>
      </div>

      {/* 개별 파일 진행률 */}
      <div className="space-y-2">
        {files.map((file, index) => (
          <FileProgressItem
            key={`${file.file.name}-${index}`}
            fileProgress={file}
          />
        ))}
      </div>
    </div>
  );
};

interface FileProgressItemProps {
  fileProgress: FileUploadProgress;
}

/**
 * 개별 파일 진행률 아이템
 */
const FileProgressItem: React.FC<FileProgressItemProps> = ({
  fileProgress
}) => {
  const { file, progress, status, error } = fileProgress;

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'uploading':
        return (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      case 'completed':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'text-gray-600';
      case 'uploading':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProgressBarColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className={cn(
      'bg-white border border-gray-200 rounded-lg p-3',
      status === 'error' && 'border-red-200 bg-red-50'
    )}>
      <div className="flex items-center space-x-3">
        {/* 상태 아이콘 */}
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>

        {/* 파일 정보 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {file.name}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className={cn('text-xs', getStatusColor())}>
              {status === 'pending' && '대기 중'}
              {status === 'uploading' && `업로드 중... ${Math.round(progress)}%`}
              {status === 'completed' && '업로드 완료'}
              {status === 'error' && '업로드 실패'}
            </span>
            <span className="text-xs text-gray-500">
              {formatFileSize(file.size)}
            </span>
          </div>

          {/* 진행률 바 */}
          {(status === 'uploading' || status === 'completed') && (
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div 
                className={cn('h-1 rounded-full transition-all duration-300', getProgressBarColor())}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* 에러 메시지 */}
          {status === 'error' && error && (
            <p className="text-xs text-red-600 mt-1">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 파일 크기 포맷 유틸리티
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};