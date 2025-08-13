'use client'

import React, { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Card, Input } from '@/components/ui'
import { useSystemSettings, SystemSettings } from '@/contexts/SystemSettingsContext'
import { supabase } from '@/lib/supabase'
// import { useI18n } from '@/contexts/I18nContext' // Available for future language switching features
// import { useToast } from '@/contexts/ToastContext' // Available for future use

type SettingsTab = 'general' | 'branding' | 'equipment' | 'breakdown' | 'repair' | 'notifications' | 'data' | 'ui' | 'security'

interface SettingsSectionProps {
  settings: SystemSettings
  updateSettings: (updates: Partial<SystemSettings>) => void
}

export function SystemSettingsPage() {
  const { t } = useTranslation(['settings', 'common'])
  // Note: currentLanguage and changeLanguage from useI18n hook could be used for future language switching features
  // const { currentLanguage, changeLanguage } = useI18n()
  const { settings, updateSettings, resetSettings, exportSettings, importSettings, loading } = useSystemSettings()
  // const { showSuccess } = useToast() // Not used yet, but available for future notifications
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tabs = [
    { id: 'general', label: t('sections.general.title'), icon: '⚙️' },
    { id: 'branding', label: t('sections.branding.title', '브랜딩'), icon: '🎨' },
    { id: 'equipment', label: t('common:equipment.title', '설비 설정'), icon: '🏭' },
    { id: 'breakdown', label: t('common:breakdown.title', '고장 신고'), icon: '🚨' },
    { id: 'repair', label: t('common:repair.title', '수리 관리'), icon: '🔧' },
    { id: 'notifications', label: t('sections.notifications.title'), icon: '🔔' },
    { id: 'data', label: t('common:data.title', '데이터 설정'), icon: '📊' },
    { id: 'ui', label: t('common:ui.title', 'UI 설정'), icon: '🎨' },
    { id: 'security', label: t('common:security.title', '보안 설정'), icon: '🔒' }
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
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('title')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('subtitle')}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={exportSettings}
            className="flex items-center space-x-2"
          >
            <span>📤</span>
            <span>{t('actions.export')}</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2"
          >
            <span>📥</span>
            <span>{t('actions.import')}</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center space-x-2 text-red-600 hover:text-red-700"
          >
            <span>🔄</span>
            <span>{t('actions.reset')}</span>
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
        {activeTab === 'branding' && <BrandingSettings settings={settings} updateSettings={updateSettings} />}
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('actions.reset')} {t('common:confirm', '확인')}</h3>
            </Card.Header>
            <Card.Content>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('common:resetWarning', '모든 시스템 설정이 기본값으로 초기화됩니다. 이 작업은 되돌릴 수 없습니다.')}
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowResetConfirm(false)}
                >
                  {t('common:cancel', '취소')}
                </Button>
                <Button
                  onClick={handleResetConfirm}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {t('actions.reset')}
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
  const { t } = useTranslation(['settings', 'common'])

  return (
    <Card>
      <Card.Header>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('sections.general.title')}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('sections.general.description')}
        </p>
      </Card.Header>
      <Card.Content className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label={t('settings.general.systemName')}
            value={settings.general.systemName}
            onChange={(e) => updateSettings({
              general: { ...settings.general, systemName: e.target.value }
            })}
            placeholder="CNC 설비 관리 시스템"
          />
          <Input
            label={t('common:company', '회사명')}
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
              {t('settings.general.language')}
            </label>
            <select
              value={settings.general.language}
              onChange={(e) => updateSettings({
                general: { ...settings.general, language: e.target.value as 'ko' | 'en' | 'vi' }
              })}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ko">{t('settings.general.languages.korean')}</option>
              <option value="en">English</option>
              <option value="vi">{t('settings.general.languages.vietnamese')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common:timezone', '시간대')}
            </label>
            <select
              value={settings.general.timezone}
              onChange={(e) => updateSettings({
                general: { ...settings.general, timezone: e.target.value }
              })}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Asia/Seoul">{t('common:timezone.seoul', '서울')} (UTC+9)</option>
              <option value="Asia/Ho_Chi_Minh">{t('common:timezone.hochiminh', '호치민')} (UTC+7)</option>
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
            {t('common:offlineMode', '오프라인 모드 (인터넷 연결 없이 사용)')}
          </label>
        </div>
      </Card.Content>
    </Card>
  )
}

