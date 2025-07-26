// Authentication domain types
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string; // 동적 역할로 변경
  plant_id: string;
  status: UserStatus;
  phone?: string;
  department?: string;
  position?: string;
  last_login_at?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system_role: boolean;
  plant_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  name: string; // resource:action 형태
  display_name: string;
  description?: string;
  module: string;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  granted_by?: string;
  granted_at: string;
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by?: string;
  assigned_at: string;
  expires_at?: string;
  is_active: boolean;
}

export interface UserRegistrationRequest {
  id: string;
  email: string;
  name: string;
  phone?: string;
  department?: string;
  position?: string;
  requested_role: string;
  plant_id: string;
  status: 'pending' | 'approved' | 'rejected';
  verification_token?: string;
  verification_expires_at?: string;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PermissionAuditLog {
  id: string;
  user_id?: string;
  role_id?: string;
  permission_id?: string;
  action: 'granted' | 'revoked' | 'role_assigned' | 'role_removed';
  old_value?: any;
  new_value?: any;
  changed_by?: string;
  reason?: string;
  created_at: string;
}

export interface UserPermissions {
  [key: string]: boolean; // permission_name: has_permission
}

export interface AuthState {
  user: User | null;
  permissions: UserPermissions;
  roles: Role[];
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  name: string;
  phone?: string;
  department?: string;
  position?: string;
  requested_role: string;
  plant_id: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

// Abstract interfaces following ISP
export interface AuthService {
  signIn(credentials: LoginCredentials): Promise<User>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  refreshSession(): Promise<User | null>;
  checkPermission(permission: string): Promise<boolean>;
  getUserPermissions(): Promise<UserPermissions>;
}

export interface SessionManager {
  getSession(): Promise<any>;
  refreshSession(): Promise<any>;
  clearSession(): Promise<void>;
}

export interface UserRepository {
  getUserProfile(userId: string): Promise<User | null>;
  updateUserProfile(userId: string, updates: Partial<User>): Promise<User>;
  getUserPermissions(userId: string): Promise<UserPermissions>;
  getUserRoles(userId: string): Promise<Role[]>;
}

export interface UserManagementService {
  // 사용자 관리
  getUsers(plantId?: string): Promise<User[]>;
  createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  activateUser(userId: string): Promise<User>;
  deactivateUser(userId: string): Promise<User>;
  
  // 사용자 등록 요청 관리
  getRegistrationRequests(status?: string): Promise<UserRegistrationRequest[]>;
  approveRegistration(requestId: string, approvedRole?: string): Promise<User>;
  rejectRegistration(requestId: string, reason: string): Promise<void>;
  
  // 역할 할당
  assignRole(userId: string, roleId: string): Promise<UserRoleAssignment>;
  removeRole(userId: string, roleId: string): Promise<void>;
  getUserRoles(userId: string): Promise<Role[]>;
}

export interface RoleManagementService {
  // 역할 관리
  getRoles(plantId?: string): Promise<Role[]>;
  createRole(roleData: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role>;
  updateRole(roleId: string, updates: Partial<Role>): Promise<Role>;
  deleteRole(roleId: string): Promise<void>;
  
  // 권한 관리
  getPermissions(): Promise<Permission[]>;
  getRolePermissions(roleId: string): Promise<Permission[]>;
  assignPermission(roleId: string, permissionId: string): Promise<void>;
  removePermission(roleId: string, permissionId: string): Promise<void>;
  
  // 권한 매트릭스
  getPermissionMatrix(): Promise<{ [roleId: string]: { [permissionId: string]: boolean } }>;
  updatePermissionMatrix(roleId: string, permissions: { [permissionId: string]: boolean }): Promise<void>;
}

export interface UserRegistrationService {
  // 회원가입 프로세스
  register(credentials: RegisterCredentials): Promise<{ success: boolean; message: string }>;
  verifyEmail(token: string): Promise<{ success: boolean; message: string }>;
  resendVerification(email: string): Promise<{ success: boolean; message: string }>;
}