'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Card, ThemeToggle } from '@/components/ui'
import { Navigation } from '@/components/Navigation'
import { EquipmentStatusMonitor } from '@/components/equipment/EquipmentStatusMonitor'

export function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <>
            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card hover className="cursor-pointer transform transition-transform hover:scale-105">
                <Card.Content className="text-center py-6">
                  <div className="text-4xl mb-2">🚨</div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    고장 신고
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    설비 고장을 즉시 신고
                  </p>
                  <Button size="sm" className="w-full">
                    신고하기
                  </Button>
                </Card.Content>
              </Card>

              <Card hover className="cursor-pointer transform transition-transform hover:scale-105">
                <Card.Content className="text-center py-6">
                  <div className="text-4xl mb-2">🔧</div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    수리 등록
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    수리 완료 내역 등록
                  </p>
                  <Button variant="secondary" size="sm" className="w-full">
                    등록하기
                  </Button>
                </Card.Content>
              </Card>

              <Card hover className="cursor-pointer transform transition-transform hover:scale-105">
                <Card.Content className="text-center py-6">
                  <div className="text-4xl mb-2">📋</div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    작업 현황
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    진행중인 작업 확인
                  </p>
                  <Button variant="info" size="sm" className="w-full">
                    확인하기
                  </Button>
                </Card.Content>
              </Card>

              <Card hover className="cursor-pointer transform transition-transform hover:scale-105">
                <Card.Content className="text-center py-6">
                  <div className="text-4xl mb-2">📊</div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    통계 보기
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    설비 가동률 분석
                  </p>
                  <Button variant="warning" size="sm" className="w-full">
                    보기
                  </Button>
                </Card.Content>
              </Card>
            </div>

            {/* Equipment Status Monitor */}
            <EquipmentStatusMonitor 
              onEquipmentClick={(equipment) => {
                console.log('Selected equipment:', equipment)
              }}
            />

            {/* Recent Activities */}
            <div className="mt-8">
              <Card>
                <Card.Header>
                  <h3 className="text-lg font-semibold text-foreground">최근 활동</h3>
                  <p className="text-sm text-muted-foreground">최근 24시간 동안의 주요 활동</p>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-4">
                    <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 text-sm">🚨</span>
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          CNC-LT-001 고장 신고
                        </p>
                        <p className="text-xs text-muted-foreground">
                          13:45 · 김기술자 · 스핀들 이상소음 발생
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">2시간 전</div>
                    </div>

                    <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm">✅</span>
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          CNC-ML-001 정비 완료
                        </p>
                        <p className="text-xs text-muted-foreground">
                          11:30 · 박정비사 · 정기 점검 및 오일 교체
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">4시간 전</div>
                    </div>

                    <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">🔧</span>
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          CNC-DR-001 수리 시작
                        </p>
                        <p className="text-xs text-muted-foreground">
                          09:15 · 이수리기사 · 드릴 척 교체 작업
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">6시간 전</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <Button variant="secondary" size="sm">
                      모든 활동 보기
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            </div>
          </>
        )
      
      case 'equipment':
        return (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">설비 관리</h2>
            <Card>
              <Card.Content className="text-center py-12">
                <div className="text-4xl mb-4">⚙️</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">설비 관리 페이지</h3>
                <p className="text-muted-foreground mb-4">설비 정보 관리 기능이 여기에 표시됩니다</p>
                <Button>설비 추가</Button>
              </Card.Content>
            </Card>
          </div>
        )
      
      case 'breakdown':
        return (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">고장 보고</h2>
            <Card>
              <Card.Content className="text-center py-12">
                <div className="text-4xl mb-4">🚨</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">고장 보고 페이지</h3>
                <p className="text-muted-foreground mb-4">고장 신고 및 관리 기능이 여기에 표시됩니다</p>
                <Button>고장 신고</Button>
              </Card.Content>
            </Card>
          </div>
        )
      
      case 'repair':
        return (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">수리 내역</h2>
            <Card>
              <Card.Content className="text-center py-12">
                <div className="text-4xl mb-4">🔧</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">수리 내역 페이지</h3>
                <p className="text-muted-foreground mb-4">수리 완료 보고 기능이 여기에 표시됩니다</p>
                <Button>수리 완료 등록</Button>
              </Card.Content>
            </Card>
          </div>
        )
      
      case 'statistics':
        return (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">통계</h2>
            <Card>
              <Card.Content className="text-center py-12">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">통계 페이지</h3>
                <p className="text-muted-foreground mb-4">각종 통계 및 분석 정보가 여기에 표시됩니다</p>
                <Button>리포트 생성</Button>
              </Card.Content>
            </Card>
          </div>
        )
      
      case 'users':
        return (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">사용자 관리</h2>
            <Card>
              <Card.Content className="text-center py-12">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">사용자 관리 페이지</h3>
                <p className="text-muted-foreground mb-4">사용자 계정 관리 기능이 여기에 표시됩니다</p>
                <Button>사용자 추가</Button>
              </Card.Content>
            </Card>
          </div>
        )
      
      case 'settings':
        return (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">시스템 설정</h2>
            <Card>
              <Card.Content className="text-center py-12">
                <div className="text-4xl mb-4">⚙️</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">시스템 설정 페이지</h3>
                <p className="text-muted-foreground mb-4">시스템 설정 관리 기능이 여기에 표시됩니다</p>
                <Button>설정 수정</Button>
              </Card.Content>
            </Card>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                CNC 설비 관리 시스템
              </h1>
              <p className="text-sm text-muted-foreground">
                실시간 설비 고장 관리 및 수리 내역 추적
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {profile?.full_name || user?.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile?.role === 'admin' && '시스템 관리자'}
                  {profile?.role === 'manager' && '일반 관리자'}
                  {profile?.role === 'user' && '사용자'}
                </p>
              </div>
              <ThemeToggle />
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

      {/* Navigation */}
      <Navigation 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPageContent()}
      </main>
    </div>
  )
}