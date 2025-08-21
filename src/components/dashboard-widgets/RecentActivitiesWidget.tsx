'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button } from '@/components/ui'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

interface RecentActivity {
  id: string
  type: 'breakdown' | 'repair' | 'maintenance'
  equipment_number: string
  equipment_name: string
  title: string
  description: string
  status: string
  priority: string
  assignee_name?: string  // reporter_name을 assignee_name으로 변경
  technician_name?: string
  location: string
  occurred_at: string
  cost?: number
}

export function RecentActivitiesWidget() {
  const { t } = useTranslation(['dashboard', 'common'])
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRecentActivities()
  }, [])

  const fetchRecentActivities = async () => {
    try {
      setLoading(true)
      console.log('Fetching recent activities from database...')

      // 고장-수리 통합 이력 뷰를 사용하여 최근 활동 가져오기
      const { data: breakdownRepairHistory, error: historyError } = await supabase
        .from('v_breakdown_repair_history')
        .select('*')
        .order('breakdown_occurred_at', { ascending: false })
        .limit(10)

      if (historyError) {
        console.error('Error fetching breakdown repair history:', historyError)
        throw historyError
      }

      console.log('Breakdown repair history data:', breakdownRepairHistory)

      // 데이터 변환
      const formattedActivities: RecentActivity[] = []

      breakdownRepairHistory?.forEach((item) => {
        // 고장 신고 활동 추가
        formattedActivities.push({
          id: `breakdown_${item.breakdown_id}`,
          type: 'breakdown',
          equipment_number: item.equipment_number,
          equipment_name: item.equipment_name,
          title: item.breakdown_title,
          description: item.breakdown_description?.substring(0, 100) + '...',
          status: item.breakdown_status,
          priority: item.priority,
          assignee_name: item.breakdown_assignee_name, // 담당자 이름으로 변경
          location: item.equipment_category, // 카테고리를 위치로 사용
          occurred_at: item.breakdown_occurred_at,
        })

        // 수리 완료 활동 추가 (있는 경우)
        if (item.repair_id && item.repair_completed_at) {
          formattedActivities.push({
            id: `repair_${item.repair_id}`,
            type: 'repair',
            equipment_number: item.equipment_number,
            equipment_name: item.equipment_name,
            title: item.repair_title,
            description: item.repair_description?.substring(0, 100) + '...',
            status: item.repair_status,
            priority: item.priority,
            technician_name: item.technician_name,
            location: item.equipment_category,
            occurred_at: item.repair_completed_at,
            cost: item.total_cost,
          })
        }
      })

      // 시간 순으로 정렬하고 최대 4개만 표시
      const sortedActivities = formattedActivities
        .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
        .slice(0, 4)

      setActivities(sortedActivities)
      setError(null)
    } catch (err) {
      console.error('Error fetching recent activities:', err)
      setError('최근 활동을 불러오는데 실패했습니다.')
      
      // 에러 시 목 데이터로 대체
      setActivities([
        {
          id: 'mock_1',
          type: 'breakdown',
          equipment_number: 'CC-1',
          equipment_name: 'Chip Cleaning',
          title: 'CC-1 스핀들 센서 오류',
          description: '스핀들 회전 중 이상 진동과 함께 센서 오류 알람이 발생...',
          status: 'reported',
          priority: 'high',
          assignee_name: '김기사',
          location: '스텝 세정기',
          occurred_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2시간 전
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string, status: string) => {
    switch (type) {
      case 'breakdown':
        return status === 'completed' ? '✅' : '🚨'
      case 'repair':
        return status === 'completed' ? '✅' : '🔧'
      case 'maintenance':
        return '⚠️'
      default:
        return '📋'
    }
  }

  const getActivityColor = (type: string, status: string, priority: string) => {
    if (type === 'breakdown' && status !== 'completed') {
      return priority === 'urgent' || priority === 'high' 
        ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
        : 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
    }
    
    if (type === 'repair' && status === 'completed') {
      return 'bg-green-50 dark:bg-green-900/20 border-green-500'
    }

    if (type === 'repair' && status !== 'completed') {
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
    }

    return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
  }

  const getStatusBadgeColor = (status: string, type: string) => {
    if (status === 'completed') {
      return 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
    }
    if (status === 'in_progress') {
      return 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
    }
    if (status === 'reported' && type === 'breakdown') {
      return 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
    }
    return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}시간 전`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}일 전`
    }
  }

  const getActivityStatusText = (type: string, status: string) => {
    if (type === 'breakdown') {
      switch (status) {
        case 'reported': return t('dashboard:activities.types.urgent')
        case 'in_progress': return t('dashboard:activities.types.inProgress')
        case 'completed': return t('dashboard:activities.types.completed')
        default: return status
      }
    } else if (type === 'repair') {
      switch (status) {
        case 'completed': return t('dashboard:activities.types.completed')
        case 'in_progress': return t('dashboard:activities.types.inProgress')
        default: return status
      }
    }
    return status
  }

  if (loading) {
    return (
      <div className="mt-8">
        <Card className="shadow-lg animate-pulse">
          <Card.Content className="p-6">
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </Card.Content>
        </Card>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <Card className="shadow-lg">
        <Card.Header className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <span className="mr-2">📋</span> {t('dashboard:activities.title')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard:activities.subtitle')}</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard:activities.realtime')}</span>
            </div>
          </div>
        </Card.Header>
        <Card.Content className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <span className="text-4xl mb-4 block">📭</span>
                <p>최근 활동이 없습니다.</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div 
                  key={activity.id}
                  className={`flex items-start p-4 rounded-xl border-l-4 hover:shadow-md transition-shadow ${getActivityColor(activity.type, activity.status, activity.priority)}`}
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-lg">{getActivityIcon(activity.type, activity.status)}</span>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {activity.equipment_number} {getActivityStatusText(activity.type, activity.status)}
                      </p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(activity.status, activity.type)}`}>
                        {activity.status === 'completed' 
                          ? t('common:status.completed') 
                          : activity.status === 'in_progress' 
                          ? t('common:status.inProgress')
                          : activity.priority === 'urgent' || activity.priority === 'high'
                          ? t('dashboard:dailyCards.breakdowns.urgent')
                          : activity.status
                        }
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {activity.type === 'breakdown' && activity.assignee_name && (
                        <>
                          담당자: {activity.assignee_name} · {activity.description}
                        </>
                      )}
                      {activity.type === 'repair' && activity.technician_name && (
                        <>
                          {t('dashboard:activities.labels.manager', { name: activity.technician_name, team: '정비팀' })} · {activity.description}
                        </>
                      )}
                      {!activity.assignee_name && !activity.technician_name && activity.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>📍 {activity.location}</span>
                      <div className="flex items-center space-x-2">
                        {activity.cost && (
                          <span>💰 {t('dashboard:activities.labels.cost', { amount: activity.cost.toLocaleString() })}</span>
                        )}
                        <span>⏰ {formatTimeAgo(activity.occurred_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              {activities.length > 0 && (
                <>
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span> 
                    {t('dashboard:activities.summary.urgent', { 
                      count: activities.filter(a => a.type === 'breakdown' && a.status !== 'completed').length 
                    })}
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span> 
                    {t('dashboard:activities.summary.inProgress', { 
                      count: activities.filter(a => a.status === 'in_progress').length 
                    })}
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> 
                    {t('dashboard:activities.summary.completed', { 
                      count: activities.filter(a => a.status === 'completed').length 
                    })}
                  </span>
                </>
              )}
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              className="hover:shadow-md transition-shadow"
              onClick={() => window.location.href = '#breakdown'}
            >
              📊 {t('dashboard:activities.viewAll')}
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}