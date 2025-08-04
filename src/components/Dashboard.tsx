'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Card, ThemeToggle } from '@/components/ui'
import { Navigation } from '@/components/Navigation'
import { EquipmentStatusMonitor, EquipmentManagement } from '@/components/equipment'
import { UserManagement } from '@/components/admin/UserManagement'
import { BreakdownPage } from '@/components/breakdown'
import { RepairPage } from '@/components/repair'

export function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')
  
  // 오프라인 모드 체크
  const isOfflineMode = process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true'

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
              <Card hover className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg border-l-4 border-l-red-500">
                <Card.Content className="text-center py-8" onClick={() => setCurrentPage('breakdown')}>
                  <div className="text-5xl mb-4 animate-pulse">🚨</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    고장 신고
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    설비 고장을 즉시 신고하고<br/>빠른 조치를 요청하세요
                  </p>
                  <Button size="sm" className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors">
                    ⚡ 긴급 신고
                  </Button>
                </Card.Content>
              </Card>

              <Card hover className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg border-l-4 border-l-green-500">
                <Card.Content className="text-center py-8" onClick={() => setCurrentPage('repair')}>
                  <div className="text-5xl mb-4">🔧</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    수리 완료
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    완료된 수리 작업을<br/>시스템에 등록하세요
                  </p>
                  <Button variant="secondary" size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors">
                    ✅ 완료 등록
                  </Button>
                </Card.Content>
              </Card>

              <Card hover className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg border-l-4 border-l-blue-500">
                <Card.Content className="text-center py-8" onClick={() => setCurrentPage('equipment')}>
                  <div className="text-5xl mb-4">⚙️</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    설비 관리
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    전체 설비 현황을<br/>한눈에 확인하세요
                  </p>
                  <Button variant="info" size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors">
                    📋 현황 보기
                  </Button>
                </Card.Content>
              </Card>

              <Card hover className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg border-l-4 border-l-purple-500">
                <Card.Content className="text-center py-8" onClick={() => setCurrentPage('statistics')}>
                  <div className="text-5xl mb-4">📊</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    통계 분석
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    설비 가동률과 성능을<br/>데이터로 분석하세요
                  </p>
                  <Button variant="warning" size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors">
                    📈 분석 보기
                  </Button>
                </Card.Content>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-white text-xl">📈</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">가동률</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">오늘 평균</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">87.5%</div>
                      <div className="text-sm text-green-600 dark:text-green-400 flex items-center">
                        ↗️ +2.3%
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '87.5%' }}></div>
                  </div>
                </Card.Content>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-white text-xl">⚡</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">효율성</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">품질 지수</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">94.2%</div>
                      <div className="text-sm text-green-600 dark:text-green-400 flex items-center">
                        ↗️ +1.8%
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '94.2%' }}></div>
                  </div>
                </Card.Content>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-white text-xl">🛠️</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">정비율</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">이번 주</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">12건</div>
                      <div className="text-sm text-red-600 dark:text-red-400 flex items-center">
                        ↗️ +4건
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>예방: 8건</span>
                    <span>사후: 3건</span>
                    <span>긴급: 1건</span>
                  </div>
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
              <Card className="shadow-lg">
                <Card.Header className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                        <span className="mr-2">📋</span> 최근 활동
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">실시간 시스템 활동 현황</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">실시간</span>
                    </div>
                  </div>
                </Card.Header>
                <Card.Content className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border-l-4 border-red-500 hover:shadow-md transition-shadow">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-red-600 dark:text-red-400 text-lg">🚨</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            CNC-LT-001 긴급 고장 신고
                          </p>
                          <span className="px-2 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 text-xs font-medium rounded-full">긴급</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          신고자: 김기술자 (생산1팀) · 스핀들 베어링 이상소음 및 진동 발생
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>📍 1공장 B라인</span>
                          <span>⏰ 2시간 전 (13:45)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-l-4 border-green-500 hover:shadow-md transition-shadow">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-green-600 dark:text-green-400 text-lg">✅</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            CNC-ML-001 정기 정비 완료
                          </p>
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">완료</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          담당자: 박정비사 (정비팀) · 오일 교체, 필터 청소, 정밀도 점검 완료
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>💰 비용: 85,000원</span>
                          <span>⏰ 4시간 전 (11:30)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-blue-600 dark:text-blue-400 text-lg">🔧</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            CNC-DR-001 수리 작업 진행중
                          </p>
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">진행중</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          담당자: 이수리기사 (정비팀) · 드릴 척 교체 및 제어 시스템 점검
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>⏱️ 예상 완료: 16:30</span>
                          <span>⏰ 6시간 전 (09:15)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border-l-4 border-yellow-500 hover:shadow-md transition-shadow">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            CNC-GR-001 정비 일정 임박
                          </p>
                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs font-medium rounded-full">알림</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          예정일: 내일 (1월 16일) · 정기 예방 정비 및 부품 교체 예정
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>👨‍🔧 담당: 최정비사</span>
                          <span>📅 D-1</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span> 긴급: 1건</span>
                      <span className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span> 진행중: 1건</span>
                      <span className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> 완료: 1건</span>
                    </div>
                    <Button variant="secondary" size="sm" className="hover:shadow-md transition-shadow">
                      📊 전체 활동 보기
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            </div>
          </>
        )
      
      case 'equipment':
        return <EquipmentManagement />
      
      case 'breakdown':
        return <BreakdownPage />
      
      case 'repair':
        return <RepairPage />
      
      case 'statistics':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">통계</h2>
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
        return <UserManagement />
      
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                CNC 설비 관리 시스템
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                실시간 설비 고장 관리 및 수리 내역 추적
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* 오프라인 모드일 때는 간단한 표시만 */}
              {isOfflineMode ? (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    개발 모드
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    오프라인 (데모)
                  </p>
                </div>
              ) : (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {profile?.full_name || user?.email}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {profile?.role === 'system_admin' && '시스템 관리자'}
                    {profile?.role === 'manager' && '관리자'}
                    {profile?.role === 'user' && '일반 사용자'}
                  </p>
                </div>
              )}
              <ThemeToggle />
              {/* 오프라인 모드가 아닐 때만 로그아웃 버튼 표시 */}
              {!isOfflineMode && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSignOut}
                >
                  로그아웃
                </Button>
              )}
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