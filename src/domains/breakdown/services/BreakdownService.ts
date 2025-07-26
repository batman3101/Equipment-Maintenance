import { BreakdownRepository } from './BreakdownRepository';
import { FileUploadService } from './FileUploadService';
import { supabase } from '@/lib/supabase';
import { offlineStorage } from '@/lib/offline-storage';
import type {
  Breakdown,
  CreateBreakdownRequest,
  UpdateBreakdownRequest,
  BreakdownFilter,
  BreakdownListResponse,
  BreakdownAttachment
} from '../types';

/**
 * 고장 관련 비즈니스 로직을 담당하는 서비스 클래스
 * Single Responsibility Principle: 고장 관련 비즈니스 로직만 담당
 * Dependency Inversion Principle: Repository 추상화에 의존
 */
export class BreakdownService {
  constructor(
    private readonly breakdownRepository: BreakdownRepository,
    private readonly fileUploadService: FileUploadService
  ) { }

  /**
   * 고장 목록 조회
   */
  async getBreakdowns(
    filter: BreakdownFilter = {},
    page: number = 1,
    limit: number = 20
  ): Promise<BreakdownListResponse> {
    return this.breakdownRepository.findAll(filter, page, limit);
  }

  /**
   * 고장 상세 조회
   */
  async getBreakdown(id: string): Promise<Breakdown | null> {
    return this.breakdownRepository.findById(id);
  }

  /**
   * 고장 등록 (오프라인 지원)
   */
  async createBreakdown(request: CreateBreakdownRequest): Promise<Breakdown> {
    try {
      // 현재 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      // 네트워크 상태 확인
      const isOnline = navigator.onLine;

      if (isOnline) {
        // 온라인 상태: 일반적인 등록 프로세스
        return await this.createBreakdownOnline(request, user);
      } else {
        // 오프라인 상태: 로컬 저장 후 동기화 대기
        return await this.createBreakdownOffline(request, user);
      }
    } catch (error) {
      // 온라인 상태에서 실패한 경우 오프라인 저장 시도
      if (navigator.onLine) {
        console.warn('온라인 등록 실패, 오프라인 저장으로 전환:', error);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            return await this.createBreakdownOffline(request, user);
          }
        } catch (offlineError) {
          console.error('오프라인 저장도 실패:', offlineError);
        }
      }

