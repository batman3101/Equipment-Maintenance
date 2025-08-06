'use client'

import React, { useState, useRef } from 'react'
import { Button, Card, Input } from '@/components/ui'
import { useSystemSettings, SystemSettings } from '@/contexts/SystemSettingsContext'
// import { useToast } from '@/contexts/ToastContext' // Available for future use

type SettingsTab = 'general' | 'equipment' | 'breakdown' | 'repair' | 'notifications' | 'data' | 'ui' | 'security'

interface SettingsSectionProps {
  settings: SystemSettings
  updateSettings: (updates: Partial<SystemSettings>) => void
}

export function SystemSettingsPage() {
  const { settings, updateSettings, resetSettings, exportSettings, importSettings, loading } = useSystemSettings()
  // const { showSuccess } = useToast() // Not used yet, but available for future notifications
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tabs = [
    { id: 'general', label: '일반 설정', icon: '⚙️' },
    { id: 'equipment', label: '설비 설정', icon: '🏭' },
    { id: 'breakdown', label: '고장 신고', icon: '🚨' },
    { id: 'repair', label: '수리 관리', icon: '🔧' },
    { id: 'notifications', label: '알림 설정', icon: '🔔' },
    { id: 'data', label: '데이터 설정', icon: '📊' },
    { id: 'ui', label: 'UI 설정', icon: '🎨' },
    { id: 'security', label: '보안 설정', icon: '🔒' }
  ] as const

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        importSettings(content)
      }
    }
    reader.readAsText(file)
    
    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleResetConfirm = () => {
    resetSettings()
    setShowResetConfirm(false)
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">시스템 설정</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            시스템 전반의 설정을 관리하고 커스터마이징할 수 있습니다
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={exportSettings}
            className="flex items-center space-x-2"
          >
            <span>📤</span>
            <span>설정 내보내기</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2"
          >
            <span>📥</span>
            <span>설정 가져오기</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center space-x-2 text-red-600 hover:text-red-700"
          >
            <span>🔄</span>
            <span>초기화</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportSettings}
            className="hidden"
          />
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`
                whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 설정 내용 */}
      <div className="space-y-6">
        {activeTab === 'general' && <GeneralSettings settings={settings} updateSettings={updateSettings} />}
        {activeTab === 'equipment' && <EquipmentSettings settings={settings} updateSettings={updateSettings} />}
        {activeTab === 'breakdown' && <BreakdownSettings settings={settings} updateSettings={updateSettings} />}
        {activeTab === 'repair' && <RepairSettings settings={settings} updateSettings={updateSettings} />}
        {activeTab === 'notifications' && <NotificationSettings settings={settings} updateSettings={updateSettings} />}
        {activeTab === 'data' && <DataSettings settings={settings} updateSettings={updateSettings} />}
        {activeTab === 'ui' && <UISettings settings={settings} updateSettings={updateSettings} />}
        {activeTab === 'security' && <SecuritySettings settings={settings} updateSettings={updateSettings} />}
      </div>

      {/* 초기화 확인 모달 */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">설정 초기화 확인</h3>
            </Card.Header>
            <Card.Content>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                모든 시스템 설정이 기본값으로 초기화됩니다. 이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowResetConfirm(false)}
                >
                  취소
                </Button>
                <Button
                  onClick={handleResetConfirm}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  초기화
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>
      )}
    </div>
  )
}

// 개별 설정 섹션 컴포넌트들
function GeneralSettings({ settings, updateSettings }: SettingsSectionProps) {
  return (
    <Card>
      <Card.Header>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">일반 설정</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          시스템의 기본 정보와 전반적인 설정을 관리합니다
        </p>
      </Card.Header>
      <Card.Content className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="시스템 이름"
            value={settings.general.systemName}
            onChange={(e) => updateSettings({
              general: { ...settings.general, systemName: e.target.value }
            })}
            placeholder="CNC 설비 관리 시스템"
          />
          <Input
            label="회사명"
            value={settings.general.companyName}
            onChange={(e) => updateSettings({
              general: { ...settings.general, companyName: e.target.value }
            })}
            placeholder="Your Company"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              언어 설정
            </label>
            <select
              value={settings.general.language}
              onChange={(e) => updateSettings({
                general: { ...settings.general, language: e.target.value as 'ko' | 'en' | 'vi' }
              })}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
              <option value="vi">Tiếng Việt</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              시간대
            </label>
            <select
              value={settings.general.timezone}
              onChange={(e) => updateSettings({
                general: { ...settings.general, timezone: e.target.value }
              })}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Asia/Seoul">서울 (UTC+9)</option>
              <option value="Asia/Ho_Chi_Minh">호치민 (UTC+7)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="offlineMode"
            checked={settings.general.offlineMode}
            onChange={(e) => updateSettings({
              general: { ...settings.general, offlineMode: e.target.checked }
            })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="offlineMode" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
            오프라인 모드 (인터넷 연결 없이 사용)
          </label>
        </div>
      </Card.Content>
    </Card>
  )
}

function EquipmentSettings({ settings, updateSettings }: SettingsSectionProps) {
  const [newCategory, setNewCategory] = useState({ value: '', label: '' })
  const [newLocation, setNewLocation] = useState({ value: '', label: '' })

  const addCategory = () => {
    if (newCategory.value && newCategory.label) {
      const categories = [...settings.equipment.categories, newCategory]
      updateSettings({
        equipment: { ...settings.equipment, categories }
      })
      setNewCategory({ value: '', label: '' })
    }
  }

  const removeCategory = (index: number) => {
    const categories = settings.equipment.categories.filter((_, i: number) => i !== index)
    updateSettings({
      equipment: { ...settings.equipment, categories }
    })
  }

  const addLocation = () => {
    if (newLocation.value && newLocation.label) {
      const locations = [...settings.equipment.locations, newLocation]
      updateSettings({
        equipment: { ...settings.equipment, locations }
      })
      setNewLocation({ value: '', label: '' })
    }
  }

  const removeLocation = (index: number) => {
    const locations = settings.equipment.locations.filter((_, i: number) => i !== index)
    updateSettings({
      equipment: { ...settings.equipment, locations }
    })
  }

  return (
    <Card>
      <Card.Header>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">설비 설정</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          설비 종류, 위치, 상태 등의 옵션을 관리합니다
        </p>
      </Card.Header>
      <Card.Content className="space-y-8">
        {/* 설비 종류 */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">설비 종류</h4>
          <div className="space-y-3">
            {settings.equipment.categories.map((category, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">{category.label}</span>
                  <span className="ml-2 text-sm text-gray-500">({category.value})</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => removeCategory(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  ❌
                </Button>
              </div>
            ))}
            
            <div className="flex space-x-2">
              <Input
                placeholder="값 (예: LASER)"
                value={newCategory.value}
                onChange={(e) => setNewCategory(prev => ({ ...prev, value: e.target.value }))}
                className="flex-1"
              />
              <Input
                placeholder="표시명 (예: 레이저 커터)"
                value={newCategory.label}
                onChange={(e) => setNewCategory(prev => ({ ...prev, label: e.target.value }))}
                className="flex-1"
              />
              <Button onClick={addCategory} disabled={!newCategory.value || !newCategory.label}>
                추가
              </Button>
            </div>
          </div>
        </div>

        {/* 설비 위치 */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">설비 위치</h4>
          <div className="space-y-3">
            {settings.equipment.locations.map((location, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">{location.label}</span>
                  <span className="ml-2 text-sm text-gray-500">({location.value})</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => removeLocation(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  ❌
                </Button>
              </div>
            ))}
            
            <div className="flex space-x-2">
              <Input
                placeholder="값 (예: BUILD_C)"
                value={newLocation.value}
                onChange={(e) => setNewLocation(prev => ({ ...prev, value: e.target.value }))}
                className="flex-1"
              />
              <Input
                placeholder="표시명 (예: BUILD C)"
                value={newLocation.label}
                onChange={(e) => setNewLocation(prev => ({ ...prev, label: e.target.value }))}
                className="flex-1"
              />
              <Button onClick={addLocation} disabled={!newLocation.value || !newLocation.label}>
                추가
              </Button>
            </div>
          </div>
        </div>

        {/* 기본 상태 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            기본 설비 상태
          </label>
          <select
            value={settings.equipment.defaultStatus}
            onChange={(e) => updateSettings({
              equipment: { ...settings.equipment, defaultStatus: e.target.value }
            })}
            className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {settings.equipment.statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </Card.Content>
    </Card>
  )
}

function BreakdownSettings({ settings, updateSettings }: SettingsSectionProps) {
  return (
    <Card>
      <Card.Header>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">고장 신고 설정</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          고장 신고 폼과 관련된 설정을 관리합니다
        </p>
      </Card.Header>
      <Card.Content className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            기본 긴급도
          </label>
          <select
            value={settings.breakdown.defaultUrgency}
            onChange={(e) => updateSettings({
              breakdown: { ...settings.breakdown, defaultUrgency: e.target.value }
            })}
            className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {settings.breakdown.urgencyLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoAssignment"
              checked={settings.breakdown.autoAssignment}
              onChange={(e) => updateSettings({
                breakdown: { ...settings.breakdown, autoAssignment: e.target.checked }
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="autoAssignment" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
              자동 담당자 배정
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="requirePhotos"
              checked={settings.breakdown.requirePhotos}
              onChange={(e) => updateSettings({
                breakdown: { ...settings.breakdown, requirePhotos: e.target.checked }
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="requirePhotos" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
              사진 첨부 필수
            </label>
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}

function RepairSettings({ settings, updateSettings }: SettingsSectionProps) {
  return (
    <Card>
      <Card.Header>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">수리 관리 설정</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          수리 작업과 관련된 설정을 관리합니다
        </p>
      </Card.Header>
      <Card.Content className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="최대 작업 시간"
              type="number"
              value={settings.repair.maxTimeSpent.toString()}
              onChange={(e) => updateSettings({
                repair: { ...settings.repair, maxTimeSpent: parseInt(e.target.value) || 24 }
              })}
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              시간 단위
            </label>
            <select
              value={settings.repair.defaultTimeUnit}
              onChange={(e) => updateSettings({
                repair: { ...settings.repair, defaultTimeUnit: e.target.value as 'hours' | 'minutes' }
              })}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="hours">시간</option>
              <option value="minutes">분</option>
            </select>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="requireTestResults"
            checked={settings.repair.requireTestResults}
            onChange={(e) => updateSettings({
              repair: { ...settings.repair, requireTestResults: e.target.checked }
            })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="requireTestResults" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
            테스트 결과 필수 입력
          </label>
        </div>
      </Card.Content>
    </Card>
  )
}

function NotificationSettings({ settings, updateSettings }: SettingsSectionProps) {
  return (
    <Card>
      <Card.Header>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">알림 설정</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          토스트 알림과 관련된 설정을 관리합니다
        </p>
      </Card.Header>
      <Card.Content className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="토스트 표시 시간 (밀리초)"
              type="number"
              value={settings.notifications.toastDuration.toString()}
              onChange={(e) => updateSettings({
                notifications: { ...settings.notifications, toastDuration: parseInt(e.target.value) || 5000 }
              })}
              min="1000"
            />
          </div>

          <div>
            <Input
              label="최대 토스트 개수"
              type="number"
              value={settings.notifications.maxToasts.toString()}
              onChange={(e) => updateSettings({
                notifications: { ...settings.notifications, maxToasts: parseInt(e.target.value) || 5 }
              })}
              min="1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            토스트 위치
          </label>
          <select
            value={settings.notifications.position}
            onChange={(e) => updateSettings({
              notifications: { ...settings.notifications, position: e.target.value as 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' }
            })}
            className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="top-right">우측 상단</option>
            <option value="top-left">좌측 상단</option>
            <option value="bottom-right">우측 하단</option>
            <option value="bottom-left">좌측 하단</option>
          </select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableSound"
              checked={settings.notifications.enableSound}
              onChange={(e) => updateSettings({
                notifications: { ...settings.notifications, enableSound: e.target.checked }
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="enableSound" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
              알림음 활성화
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoHide"
              checked={settings.notifications.autoHide}
              onChange={(e) => updateSettings({
                notifications: { ...settings.notifications, autoHide: e.target.checked }
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="autoHide" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
              자동 숨김
            </label>
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}

function DataSettings({ settings, updateSettings }: SettingsSectionProps) {
  return (
    <Card>
      <Card.Header>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">데이터 설정</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          데이터 표시, 내보내기, 보존과 관련된 설정을 관리합니다
        </p>
      </Card.Header>
      <Card.Content className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="페이지당 항목 수"
              type="number"
              value={settings.data.itemsPerPage.toString()}
              onChange={(e) => updateSettings({
                data: { ...settings.data, itemsPerPage: parseInt(e.target.value) || 10 }
              })}
              min="5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              기본 내보내기 형식
            </label>
            <select
              value={settings.data.exportFormat}
              onChange={(e) => updateSettings({
                data: { ...settings.data, exportFormat: e.target.value as 'json' | 'xlsx' | 'csv' }
              })}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
              <option value="json">JSON (.json)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="자동 저장 간격 (분)"
              type="number"
              value={settings.data.autoSaveInterval.toString()}
              onChange={(e) => updateSettings({
                data: { ...settings.data, autoSaveInterval: parseInt(e.target.value) || 5 }
              })}
              min="1"
              disabled={!settings.data.autoSave}
            />
          </div>

          <div>
            <Input
              label="데이터 보존 기간 (일)"
              type="number"
              value={settings.data.dataRetentionDays.toString()}
              onChange={(e) => updateSettings({
                data: { ...settings.data, dataRetentionDays: parseInt(e.target.value) || 365 }
              })}
              min="30"
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoSave"
            checked={settings.data.autoSave}
            onChange={(e) => updateSettings({
              data: { ...settings.data, autoSave: e.target.checked }
            })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="autoSave" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
            자동 저장 활성화
          </label>
        </div>
      </Card.Content>
    </Card>
  )
}

function UISettings({ settings, updateSettings }: SettingsSectionProps) {
  return (
    <Card>
      <Card.Header>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">UI 설정</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          사용자 인터페이스와 관련된 설정을 관리합니다
        </p>
      </Card.Header>
      <Card.Content className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              테마
            </label>
            <select
              value={settings.ui.theme}
              onChange={(e) => updateSettings({
                ui: { ...settings.ui, theme: e.target.value as 'auto' | 'light' | 'dark' }
              })}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="light">라이트</option>
              <option value="dark">다크</option>
              <option value="auto">자동</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              글자 크기
            </label>
            <select
              value={settings.ui.fontSize}
              onChange={(e) => updateSettings({
                ui: { ...settings.ui, fontSize: e.target.value as 'small' | 'medium' | 'large' }
              })}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="small">작게</option>
              <option value="medium">보통</option>
              <option value="large">크게</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="compactMode"
              checked={settings.ui.compactMode}
              onChange={(e) => updateSettings({
                ui: { ...settings.ui, compactMode: e.target.checked }
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="compactMode" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
              컴팩트 모드 (밀도 높은 레이아웃)
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showHelpTexts"
              checked={settings.ui.showHelpTexts}
              onChange={(e) => updateSettings({
                ui: { ...settings.ui, showHelpTexts: e.target.checked }
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showHelpTexts" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
              도움말 텍스트 표시
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="animationsEnabled"
              checked={settings.ui.animationsEnabled}
              onChange={(e) => updateSettings({
                ui: { ...settings.ui, animationsEnabled: e.target.checked }
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="animationsEnabled" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
              애니메이션 효과 활성화
            </label>
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}

function SecuritySettings({ settings, updateSettings }: SettingsSectionProps) {
  return (
    <Card>
      <Card.Header>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">보안 설정</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          시스템 보안과 관련된 설정을 관리합니다
        </p>
      </Card.Header>
      <Card.Content className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="세션 타임아웃 (분)"
              type="number"
              value={settings.security.sessionTimeout.toString()}
              onChange={(e) => updateSettings({
                security: { ...settings.security, sessionTimeout: parseInt(e.target.value) || 30 }
              })}
              min="5"
            />
          </div>

          <div>
            <Input
              label="최소 비밀번호 길이"
              type="number"
              value={settings.security.passwordMinLength.toString()}
              onChange={(e) => updateSettings({
                security: { ...settings.security, passwordMinLength: parseInt(e.target.value) || 8 }
              })}
              min="6"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="최대 로그인 시도 횟수"
              type="number"
              value={settings.security.maxLoginAttempts.toString()}
              onChange={(e) => updateSettings({
                security: { ...settings.security, maxLoginAttempts: parseInt(e.target.value) || 5 }
              })}
              min="3"
            />
          </div>

          <div>
            <Input
              label="계정 잠금 시간 (분)"
              type="number"
              value={settings.security.lockoutDuration.toString()}
              onChange={(e) => updateSettings({
                security: { ...settings.security, lockoutDuration: parseInt(e.target.value) || 15 }
              })}
              min="5"
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="requireTwoFactor"
            checked={settings.security.requireTwoFactor}
            onChange={(e) => updateSettings({
              security: { ...settings.security, requireTwoFactor: e.target.checked }
            })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="requireTwoFactor" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
            2단계 인증 필수
          </label>
        </div>
      </Card.Content>
    </Card>
  )
}