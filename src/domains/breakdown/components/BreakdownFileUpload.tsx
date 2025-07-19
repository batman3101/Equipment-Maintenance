'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { CameraCapture } from './CameraCapture';
import { FilePreviewGrid, type FilePreviewItem } from './FilePreviewGrid';
import { UploadProgress } from './UploadProgress';
import { useFileUpload } from '../hooks/useFileUpload';
import type { FileUploadProgress } from '../types';

export interface BreakdownFileUploadProps {
  onFilesChange?: (files: File[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  maxFiles?: number;
  className?: string;
}

/**
 * 고장 등록용 파일 첨부 컴포넌트
 * - 카메라 촬영 및 갤러리 선택
 * - 파일 미리보기 및 삭제
 * - 업로드 진행률 표시
 * - 오프라인 지원 (로컬 저장)
 */
export const BreakdownFileUpload: React.FC<BreakdownFileUploadProps> = ({
  onFilesChange,
  onError,
  disabled = false,
  maxFiles = 5,
  className
}) => {
  const {
    files,
    uploadProgress,
    uploading,
    error,
    addFiles,
    removeFile,
    clearFiles,
    validateFile,
    createPreviewUrl,
    revokePreviewUrl,
    formatFileSize
  } = useFileUpload();

  const [previewItems, setPreviewItems] = useState<FilePreviewItem[]>([]);
  const [showUploadProgress, setShowUploadProgress] = useState(false);

  // 파일 선택 핸들러
  const handleFilesSelected = useCallback((newFiles: File[]) => {
    // 최대 파일 수 체크
    if (files.length + newFiles.length > maxFiles) {
      onError?.(`최대 ${maxFiles}개의 파일만 첨부할 수 있습니다.`);
      return;
    }

    // 파일 추가
    addFiles(newFiles);

    // 미리보기 아이템 생성
    const newPreviewItems: FilePreviewItem[] = newFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? createPreviewUrl(file) : undefined,
      uploadProgress: 0,
      uploadStatus: 'pending'
    }));

    setPreviewItems(prev => [...prev, ...newPreviewItems]);

    // 부모 컴포넌트에 알림
    const allFiles = [...files, ...newFiles];
    onFilesChange?.(allFiles);
  }, [files, maxFiles, addFiles, createPreviewUrl, onFilesChange, onError]);

  // 파일 제거 핸들러
  const handleFileRemove = useCallback((index: number) => {
    const item = previewItems[index];
    
    // 미리보기 URL 해제
    if (item.preview) {
      revokePreviewUrl(item.preview);
    }

    // 파일 제거
    removeFile(index);
    setPreviewItems(prev => prev.filter((_, i) => i !== index));

    // 부모 컴포넌트에 알림
    const remainingFiles = files.filter((_, i) => i !== index);
    onFilesChange?.(remainingFiles);
  }, [previewItems, files, removeFile, revokePreviewUrl, onFilesChange]);

  // 파일 미리보기 핸들러
  const handleFilePreview = useCallback((file: File, index: number) => {
    // 파일 미리보기 모달 또는 새 창에서 열기
    if (file.type.startsWith('image/')) {
      const url = createPreviewUrl(file);
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>${file.name}</title></head>
            <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#000;">
              <img src="${url}" style="max-width:100%;max-height:100%;object-fit:contain;" alt="${file.name}" />
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
  }, [createPreviewUrl]);

  // 에러 처리
  const handleError = useCallback((errorMessage: string) => {
    onError?.(errorMessage);
  }, [onError]);

  // 업로드 진행률 업데이트
  React.useEffect(() => {
    if (uploadProgress.length > 0) {
      setShowUploadProgress(true);
      
      // 미리보기 아이템의 업로드 상태 업데이트
      setPreviewItems(prev => 
        prev.map((item, index) => {
          const progress = uploadProgress[index];
          if (progress) {
            return {
              ...item,
              uploadProgress: progress.progress,
              uploadStatus: progress.status,
              error: progress.error
            };
          }
          return item;
        })
      );
    } else {
      setShowUploadProgress(false);
    }
  }, [uploadProgress]);

  // 전체 파일 클리어
  const handleClearAll = useCallback(() => {
    // 모든 미리보기 URL 해제
    previewItems.forEach(item => {
      if (item.preview) {
        revokePreviewUrl(item.preview);
      }
    });

    clearFiles();
    setPreviewItems([]);
    setShowUploadProgress(false);
    onFilesChange?.([]);
  }, [previewItems, clearFiles, revokePreviewUrl, onFilesChange]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* 파일 첨부 영역 */}
      {(!disabled && files.length < maxFiles) && (
        <CameraCapture
          onFilesSelected={handleFilesSelected}
          onError={handleError}
          disabled={disabled || uploading}
        />
      )}

      {/* 업로드 진행률 */}
      {showUploadProgress && (
        <UploadProgress files={uploadProgress} />
      )}

      {/* 파일 미리보기 그리드 */}
      {previewItems.length > 0 && (
        <div className="space-y-3">
          <FilePreviewGrid
            files={previewItems}
            onRemove={handleFileRemove}
            onPreview={handleFilePreview}
            maxFiles={maxFiles}
          />

          {/* 전체 삭제 버튼 */}
          {previewItems.length > 1 && !uploading && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleClearAll}
                className="text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                모든 파일 삭제
              </button>
            </div>
          )}
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-4 w-4 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* 도움말 텍스트 */}
      {files.length === 0 && (
        <div className="text-center py-2">
          <p className="text-sm text-gray-500">
            고장 상황을 보여주는 사진이나 동영상을 첨부해주세요.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            이미지: 최대 5MB, 동영상: 최대 10MB (최대 {maxFiles}개)
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * 오프라인 상태에서 파일을 로컬 스토리지에 저장하는 유틸리티
 */
export const saveFilesOffline = async (files: File[], breakdownId: string): Promise<void> => {
  try {
    const fileData = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        return {
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
          lastModified: file.lastModified
        };
      })
    );

    const offlineData = {
      breakdownId,
      files: fileData,
      timestamp: Date.now()
    };

    localStorage.setItem(`breakdown_files_${breakdownId}`, JSON.stringify(offlineData));
  } catch (error) {
    console.error('오프라인 파일 저장 실패:', error);
    throw new Error('파일을 임시 저장하는 중 오류가 발생했습니다.');
  }
};

/**
 * 로컬 스토리지에서 오프라인 파일을 불러오는 유틸리티
 */
export const loadOfflineFiles = (breakdownId: string): File[] | null => {
  try {
    const data = localStorage.getItem(`breakdown_files_${breakdownId}`);
    if (!data) return null;

    const offlineData = JSON.parse(data);
    
    return offlineData.files.map((fileData: any) => {
      const binaryString = atob(fileData.data);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return new File([bytes], fileData.name, {
        type: fileData.type,
        lastModified: fileData.lastModified
      });
    });
  } catch (error) {
    console.error('오프라인 파일 로드 실패:', error);
    return null;
  }
};

/**
 * 오프라인 파일 데이터 삭제
 */
export const clearOfflineFiles = (breakdownId: string): void => {
  localStorage.removeItem(`breakdown_files_${breakdownId}`);
};