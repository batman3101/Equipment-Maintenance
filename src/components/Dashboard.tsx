'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Card } from '@/components/ui'

export function Dashboard() {
  const { user, profile, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                CNC 설비 관리 시스템
              </h1>
              <p className="text-sm text-gray-600">
                실시간 설비 고장 관리 및 수리 내역 추적
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {profile?.full_name || user?.email}
                </p>
                <p className="text-xs text-gray-600">
                  {profile?.role === 'admin' && '시스템 관리자'}
                  {profile?.role === 'manager' && '일반 관리자'}
                  {profile?.role === 'user' && '사용자'}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSignOut}
              >
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 고장 등록 카드 */}
          <Card hover>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">
                고장 등록
              </h3>
              <p className="text-sm text-gray-600">
                새로운 설비 고장을 등록합니다
              </p>
            </Card.Header>
            <Card.Content>
              <Button className="w-full">
                고장 등록하기
              </Button>
            </Card.Content>
          </Card>

          {/* 고장 목록 카드 */}
          <Card hover>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">
                고장 목록
              </h3>
              <p className="text-sm text-gray-600">
                등록된 고장 내역을 조회합니다
              </p>
            </Card.Header>
            <Card.Content>
              <Button variant="secondary" className="w-full">
                목록 보기
              </Button>
            </Card.Content>
          </Card>

          {/* 수리 내역 카드 */}
          <Card hover>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">
                수리 내역
              </h3>
              <p className="text-sm text-gray-600">
                완료된 수리 내역을 확인합니다
              </p>
            </Card.Header>
            <Card.Content>
              <Button variant="secondary" className="w-full">
                내역 보기
              </Button>
            </Card.Content>
          </Card>

          {/* 통계 대시보드 카드 */}
          <Card hover>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">
                통계 대시보드
              </h3>
              <p className="text-sm text-gray-600">
                설비 가동률 및 비용 분석
              </p>
            </Card.Header>
            <Card.Content>
              <Button variant="info" className="w-full">
                통계 보기
              </Button>
            </Card.Content>
          </Card>

          {/* 설비 관리 카드 */}
          <Card hover>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">
                설비 관리
              </h3>
              <p className="text-sm text-gray-600">
                등록된 설비 정보를 관리합니다
              </p>
            </Card.Header>
            <Card.Content>
              <Button variant="secondary" className="w-full">
                설비 관리
              </Button>
            </Card.Content>
          </Card>

          {/* 사용자 관리 카드 (관리자만) */}
          {(profile?.role === 'admin' || profile?.role === 'manager') && (
            <Card hover>
              <Card.Header>
                <h3 className="text-lg font-semibold text-gray-900">
                  사용자 관리
                </h3>
                <p className="text-sm text-gray-600">
                  시스템 사용자를 관리합니다
                </p>
              </Card.Header>
              <Card.Content>
                <Button variant="warning" className="w-full">
                  사용자 관리
                </Button>
              </Card.Content>
            </Card>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <Card.Content>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">0</p>
                <p className="text-sm text-gray-600">진행중인 고장</p>
              </div>
            </Card.Content>
          </Card>
          
          <Card>
            <Card.Content>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">0</p>
                <p className="text-sm text-gray-600">수리중인 설비</p>
              </div>
            </Card.Content>
          </Card>
          
          <Card>
            <Card.Content>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">0</p>
                <p className="text-sm text-gray-600">완료된 수리</p>
              </div>
            </Card.Content>
          </Card>
          
          <Card>
            <Card.Content>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">100%</p>
                <p className="text-sm text-gray-600">전체 가동률</p>
              </div>
            </Card.Content>
          </Card>
        </div>
      </main>
    </div>
  )
}