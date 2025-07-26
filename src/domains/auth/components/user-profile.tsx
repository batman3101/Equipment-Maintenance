'use client';

import { useAuth } from '../hooks/use-auth';

// User profile component (SRP - only displays user information)
interface UserProfileProps {
  showLogout?: boolean;
  className?: string;
}

export function UserProfile({ showLogout = true, className = '' }: UserProfileProps) {
  const { authState, signOut } = useAuth();

  if (!authState.user) {
    return null;
  }

  const { user } = authState;

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      admin: '관리자',
      manager: '매니저',
      engineer: '엔지니어',
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      engineer: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300';
  };

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {user.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
            {getRoleDisplayName(user.role)}
          </span>
          {showLogout && (
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              로그아웃
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact version for mobile headers
export function UserProfileCompact({ className = '' }: { className?: string }) {
  const { authState } = useAuth();

  if (!authState.user) {
    return null;
  }

  const { user } = authState;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
        <span className="text-white font-medium text-xs">
          {user.name.charAt(0).toUpperCase()}
        </span>
      </div>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-24">
        {user.name}
      </span>
    </div>
  );
}