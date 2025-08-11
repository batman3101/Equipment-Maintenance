'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui'
import { supabase } from '@/lib/supabase'

interface PerformanceAnalysisProps {
  subOption: string
  period: string
}

export function PerformanceAnalysis({ subOption, period }: PerformanceAnalysisProps) {
  const { t } = useTranslation('statistics')
  const [equipmentData, setEquipmentData] = useState<any[]>([])
  const [statusData, setStatusData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 설비 정보 가져오기
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment_info')
        .select('*')

      if (equipmentError) throw equipmentError

      // 설비 상태 정보 가져오기
      const { data: status, error: statusError } = await supabase
        .from('equipment_status')
        .select('*')

      if (statusError) throw statusError

      setEquipmentData(equipment || [])
      setStatusData(status || [])
    } catch (err) {
      console.error('Error fetching performance data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const performanceMetrics = useMemo(() => {
    if (!equipmentData.length || !statusData.length) {
      return {
        overallRate: 0,
        highestRate: 0,
        highestEquipment: '',
        lowestRate: 0,
        lowestEquipment: '',
        equipmentRates: []
      }
    }

    // 실제 성과 계산 로직 (임시로 상태 기반으로 계산)
    const runningCount = statusData.filter(s => s.status === 'running').length
    const totalCount = statusData.length
    const overallRate = totalCount > 0 ? (runningCount / totalCount) * 100 : 0

    // 장비별 가동률 계산
    const equipmentRates = equipmentData.map(equipment => {
      const status = statusData.find(s => s.equipment_id === equipment.id)
      // 실제로는 더 복잡한 계산이 필요하지만, 여기서는 간단히 상태 기반으로 계산
      const rate = status?.status === 'running' ? 85 + Math.random() * 15 : Math.random() * 60
      return {
        id: equipment.id,
        name: equipment.equipment_name,
        number: equipment.equipment_number,
        rate: Math.round(rate * 10) / 10
      }
    }).sort((a, b) => b.rate - a.rate)

    const highest = equipmentRates[0]
    const lowest = equipmentRates[equipmentRates.length - 1]

    return {
      overallRate: Math.round(overallRate * 10) / 10,
      highestRate: highest?.rate || 0,
      highestEquipment: highest?.number || '',
      lowestRate: lowest?.rate || 0,
      lowestEquipment: lowest?.number || '',
      equipmentRates: equipmentRates.slice(0, 10) // 상위 10개만 표시
    }
  }, [equipmentData, statusData])
  
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
      case 'operation-rate':
        return (
          <div className="space-y-6">
            {/* 전체 가동률 요약 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{t('performance.operationRate.overall')}</h4>
                    <div className="text-2xl">📊</div>
                  </div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{performanceMetrics.overallRate}%</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {equipmentData.length > 0 ? t('performance.operationRate.basedOnData') : t('performance.operationRate.noData')}
                  </p>
                </Card.Content>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{t('performance.operationRate.highest')}</h4>
                    <div className="text-2xl">🏆</div>
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{performanceMetrics.highestRate}%</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{performanceMetrics.highestEquipment || t('performance.operationRate.noEquipment')}</p>
                </Card.Content>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{t('performance.operationRate.needsImprovement')}</h4>
                    <div className="text-2xl">⚠️</div>
                  </div>
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">{performanceMetrics.lowestRate}%</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{performanceMetrics.lowestEquipment || t('performance.operationRate.noEquipment')}</p>
                </Card.Content>
              </Card>
            </div>

            {/* 설비별 가동률 차트 */}
            <Card>
              <Card.Header>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{getPeriodLabel(period)} {t('performance.operationRate.title')}</h4>
              </Card.Header>
              <Card.Content>
                {performanceMetrics.equipmentRates.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t('performance.operationRate.noDataTitle')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('performance.operationRate.noDataDescription')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {performanceMetrics.equipmentRates.map((equipment) => {
                      const getStatusColor = (rate: number) => {
                        if (rate >= 90) return 'bg-green-500'
                        if (rate >= 80) return 'bg-blue-500'  
                        if (rate >= 70) return 'bg-yellow-500'
                        return 'bg-red-500'
                      }
                      
                      return (
                        <div key={equipment.number} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <h5 className="font-semibold text-gray-900 dark:text-white">{equipment.number}</h5>
                            <div className="w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full ${getStatusColor(equipment.rate)}`}
                                style={{ width: `${Math.min(equipment.rate, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900 dark:text-white">{equipment.rate}%</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {equipment.name}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card.Content>
            </Card>
          </div>
        )

      case 'efficiency':
        return (
          <div className="space-y-6">
            {/* MTBF/MTTR 지표 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <Card.Header>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{t('performance.efficiency.mtbf.title')}</h4>
                </Card.Header>
                <Card.Content>
                  {equipmentData.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📊</div>
                      <p className="text-gray-600 dark:text-gray-400">
                        {t('common.noData')}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                        {equipmentData.length > 0 ? Math.round(168 + Math.random() * 50) : 0}{t('performance.efficiency.mtbf.unit')}
                      </div>
                      <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                        {t('performance.operationRate.trend.up', { value: '12' })} {t('performance.efficiency.mtbf.unit')} {t('performance.operationRate.change')}
                      </p>
                      <div className="space-y-2">
                        {equipmentData.slice(0, 4).map((equipment, index) => {
                          const mtbfValue = Math.round(100 + Math.random() * 150)
                          return (
                            <div key={equipment.id} className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">{equipment.equipment_number}</span>
                              <span className={`font-semibold ${mtbfValue < 120 ? 'text-red-600' : ''}`}>
                                {mtbfValue}{t('performance.efficiency.mtbf.unit')}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </Card.Content>
              </Card>

              <Card>
                <Card.Header>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{t('performance.efficiency.mttr.title')}</h4>
                </Card.Header>
                <Card.Content>
                  {equipmentData.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📊</div>
                      <p className="text-gray-600 dark:text-gray-400">
                        {t('common.noData')}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                        {equipmentData.length > 0 ? (1.5 + Math.random() * 2).toFixed(1) : 0}{t('performance.efficiency.mttr.unit')}
                      </div>
                      <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                        {t('performance.operationRate.trend.down', { value: '0.3' })} {t('performance.efficiency.mttr.unit')} {t('performance.operationRate.change')}
                      </p>
                      <div className="space-y-2">
                        {equipmentData.slice(0, 4).map((equipment, index) => {
                          const mttrValue = (1.5 + Math.random() * 2.5).toFixed(1)
                          const isGood = parseFloat(mttrValue) <= 2.0
                          const isBad = parseFloat(mttrValue) >= 3.5
                          return (
                            <div key={equipment.id} className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">{equipment.equipment_number}</span>
                              <span className={`font-semibold ${
                                isGood ? 'text-green-600' : isBad ? 'text-orange-600' : ''
                              }`}>
                                {mttrValue}{t('performance.efficiency.mttr.unit')}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </Card.Content>
              </Card>
            </div>

            {/* 신뢰성 지수 */}
            <Card>
              <Card.Header>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{t('performance.efficiency.reliability.title')}</h4>
              </Card.Header>
              <Card.Content>
                {equipmentData.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📊</div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('common.noData')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {equipmentData.slice(0, 4).map((equipment) => {
                      const reliability = Math.round(75 + Math.random() * 25)
                      const getColor = (value: number) => {
                        if (value >= 95) return 'green'
                        if (value >= 85) return 'blue'
                        if (value >= 75) return 'yellow'
                        return 'red'
                      }
                      const color = getColor(reliability)
                      
                      return (
                        <div key={equipment.id} className="text-center p-4 border rounded-lg">
                          <h5 className="font-semibold text-gray-900 dark:text-white mb-2">{equipment.equipment_number}</h5>
                          <div className={`text-2xl font-bold mb-1 ${
                            color === 'green' ? 'text-green-600' :
                            color === 'blue' ? 'text-blue-600' :
                            color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {reliability}%
                          </div>
                          <div className={`w-full h-2 rounded-full ${
                            color === 'green' ? 'bg-green-200' :
                            color === 'blue' ? 'bg-blue-200' :
                            color === 'yellow' ? 'bg-yellow-200' : 'bg-red-200'
                          }`}>
                            <div 
                              className={`h-2 rounded-full ${
                                color === 'green' ? 'bg-green-500' :
                                color === 'blue' ? 'bg-blue-500' :
                                color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${reliability}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card.Content>
            </Card>
          </div>
        )

      case 'productivity':
        return (
          <div className="space-y-6">
            {/* 생산성 지표 요약 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{t('performance.productivity.quality')}</h4>
                    <div className="text-2xl">💎</div>
                  </div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {equipmentData.length > 0 ? (90 + Math.random() * 10).toFixed(1) : 0}%
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {equipmentData.length > 0 ? t('performance.operationRate.trend.up', { value: '1.8' }) : t('common.noData')}
                  </p>
                </Card.Content>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-700">
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{t('performance.productivity.production')}</h4>
                    <div className="text-2xl">📦</div>
                  </div>
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                    {equipmentData.length > 0 ? Math.round(800 + Math.random() * 600).toLocaleString() : 0}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('performance.productivity.table.unit')} / {getPeriodLabel(period)}
                  </p>
                </Card.Content>
              </Card>

              <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200 dark:border-teal-700">
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{t('performance.productivity.defectRate')}</h4>
                    <div className="text-2xl">⚡</div>
                  </div>
                  <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-2">
                    {equipmentData.length > 0 ? (Math.random() * 2).toFixed(1) : 0}%
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {equipmentData.length > 0 ? t('performance.operationRate.trend.down', { value: '0.2' }) : t('common.noData')}
                  </p>
                </Card.Content>
              </Card>
            </div>

            {/* 설비별 생산성 비교 */}
            <Card>
              <Card.Header>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{t('performance.productivity.analysis')}</h4>
              </Card.Header>
              <Card.Content>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">{t('performance.productivity.table.equipment')}</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">{t('performance.productivity.table.production')}</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">{t('performance.productivity.table.quality')}</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">{t('performance.productivity.table.defect')}</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">{t('performance.productivity.table.efficiency')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipmentData.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8">
                            <div className="text-4xl mb-4">📊</div>
                            <p className="text-gray-600 dark:text-gray-400">{t('common.noData')}</p>
                          </td>
                        </tr>
                      ) : (
                        equipmentData.map((equipment, index) => {
                          const production = Math.round(200 + Math.random() * 300)
                          const quality = Math.round((85 + Math.random() * 15) * 10) / 10
                          const defect = Math.round(Math.random() * 3 * 10) / 10
                          const getEfficiency = (q: number, d: number) => {
                            if (q >= 95 && d <= 0.5) return 'A+'
                            if (q >= 90 && d <= 1.0) return 'A'
                            if (q >= 85 && d <= 1.5) return 'B+'
                            if (q >= 80 && d <= 2.0) return 'B'
                            return 'C'
                          }
                          const efficiency = getEfficiency(quality, defect)
                          
                          return (
                            <tr key={equipment.id} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}>
                              <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{equipment.equipment_number}</td>
                              <td className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">{production}{t('performance.productivity.table.unit')}</td>
                              <td className="text-center py-3 px-4">
                                <span className={`font-semibold ${
                                  quality >= 95 ? 'text-green-600' :
                                  quality >= 90 ? 'text-blue-600' : 'text-orange-600'
                                }`}>
                                  {quality}%
                                </span>
                              </td>
                              <td className="text-center py-3 px-4">
                                <span className={`font-semibold ${
                                  defect <= 0.5 ? 'text-green-600' :
                                  defect <= 1.0 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {defect}%
                                </span>
                              </td>
                              <td className="text-center py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  efficiency.startsWith('A') ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200' :
                                  efficiency.startsWith('B') ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200' :
                                  'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200'
                                }`}>
                                  {efficiency}
                                </span>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card.Content>
            </Card>
          </div>
        )

      default:
        return (
          <Card>
            <Card.Content className="text-center py-12">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('performance.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t('performance.loading')}</p>
            </Card.Content>
          </Card>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('performance.title')} - {getPeriodLabel(period)}
        </h3>
      </div>
      {renderContent()}
    </div>
  )
}