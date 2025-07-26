import { supabase } from '@/lib/supabase';
import type { 
  User, 
  UserManagementService, 
  UserRegistrationRequest,
  UserRoleAssignment,
  Role,
  UserListFilters,
  UserStatistics,
  RegistrationRequestFilters,
  UserStatus 
} from '../types';

export class SupabaseUserManagementService implements UserManagementService {
  
  // 사용자 목록 조회
  async getUsers(plantId?: string): Promise<User[]> {
    try {
      let query = supabase
        .from('users')
        .select(`
          *,
          approved_by_user:users!approved_by(name),
          user_role_assignments!inner(
            role_id,
            is_active,
            roles(name, display_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (plantId) {
        query = query.eq('plant_id', plantId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('사용자 목록 조회 실패:', error);
        throw new Error(`사용자 목록을 불러올 수 없습니다: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('getUsers error:', error);
      throw error;
    }
  }

  // 필터링된 사용자 목록 조회
  async getUsersWithFilters(filters: UserListFilters) {
    try {
      let query = supabase
        .from('users')
        .select(`
          *,
          user_role_assignments!inner(
            roles(name, display_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (filters.plant_id) {
        query = query.eq('plant_id', filters.plant_id);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.department) {
        query = query.eq('department', filters.department);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`사용자 검색 실패: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('getUsersWithFilters error:', error);
      throw error;
    }
  }

  // 사용자 생성
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          ...userData,
          status: userData.status || 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('사용자 생성 실패:', error);
        throw new Error(`사용자를 생성할 수 없습니다: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('createUser error:', error);
      throw error;
    }
  }

  // 사용자 정보 수정
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('사용자 정보 수정 실패:', error);
        throw new Error(`사용자 정보를 수정할 수 없습니다: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('updateUser error:', error);
      throw error;
    }
  }

  // 사용자 삭제 (소프트 삭제)
  async deleteUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);