      throw new Error(`고장 등록 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 온라인 고장 등록
   */
  private async createBreakdownOnline(request: CreateBreakdownRequest, user: any): Promise<Breakdown> {
    // 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('plant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }

    // 설비 정보 확인
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('id')
      .eq('equipment_number', request.equipment_number)
      .eq('equipment_type', request.equipment_type)
      .eq('plant_id', userData.plant_id)
      .single();

    if (equipmentError || !equipment) {
      throw new Error('해당 설비를 찾을 수 없습니다.');
    }

    // 고장 데이터 생성
    const breakdownData: Omit<Breakdown, 'id' | 'created_at' | 'updated_at'> = {
      equipment_id: equipment.id,
      equipment_type: request.equipment_type,
      equipment_number: request.equipment_number,
      occurred_at: request.occurred_at,
      symptoms: request.symptoms,
      cause: request.cause,
      status: 'in_progress',
      reporter_id: user.id,
      plant_id: userData.plant_id,
      breakdown_main_category_id: request.breakdown_main_category_id,
      breakdown_sub_category_id: request.breakdown_sub_category_id
    };

    // 고장 등록
    const breakdown = await this.breakdownRepository.create(breakdownData);

    // 파일 업로드 처리
    if (request.attachments && request.attachments.length > 0) {
      await this.uploadAttachments(breakdown.id, request.attachments);
    }

    // 실시간 알림 발송
    await this.sendRealtimeNotification(breakdown);

    return breakdown;
  }

  /**
   * 오프라인 고장 등록
   */
  private async createBreakdownOffline(request: CreateBreakdownRequest, user: any): Promise<Breakdown> {
    // 임시 ID 생성
    const tempId = `temp-breakdown-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 사용자 정보에서 plant_id 가져오기 (오프라인 상태에서는 캐시된 정보 사용)
    let plantId = '';
    try {
      // 로컬 스토리지나 IndexedDB에서 사용자 정보 조회 시도
      const cachedUserData = localStorage.getItem(`user_${user.id}`);
      if (cachedUserData) {
        const userData = JSON.parse(cachedUserData);
        plantId = userData.plant_id || '';
      }
    } catch (error) {
      console.warn('오프라인 상태에서 사용자 정보 조회 실패:', error);
    }

    // 임시 equipment_id 생성 (실제 동기화 시 서버에서 올바른 ID로 대체됨)
    const tempEquipmentId = `temp-equipment-${request.equipment_type}-${request.equipment_number}`;

    // 오프라인 고장 데이터 생성 (Breakdown 인터페이스와 일치하도록 필수 필드 추가)
    const offlineBreakdownData: Breakdown = {
      id: tempId,
      equipment_id: tempEquipmentId, // 임시 equipment_id
      equipment_type: request.equipment_type,
      equipment_number: request.equipment_number,
      occurred_at: request.occurred_at,
      symptoms: request.symptoms,
      cause: request.cause,
      status: 'in_progress',
      reporter_id: user.id,
      plant_id: plantId, // 캐시된 정보에서 가져온 plant_id 또는 빈 문자열
      breakdown_main_category_id: request.breakdown_main_category_id,
      breakdown_sub_category_id: request.breakdown_sub_category_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // 오프라인 플래그 (Breakdown 타입에 없는 속성은 타입 단언 후 추가)
      _offline: true,
      _tempId: tempId
    } as Breakdown & { _offline: boolean; _tempId: string };

    // 오프라인 저장소에 저장
    await offlineStorage.saveOfflineData({
      id: tempId,
      type: 'breakdown',
      data: offlineBreakdownData,
      action: 'create'
    });

    // 파일이 있는 경우 로컬 저장 (실제 구현에서는 IndexedDB나 다른 방법 사용)
    if (request.attachments && request.attachments.length > 0) {
      await this.saveAttachmentsOffline(tempId, request.attachments);
    }

    console.log('오프라인 고장 등록 완료:', tempId);

    // 고장 객체 반환
    return offlineBreakdownData;
  }

