'use client'

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { apiService } from '@/lib/api/unified-api-service'
import { useAsyncOperation } from '@/hooks/useAsyncOperation'
import { useToast } from '@/contexts/ToastContext'

interface RealTimeMonitoringProps {
  subOption: string
}

export function RealTimeMonitoring({ subOption }: RealTimeMonitoringProps) {
  const { t } = useTranslation('statistics')
  const { showError } = useToast()
  
  type Equipment = { id: string; equipment_number: string; equipment_name?: string; location?: string; category?: string; manufacturer?: string; model?: string }
  type EquipmentStatus = { id: string; equipment_id: string; status: 'running' | 'breakdown' | 'standby' | 'maintenance' | 'stopped'; updated_at?: string }
  type Breakdown = { id: string; equipment_id: string; breakdown_title: string; breakdown_description: string; priority: 'low' | 'medium' | 'high' | 'urgent'; occurred_at: string }
  
  type RealTimeData = {
    equipmentData: Equipment[]
    statusData: EquipmentStatus[]
    breakdownData: Breakdown[]
  }

  // 비동기 작업 및 에러 처리
  const asyncFetchData = useAsyncOperation(
    async (): Promise<RealTimeData> => {
      console.log('[RealTimeMonitoring] 실시간 데이터 로드 시작...')

      // 통합 API 서비스를 사용하여 데이터 수집
      const [equipmentResponse, statusResponse, breakdownResponse] = await Promise.all([
        apiService.getEquipments(),
        apiService.getEquipmentStatuses(),
        apiService.getBreakdownReports()
      ])

      console.log('[RealTimeMonitoring] API 응답 상태:', {
        equipment: equipmentResponse.success,
        status: statusResponse.success,
        breakdown: breakdownResponse.success
      })

      // 각 API 응답 검증 및 에러 처리
      if (!equipmentResponse.success) {
        throw new Error(`설비 데이터 로드 실패: ${equipmentResponse.error}`)
      }
      if (!statusResponse.success) {
        throw new Error(`상태 데이터 로드 실패: ${statusResponse.error}`)
      }
      if (!breakdownResponse.success) {
        throw new Error(`고장 신고 데이터 로드 실패: ${breakdownResponse.error}`)
      }

      // 데이터 변환
      const equipments = (equipmentResponse.data || []).map(eq => ({
        id: eq.id,
        equipment_number: eq.equipmentNumber,
        equipment_name: eq.equipmentName,
        location: eq.location || undefined,
        category: eq.category,
        manufacturer: eq.manufacturer || undefined,
        model: eq.model || undefined
      }))

      const statuses = (statusResponse.data || []).map(status => ({
        id: status.id,
        equipment_id: status.equipmentId,
        status: status.status as 'running' | 'breakdown' | 'standby' | 'maintenance' | 'stopped',
        updated_at: status.statusChangedAt
      }))

      // 최근 10건만 가져오기 (고장 신고)
      const breakdowns = (breakdownResponse.data || []).slice(0, 10).map(breakdown => ({
        id: breakdown.id,
        equipment_id: breakdown.equipmentId,
        breakdown_title: breakdown.breakdownTitle,
        breakdown_description: breakdown.breakdownDescription,
        priority: breakdown.priority as 'low' | 'medium' | 'high' | 'urgent',
        occurred_at: breakdown.occurredAt
      }))

      console.log('[RealTimeMonitoring] 데이터 로드 완료:', {
        equipmentCount: equipments.length,
        statusCount: statuses.length,
        breakdownCount: breakdowns.length
      })

      return {
        equipmentData: equipments,
        statusData: statuses,
        breakdownData: breakdowns
      }
    },
    {
      maxRetries: 2,
      retryDelay: 2000,
      componentId: 'real-time-monitoring',
      onSuccess: () => {
        console.log('[RealTimeMonitoring] 실시간 데이터 로드 성공')
      },
      onError: (error) => {
        console.error('[RealTimeMonitoring] 실시간 데이터 로드 실패:', error)
        showError('실시간 모니터링 데이터를 불러오는데 실패했습니다.')
      }
    }
  )

  const data = asyncFetchData.data || { equipmentData: [], statusData: [], breakdownData: [] }
  const loading = asyncFetchData.loading
  const error = asyncFetchData.error

  useEffect(() => {
    asyncFetchData.execute()
    // 실시간 모니터링을 위한 주기적 데이터 가져오기
    const interval = setInterval(() => {
      asyncFetchData.execute()
    }, 30000) // 30초마다 업데이트
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <Card.Content className="text-center py-8">
            <div className="text-gray-500">{t('common:loading')}</div>
          </Card.Content>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <Card.Content className="text-center py-8">
            <div className="text-red-500 mb-4">{error}</div>
            <button 
              onClick={() => asyncFetchData.execute()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {t('common:actions.retry')}
            </button>
          </Card.Content>
        </Card>
      </div>
    )
  }

  const renderContent = () => {
    switch (subOption) {
      case 'current-status':
        return (
          <>
            {data.equipmentData.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🏭</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('realtime.noEquipmentTitle')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('realtime.noEquipmentDescription')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.equipmentData.map((equipment) => {
                  const status = data.statusData.find(s => s.equipment_id === equipment.id)
                  const getStatusStyle = (statusValue: string) => {
                    switch (statusValue) {
                      case 'running':
                        return {
                          cardClass: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700',
                          dotClass: 'bg-green-500',
                          textClass: 'text-green-600 dark:text-green-400'
                        }
                      case 'maintenance':
                        return {
                          cardClass: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700',
                          dotClass: 'bg-blue-500',
                          textClass: 'text-blue-600 dark:text-blue-400'
                        }
                      case 'breakdown':
                        return {
                          cardClass: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700',
                          dotClass: 'bg-red-500',
                          textClass: 'text-red-600 dark:text-red-400'
                        }
                      case 'standby':
                        return {
                          cardClass: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700',
                          dotClass: 'bg-yellow-500',
                          textClass: 'text-yellow-600 dark:text-yellow-400'
                        }
                      default:
                        return {
                          cardClass: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200 dark:border-gray-700',
                          dotClass: 'bg-gray-500',
                          textClass: 'text-gray-600 dark:text-gray-400'
                        }
                    }
                  }
                  
                  const statusStyle = getStatusStyle(status?.status || 'unknown')
                  
                  return (
                    <Card key={equipment.id} className={statusStyle.cardClass}>
                      <Card.Content className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{equipment.equipment_number}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{equipment.location || equipment.equipment_name}</p>
                          </div>
                          <div className="flex items-center">
                            <div className={`w-3 h-3 ${statusStyle.dotClass} rounded-full animate-pulse mr-2`}></div>
                            <span className={`text-sm ${statusStyle.textClass} font-medium`}>
                              {status?.status ? t(`realtime.status.${status.status}`) : t('realtime.status.unknown')}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{t('realtime.metrics.category')}</span>
                            <span className="font-semibold">{equipment.category}</span>
                          </div>
                          {equipment.manufacturer && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">{t('realtime.metrics.manufacturer')}</span>
                              <span className="font-semibold">{equipment.manufacturer}</span>
                            </div>
                          )}
                          {equipment.model && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">{t('realtime.metrics.model')}</span>
                              <span className="font-semibold">{equipment.model}</span>
                            </div>
                          )}
                          {status?.updated_at && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">{t('realtime.metrics.lastUpdate')}</span>
                              <span className="font-semibold">
                                {new Date(status.updated_at).toLocaleTimeString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </Card.Content>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )

      case 'real-alarms':
        return (
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('realtime.alarms.title')}</h3>
            </Card.Header>
            <Card.Content>
              {data.breakdownData.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🔔</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('realtime.alarms.noAlarmsTitle')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('realtime.alarms.noAlarmsDescription')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.breakdownData.map((breakdown) => {
                    const getSeverityStyle = (priority: string) => {
                      switch (priority) {
                        case 'urgent':
                          return { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-500', icon: '🚨', badge: 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200' }
                        case 'high':
                          return { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-500', icon: '⚠️', badge: 'bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200' }
                        case 'medium':
                          return { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-500', icon: '⚡', badge: 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200' }
                        default:
                          return { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-500', icon: 'ℹ️', badge: 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200' }
                      }
                    }
                    
                    const style = getSeverityStyle(breakdown.priority)
                    
                    return (
                      <div key={breakdown.id} className={`flex items-start p-4 ${style.bg} rounded-xl border-l-4 ${style.border}`}>
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">{style.icon}</span>
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {breakdown.breakdown_title}
                            </p>
                            <span className={`px-2 py-1 ${style.badge} text-xs font-medium rounded-full`}>
                              {t(`breakdown:urgency.${breakdown.priority}`)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {breakdown.breakdown_description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>📍 {breakdown.equipment_id}</span>
                            <span>⏰ {new Date(breakdown.occurred_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card.Content>
          </Card>
        )

      case 'urgent-equipment':
        const urgentEquipment = data.statusData.filter(s => s.status === 'breakdown' || s.status === 'maintenance')
        
        return (
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('realtime.urgent.title')}</h3>
            </Card.Header>
            <Card.Content>
              {urgentEquipment.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">✅</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('realtime.urgent.noUrgentTitle')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('realtime.urgent.noUrgentDescription')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {urgentEquipment.map((status) => {
                    const equipment = data.equipmentData.find(e => e.id === status.equipment_id)
                    if (!equipment) return null
                    
                    return (
                      <Card key={status.id} className={status.status === 'breakdown' ? 
                        'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700' :
                        'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700'
                      }>
                        <Card.Content className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{equipment.equipment_number}</h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              status.status === 'breakdown' ? 
                                'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200' :
                                'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                            }`}>
                              {t(`realtime.status.${status.status}`)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{equipment.equipment_name}</p>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            📍 {equipment.location || t('realtime.noLocation')}
                          </div>
                        </Card.Content>
                      </Card>
                    )
                  })}
                </div>
              )}
            </Card.Content>
          </Card>
        )

      default:
        return <div className="text-center py-8 text-gray-500">{t('realtime.selectOption')}</div>
    }
  }

  return (
    <div className="space-y-6">
      {renderContent()}
    </div>
  )
}