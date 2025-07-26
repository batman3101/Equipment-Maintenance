'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  AlertTriangle, 
  Settings, 
  LogOut,
  Menu,
  X,
  Wrench,
  Cog,
  Users,
  Shield,
  UserCheck
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/domains/auth/hooks/use-auth';
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';
import { PermissionGuard } from '@/domains/user-management/components/PermissionGuard';

const navigationItems = [
  {
    name: '대시보드',
    href: '/',
    icon: Home,
    permissions: [], // 모든 사용자
  },
  {
    name: '고장 관리',
    href: '/breakdowns',
    icon: AlertTriangle,
    permissions: ['breakdowns:read'],
  },
  {
    name: '설비 관리',
    href: '/equipment',
    icon: Wrench,
    permissions: ['equipment:read'],
  },
  {
    name: '설정',
    href: '/settings',
    icon: Settings,
    permissions: ['settings:read'],
  },
];

const adminMenuItems = [
  {
    name: '사용자 관리',
    href: '/admin/users',
    icon: Users,
    permissions: ['users:read'],
  },
  {
    name: '등록 요청',
    href: '/admin/user-requests',
    icon: UserCheck,
    permissions: ['users:approve'],
  },
  {
    name: '권한 관리',
    href: '/admin/permissions',
    icon: Shield,
    permissions: ['roles:read', 'permissions:assign'],
    requireAll: false,
  },
];

// 네비게이션 아이템 렌더링 함수
function NavigationItem({ item, pathname, isMobile = false, onMobileClick }: {
  item: typeof navigationItems[0] & { requireAll?: boolean };
  pathname: string;
  isMobile?: boolean;
  onMobileClick?: () => void;
}) {
  const isActive = pathname === item.href;
  const Icon = item.icon;

  const linkContent = (
    <Link
      href={item.href}
      className={
        isMobile
          ? `block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200 ${
              isActive
                ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-500 text-blue-700 dark:text-blue-300'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
            }`
          : `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
              isActive
                ? 'border-blue-500 text-gray-900 dark:text-white'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
            }`
      }
      onClick={onMobileClick}
    >
      <div className={`flex items-center ${isMobile ? '' : ''}`}>
        <Icon className={`${isMobile ? 'h-5 w-5 mr-3' : 'h-4 w-4 mr-2'}`} />
        {item.name}
      </div>
    </Link>
  );

  // 권한이 없으면 아이템을 표시하지 않음
  if (item.permissions && item.permissions.length > 0) {
    return (
      <PermissionGuard 
        permissions={item.permissions}
        requireAll={item.requireAll}
        fallback={null}
      >
        {linkContent}
      </PermissionGuard>
    );
  }

  return linkContent;
}

export function Navigation() {
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const handleMobileItemClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* 로고 및 데스크톱 네비게이션 */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">CNC 설비 관리</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {/* 일반 메뉴 */}
              {navigationItems.map((item) => (
                <NavigationItem
                  key={item.name}
                  item={item}
                  pathname={pathname}
                />
              ))}
              
              {/* 관리자 메뉴 구분선 */}
              <PermissionGuard 
                permissions={['users:read', 'users:approve', 'roles:read']} 
                requireAll={false}
              >
                <div className="border-l border-gray-300 dark:border-gray-600 h-6 self-center mx-2" />
              </PermissionGuard>
              
              {/* 관리자 메뉴 */}
              {adminMenuItems.map((item) => (
                <NavigationItem
                  key={item.name}
                  item={item}
                  pathname={pathname}
                />
              ))}
            </div>
          </div>

          {/* 데스크톱 테마토글 및 로그아웃 버튼 */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-3">
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              로그아웃
            </button>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="sm:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="pt-2 pb-3 space-y-1">
            {/* 일반 메뉴 */}
            {navigationItems.map((item) => (
              <NavigationItem
                key={item.name}
                item={item}
                pathname={pathname}
                isMobile={true}
                onMobileClick={handleMobileItemClick}
              />
            ))}
            
            {/* 관리자 메뉴 구분선 */}
            <PermissionGuard 
              permissions={['users:read', 'users:approve', 'roles:read']} 
              requireAll={false}
            >
              <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
              <div className="pl-3 pr-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                관리자 메뉴
              </div>
            </PermissionGuard>
            
            {/* 관리자 메뉴 */}
            {adminMenuItems.map((item) => (
              <NavigationItem
                key={item.name}
                item={item}
                pathname={pathname}
                isMobile={true}
                onMobileClick={handleMobileItemClick}
              />
            ))}
            
            {/* 로그아웃 버튼 */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
            <button
              onClick={handleSignOut}
              className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
            >
              <div className="flex items-center">
                <LogOut className="h-5 w-5 mr-3" />
                로그아웃
              </div>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}