  /**
   * 오프라인 첨부 파일 저장
   */
  private async saveAttachmentsOffline(breakdownId: string, files: File[]): Promise<void> {
    try {
      // 파일을 Base64로 변환하여 저장 (실제 구현에서는 더 효율적인 방법 사용)
      const attachmentPromises = files.map(async (file) => {
        return new Promise<any>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              breakdown_id: breakdownId,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              file_data: reader.result, // Base64 데이터
              _offline: true
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const attachmentData = await Promise.all(attachmentPromises);

      // 오프라인 저장소에 첨부 파일 정보 저장
      for (const attachment of attachmentData) {
        await offlineStorage.saveOfflineData({
          id: `${breakdownId}-attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'breakdown',
          data: attachment,
          action: 'create'
        });
      }

      console.log('오프라인 첨부 파일 저장 완료:', attachmentData.length, '개');
    } catch (error) {
      console.error('오프라인 첨부 파일 저장 실패:', error);
      // 첨부 파일 저장 실패는 전체 프로세스를 중단시키지 않음
    }
  }

  /**
   * 고장 정보 수정
   */
  async updateBreakdown(request: UpdateBreakdownRequest): Promise<Breakdown> {
    try {
      // 권한 확인
      await this.checkUpdatePermission(request.id);

      // 고장 정보 수정
      const breakdown = await this.breakdownRepository.update(request.id, {
        symptoms: request.symptoms,
        cause: request.cause,
        status: request.status,
        breakdown_main_category_id: request.breakdown_main_category_id,
        breakdown_sub_category_id: request.breakdown_sub_category_id
      });

      return breakdown;
    } catch (error) {
      throw new Error(`고장 정보 수정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 고장 삭제
   */
  async deleteBreakdown(id: string): Promise<void> {
    try {
      // 권한 확인
      await this.checkUpdatePermission(id);

      // 첨부 파일 삭제
      const breakdown = await this.breakdownRepository.findById(id);
      if (breakdown?.attachments) {
        for (const attachment of breakdown.attachments) {
          await this.fileUploadService.deleteFile(attachment.file_path);
        }
      }

      // 고장 삭제
      await this.breakdownRepository.delete(id);
    } catch (error) {
      throw new Error(`고장 삭제 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 설비별 고장 이력 조회
   */
  async getBreakdownsByEquipment(equipmentId: string): Promise<Breakdown[]> {
    return this.breakdownRepository.findByEquipment(equipmentId);
  }

  /**
   * 고장 상태 업데이트
   */
  async updateBreakdownStatus(id: string, status: Breakdown['status']): Promise<void> {
    try {
      await this.breakdownRepository.updateStatus(id, status);

      // 상태 변경 알림 발송
      const breakdown = await this.breakdownRepository.findById(id);
      if (breakdown) {
        await this.sendStatusChangeNotification(breakdown, status);
      }
    } catch (error) {
      throw new Error(`고장 상태 업데이트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 첨부 파일 업로드
   */
  private async uploadAttachments(breakdownId: string, files: File[]): Promise<void> {
    try {
      const uploadedFiles = await this.fileUploadService.uploadFiles(files, breakdownId);

      // 첨부 파일 정보를 데이터베이스에 저장
      const attachmentData = uploadedFiles.map(file => ({
        breakdown_id: breakdownId,
        file_name: file.file_name,
        file_path: file.file_path,
        file_type: file.file_type,
        file_size: file.file_size
      }));

      const { error } = await supabase
        .from('breakdown_attachments')
        .insert(attachmentData);

      if (error) {
        throw new Error(`첨부 파일 정보 저장 실패: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`첨부 파일 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 실시간 알림 발송
   */
  private async sendRealtimeNotification(breakdown: Breakdown): Promise<void> {
    try {
      const channel = supabase.channel('breakdown-notifications');

      await channel.send({
        type: 'broadcast',
        event: 'breakdown-created',
        payload: {
          breakdown_id: breakdown.id,
          equipment_type: breakdown.equipment_type,
          equipment_number: breakdown.equipment_number,
          symptoms: breakdown.symptoms,
          occurred_at: breakdown.occurred_at,
          reporter_id: breakdown.reporter_id
        }
      });
    } catch (error) {
      // 알림 발송 실패는 전체 프로세스를 중단시키지 않음
      console.error('실시간 알림 발송 실패:', error);
    }
  }

  /**
   * 상태 변경 알림 발송
   */
  private async sendStatusChangeNotification(breakdown: Breakdown, newStatus: Breakdown['status']): Promise<void> {
    try {
      const channel = supabase.channel('breakdown-notifications');

      await channel.send({
        type: 'broadcast',
        event: 'breakdown-status-changed',
        payload: {
          breakdown_id: breakdown.id,
          equipment_number: breakdown.equipment_number,
          old_status: breakdown.status,
          new_status: newStatus
        }
      });
    } catch (error) {
      console.error('상태 변경 알림 발송 실패:', error);
    }
  }

  /**
   * 수정 권한 확인
   */
  private async checkUpdatePermission(breakdownId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('인증되지 않은 사용자입니다.');
    }

    const breakdown = await this.breakdownRepository.findById(breakdownId);
    if (!breakdown) {
      throw new Error('고장 정보를 찾을 수 없습니다.');
    }

    // 본인이 등록한 고장이거나 관리자 권한이 있는 경우에만 수정 가능
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isOwner = breakdown.reporter_id === user.id;
    const isManager = userData?.role === 'manager' || userData?.role === 'admin';

    if (!isOwner && !isManager) {
      throw new Error('수정 권한이 없습니다.');
    }
  }
}

// 싱글톤 인스턴스 생성
export const breakdownService = new BreakdownService(
  new BreakdownRepository(),
  new FileUploadService()
);