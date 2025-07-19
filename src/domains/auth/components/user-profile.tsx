'use client';

import { useAuth } from '../hooks/use-auth';
import { LogoutButton } from './logout-button';

// User profile component (SRP - only displays user information)
interface UserProfileProps {
  showLogout?: boolean;
  className?: string;
}

export function UserProfile({ showLogout = true, className = '' }: UserProfileProps) {
  const { authState } = useAuth();

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
      admin: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      engineer: 'bg-green-100 text-green-800',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
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
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {user.email}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
            {getRoleDisplayName(user.role)}
          </span>
          {showLogout && (
            <LogoutButton 
              variant="link" 
              className="text-xs"
              showConfirmation={true}
            />
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
      <span className="text-sm font-medium text-gray-900 truncate max-w-24">
        {user.name}
      </span>
    </div>
  );
}