export * from '../auth/types';

// 추가 사용자 관리 관련 타입들
export interface UserListFilters {
  status?: string;
  role?: string;
  plant_id?: string;
  department?: string;
  search?: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RoleListFilters {
  plant_id?: string;
  is_system_role?: boolean;
  search?: string;
}

export interface PermissionsByModule {
  [module: string]: Permission[];
}

export interface UserFormData {
  name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  plant_id: string;
  status: UserStatus;
}

export interface RoleFormData {
  name: string;
  display_name: string;
  description?: string;
  plant_id?: string;
}

export interface BulkUserAction {
  userIds: string[];
  action: 'activate' | 'deactivate' | 'delete' | 'assign_role' | 'remove_role';
  roleId?: string;
}

export interface UserStatistics {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  suspended: number;
  byRole: { [roleName: string]: number };
  byDepartment: { [department: string]: number };
}

export interface RegistrationRequestFilters {
  status?: 'pending' | 'approved' | 'rejected';
  plant_id?: string;
  requested_role?: string;
  date_from?: string;
  date_to?: string;
}

// Re-export specific types from auth
export type {
  User,
  Role,
  Permission,
  UserRoleAssignment,
  UserRegistrationRequest,
  PermissionAuditLog,
  UserPermissions,
  UserStatus,
  RegisterCredentials,
  UserManagementService,
  RoleManagementService,
  UserRegistrationService
} from '../auth/types';