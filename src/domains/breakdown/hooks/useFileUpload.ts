import { useState, useCallback } from 'react';
import { FileUploadService } from '../services/FileUploadService';
import type { FileUploadProgress, UploadedFile } from '../types';

interface UseFileUploadReturn {
  files: File[];
  uploadProgress: FileUploadProgress[];
  uploading: boolean;
  error: string | null;
  addFiles: (newFiles: File[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  uploadFiles: (breakdownId: string) => Promise<UploadedFile[]>;
  validateFile: (file: File) => { isValid: boolean; error?: string };
  createPreviewUrl: (file: File) => string;
  revokePreviewUrl: (url: string) => void;
  formatFileSize: (bytes: number) => string;
}

/**
 * 파일 업로드 관리를 위한 커스텀 훅
 */
export function useFileUpload(): UseFileUploadReturn {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileUploadService = new FileUploadService();

  const addFiles = useCallback((newFiles: File[]) => {
    setError(null);
    
    // 파일 유효성 검사
    const validFiles: File[] = [];
    const errors: string[] = [];

    newFiles.forEach(file => {
      const validation = fileUploadService.validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      
      // 업로드 진행률 초기화
      const newProgress = validFiles.map(file => ({
        file,
        progress: 0,
        status: 'pending' as const
      }));
      
      setUploadProgress(prev => [...prev, ...newProgress]);
    }
  }, [fileUploadService]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setUploadProgress(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setUploadProgress([]);
    setError(null);
  }, []);

  const uploadFiles = useCallback(async (breakdownId: string): Promise<UploadedFile[]> => {
    if (files.length === 0) {
      return [];
    }

    try {
      setUploading(true);
      setError(null);

      // 업로드 진행률 업데이트 함수
      const onProgress = (fileIndex: number, progress: number) => {
        setUploadProgress(prev => 
          prev.map((item, index) => 
            index === fileIndex 
              ? { ...item, progress, status: 'uploading' as const }
              : item
          )
        );
      };

      const uploadedFiles = await fileUploadService.uploadFiles(
        files,
        breakdownId,
        onProgress
      );

      // 업로드 완료 상태로 업데이트
      setUploadProgress(prev => 
        prev.map(item => ({ ...item, progress: 100, status: 'completed' as const }))
      );

      return uploadedFiles;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '파일 업로드 중 오류가 발생했습니다.';
      setError(errorMessage);
      
      // 업로드 실패 상태로 업데이트
      setUploadProgress(prev => 
        prev.map(item => ({ 
          ...item, 
          status: 'error' as const,
          error: errorMessage
        }))
      );
      
      throw err;
    } finally {
      setUploading(false);
    }
  }, [files, fileUploadService]);

  const validateFile = useCallback((file: File) => {
    return fileUploadService.validateFile(file);
  }, [fileUploadService]);

  const createPreviewUrl = useCallback((file: File) => {
    return fileUploadService.createPreviewUrl(file);
  }, [fileUploadService]);

  const revokePreviewUrl = useCallback((url: string) => {
    fileUploadService.revokePreviewUrl(url);
  }, [fileUploadService]);

  const formatFileSize = useCallback((bytes: number) => {
    return fileUploadService.formatFileSize(bytes);
  }, [fileUploadService]);

  return {
    files,
    uploadProgress,
    uploading,
    error,
    addFiles,
    removeFile,
    clearFiles,
    uploadFiles,
    validateFile,
    createPreviewUrl,
    revokePreviewUrl,
    formatFileSize
  };
}