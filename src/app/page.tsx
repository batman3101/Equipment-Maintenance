'use client';

import { ProtectedRoute } from '@/domains/auth/components/protected-route';
import { UserProfile } from '@/domains/auth/components/user-profile';
import { Dashboard } from '@/domains/dashboard';

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <UserProfile />
        </div>
        
        <Dashboard />
      </div>
    </ProtectedRoute>
  );
}
