'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/Button';
import { ActionSheet, useActionSheet } from '@/shared/components/ui/ActionSheet';

export interface CameraCaptureProps {
  onFilesSelected: (files: File[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * 카메라 촬영 및 갤러리 선택 컴포넌트
 * - 모바일 환경에서 카메라 직접 촬영
 * - 갤러리에서 파일 선택
 * - 파일 타입 및 크기 제한
 */
export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onFilesSelected,
  onError,
  disabled = false,
  className
}) => {
  const { open: openActionSheet, ActionSheet } = useActionSheet();
  const [isCapturing, setIsCapturing] = useState(false);

  // 파일 입력 ref들
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);

  // 파일 유효성 검사
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    const maxImageSize = 5 * 1024 * 1024; // 5MB
    const maxVideoSize = 10 * 1024 * 1024; // 10MB
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

    const isImage = allowedImageTypes.includes(file.type);
    const isVideo = allowedVideoTypes.includes(file.type);

    if (!isImage && !isVideo) {
      return {
        isValid: false,
        error: '지원하지 않는 파일 형식입니다. (이미지: JPEG, PNG, WebP / 동영상: MP4, WebM, MOV)'
      };
    }

    const maxSize = isImage ? maxImageSize : maxVideoSize;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return {
        isValid: false,
        error: `파일 크기가 너무 큽니다. (최대 ${maxSizeMB}MB)`
      };
    }

    return { isValid: true };
  };

  // 파일 선택 처리
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      const validation = validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      onError?.(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }

    // 입력 초기화
    event.target.value = '';
  };

  // 카메라 촬영
  const handleCameraCapture = () => {
    setIsCapturing(true);
    cameraInputRef.current?.click();
    setTimeout(() => setIsCapturing(false), 100);
  };

  // 갤러리 선택
  const handleGallerySelect = () => {
    galleryInputRef.current?.click();
  };

  // 동영상 촬영
  const handleVideoCapture = () => {
    setIsCapturing(true);
    videoInputRef.current?.click();
    setTimeout(() => setIsCapturing(false), 100);
  };

  // 파일 첨부 옵션 표시
  const handleAttachFile = () => {
    const actions = [
      {
        label: '카메라로 사진 촬영',
        onClick: handleCameraCapture,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      },
      {
        label: '갤러리에서 사진 선택',
        onClick: handleGallerySelect,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      },
      {
        label: '동영상 촬영',
        onClick: handleVideoCapture,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )
      }
    ];

    openActionSheet({
      title: '파일 첨부',
      description: '고장 상황을 보여주는 사진이나 동영상을 첨부해주세요.',
      actions
    });
  };

  return (
    <div className={className}>
      {/* 숨겨진 파일 입력들 */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="sr-only"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileChange}
        className="sr-only"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        onChange={handleFileChange}
        className="sr-only"
      />

      {/* 파일 첨부 버튼 */}
      <Button
        type="button"
        variant="secondary"
        onClick={handleAttachFile}
        disabled={disabled || isCapturing}
        loading={isCapturing}
        className={cn(
          'w-full flex items-center justify-center space-x-2',
          'border-2 border-dashed border-gray-300 hover:border-gray-400',
          'bg-gray-50 hover:bg-gray-100',
          'min-h-[120px] rounded-lg',
          className
        )}
      >
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">파일 첨부</p>
          <p className="text-xs text-gray-500">사진 촬영 또는 파일 선택</p>
        </div>
      </Button>

      <ActionSheet />
    </div>
  );
};

/**
 * 파일 타입 확인 유틸리티
 */
export const getFileType = (file: File): 'image' | 'video' | 'unknown' => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'unknown';
};

/**
 * 파일 크기 포맷 유틸리티
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};