      if (error) {
        console.error('사용자 삭제 실패:', error);
        throw new Error(`사용자를 삭제할 수 없습니다: ${error.message}`);
      }
    } catch (error) {
      console.error('deleteUser error:', error);
      throw error;
    }
  }

  // 사용자 활성화
  async activateUser(userId: string): Promise<User> {
    return this.updateUser(userId, { status: 'active' });
  }

  // 사용자 비활성화
  async deactivateUser(userId: string): Promise<User> {
    return this.updateUser(userId, { status: 'inactive' });
  }

  // 사용자 등록 요청 목록 조회
  async getRegistrationRequests(status?: string): Promise<UserRegistrationRequest[]> {
    try {
      let query = supabase
        .from('user_registration_requests')
        .select(`
          *,
          approved_by_user:users!approved_by(name),
          rejected_by_user:users!rejected_by(name),
          plant:plants(name)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('등록 요청 목록 조회 실패:', error);
        throw new Error(`등록 요청 목록을 불러올 수 없습니다: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('getRegistrationRequests error:', error);
      throw error;
    }
  }

  // 등록 요청 승인
  async approveRegistration(requestId: string, approvedRole?: string): Promise<User> {
    try {
      // 트랜잭션 시작
      const { data: request, error: requestError } = await supabase
        .from('user_registration_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) {
        throw new Error(`등록 요청을 찾을 수 없습니다: ${requestError.message}`);
      }

      if (request.status !== 'pending') {
        throw new Error('이미 처리된 요청입니다.');
      }

      // 1. 새 사용자 생성 (Supabase Auth)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: request.email,
        password: 'temporary-password-123!', // 임시 비밀번호
        email_confirm: true,
        user_metadata: {
          name: request.name,
          phone: request.phone,
          department: request.department,
          position: request.position,
          approved: true
        }
      });

      if (authError) {
        throw new Error(`사용자 계정 생성 실패: ${authError.message}`);
      }

      // 2. users 테이블에 프로필 생성
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: request.email,
          name: request.name,
          phone: request.phone,
          department: request.department,
          position: request.position,
          role: approvedRole || request.requested_role,
          plant_id: request.plant_id,
          status: 'active',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString()
        })
        .select()
        .single();

      if (userError) {
        // 롤백: Auth 사용자 삭제
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(`사용자 프로필 생성 실패: ${userError.message}`);
      }

      // 3. 역할 할당
      if (approvedRole || request.requested_role) {
        const { data: role } = await supabase
          .from('roles')
          .select('id')
          .eq('name', approvedRole || request.requested_role)
          .single();

        if (role) {
          await supabase
            .from('user_role_assignments')
            .insert({
              user_id: newUser.id,
              role_id: role.id,
              assigned_by: (await supabase.auth.getUser()).data.user?.id,
              is_active: true
            });
        }
      }

      // 4. 등록 요청 상태 업데이트
      await supabase
        .from('user_registration_requests')
        .update({
          status: 'approved',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      return newUser;
    } catch (error) {
      console.error('approveRegistration error:', error);
      throw error;
    }
  }

  // 등록 요청 거부
  async rejectRegistration(requestId: string, reason: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_registration_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          rejected_by: (await supabase.auth.getUser()).data.user?.id,
          rejected_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        throw new Error(`등록 요청 거부 실패: ${error.message}`);
      }
    } catch (error) {
      console.error('rejectRegistration error:', error);
      throw error;
    }
  }

  // 사용자에게 역할 할당
  async assignRole(userId: string, roleId: string): Promise<UserRoleAssignment> {
    try {
      // 기존 활성 역할 비활성화
      await supabase
        .from('user_role_assignments')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      // 새 역할 할당
      const { data, error } = await supabase
        .from('user_role_assignments')
        .insert({
          user_id: userId,
          role_id: roleId,
          assigned_by: (await supabase.auth.getUser()).data.user?.id,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        throw new Error(`역할 할당 실패: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('assignRole error:', error);
      throw error;
    }
  }

  // 사용자 역할 제거
  async removeRole(userId: string, roleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_role_assignments')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('role_id', roleId);

      if (error) {
        throw new Error(`역할 제거 실패: ${error.message}`);
      }
    } catch (error) {
      console.error('removeRole error:', error);
      throw error;
    }
  }

  // 사용자의 역할 목록 조회
  async getUserRoles(userId: string): Promise<Role[]> {
    try {
      const { data, error } = await supabase
        .from('user_role_assignments')
        .select(`
          roles(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        throw new Error(`사용자 역할 조회 실패: ${error.message}`);
      }

      return data?.map(item => item.roles).filter(Boolean) || [];
    } catch (error) {
      console.error('getUserRoles error:', error);
      throw error;
    }
  }

  // 사용자 통계 조회
  async getUserStatistics(plantId?: string): Promise<UserStatistics> {
    try {
      let query = supabase.from('users').select('status, role, department');
      
      if (plantId) {
        query = query.eq('plant_id', plantId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`사용자 통계 조회 실패: ${error.message}`);
      }

      const stats: UserStatistics = {
        total: data?.length || 0,
        active: 0,
        inactive: 0,
        pending: 0,
        suspended: 0,
        byRole: {},
        byDepartment: {}
      };

      data?.forEach(user => {
        // 상태별 통계
        if (user.status === 'active') stats.active++;
        else if (user.status === 'inactive') stats.inactive++;
        else if (user.status === 'pending') stats.pending++;
        else if (user.status === 'suspended') stats.suspended++;

        // 역할별 통계
        if (user.role) {
          stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
        }

        // 부서별 통계
        if (user.department) {
          stats.byDepartment[user.department] = (stats.byDepartment[user.department] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('getUserStatistics error:', error);
      throw error;
    }
  }
}

// Factory function
export function createUserManagementService(): UserManagementService {
  return new SupabaseUserManagementService();
}