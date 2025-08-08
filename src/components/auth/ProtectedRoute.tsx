'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LoginForm } from './LoginForm'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'system_admin' | 'manager' | 'user'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  // 오프라인 모드 체크
  const isOfflineMode = process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // 오프라인 모드에서는 인증 체크를 건너뛰고 바로 대시보드로
  if (isOfflineMode) {
    console.log('ProtectedRoute: Running in offline mode, bypassing authentication')
    return <>{children}</>
  }

  if (!user || !profile) {
    return <LoginForm />
  }

  if (requiredRole) {
    const roleHierarchy = {
      system_admin: 3,
      manager: 2,
      user: 1
    }

    const userLevel = roleHierarchy[profile.role]
    const requiredLevel = roleHierarchy[requiredRole]

    if (userLevel < requiredLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">접근 권한 없음</h1>
            <p className="text-gray-600">이 페이지에 접근할 권한이 없습니다.</p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}