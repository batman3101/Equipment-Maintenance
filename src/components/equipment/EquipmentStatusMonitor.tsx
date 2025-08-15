'use client'

import React, { useState, useEffect } from 'react'
import { Card, StatusBadge } from '@/components/ui'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { BreakdownStatus } from '@/types/breakdown'

interface Equipment {
  id: string
  equipment_number: string
  equipment_name: string
  category: string
  location: string
  status: 'breakdown' | 'in_progress' | 'reported' | 'assigned'
  urgency: 'low' | 'medium' | 'high' | 'critical'
  lastUpdated: string
  breakdownTitle?: string
  assignedTo?: string
}

const getStatusColor = (status: string): 'success' | 'danger' | 'warning' | 'info' | 'secondary' => {
  switch (status) {
    case 'reported': return 'danger'
    case 'assigned': return 'warning'
    case 'in_progress': return 'info'
    case 'breakdown': return 'danger'
    default: return 'secondary'
  }
}

const getUrgencyColor = (urgency: string): 'success' | 'danger' | 'warning' | 'info' => {
  switch (urgency) {
    case 'low': return 'success'
    case 'medium': return 'warning'
    case 'high': return 'danger'
    case 'critical': return 'danger'
    default: return 'info'
  }
}

const getStatusText = (status: string, t: (key: string) => string) => {
  return t(`breakdown:status.${status}`)
}

interface EquipmentStatusMonitorProps {
  onEquipmentClick?: (equipment: Equipment) => void
}

export function EquipmentStatusMonitor({ onEquipmentClick }: EquipmentStatusMonitorProps) {
  const { t } = useTranslation(['equipment', 'common', 'breakdown'])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  // 수리 완료가 아닌 고장 신고된 설비들을 가져오기
  useEffect(() => {
    const fetchBreakdownEquipment = async () => {
      try {
        setLoading(true)
        
        const { data, error } = await supabase
          .from('breakdown_reports')
          .select(`
            id,
            breakdown_title,
            status,
            priority,
            occurred_at,
            updated_at,
            equipment_info!inner(
              id,
              equipment_number,
              equipment_name,
              category,
              location
            ),
            profiles_assigned:profiles!breakdown_reports_assigned_to_fkey(full_name)
          `)
          .neq('status', BreakdownStatus.COMPLETED) // 수리 완료가 아닌 것들만
          .order('occurred_at', { ascending: false })

        if (error) {
          throw error
        }

        // 설비별로 그룹화하여 최신 고장 신고만 유지
        const equipmentMap = new Map<string, Equipment>()
        
        data?.forEach((item: any) => {
          const equipment = Array.isArray(item.equipment_info) ? item.equipment_info[0] : item.equipment_info
          const assignedProfile = Array.isArray(item.profiles_assigned) ? item.profiles_assigned[0] : item.profiles_assigned
          
          if (equipment && !equipmentMap.has(equipment.id)) {
            equipmentMap.set(equipment.id, {
              id: equipment.id,
              equipment_number: equipment.equipment_number,
              equipment_name: equipment.equipment_name,
              category: equipment.category,
              location: equipment.location || '위치 미지정',
              status: item.status as 'breakdown' | 'in_progress' | 'reported' | 'assigned',
              urgency: (item.priority || 'medium') as 'low' | 'medium' | 'high' | 'critical',
              lastUpdated: item.updated_at || item.occurred_at,
              breakdownTitle: item.breakdown_title,
              assignedTo: assignedProfile?.full_name
            })
          }
        })

        setEquipment(Array.from(equipmentMap.values()))
        setLastUpdated(new Date().toLocaleString())
        setError(null)
      } catch (err) {
        console.error('Error fetching breakdown equipment:', err)
        setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchBreakdownEquipment()
    
    // 30초마다 데이터 새로고침
    const interval = setInterval(fetchBreakdownEquipment, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <Card.Content className="text-center py-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </Card.Content>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <Card.Content className="text-center py-8">
          <div className="text-red-600 mb-2">⚠️ 오류 발생</div>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </Card.Content>
      </Card>
    )
  }

  const categories = ['all', ...Array.from(new Set(equipment.map(eq => eq.category)))]
  const filteredEquipment = selectedCategory === 'all' 
    ? equipment 
    : equipment.filter(eq => eq.category === selectedCategory)

  const statusCounts = equipment.reduce((acc, eq) => {
    acc[eq.status] = (acc[eq.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const urgencyCounts = equipment.reduce((acc, eq) => {
    acc[eq.urgency] = (acc[eq.urgency] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            설비 현황 모니터링
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            수리가 필요한 고장 신고된 설비들 ({equipment.length}대)
          </p>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          마지막 업데이트: {lastUpdated}
        </div>
      </div>

      {/* 상태 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-red-600">
              {statusCounts.reported || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('breakdown:status.reported', '신고됨')}</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-yellow-600">
              {statusCounts.assigned || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('breakdown:status.assigned', '배정됨')}</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-blue-600">
              {statusCounts.in_progress || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('breakdown:status.in_progress', '진행중')}</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-purple-600">
              {urgencyCounts.critical || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('breakdown:urgency.critical', '긴급')}</div>
          </Card.Content>
        </Card>
      </div>

      {/* 필터링 및 설비 목록 */}
      <Card>
        <Card.Header>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white">고장 신고된 설비 목록</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">수리가 필요한 설비들을 확인하세요</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full sm:w-auto rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">모든 카테고리</option>
                {categories.slice(1).map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card.Header>
        
        <Card.Content>
          {equipment.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                수리가 필요한 설비가 없습니다
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                모든 설비가 정상 상태이거나 수리가 완료되었습니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEquipment.map((eq) => (
                <div
                  key={eq.id}
                  onClick={() => onEquipmentClick?.(eq)}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">{eq.equipment_number}</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{eq.equipment_name}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <StatusBadge variant={getStatusColor(eq.status)}>
                        {getStatusText(eq.status, t)}
                      </StatusBadge>
                      <StatusBadge variant={getUrgencyColor(eq.urgency)}>
                        {t(`breakdown:urgency.${eq.urgency}`, eq.urgency)}
                      </StatusBadge>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">위치:</span>
                      <span className="text-gray-900 dark:text-gray-100">{eq.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">카테고리:</span>
                      <span className="text-gray-900 dark:text-gray-100">{eq.category}</span>
                    </div>
                    {eq.assignedTo && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">담당자:</span>
                        <span className="text-gray-900 dark:text-gray-100">{eq.assignedTo}</span>
                      </div>
                    )}
                    {eq.breakdownTitle && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={eq.breakdownTitle}>
                          {eq.breakdownTitle}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    업데이트: {new Date(eq.lastUpdated).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  )
}