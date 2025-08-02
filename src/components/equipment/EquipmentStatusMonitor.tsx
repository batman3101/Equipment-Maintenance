'use client'

import React, { useState, useEffect } from 'react'
import { Card, StatusBadge } from '@/components/ui'

interface Equipment {
  id: string
  equipment_number: string
  equipment_name: string
  category: string
  location: string
  status: 'running' | 'breakdown' | 'standby' | 'maintenance' | 'stopped'
  lastUpdated: string
}

const mockEquipmentData: Equipment[] = [
  {
    id: '1',
    equipment_number: 'CNC-ML-001',
    equipment_name: 'CNC 밀링머신 #1',
    category: '밀링머신',
    location: '1공장 A라인',
    status: 'running',
    lastUpdated: '2024-01-15 14:30:00'
  },
  {
    id: '2',
    equipment_number: 'CNC-LT-001',
    equipment_name: 'CNC 선반 #1',
    category: '선반',
    location: '1공장 B라인',
    status: 'breakdown',
    lastUpdated: '2024-01-15 13:45:00'
  },
  {
    id: '3',
    equipment_number: 'CNC-DR-001',
    equipment_name: 'CNC 드릴링머신 #1',
    category: '드릴링머신',
    location: '2공장 A라인',
    status: 'standby',
    lastUpdated: '2024-01-15 14:25:00'
  },
  {
    id: '4',
    equipment_number: 'CNC-GR-001',
    equipment_name: 'CNC 그라인딩머신 #1',
    category: '그라인딩머신',
    location: '2공장 B라인',
    status: 'maintenance',
    lastUpdated: '2024-01-15 12:00:00'
  },
  {
    id: '5',
    equipment_number: 'CNC-LC-001',
    equipment_name: 'CNC 레이저커터 #1',
    category: '레이저커터',
    location: '3공장 A라인',
    status: 'running',
    lastUpdated: '2024-01-15 14:35:00'
  }
]

const getStatusColor = (status: string): 'success' | 'danger' | 'warning' | 'info' | 'secondary' => {
  switch (status) {
    case 'running': return 'success'
    case 'breakdown': return 'danger'
    case 'maintenance': return 'warning'
    case 'standby': return 'info'
    case 'stopped': return 'secondary'
    default: return 'secondary'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'running': return '가동중'
    case 'breakdown': return '고장중'
    case 'maintenance': return '정비중'
    case 'standby': return '대기중'
    case 'stopped': return '정지'
    default: return '알 수 없음'
  }
}

interface EquipmentStatusMonitorProps {
  onEquipmentClick?: (equipment: Equipment) => void
}

export function EquipmentStatusMonitor({ onEquipmentClick }: EquipmentStatusMonitorProps) {
  const [equipment] = useState<Equipment[]>(mockEquipmentData)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleString())

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date().toLocaleString())
    }, 30000) // 30초마다 업데이트

    return () => clearInterval(interval)
  }, [])

  const categories = ['all', ...Array.from(new Set(equipment.map(eq => eq.category)))]

  const filteredEquipment = selectedCategory === 'all' 
    ? equipment 
    : equipment.filter(eq => eq.category === selectedCategory)

  const statusCounts = equipment.reduce((acc, eq) => {
    acc[eq.status] = (acc[eq.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* 상태 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-green-600">
              {statusCounts.running || 0}
            </div>
            <div className="text-sm text-black dark:text-black">가동중</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-red-600">
              {statusCounts.breakdown || 0}
            </div>
            <div className="text-sm text-black dark:text-black">고장중</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-yellow-600">
              {statusCounts.maintenance || 0}
            </div>
            <div className="text-sm text-black dark:text-black">정비중</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-blue-600">
              {statusCounts.standby || 0}
            </div>
            <div className="text-sm text-black dark:text-black">대기중</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="text-center py-4">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">
              {statusCounts.stopped || 0}
            </div>
            <div className="text-sm text-black dark:text-black">정지</div>
          </Card.Content>
        </Card>
      </div>

      {/* 필터링 */}
      <Card>
        <Card.Header>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">설비 현황 모니터링</h3>
              <p className="text-sm text-black dark:text-black">최종 업데이트: {lastUpdated}</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full sm:w-auto rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEquipment.map((eq) => (
              <div
                key={eq.id}
                onClick={() => onEquipmentClick?.(eq)}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-black dark:text-black">{eq.equipment_name}</h4>
                    <p className="text-sm font-bold text-black dark:text-black">{eq.equipment_number}</p>
                  </div>
                  <StatusBadge variant={getStatusColor(eq.status)}>
                    {getStatusText(eq.status)}
                  </StatusBadge>
                </div>
                
                <div className="space-y-1 text-sm text-black dark:text-black">
                  <div className="flex justify-between">
                    <span>카테고리:</span>
                    <span>{eq.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>위치:</span>
                    <span>{eq.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>최종 업데이트:</span>
                    <span>{new Date(eq.lastUpdated).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}