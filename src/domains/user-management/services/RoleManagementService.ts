import { supabase } from '@/lib/supabase';
import type { 
  Role, 
  Permission, 
  RoleManagementService,
  RoleListFilters,
  PermissionsByModule
} from '../types';

export class SupabaseRoleManagementService implements RoleManagementService {

  // 역할 목록 조회
  async getRoles(plantId?: string): Promise<Role[]> {
    try {
      let query = supabase
        .from('roles')
        .select(`
          *,
          created_by_user:users!created_by(name),
          role_permissions(
            permissions(*)
          )
        `)
        .order('is_system_role', { ascending: false })
        .order('created_at', { ascending: true });

      // 시스템 역할 또는 해당 공장의 역할만 조회
      if (plantId) {
        query = query.or(`plant_id.is.null,plant_id.eq.${plantId}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('역할 목록 조회 실패:', error);
        throw new Error(`역할 목록을 불러올 수 없습니다: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('getRoles error:', error);
      throw error;
    }
  }

  // 필터링된 역할 목록 조회
  async getRolesWithFilters(filters: RoleListFilters): Promise<Role[]> {
    try {
      let query = supabase
        .from('roles')
        .select('*')
        .order('is_system_role', { ascending: false })
        .order('created_at', { ascending: true });

      if (filters.plant_id) {
        query = query.or(`plant_id.is.null,plant_id.eq.${filters.plant_id}`);
      }

      if (filters.is_system_role !== undefined) {
        query = query.eq('is_system_role', filters.is_system_role);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`역할 검색 실패: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('getRolesWithFilters error:', error);
      throw error;
    }
  }

  // 역할 생성
  async createRole(roleData: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role> {
    try {
      const currentUser = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('roles')
        .insert({
          ...roleData,
          created_by: currentUser.data.user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('역할 생성 실패:', error);
        throw new Error(`역할을 생성할 수 없습니다: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('createRole error:', error);
      throw error;
    }
  }

  // 역할 수정
  async updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
    try {
      // 시스템 역할은 수정할 수 없음
      const { data: existingRole } = await supabase
        .from('roles')
        .select('is_system_role')
        .eq('id', roleId)
        .single();

      if (existingRole?.is_system_role) {
        throw new Error('시스템 역할은 수정할 수 없습니다.');
      }

      const { data, error } = await supabase
        .from('roles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', roleId)
        .select()
        .single();

      if (error) {
        console.error('역할 수정 실패:', error);
        throw new Error(`역할을 수정할 수 없습니다: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('updateRole error:', error);
      throw error;
    }
  }

  // 역할 삭제
  async deleteRole(roleId: string): Promise<void> {
    try {
      // 시스템 역할은 삭제할 수 없음
      const { data: existingRole } = await supabase
        .from('roles')
        .select('is_system_role')
        .eq('id', roleId)
        .single();

      if (existingRole?.is_system_role) {
        throw new Error('시스템 역할은 삭제할 수 없습니다.');
      }

      // 역할을 사용하는 사용자가 있는지 확인
      const { data: assignments } = await supabase
        .from('user_role_assignments')
        .select('id')
        .eq('role_id', roleId)
        .eq('is_active', true)
        .limit(1);

      if (assignments && assignments.length > 0) {
        throw new Error('이 역할을 사용하는 사용자가 있어 삭제할 수 없습니다.');
      }

      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) {
        console.error('역할 삭제 실패:', error);
        throw new Error(`역할을 삭제할 수 없습니다: ${error.message}`);
      }
    } catch (error) {
      console.error('deleteRole error:', error);
      throw error;
    }
  }

  // 모든 권한 조회
  async getPermissions(): Promise<Permission[]> {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('module')
        .order('resource')
        .order('action');

      if (error) {
        console.error('권한 목록 조회 실패:', error);
        throw new Error(`권한 목록을 불러올 수 없습니다: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('getPermissions error:', error);
      throw error;
    }
  }

  // 모듈별 권한 조회
  async getPermissionsByModule(): Promise<PermissionsByModule> {
    try {
      const permissions = await this.getPermissions();
      const groupedPermissions: PermissionsByModule = {};

      permissions.forEach(permission => {
        if (!groupedPermissions[permission.module]) {
          groupedPermissions[permission.module] = [];
        }
        groupedPermissions[permission.module].push(permission);
      });

      return groupedPermissions;
    } catch (error) {
      console.error('getPermissionsByModule error:', error);
      throw error;
    }
  }

  // 특정 역할의 권한 조회
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          permissions(*)
        `)
        .eq('role_id', roleId);

      if (error) {
        console.error('역할 권한 조회 실패:', error);
        throw new Error(`역할 권한을 불러올 수 없습니다: ${error.message}`);
      }

      return data?.map(item => item.permissions).filter(Boolean) || [];
    } catch (error) {
      console.error('getRolePermissions error:', error);
      throw error;
    }
  }

  // 역할에 권한 할당
  async assignPermission(roleId: string, permissionId: string): Promise<void> {
    try {
      const currentUser = await supabase.auth.getUser();

      const { error } = await supabase
        .from('role_permissions')
        .insert({
          role_id: roleId,
          permission_id: permissionId,
          granted_by: currentUser.data.user?.id
        });

      if (error) {
        // 이미 존재하는 권한인 경우는 무시
        if (error.code !== '23505') {
          console.error('권한 할당 실패:', error);
          throw new Error(`권한을 할당할 수 없습니다: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('assignPermission error:', error);
      throw error;
    }
  }

  // 역할에서 권한 제거
  async removePermission(roleId: string, permissionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId)
        .eq('permission_id', permissionId);

      if (error) {
        console.error('권한 제거 실패:', error);
        throw new Error(`권한을 제거할 수 없습니다: ${error.message}`);
      }
    } catch (error) {
      console.error('removePermission error:', error);
      throw error;
    }
  }

