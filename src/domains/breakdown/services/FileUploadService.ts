import { supabase } from '@/lib/supabase';
import type { UploadedFile, FileUploadProgress } from '../types';

/**
 * 파일 업로드를 담당하는 서비스 클래스
 * Single Responsibility Principle: 파일 업로드 로직만 담당
 */
export class FileUploadService {
  private readonly bucketName = 'breakdown-attachments';
  private readonly maxImageSize = 5 * 1024 * 1024; // 5MB
  private readonly maxVideoSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

  /**
   * 파일 유효성 검사
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    const isImage = this.allowedImageTypes.includes(file.type);
    const isVideo = this.allowedVideoTypes.includes(file.type);

    if (!isImage && !isVideo) {
      return {
        isValid: false,
        error: '지원하지 않는 파일 형식입니다. (이미지: JPEG, PNG, WebP / 동영상: MP4, WebM, MOV)'
      };
    }

    const maxSize = isImage ? this.maxImageSize : this.maxVideoSize;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return {
        isValid: false,
        error: `파일 크기가 너무 큽니다. (최대 ${maxSizeMB}MB)`
      };
    }

    return { isValid: true };
  }

  /**
   * 단일 파일 업로드
   */
  async uploadFile(
    file: File,
    breakdownId: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadedFile> {
    // 파일 유효성 검사
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // 파일명 생성 (중복 방지를 위해 타임스탬프 추가)
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${breakdownId}_${timestamp}.${fileExtension}`;
    const filePath = `${breakdownId}/${fileName}`;

    try {
      // Supabase Storage에 업로드
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`파일 업로드 실패: ${error.message}`);
      }

      // 업로드된 파일 정보 반환
      return {
        file_name: fileName,
        file_path: data.path,
        file_type: this.getFileType(file.type),
        file_size: file.size
      };
    } catch (error) {
      throw new Error(`파일 업로드 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 여러 파일 업로드
   */
  async uploadFiles(
    files: File[],
    breakdownId: string,
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<UploadedFile[]> {
    const uploadPromises = files.map(async (file, index) => {
      return this.uploadFile(file, breakdownId, (progress) => {
        onProgress?.(index, progress);
      });
    });

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      throw new Error(`파일 업로드 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 파일 삭제
   */
  async deleteFile(filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([filePath]);

    if (error) {
      throw new Error(`파일 삭제 실패: ${error.message}`);
    }
  }

  /**
   * 파일 URL 생성
   */
  getFileUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * 파일 다운로드 URL 생성 (만료 시간 포함)
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`파일 URL 생성 실패: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * 파일 타입 결정
   */
  private getFileType(mimeType: string): 'image' | 'video' {
    return mimeType.startsWith('image/') ? 'image' : 'video';
  }

  /**
   * 파일 크기를 읽기 쉬운 형태로 변환
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 이미지 미리보기 URL 생성
   */
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * 미리보기 URL 해제
   */
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}