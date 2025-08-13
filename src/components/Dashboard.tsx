'use client'

import React, { useState, memo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Card, ThemeToggle } from '@/components/ui'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { Navigation } from '@/components/Navigation'
import { EquipmentStatusMonitor, EquipmentManagement } from '@/components/equipment'
import { UserManagement } from '@/components/admin/UserManagement'
import { BreakdownPage } from '@/components/breakdown'
import { RepairPage } from '@/components/repair'
import { StatisticsPage } from '@/components/statistics'
import { SystemSettingsPage } from '@/components/settings'
import { TrendChart, DailyStatusCards } from '@/components/dashboard-widgets'
import { RecentActivitiesWidget } from '@/components/dashboard-widgets/RecentActivitiesWidget'
import { useTranslation } from 'react-i18next'

/**
 * [OCP] Rule: 메모이제이션을 통한 성능 최적화 확장
 * 기존 컴포넌트 로직을 수정하지 않고 성능 개선
 */
function DashboardComponent() {
  const { user, profile, signOut } = useAuth()
  const { t } = useTranslation(['dashboard', 'common', 'admin'])
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

  // 사용자 역할 표시를 사용자 목록의 표기와 동일하게 매핑
  const getRoleDisplay = (role?: string) => {
    switch (role) {
      case 'system_admin':
        return `🔧 ${t('admin:roles.systemAdmin')}`
      case 'manager':
        return `👨‍💼 ${t('admin:roles.manager')}`
      case 'user':
        return `👷‍♂️ ${t('admin:roles.user')}`
      default:
        return ''
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
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('dashboard:metrics.mtbf.title')}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard:metrics.mtbf.period')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{t('dashboard:metrics.mtbf.value')}</div>
                      <div className="text-sm text-green-600 dark:text-green-400 flex items-center">
                        ↗️ {t('dashboard:metrics.mtbf.change')}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div>• {t('dashboard:metrics.mtbf.target')}</div>
                    <div>• {t('dashboard:metrics.mtbf.best')}</div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      💡 <strong>MTBF</strong>: {t('dashboard:metrics.mtbf.description')}
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
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('dashboard:metrics.mttr.title')}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard:metrics.mttr.period')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">{t('dashboard:metrics.mttr.value')}</div>
                      <div className="text-sm text-green-600 dark:text-green-400 flex items-center">
                        ↘️ {t('dashboard:metrics.mttr.change')}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div>• {t('dashboard:metrics.mttr.target')}</div>
                    <div>• {t('dashboard:metrics.mttr.best')}</div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      💡 <strong>MTTR</strong>: {t('dashboard:metrics.mttr.description')}
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
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('dashboard:metrics.completion.title')}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard:metrics.completion.period')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{t('dashboard:metrics.completion.value')}</div>
                      <div className="text-sm text-green-600 dark:text-green-400 flex items-center">
                        ↗️ {t('dashboard:metrics.completion.change')}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div>• {t('dashboard:metrics.completion.details')}</div>
                    <div>• {t('dashboard:metrics.completion.preventive')}</div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      💡 <strong>{t('dashboard:metrics.completion.title')}</strong>: {t('dashboard:metrics.completion.description')}
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

            {/* Recent Activities - Real Database Data */}
            <RecentActivitiesWidget />
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
                {t('dashboard:title')}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('dashboard:subtitle')}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* 오프라인 모드일 때는 간단한 표시만 */}
              {isOfflineMode ? (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {t('dashboard:mode.development')}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    {t('dashboard:mode.offline')}
                  </p>
                </div>
              ) : (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {profile?.full_name || user?.email}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{getRoleDisplay(profile?.role)}</p>
                </div>
              )}
              <LanguageToggle />
              <ThemeToggle />
              {/* 오프라인 모드가 아닐 때만 로그아웃 버튼 표시 */}
              {!isOfflineMode && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSignOut}
                >
                  {t('common:navigation.logout')}
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

// React.memo를 사용한 성능 최적화된 Dashboard 컴포넌트 내보내기
export const Dashboard = memo(DashboardComponent)