  // 권한 매트릭스 조회
  async getPermissionMatrix(): Promise<{ [roleId: string]: { [permissionId: string]: boolean } }> {
    try {
      const [roles, permissions, rolePermissions] = await Promise.all([
        this.getRoles(),
        this.getPermissions(),
        supabase.from('role_permissions').select('role_id, permission_id')
      ]);

      if (rolePermissions.error) {
        throw new Error(`권한 매트릭스 조회 실패: ${rolePermissions.error.message}`);
      }

      const matrix: { [roleId: string]: { [permissionId: string]: boolean } } = {};

      // 모든 역할에 대해 매트릭스 초기화
      roles.forEach(role => {
        matrix[role.id] = {};
        permissions.forEach(permission => {
          matrix[role.id][permission.id] = false;
        });
      });

      // 실제 할당된 권한 표시
      rolePermissions.data?.forEach(rp => {
        if (matrix[rp.role_id]) {
          matrix[rp.role_id][rp.permission_id] = true;
        }
      });

      return matrix;
    } catch (error) {
      console.error('getPermissionMatrix error:', error);
      throw error;
    }
  }

  // 권한 매트릭스 업데이트
  async updatePermissionMatrix(roleId: string, permissions: { [permissionId: string]: boolean }): Promise<void> {
    try {
      const currentUser = await supabase.auth.getUser();

      // 트랜잭션으로 처리
      const updates: Promise<any>[] = [];

      Object.entries(permissions).forEach(([permissionId, hasPermission]) => {
        if (hasPermission) {
          // 권한 추가
          updates.push(
            supabase
              .from('role_permissions')
              .upsert({
                role_id: roleId,
                permission_id: permissionId,
                granted_by: currentUser.data.user?.id
              })
          );
        } else {
          // 권한 제거
          updates.push(
            supabase
              .from('role_permissions')
              .delete()
              .eq('role_id', roleId)
              .eq('permission_id', permissionId)
          );
        }
      });

      const results = await Promise.allSettled(updates);
      
      // 실패한 업데이트가 있는지 확인
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.error('일부 권한 업데이트 실패:', failures);
        throw new Error('일부 권한 업데이트에 실패했습니다.');
      }

      // 감사 로그 생성
      await this.createPermissionAuditLog(roleId, permissions, currentUser.data.user?.id);
    } catch (error) {
      console.error('updatePermissionMatrix error:', error);
      throw error;
    }
  }

  // 권한 변경 감사 로그 생성
  private async createPermissionAuditLog(
    roleId: string, 
    permissions: { [permissionId: string]: boolean },
    changedBy?: string
  ): Promise<void> {
    try {
      const logs = Object.entries(permissions).map(([permissionId, hasPermission]) => ({
        role_id: roleId,
        permission_id: permissionId,
        action: hasPermission ? 'granted' : 'revoked' as const,
        new_value: { hasPermission },
        changed_by: changedBy,
        created_at: new Date().toISOString()
      }));

      if (logs.length > 0) {
        await supabase
          .from('permission_audit_logs')
          .insert(logs);
      }
    } catch (error) {
      console.error('감사 로그 생성 실패:', error);
      // 감사 로그 실패는 메인 기능에 영향을 주지 않음
    }
  }
}

// Factory function
export function createRoleManagementService(): RoleManagementService {
  return new SupabaseRoleManagementService();
}