function EquipmentSettings({ settings, updateSettings }: SettingsSectionProps) {
  const { t } = useTranslation(['settings', 'common'])
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
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('common:equipment.settings', '설비 설정')}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('common:equipment.settingsDesc', '설비 종류, 위치, 상태 등의 옵션을 관리합니다')}
        </p>
      </Card.Header>
      <Card.Content className="space-y-8">
        {/* 설비 종류 */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('common:equipment.categories', '설비 종류')}</h4>
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
                {t('common:add', '추가')}
              </Button>
            </div>
          </div>
        </div>

        {/* 설비 위치 */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('common:equipment.locations', '설비 위치')}</h4>
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
                {t('common:add', '추가')}
              </Button>
            </div>
          </div>
        </div>

        {/* 기본 상태 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('common:equipment.defaultStatus', '기본 설비 상태')}
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
  const { t } = useTranslation(['settings', 'common'])

  return (
    <Card>
      <Card.Header>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('common:breakdown.settings', '고장 신고 설정')}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('common:breakdown.settingsDesc', '고장 신고 폼과 관련된 설정을 관리합니다')}
        </p>
      </Card.Header>
      <Card.Content className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('common:breakdown.defaultUrgency', '기본 긴급도')}
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
              {t('common:breakdown.autoAssignment', '자동 담당자 배정')}
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
              {t('common:breakdown.requirePhotos', '사진 첨부 필수')}
            </label>
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}

function RepairSettings({ settings, updateSettings }: SettingsSectionProps) {
  const { t } = useTranslation(['settings', 'common'])

  return (
    <Card>
      <Card.Header>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('common:repair.settings', '수리 관리 설정')}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('common:repair.settingsDesc', '수리 작업과 관련된 설정을 관리합니다')}
        </p>
      </Card.Header>
      <Card.Content className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label={t('common:repair.maxTimeSpent', '최대 작업 시간')}
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
              {t('common:repair.timeUnit', '시간 단위')}
            </label>
            <select
              value={settings.repair.defaultTimeUnit}
              onChange={(e) => updateSettings({
                repair: { ...settings.repair, defaultTimeUnit: e.target.value as 'hours' | 'minutes' }
              })}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="hours">{t('common:units.hours', '시간')}</option>
              <option value="minutes">{t('common:units.minutes', '분')}</option>
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
            {t('common:repair.requireTestResults', '테스트 결과 필수 입력')}
          </label>
        </div>
      </Card.Content>
    </Card>
  )
}

function NotificationSettings({ settings, updateSettings }: SettingsSectionProps) {
  const { t } = useTranslation(['settings', 'common'])

  return (
    <Card>
      <Card.Header>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('sections.notifications.title')}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('sections.notifications.description')}
        </p>
      </Card.Header>
      <Card.Content className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label={t('common:notifications.toastDuration', '토스트 표시 시간 (밀리초)')}
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
              label={t('common:notifications.maxToasts', '최대 토스트 개수')}
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
            {t('common:notifications.position', '토스트 위치')}
          </label>
          <select
            value={settings.notifications.position}
            onChange={(e) => updateSettings({
              notifications: { ...settings.notifications, position: e.target.value as 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' }
            })}
            className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="top-right">{t('common:notifications.topRight', '우측 상단')}</option>
            <option value="top-left">{t('common:notifications.topLeft', '좌측 상단')}</option>
            <option value="bottom-right">{t('common:notifications.bottomRight', '우측 하단')}</option>
            <option value="bottom-left">{t('common:notifications.bottomLeft', '좌측 하단')}</option>
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
              {t('common:notifications.enableSound', '알림음 활성화')}
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
              {t('common:notifications.autoHide', '자동 숨김')}
            </label>
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}

function DataSettings({ settings, updateSettings }: SettingsSectionProps) {
  const { t } = useTranslation(['settings', 'common'])

  return (
    <Card>
      <Card.Header>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('common:data.settings', '데이터 설정')}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('common:data.settingsDesc', '데이터 표시, 내보내기, 보존과 관련된 설정을 관리합니다')}
        </p>
      </Card.Header>
      <Card.Content className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label={t('common:data.itemsPerPage', '페이지당 항목 수')}
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
              {t('common:data.exportFormat', '기본 내보내기 형식')}
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
              label={t('common:data.autoSaveInterval', '자동 저장 간격 (분)')}
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
              label={t('common:data.dataRetentionDays', '데이터 보존 기간 (일)')}
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
            {t('common:data.autoSave', '자동 저장 활성화')}
          </label>
        </div>
      </Card.Content>
    </Card>
  )
}

function UISettings({ settings, updateSettings }: SettingsSectionProps) {
  const { t } = useTranslation(['settings', 'common'])

  return (
    <Card>
      <Card.Header>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('common:ui.settings', 'UI 설정')}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('common:ui.settingsDesc', '사용자 인터페이스와 관련된 설정을 관리합니다')}
        </p>
      </Card.Header>
      <Card.Content className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('settings.general.theme')}
            </label>
            <select
              value={settings.ui.theme}
              onChange={(e) => updateSettings({
                ui: { ...settings.ui, theme: e.target.value as 'auto' | 'light' | 'dark' }
              })}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="light">{t('settings.general.themes.light')}</option>
              <option value="dark">{t('settings.general.themes.dark')}</option>
              <option value="auto">{t('common:auto', '자동')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common:ui.fontSize', '글자 크기')}
            </label>
            <select
              value={settings.ui.fontSize}
              onChange={(e) => updateSettings({
                ui: { ...settings.ui, fontSize: e.target.value as 'small' | 'medium' | 'large' }
              })}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="small">{t('common:ui.small', '작게')}</option>
              <option value="medium">{t('common:ui.medium', '보통')}</option>
              <option value="large">{t('common:ui.large', '크게')}</option>
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
              {t('common:ui.compactMode', '컴팩트 모드 (밀도 높은 레이아웃)')}
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
              {t('common:ui.showHelpTexts', '도움말 텍스트 표시')}
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
              {t('common:ui.animationsEnabled', '애니메이션 효과 활성화')}
            </label>
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}

function SecuritySettings({ settings, updateSettings }: SettingsSectionProps) {
  const { t } = useTranslation(['settings', 'common'])

  return (
    <Card>
      <Card.Header>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('common:security.settings', '보안 설정')}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('common:security.settingsDesc', '시스템 보안과 관련된 설정을 관리합니다')}
        </p>
      </Card.Header>
      <Card.Content className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label={t('settings.users.sessionTimeout')}
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
              label={t('common:security.passwordMinLength', '최소 비밀번호 길이')}
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
              label={t('settings.users.maxLoginAttempts')}
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
              label={t('common:security.lockoutDuration', '계정 잠금 시간 (분)')}
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
            {t('settings.users.twoFactorAuth')}
          </label>
        </div>
      </Card.Content>
    </Card>
  )
}

// 브랜딩 설정 컴포넌트
function BrandingSettings({ settings, updateSettings }: SettingsSectionProps) {
  const [uploading, setUploading] = useState({ symbol: false, logo: false })
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')

  const handleImageUpload = async (file: File, type: 'symbol' | 'logo') => {
    try {
      setUploading({ ...uploading, [type]: true })
      setUploadError('')
      setUploadSuccess('')

      // 파일 유효성 검사
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('지원되지 않는 파일 형식입니다. JPG, PNG, WebP 파일만 업로드 가능합니다.')
      }

      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('파일 크기가 너무 큽니다. 5MB 이하의 파일만 업로드 가능합니다.')
      }

      // 파일명 생성 (고유한 이름)
      const fileExt = file.name.split('.').pop()
      const fileName = `branding/${type}_${Date.now()}.${fileExt}`

      // Supabase Storage에 업로드
      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // 공개 URL 가져오기
      const { data: publicUrlData } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName)

      // 설정 업데이트
      updateSettings({
        branding: {
          ...settings.branding,
          [type === 'symbol' ? 'symbolUrl' : 'logoUrl']: publicUrlData.publicUrl
        }
      })

      setUploadSuccess(`${type === 'symbol' ? '심볼' : '로고'} 이미지가 성공적으로 업로드되었습니다.`)
      
      // 로그인 페이지 이미지 업데이트
      updateLoginImage(type, publicUrlData.publicUrl)

    } catch (error) {
      console.error('Image upload error:', error)
      setUploadError(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.')
    } finally {
      setUploading({ ...uploading, [type]: false })
    }
  }

  const updateLoginImage = (type: 'symbol' | 'logo', url: string) => {
    // 로그인 페이지의 이미지를 동적으로 업데이트
    const img = document.getElementById(`login-${type}`) as HTMLImageElement
    const placeholder = document.getElementById(`${type}-placeholder`)
    
    if (img && placeholder) {
      img.src = url
      img.classList.remove('hidden')
      placeholder.classList.add('hidden')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'symbol' | 'logo') => {
    const file = event.target.files?.[0]
    if (file) {
      handleImageUpload(file, type)
    }
    // 파일 인풋 리셋
    event.target.value = ''
  }

  const triggerFileInput = (type: 'symbol' | 'logo') => {
    const fileInput = document.getElementById(`${type}-file-input`) as HTMLInputElement
    if (fileInput) {
      fileInput.click()
    }
  }

  const removeImage = async (type: 'symbol' | 'logo') => {
    try {
      // 설정에서 URL 제거
      updateSettings({
        branding: {
          ...settings.branding,
          [type === 'symbol' ? 'symbolUrl' : 'logoUrl']: null
        }
      })

      // 로그인 페이지에서 이미지 제거
      const img = document.getElementById(`login-${type}`) as HTMLImageElement
      const placeholder = document.getElementById(`${type}-placeholder`)
      
      if (img && placeholder) {
        img.classList.add('hidden')
        placeholder.classList.remove('hidden')
      }

      setUploadSuccess(`${type === 'symbol' ? '심볼' : '로고'} 이미지가 제거되었습니다.`)

    } catch (error) {
      console.error('Remove image error:', error)
      setUploadError('이미지 제거에 실패했습니다.')
    }
  }

  return (
    <Card>
      <Card.Header>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">브랜딩 설정</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          회사 심볼과 로고를 설정하여 로그인 페이지와 시스템 전반에 표시됩니다
        </p>
      </Card.Header>
      <Card.Content className="space-y-6">
        {uploadError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 text-sm">{uploadError}</div>
          </div>
        )}

        {uploadSuccess && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-green-800 text-sm">{uploadSuccess}</div>
          </div>
        )}

        {/* 심볼 업로드 */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">회사 심볼</h4>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
                {settings.branding?.symbolUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={settings.branding.symbolUrl} 
                    alt="Company Symbol" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-400 text-xs text-center px-2">심볼</span>
                )}
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex space-x-2">
                <input
                  id="symbol-file-input"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => handleFileSelect(e, 'symbol')}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={uploading.symbol}
                  onClick={() => triggerFileInput('symbol')}
                >
                  {uploading.symbol ? '업로드 중...' : '📁 파일 선택'}
                </Button>
                {settings.branding?.symbolUrl && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => removeImage('symbol')}
                    className="text-red-600 hover:text-red-700"
                  >
                    🗑️ 제거
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                권장: 정사각형, 최대 5MB, JPG/PNG/WebP
              </p>
            </div>
          </div>
        </div>

        {/* 로고 업로드 */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">회사 로고</h4>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-48 h-16 bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center overflow-hidden px-4">
                {settings.branding?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={settings.branding.logoUrl} 
                    alt="Company Logo" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-400 text-xs text-center">회사 로고</span>
                )}
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex space-x-2">
                <input
                  id="logo-file-input"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => handleFileSelect(e, 'logo')}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={uploading.logo}
                  onClick={() => triggerFileInput('logo')}
                >
                  {uploading.logo ? '업로드 중...' : '📁 파일 선택'}
                </Button>
                {settings.branding?.logoUrl && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => removeImage('logo')}
                    className="text-red-600 hover:text-red-700"
                  >
                    🗑️ 제거
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                권장: 가로형, 최대 5MB, JPG/PNG/WebP
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-blue-400 text-lg mr-2">💡</span>
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">이미지 업로드 안내:</p>
              <ul className="text-xs space-y-1 text-blue-700 dark:text-blue-400">
                <li>• 업로드한 이미지는 로그인 페이지에 즉시 반영됩니다</li>
                <li>• 심볼: 정사각형 비율 권장 (예: 200x200px)</li>
                <li>• 로고: 가로형 비율 권장 (예: 300x100px)</li>
                <li>• 투명 배경 PNG 파일 사용 시 더 자연스러운 표현이 가능합니다</li>
              </ul>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}