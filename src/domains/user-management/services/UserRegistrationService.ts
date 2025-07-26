import { supabase } from '@/lib/supabase';
import type { 
  UserRegistrationService,
  RegisterCredentials
} from '../types';

export class SupabaseUserRegistrationService implements UserRegistrationService {

  // 사용자 등록 요청
  async register(credentials: RegisterCredentials): Promise<{ success: boolean; message: string }> {
    try {
      // 1. 이메일 중복 확인
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', credentials.email)
        .single();

      if (existingUser) {
        return {
          success: false,
          message: '이미 등록된 이메일입니다.'
        };
      }

      // 2. 기존 등록 요청 확인
      const { data: existingRequest } = await supabase
        .from('user_registration_requests')
        .select('status')
        .eq('email', credentials.email)
        .single();

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          return {
            success: false,
            message: '이미 등록 요청이 진행 중입니다. 관리자의 승인을 기다려주세요.'
          };
        } else if (existingRequest.status === 'approved') {
          return {
            success: false,
            message: '이미 승인된 이메일입니다.'
          };
        }
      }

      // 3. 검증 토큰 생성
      const verificationToken = this.generateVerificationToken();
      const verificationExpiresAt = new Date();
      verificationExpiresAt.setHours(verificationExpiresAt.getHours() + 24); // 24시간 후 만료

      // 4. 등록 요청 생성
      const { data, error } = await supabase
        .from('user_registration_requests')
        .insert({
          email: credentials.email,
          name: credentials.name,
          phone: credentials.phone,
          department: credentials.department,
          position: credentials.position,
          requested_role: credentials.requested_role,
          plant_id: credentials.plant_id,
          status: 'pending',
          verification_token: verificationToken,
          verification_expires_at: verificationExpiresAt.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('등록 요청 생성 실패:', error);
        return {
          success: false,
          message: '등록 요청에 실패했습니다. 다시 시도해주세요.'
        };
      }

      // 5. 인증 이메일 발송 (실제 구현에서는 이메일 서비스 연동)
      await this.sendVerificationEmail(credentials.email, verificationToken);

      return {
        success: true,
        message: '등록 요청이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.'
      };

    } catch (error) {
      console.error('register error:', error);
      return {
        success: false,
        message: '등록 요청 중 오류가 발생했습니다.'
      };
    }
  }

  // 이메일 인증
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    try {
      // 1. 토큰 유효성 확인
      const { data: request, error } = await supabase
        .from('user_registration_requests')
        .select('*')
        .eq('verification_token', token)
        .single();

      if (error || !request) {
        return {
          success: false,
          message: '유효하지 않은 인증 링크입니다.'
        };
      }

      // 2. 토큰 만료 확인
      if (new Date() > new Date(request.verification_expires_at || '')) {
        return {
          success: false,
          message: '인증 링크가 만료되었습니다. 새로운 인증 이메일을 요청해주세요.'
        };
      }

      // 3. 이미 인증된 요청인지 확인
      if (request.status !== 'pending') {
        return {
          success: false,
          message: '이미 처리된 요청입니다.'
        };
      }

      // 4. 인증 완료 (토큰 제거)
      const { error: updateError } = await supabase
        .from('user_registration_requests')
        .update({
          verification_token: null,
          verification_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) {
        console.error('인증 완료 처리 실패:', updateError);
        return {
          success: false,
          message: '인증 처리 중 오류가 발생했습니다.'
        };
      }

      // 5. 관리자에게 승인 대기 알림 발송
      await this.notifyAdminForApproval(request);

      return {
        success: true,
        message: '이메일 인증이 완료되었습니다. 관리자의 승인을 기다려주세요.'
      };

    } catch (error) {
      console.error('verifyEmail error:', error);
      return {
        success: false,
        message: '인증 처리 중 오류가 발생했습니다.'
      };
    }
  }

  // 인증 이메일 재발송
  async resendVerification(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // 1. 등록 요청 확인
      const { data: request, error } = await supabase
        .from('user_registration_requests')
        .select('*')
        .eq('email', email)
        .eq('status', 'pending')
        .single();

      if (error || !request) {
        return {
          success: false,
          message: '등록 요청을 찾을 수 없습니다.'
        };
      }

      // 2. 새 인증 토큰 생성
      const verificationToken = this.generateVerificationToken();
      const verificationExpiresAt = new Date();
      verificationExpiresAt.setHours(verificationExpiresAt.getHours() + 24);

      // 3. 토큰 업데이트
      const { error: updateError } = await supabase
        .from('user_registration_requests')
        .update({
          verification_token: verificationToken,
          verification_expires_at: verificationExpiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) {
        console.error('토큰 업데이트 실패:', updateError);
        return {
          success: false,
          message: '인증 이메일 재발송에 실패했습니다.'
        };
      }

      // 4. 인증 이메일 재발송
      await this.sendVerificationEmail(email, verificationToken);

      return {
        success: true,
        message: '인증 이메일이 재발송되었습니다. 이메일을 확인해주세요.'
      };

    } catch (error) {
      console.error('resendVerification error:', error);
      return {
        success: false,
        message: '인증 이메일 재발송 중 오류가 발생했습니다.'
      };
    }
  }

  // 검증 토큰 생성
  private generateVerificationToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           Date.now().toString(36);
  }

  // 인증 이메일 발송 (실제 구현에서는 이메일 서비스 연동)
  private async sendVerificationEmail(email: string, token: string): Promise<void> {
    try {
      // 실제 구현에서는 SendGrid, AWS SES 등의 이메일 서비스 사용
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
      
      console.log(`인증 이메일 발송: ${email}`);
      console.log(`인증 URL: ${verificationUrl}`);
      
      // TODO: 실제 이메일 발송 로직 구현
      // await emailService.send({
      //   to: email,
      //   subject: 'CNC 설비 관리 시스템 - 이메일 인증',
      //   template: 'verification',
      //   data: { verificationUrl }
      // });
      
    } catch (error) {
      console.error('이메일 발송 실패:', error);
      // 이메일 발송 실패는 등록 프로세스를 중단시키지 않음
    }
  }

  // 관리자에게 승인 대기 알림
  private async notifyAdminForApproval(request: any): Promise<void> {
    try {
      // 해당 공장의 관리자들 조회
      const { data: admins } = await supabase
        .from('user_role_assignments')
        .select(`
          users(email, name),
          roles!inner(name)
        `)
        .eq('roles.name', 'admin')
        .eq('is_active', true);

      if (admins && admins.length > 0) {
        console.log(`관리자 승인 알림: ${request.name} (${request.email}) 등록 요청`);
        
        // TODO: 관리자들에게 승인 대기 알림 발송
        // await notificationService.notifyAdmins({
        //   type: 'user_registration_pending',
        //   data: request,
        //   recipients: admins.map(admin => admin.users.email)
        // });
      }
    } catch (error) {
      console.error('관리자 알림 실패:', error);
      // 알림 실패는 등록 프로세스를 중단시키지 않음
    }
  }
}

// Factory function
export function createUserRegistrationService(): UserRegistrationService {
  return new SupabaseUserRegistrationService();
}