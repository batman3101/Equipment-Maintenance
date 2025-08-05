'use client'

import React from 'react'
import { Card } from '@/components/ui'

interface PerformanceAnalysisProps {
  subOption: string
  period: string
}

export function PerformanceAnalysis({ subOption, period }: PerformanceAnalysisProps) {
  const getPeriodLabel = (period: string) => {
    const labels: { [key: string]: string } = {
      daily: '일간',
      weekly: '주간',
      monthly: '월간',
      quarterly: '분기별'
    }
    return labels[period] || '일간'
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
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">전체 평균</h4>
                    <div className="text-2xl">📊</div>
                  </div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">87.5%</div>
                  <p className="text-sm text-green-600 dark:text-green-400">↗️ 전 기간 대비 +2.3%</p>
                </Card.Content>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">최고 가동률</h4>
                    <div className="text-2xl">🏆</div>
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">94.2%</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">CNC-LT-001</p>
                </Card.Content>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">개선 필요</h4>
                    <div className="text-2xl">⚠️</div>
                  </div>
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">72.8%</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">CNC-GR-001</p>
                </Card.Content>
              </Card>
            </div>

            {/* 설비별 가동률 차트 */}
            <Card>
              <Card.Header>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{getPeriodLabel(period)} 설비별 가동률</h4>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  {[
                    { name: 'CNC-LT-001', rate: 94.2, trend: '+1.5%', status: 'excellent' },
                    { name: 'CNC-ML-001', rate: 87.8, trend: '+0.8%', status: 'good' },
                    { name: 'CNC-DR-001', rate: 85.4, trend: '-2.1%', status: 'warning' },
                    { name: 'CNC-GR-001', rate: 72.8, trend: '-5.2%', status: 'poor' }
                  ].map((equipment) => (
                    <div key={equipment.name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <h5 className="font-semibold text-gray-900 dark:text-white">{equipment.name}</h5>
                        <div className="w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${
                              equipment.status === 'excellent' ? 'bg-green-500' :
                              equipment.status === 'good' ? 'bg-blue-500' :
                              equipment.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${equipment.rate}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{equipment.rate}%</div>
                        <div className={`text-sm ${equipment.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {equipment.trend}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">MTBF (평균 고장 간격)</h4>
                </Card.Header>
                <Card.Content>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">168시간</div>
                  <p className="text-sm text-green-600 dark:text-green-400 mb-4">↗️ 전 기간 대비 +12시간</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">CNC-LT-001</span>
                      <span className="font-semibold">245시간</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">CNC-ML-001</span>
                      <span className="font-semibold">189시간</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">CNC-DR-001</span>
                      <span className="font-semibold">142시간</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">CNC-GR-001</span>
                      <span className="font-semibold text-red-600">96시간</span>
                    </div>
                  </div>
                </Card.Content>
              </Card>

              <Card>
                <Card.Header>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">MTTR (평균 수리 시간)</h4>
                </Card.Header>
                <Card.Content>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">2.4시간</div>
                  <p className="text-sm text-green-600 dark:text-green-400 mb-4">↘️ 전 기간 대비 -0.3시간</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">CNC-LT-001</span>
                      <span className="font-semibold text-green-600">1.8시간</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">CNC-ML-001</span>
                      <span className="font-semibold">2.1시간</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">CNC-DR-001</span>
                      <span className="font-semibold">2.9시간</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">CNC-GR-001</span>
                      <span className="font-semibold text-orange-600">3.8시간</span>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            </div>

            {/* 신뢰성 지수 */}
            <Card>
              <Card.Header>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">설비 신뢰성 지수</h4>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: 'CNC-LT-001', reliability: 98.2, color: 'green' },
                    { name: 'CNC-ML-001', reliability: 94.7, color: 'blue' },
                    { name: 'CNC-DR-001', reliability: 89.3, color: 'yellow' },
                    { name: 'CNC-GR-001', reliability: 76.8, color: 'red' }
                  ].map((equipment) => (
                    <div key={equipment.name} className="text-center p-4 border rounded-lg">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-2">{equipment.name}</h5>
                      <div className={`text-2xl font-bold mb-1 ${
                        equipment.color === 'green' ? 'text-green-600' :
                        equipment.color === 'blue' ? 'text-blue-600' :
                        equipment.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {equipment.reliability}%
                      </div>
                      <div className={`w-full h-2 rounded-full ${
                        equipment.color === 'green' ? 'bg-green-200' :
                        equipment.color === 'blue' ? 'bg-blue-200' :
                        equipment.color === 'yellow' ? 'bg-yellow-200' : 'bg-red-200'
                      }`}>
                        <div 
                          className={`h-2 rounded-full ${
                            equipment.color === 'green' ? 'bg-green-500' :
                            equipment.color === 'blue' ? 'bg-blue-500' :
                            equipment.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${equipment.reliability}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
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
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">품질 지수</h4>
                    <div className="text-2xl">💎</div>
                  </div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">94.2%</div>
                  <p className="text-sm text-green-600 dark:text-green-400">↗️ +1.8%</p>
                </Card.Content>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-700">
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">생산량</h4>
                    <div className="text-2xl">📦</div>
                  </div>
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">1,245</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">개 / {getPeriodLabel(period)}</p>
                </Card.Content>
              </Card>

              <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200 dark:border-teal-700">
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">불량률</h4>
                    <div className="text-2xl">⚡</div>
                  </div>
                  <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-2">0.8%</div>
                  <p className="text-sm text-green-600 dark:text-green-400">↘️ -0.2%</p>
                </Card.Content>
              </Card>
            </div>

            {/* 설비별 생산성 비교 */}
            <Card>
              <Card.Header>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">설비별 생산성 분석</h4>
              </Card.Header>
              <Card.Content>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">설비명</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">생산량</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">품질지수</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">불량률</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">효율성</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'CNC-LT-001', production: 425, quality: 97.8, defect: 0.4, efficiency: 'A+' },
                        { name: 'CNC-ML-001', production: 385, quality: 94.2, defect: 0.8, efficiency: 'A' },
                        { name: 'CNC-DR-001', production: 295, quality: 91.5, defect: 1.2, efficiency: 'B+' },
                        { name: 'CNC-GR-001', production: 140, quality: 87.3, defect: 2.1, efficiency: 'C' }
                      ].map((equipment, index) => (
                        <tr key={equipment.name} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}>
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{equipment.name}</td>
                          <td className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">{equipment.production}개</td>
                          <td className="text-center py-3 px-4">
                            <span className={`font-semibold ${
                              equipment.quality >= 95 ? 'text-green-600' :
                              equipment.quality >= 90 ? 'text-blue-600' : 'text-orange-600'
                            }`}>
                              {equipment.quality}%
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className={`font-semibold ${
                              equipment.defect <= 0.5 ? 'text-green-600' :
                              equipment.defect <= 1.0 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {equipment.defect}%
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              equipment.efficiency.startsWith('A') ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200' :
                              equipment.efficiency.startsWith('B') ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200' :
                              'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200'
                            }`}>
                              {equipment.efficiency}
                            </span>
                          </td>
                        </tr>
                      ))}
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">성과 분석</h3>
              <p className="text-gray-600 dark:text-gray-400">선택한 분석 항목의 데이터를 불러오는 중...</p>
            </Card.Content>
          </Card>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          📈 성과 분석 - {getPeriodLabel(period)}
        </h3>
      </div>
      {renderContent()}
    </div>
  )
}