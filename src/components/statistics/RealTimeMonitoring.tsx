'use client'

import React from 'react'
import { Card } from '@/components/ui'

interface RealTimeMonitoringProps {
  subOption: string
}

export function RealTimeMonitoring({ subOption }: RealTimeMonitoringProps) {
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
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">정상</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">가동률</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">94.2%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">온도</span>
                    <span className="font-semibold">45°C</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">진동</span>
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
                    <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">주의</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">가동률</span>
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">78.5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">온도</span>
                    <span className="font-semibold text-yellow-600">52°C</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">진동</span>
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
                    <span className="text-sm text-red-600 dark:text-red-400 font-medium">이상</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">가동률</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">0%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">온도</span>
                    <span className="font-semibold text-red-600">85°C</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">진동</span>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">실시간 알람 현황</h3>
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
                        CNC-DR-001 긴급 정지
                      </p>
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 text-xs font-medium rounded-full">긴급</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      스핀들 과열로 인한 자동 정지 발생
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>📍 2공장 C라인</span>
                      <span>⏰ 실시간</span>
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
                        CNC-ML-001 온도 상승
                      </p>
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs font-medium rounded-full">주의</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      설비 온도가 정상 범위를 초과함 (52°C)
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>📍 1공장 B라인</span>
                      <span>⏰ 5분 전</span>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">긴급 조치 필요 설비</h3>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-red-800 dark:text-red-200">CNC-DR-001</h4>
                    <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">즉시 대응</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    스핀들 과열로 인한 자동 정지 상태
                  </p>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div>• 온도: 85°C (정상: 45°C 이하)</div>
                    <div>• 진동: 1.2mm/s (정상: 0.5mm/s 이하)</div>
                    <div>• 예상 원인: 냉각수 순환 이상</div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">CNC-ML-001</h4>
                    <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">점검 필요</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    온도 상승 및 가동률 저하
                  </p>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div>• 온도: 52°C (정상: 45°C 이하)</div>
                    <div>• 가동률: 78.5% (평균: 87%)</div>
                    <div>• 예상 원인: 필터 청소 필요</div>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">실시간 모니터링</h3>
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
          🔥 실시간 모니터링
        </h3>
        <div className="flex items-center text-sm text-green-600 dark:text-green-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
          실시간 업데이트
        </div>
      </div>
      {renderContent()}
    </div>
  )
}