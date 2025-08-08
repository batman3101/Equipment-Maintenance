'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui'

interface RealTimeMonitoringProps {
  subOption: string
}

export function RealTimeMonitoring({ subOption }: RealTimeMonitoringProps) {
  const { t } = useTranslation('statistics')

  const renderContent = () => {
    switch (subOption) {
      case 'current-status':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 설비 상태 카드들 */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
              <Card.Content className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">CNC-LT-001</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">1공장 A라인</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">{t('realtime.status.normal')}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('realtime.metrics.operationRate')}</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">94.2%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('realtime.metrics.temperature')}</span>
                    <span className="font-semibold">45°C</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('realtime.metrics.vibration')}</span>
                    <span className="font-semibold">0.2mm/s</span>
                  </div>
                </div>
              </Card.Content>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700">
              <Card.Content className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">CNC-ML-001</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">1공장 B라인</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">{t('realtime.status.warning')}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('realtime.metrics.operationRate')}</span>
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">78.5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('realtime.metrics.temperature')}</span>
                    <span className="font-semibold text-yellow-600">52°C</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('realtime.metrics.vibration')}</span>
                    <span className="font-semibold">0.4mm/s</span>
                  </div>
                </div>
              </Card.Content>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
              <Card.Content className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">CNC-DR-001</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">2공장 C라인</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm text-red-600 dark:text-red-400 font-medium">{t('realtime.status.critical')}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('realtime.metrics.operationRate')}</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">0%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('realtime.metrics.temperature')}</span>
                    <span className="font-semibold text-red-600">85°C</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('realtime.metrics.vibration')}</span>
                    <span className="font-semibold text-red-600">1.2mm/s</span>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>
        )

      case 'real-alarms':
        return (
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('realtime.alarms.title')}</h3>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="flex items-start p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border-l-4 border-red-500">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">🚨</span>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {t('realtime.alarms.messages.emergencyStop', { equipment: 'CNC-DR-001' })}
                      </p>
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 text-xs font-medium rounded-full">{t('realtime.alarms.emergency')}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {t('realtime.alarms.messages.overheat')}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>📍 2공장 C라인</span>
                      <span>⏰ {t('realtime.alarms.timeAgo.realtime')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border-l-4 border-yellow-500">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">⚠️</span>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {t('realtime.alarms.messages.temperatureRise', { equipment: 'CNC-ML-001' })}
                      </p>
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs font-medium rounded-full">{t('realtime.alarms.warning')}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {t('realtime.alarms.messages.tempExceed', { temp: '52' })}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>📍 1공장 B라인</span>
                      <span>⏰ {t('realtime.alarms.timeAgo.minutesAgo', { minutes: '5' })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>
        )

      case 'urgent-equipment':
        return (
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('realtime.urgent.title')}</h3>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-red-800 dark:text-red-200">CNC-DR-001</h4>
                    <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">{t('realtime.urgent.immediateAction')}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {t('realtime.alarms.messages.overheat')}
                  </p>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div>• 온도: 85°C (정상: 45°C 이하)</div>
                    <div>• 진동: 1.2mm/s (정상: 0.5mm/s 이하)</div>
                    <div>• 예상 원인: {t('realtime.urgent.causes.coolantIssue')}</div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">CNC-ML-001</h4>
                    <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">{t('realtime.urgent.inspectionNeeded')}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {t('realtime.alarms.messages.temperatureRise', { equipment: '' })} 및 가동률 저하
                  </p>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div>• 온도: 52°C (정상: 45°C 이하)</div>
                    <div>• 가동률: 78.5% (평균: 87%)</div>
                    <div>• 예상 원인: {t('realtime.urgent.causes.filterCleaning')}</div>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>
        )

      default:
        return (
          <Card>
            <Card.Content className="text-center py-12">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('realtime.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t('realtime.loading')}</p>
            </Card.Content>
          </Card>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('realtime.title')}
        </h3>
        <div className="flex items-center text-sm text-green-600 dark:text-green-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
          {t('realtime.realtimeUpdate')}
        </div>
      </div>
      {renderContent()}
    </div>
  )
}