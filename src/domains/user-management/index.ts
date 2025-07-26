// 사용자 관리 도메인 메인 export 파일

// 타입 exports
export type * from './types';

// 서비스 exports
export {
  createUserManagementService,
  createRoleManagementService,
  createUserRegistrationService
} from './services';

// 컴포넌트 exports
export { UserManagementTable } from './components/UserManagementTable';
export { UserForm } from './components/UserForm';
export { RegistrationRequestsTable } from './components/RegistrationRequestsTable';
export { PermissionMatrix } from './components/PermissionMatrix';
export { PermissionGuard, ProtectedComponent, AdminOnly, ManagerOrAbove } from './components/PermissionGuard';
export { RouteGuard } from './components/RouteGuard';

// 훅 exports
export { usePermissions } from './hooks/usePermissions';