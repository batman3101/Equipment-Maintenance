'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Card, ThemeToggle } from '@/components/ui'
import { Navigation } from '@/components/Navigation'
import { EquipmentStatusMonitor, EquipmentManagement } from '@/components/equipment'
import { UserManagement } from '@/components/admin/UserManagement'
import { BreakdownPage } from '@/components/breakdown'
import { RepairPage } from '@/components/repair'
import { StatisticsPage } from '@/components/statistics'
import { SystemSettingsPage } from '@/components/settings'
import { TrendChart, DailyStatusCards } from '@/components/dashboard-widgets'

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
            {/* Daily Status Cards */}
            <DailyStatusCards className="mb-8" />

            {/* Trend Analysis Chart */}
            <TrendChart className="mb-8" />



            {/* Performance Metrics - 개선된 버전 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700 shadow-lg">
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-4 shadow-md">
                        <span className="text-white text-xl">📊</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">평균 MTBF</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">이번 달</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">168h</div>
                      <div className="text-sm text-green-600 dark:text-green-400 flex items-center">
                        ↗️ +12h
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div>• 목표: 150h (달성)</div>
                    <div>• 최고: CNC-LT-001 (245h)</div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      💡 <strong>MTBF</strong>는 설비가 고장 없이 연속 운전할 수 있는 평균 시간을 나타냅니다. 높을수록 설비 신뢰성이 우수함을 의미합니다.
                    </p>
                  </div>
                </Card.Content>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700 shadow-lg">
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-4 shadow-md">
                        <span className="text-white text-xl">⚡</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">평균 MTTR</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">수리 시간</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">2.4h</div>
                      <div className="text-sm text-green-600 dark:text-green-400 flex items-center">
                        ↘️ -0.3h
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div>• 목표: 3.0h (달성)</div>
                    <div>• 최단: CNC-LT-001 (1.8h)</div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      💡 <strong>MTTR</strong>은 고장 발생 후 수리 완료까지 걸리는 평균 시간입니다. 낮을수록 신속한 복구 능력을 의미합니다.
                    </p>
                  </div>
                </Card.Content>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700 shadow-lg">
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mr-4 shadow-md">
                        <span className="text-white text-xl">🎯</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">정비 완료율</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">이번 주</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">91.7%</div>
                      <div className="text-sm text-green-600 dark:text-green-400 flex items-center">
                        ↗️ +3.2%
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div>• 완료: 22건 / 계획: 24건</div>
                    <div>• 예방정비 비율: 75%</div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      💡 <strong>정비 완료율</strong>은 계획된 정비 작업 중 실제 완료된 작업의 비율입니다. 높을수록 정비 계획 이행률이 우수함을 의미합니다.
                    </p>
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
        return <StatisticsPage />
      
      case 'users':
        return <UserManagement />
      
      case 'settings':
        return <SystemSettingsPage />
      
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