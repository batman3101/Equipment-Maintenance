'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui'
import { supabase } from '@/lib/supabase'

interface MaintenanceAnalysisProps {
  subOption: string
  period: string
}

export function MaintenanceAnalysis({ subOption, period }: MaintenanceAnalysisProps) {
  const { t } = useTranslation('statistics')
  type Equipment = { id: string; equipment_number: string; equipment_name?: string; category?: string }
  type Maintenance = { id: string; equipment_id: string; status: 'planned' | 'completed' | 'in_progress' | 'delayed' | 'overdue' }
  type Repair = { id: string; equipment_id: string; repair_completed_at?: string }
  const [equipmentData, setEquipmentData] = useState<Equipment[]>([])
  const [maintenanceData, setMaintenanceData] = useState<Maintenance[]>([])
  const [repairData, setRepairData] = useState<Repair[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 설비 정보, 정비 계획, 수리 내역을 동시에 가져오기
      const [equipmentResult, maintenanceResult, repairResult] = await Promise.all([
        supabase.from('equipment_info').select('*'),
        supabase.from('maintenance_schedules').select('*'),
        supabase.from('repair_reports').select('*')
      ])

      if (equipmentResult.error) throw equipmentResult.error
      if (maintenanceResult.error) throw maintenanceResult.error  
      if (repairResult.error) throw repairResult.error

      setEquipmentData(equipmentResult.data || [])
      setMaintenanceData(maintenanceResult.data || [])
      setRepairData(repairResult.data || [])
    } catch (err) {
      console.error('Error fetching maintenance data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const maintenanceMetrics = useMemo(() => {
    if (!maintenanceData.length) {
      return {
        planned: 0,
        completed: 0,
        inProgress: 0,
        delayed: 0,
        overallRate: 0
      }
    }

    const planned = maintenanceData.length
    const completed = maintenanceData.filter(m => m.status === 'completed').length
    const inProgress = maintenanceData.filter(m => m.status === 'in_progress').length
    const delayed = maintenanceData.filter(m => m.status === 'delayed' || m.status === 'overdue').length
    const overallRate = planned > 0 ? Math.round((completed / planned) * 100 * 10) / 10 : 0

    return { planned, completed, inProgress, delayed, overallRate }
  }, [maintenanceData])
  
  const getPeriodLabel = (period: string) => {
    const labels: { [key: string]: string } = {
      daily: t('periods.daily'),
      weekly: t('periods.weekly'),
      monthly: t('periods.monthly'),
      quarterly: t('periods.quarterly')
    }
    return labels[period] || t('periods.daily')
  }

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
              onClick={fetchData}
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
      case 'schedule-analysis':
        return (
          <div className="space-y-6">
            {/* 정비 일정 요약 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <Card.Content className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{maintenanceMetrics.planned}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('maintenance.schedule.planned')}</div>
                </Card.Content>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                <Card.Content className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{maintenanceMetrics.completed}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('maintenance.schedule.completed')}</div>
                </Card.Content>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
                <Card.Content className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{maintenanceMetrics.inProgress}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('maintenance.schedule.inProgress')}</div>
                </Card.Content>
              </Card>
              <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
                <Card.Content className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{maintenanceMetrics.delayed}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('maintenance.schedule.delayed')}</div>
                </Card.Content>
              </Card>
            </div>

            {/* 정비 계획 준수율 */}
            <Card>
              <Card.Header>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{getPeriodLabel(period)} {t('maintenance.schedule.compliance')}</h4>
              </Card.Header>
              <Card.Content>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('maintenance.schedule.overall')}</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">{maintenanceMetrics.overallRate}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-6">
                  <div className="bg-green-500 h-4 rounded-full" style={{ width: `${maintenanceMetrics.overallRate}%` }}></div>
                </div>

                <div className="space-y-4">
                  {equipmentData.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400">{t('common.noData')}</p>
                    </div>
                  ) : (
                    equipmentData.map((equipment) => {
                      const equipmentMaintenance = maintenanceData.filter(m => m.equipment_id === equipment.id)
                      const planned = equipmentMaintenance.length
                      const completed = equipmentMaintenance.filter(m => m.status === 'completed').length
                      const rate = planned > 0 ? Math.round((completed / planned) * 100 * 10) / 10 : 0
                      
                      return (
                        <div key={equipment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <span className="font-medium text-gray-900 dark:text-white">{equipment.equipment_number}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {t('maintenance.schedule.completedTasks', { completed, planned })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${rate === 100 ? 'bg-green-500' : rate >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(rate, 100)}%` }}
                              ></div>
                            </div>
                            <span className={`text-sm font-semibold ${rate === 100 ? 'text-green-600' : rate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {rate}%
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </Card.Content>
            </Card>

            {/* 예정된 정비 */}
            <Card>
              <Card.Header>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{t('maintenance.schedule.upcoming.title')}</h4>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  {[
                    { equipment: 'CNC-GR-001', type: t('maintenance.schedule.upcoming.types.inspection'), date: '2024-01-16', status: 'pending', priority: 'high' },
                    { equipment: 'CNC-DR-001', type: t('maintenance.schedule.upcoming.types.replacement'), date: '2024-01-18', status: 'scheduled', priority: 'medium' },
                    { equipment: 'CNC-LT-001', type: t('maintenance.schedule.upcoming.types.oilChange'), date: '2024-01-20', status: 'scheduled', priority: 'low' }
                  ].map((task, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          task.priority === 'high' ? 'bg-red-500' :
                          task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{task.equipment}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{task.type}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{task.date}</div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          task.status === 'pending' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                        }`}>
                          {task.status === 'pending' ? t('maintenance.schedule.upcoming.status.pending') : t('maintenance.schedule.upcoming.status.scheduled')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          </div>
        )

      case 'maintenance-type':
        return (
          <div className="space-y-6">
            {/* 정비 유형 비율 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
                <Card.Content className="p-6 text-center">
                  <div className="text-3xl mb-2">🛡️</div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('maintenance.types.preventive')}</h4>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">18{t('common.items')}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('maintenance.types.percentage', { percent: '75' })}</div>
                </Card.Content>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
                <Card.Content className="p-6 text-center">
                  <div className="text-3xl mb-2">🔧</div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('maintenance.types.corrective')}</h4>
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">5{t('common.items')}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('maintenance.types.percentage', { percent: '21' })}</div>
                </Card.Content>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
                <Card.Content className="p-6 text-center">
                  <div className="text-3xl mb-2">🚨</div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('maintenance.types.emergency')}</h4>
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">1{t('common.items')}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('maintenance.types.percentage', { percent: '4' })}</div>
                </Card.Content>
              </Card>
            </div>

            {/* 설비별 정비 유형 분석 */}
            <Card>
              <Card.Header>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{t('maintenance.types.analysis')}</h4>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  {[
                    { name: 'CNC-LT-001', preventive: 5, corrective: 1, emergency: 0 },
                    { name: 'CNC-ML-001', preventive: 4, corrective: 2, emergency: 0 },
                    { name: 'CNC-DR-001', preventive: 5, corrective: 1, emergency: 1 },
                    { name: 'CNC-GR-001', preventive: 4, corrective: 1, emergency: 0 }
                  ].map((equipment) => {
                    const total = equipment.preventive + equipment.corrective + equipment.emergency
                    return (
                      <div key={equipment.name} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-gray-900 dark:text-white">{equipment.name}</h5>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{t('maintenance.types.total', { count: total })}</span>
                        </div>
                        <div className="flex space-x-1 mb-2">
                          <div 
                            className="bg-green-500 h-3 rounded-l"
                            style={{ width: `${(equipment.preventive / total) * 100}%` }}
                          ></div>
                          <div 
                            className="bg-orange-500 h-3"
                            style={{ width: `${(equipment.corrective / total) * 100}%` }}
                          ></div>
                          <div 
                            className="bg-red-500 h-3 rounded-r"
                            style={{ width: `${(equipment.emergency / total) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>{t('maintenance.types.preventive')}: {equipment.preventive}{t('common.items')}</span>
                          <span>{t('maintenance.types.corrective')}: {equipment.corrective}{t('common.items')}</span>
                          <span>{t('maintenance.types.emergency')}: {equipment.emergency}{t('common.items')}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card.Content>
            </Card>

            {/* 정비 유형별 효과 분석 */}
            <Card>
              <Card.Header>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{t('maintenance.types.effect')}</h4>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border border-green-200 dark:border-green-700 rounded-lg">
                    <div className="text-green-600 dark:text-green-400 font-semibold mb-2">{t('maintenance.types.preventive')}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('maintenance.types.averageTime')}</div>
                    <div className="text-xl font-bold text-green-600">1.8{t('common.hours')}</div>
                  </div>
                  <div className="text-center p-4 border border-orange-200 dark:border-orange-700 rounded-lg">
                    <div className="text-orange-600 dark:text-orange-400 font-semibold mb-2">{t('maintenance.types.corrective')}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('maintenance.types.averageTime')}</div>
                    <div className="text-xl font-bold text-orange-600">3.2{t('common.hours')}</div>
                  </div>
                  <div className="text-center p-4 border border-red-200 dark:border-red-700 rounded-lg">
                    <div className="text-red-600 dark:text-red-400 font-semibold mb-2">{t('maintenance.types.emergency')}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('maintenance.types.averageTime')}</div>
                    <div className="text-xl font-bold text-red-600">5.5{t('common.hours')}</div>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>
        )

      case 'team-performance':
        return (
          <div className="space-y-6">
            {/* 정비팀 성과 요약 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <Card.Content className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">24</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('maintenance.team.completedTasks')}</div>
                </Card.Content>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                <Card.Content className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">95.8%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('maintenance.team.completionRate')}</div>
                </Card.Content>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                <Card.Content className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">2.4h</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('maintenance.team.averageTime')}</div>
                </Card.Content>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                <Card.Content className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">98.2%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('maintenance.team.qualityScore')}</div>
                </Card.Content>
              </Card>
            </div>

            {/* 정비팀별 성과 */}
            <Card>
              <Card.Header>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{t('maintenance.team.title')}</h4>
              </Card.Header>
              <Card.Content>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">{t('maintenance.team.title')}</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">{t('maintenance.team.completedTasks')}</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">{t('maintenance.team.averageTime')}</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">{t('maintenance.team.qualityScore')}</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">{t('maintenance.team.specialty')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: '박정비사', completed: 8, avgTime: 2.1, quality: 99.2, specialty: t('maintenance.team.specialtyAreas.cncPrecision') },
                        { name: '이수리기사', completed: 6, avgTime: 2.3, quality: 98.5, specialty: t('maintenance.team.specialtyAreas.drilling') },
                        { name: '최정비사', completed: 7, avgTime: 2.8, quality: 97.8, specialty: t('maintenance.team.specialtyAreas.hydraulic') },
                        { name: '김기술자', completed: 3, avgTime: 1.9, quality: 96.5, specialty: t('maintenance.team.specialtyAreas.electrical') }
                      ].map((technician, index) => (
                        <tr key={technician.name} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}>
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{technician.name}</td>
                          <td className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">{technician.completed}{t('common.items')}</td>
                          <td className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">{technician.avgTime}{t('common.hours')}</td>
                          <td className="text-center py-3 px-4">
                            <span className={`font-semibold ${
                              technician.quality >= 98 ? 'text-green-600' :
                              technician.quality >= 95 ? 'text-blue-600' : 'text-orange-600'
                            }`}>
                              {technician.quality}%
                            </span>
                          </td>
                          <td className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">{technician.specialty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card.Content>
            </Card>

            {/* 기술자별 전문성 분석 */}
            <Card>
              <Card.Header>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{t('maintenance.team.skills')}</h4>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { name: '박정비사', workload: 85, skills: [t('maintenance.team.skillCategories.machining'), t('maintenance.team.skillCategories.measurement'), t('maintenance.team.skillCategories.quality')], rating: 'A+' },
                    { name: '이수리기사', workload: 70, skills: [t('maintenance.team.skillCategories.drilling'), t('maintenance.team.skillCategories.tapping'), t('maintenance.team.skillCategories.boring')], rating: 'A' },
                    { name: '최정비사', workload: 78, skills: [t('maintenance.team.skillCategories.hydraulic'), t('maintenance.team.skillCategories.pneumatic'), t('maintenance.team.skillCategories.cooling')], rating: 'A-' },
                    { name: '김기술자', workload: 45, skills: [t('maintenance.team.skillCategories.electrical'), t('maintenance.team.skillCategories.plc'), t('maintenance.team.skillCategories.sensor')], rating: 'B+' }
                  ].map((tech) => (
                    <div key={tech.name} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-gray-900 dark:text-white">{tech.name}</h5>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          tech.rating.startsWith('A') ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                        }`}>
                          {tech.rating}
                        </span>
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">{t('maintenance.team.workload')}</span>
                          <span className="font-medium">{tech.workload}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              tech.workload >= 80 ? 'bg-red-500' :
                              tech.workload >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${tech.workload}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('maintenance.team.skills')}</div>
                        <div className="flex flex-wrap gap-1">
                          {tech.skills.map((skill) => (
                            <span key={skill} className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          </div>
        )

      default:
        return (
          <Card>
            <Card.Content className="text-center py-12">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('maintenance.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t('maintenance.loading')}</p>
            </Card.Content>
          </Card>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('maintenance.title')} - {getPeriodLabel(period)}
        </h3>
      </div>
      {renderContent()}
    </div>
  )
}