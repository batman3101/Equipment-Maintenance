'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // bytes
  maxFiles?: number;
  onFilesChange?: (files: File[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface FilePreviewProps {
  file: File;
  onRemove?: () => void;
  className?: string;
}

/**
 * 파일 업로드 컴포넌트
 * - 드래그 앤 드롭 지원
 * - 파일 크기 및 타입 검증
 * - 모바일 최적화 (카메라/갤러리 접근)
 * - 미리보기 기능
 */
export const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  ({ 
    accept = 'image/*,video/*',
    multiple = true,
    maxSize = 10 * 1024 * 1024, // 10MB
    maxFiles = 5,
    onFilesChange,
    onError,
    disabled = false,
    loading = false,
    className,
    children,
    ...props 
  }, ref) => {
    const [isDragOver, setIsDragOver] = React.useState(false);
    const [files, setFiles] = React.useState<File[]>([]);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // 파일 검증
    const validateFiles = (fileList: FileList | File[]): File[] => {
      const validFiles: File[] = [];
      const fileArray = Array.from(fileList);

      for (const file of fileArray) {
        // 파일 크기 검증
        if (file.size > maxSize) {
          onError?.(`파일 크기가 너무 큽니다: ${file.name} (최대 ${Math.round(maxSize / 1024 / 1024)}MB)`);
          continue;
        }

        // 파일 타입 검증
        if (accept && !accept.includes('*')) {
          const acceptedTypes = accept.split(',').map(type => type.trim());
          const isValidType = acceptedTypes.some(type => {
            if (type.endsWith('/*')) {
              return file.type.startsWith(type.replace('/*', '/'));
            }
            return file.type === type;
          });

          if (!isValidType) {
            onError?.(`지원하지 않는 파일 형식입니다: ${file.name}`);
            continue;
          }
        }

        validFiles.push(file);
      }

      // 최대 파일 수 검증
      if (validFiles.length + files.length > maxFiles) {
        onError?.(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`);
        return validFiles.slice(0, maxFiles - files.length);
      }

      return validFiles;
    };

    // 파일 선택 처리
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = event.target.files;
      if (!fileList) return;

      const validFiles = validateFiles(fileList);
      const newFiles = multiple ? [...files, ...validFiles] : validFiles;
      
      setFiles(newFiles);
      onFilesChange?.(newFiles);
    };

    // 드래그 앤 드롭 처리
    const handleDragOver = (event: React.DragEvent) => {
      event.preventDefault();
      if (!disabled && !loading) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragOver(false);
    };

    const handleDrop = (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragOver(false);

      if (disabled || loading) return;

      const droppedFiles = event.dataTransfer.files;
      const validFiles = validateFiles(droppedFiles);
      const newFiles = multiple ? [...files, ...validFiles] : validFiles;
      
      setFiles(newFiles);
      onFilesChange?.(newFiles);
    };

    // 파일 제거
    const removeFile = (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      setFiles(newFiles);
      onFilesChange?.(newFiles);
    };

    // 파일 선택 버튼 클릭
    const handleButtonClick = () => {
      inputRef.current?.click();
    };

    return (
      <div className={cn('space-y-4', className)}>
        {/* 파일 업로드 영역 */}
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors',
            'min-h-[120px] flex flex-col items-center justify-center',
            isDragOver && !disabled && !loading && 'border-blue-500 bg-blue-50',
            disabled || loading ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-gray-400',
            'cursor-pointer'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
            disabled={disabled || loading}
            className="sr-only"
            {...props}
          />

          {loading ? (
            <div className="flex flex-col items-center space-y-2">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-gray-500">업로드 중...</p>
            </div>
          ) : (
            <>
              {children || (
                <>
                  <svg
                    className="h-12 w-12 text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-sm text-gray-600 mb-2">
                    파일을 드래그하거나 클릭하여 업로드
                  </p>
                  <p className="text-xs text-gray-500">
                    {accept.includes('image') && '이미지'} 
                    {accept.includes('video') && accept.includes('image') && ', 동영상'}
                    {accept.includes('video') && !accept.includes('image') && '동영상'}
                    {' '}파일 (최대 {Math.round(maxSize / 1024 / 1024)}MB)
                  </p>
                </>
              )}
            </>
          )}
        </div>

        {/* 파일 미리보기 */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              선택된 파일 ({files.length}/{maxFiles})
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {files.map((file, index) => (
                <FilePreview
                  key={`${file.name}-${index}`}
                  file={file}
                  onRemove={() => removeFile(index)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';

/**
 * 파일 미리보기 컴포넌트
 */
export const FilePreview = React.forwardRef<HTMLDivElement, FilePreviewProps>(
  ({ file, onRemove, className, ...props }, ref) => {
    const [preview, setPreview] = React.useState<string>('');

    // 미리보기 생성
    React.useEffect(() => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }

      return () => {
        if (preview) {
          URL.revokeObjectURL(preview);
        }
      };
    }, [file]);

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative bg-white border border-gray-200 rounded-lg p-3',
          'hover:shadow-md transition-shadow',
          className
        )}
        {...props}
      >
        {/* 미리보기 이미지 또는 파일 아이콘 */}
        <div className="aspect-square mb-2 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
          {file.type.startsWith('image/') && preview ? (
            <img
              src={preview}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          ) : file.type.startsWith('video/') ? (
            <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          ) : (
            <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* 파일 정보 */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-900 truncate" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-gray-500">
            {formatFileSize(file.size)}
          </p>
        </div>

        {/* 제거 버튼 */}
        {onRemove && (
          <button
            onClick={onRemove}
            className={cn(
              'absolute -top-2 -right-2 bg-red-500 text-white rounded-full',
              'w-6 h-6 flex items-center justify-center',
              'hover:bg-red-600 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
            )}
            aria-label={`${file.name} 제거`}
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

FilePreview.displayName = 'FilePreview';