'use client'

import React from 'react'
import { Card, Button } from '@/components/ui'

interface ComprehensiveReportProps {
  subOption: string
  period: string
}

export function ComprehensiveReport({ subOption, period }: ComprehensiveReportProps) {
  const getPeriodLabel = (period: string) => {
    const labels: { [key: string]: string } = {
      daily: '일간',
      weekly: '주간',
      monthly: '월간',
      quarterly: '분기별'
    }
    return labels[period] || '월간'
  }

  const renderContent = () => {
    switch (subOption) {
      case 'monthly-report':
        return (
          <div className="space-y-6">
            {/* 종합 성과 요약 */}
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getPeriodLabel(period)} 종합 성과 요약
                  </h4>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    📄 PDF 다운로드
                  </Button>
                </div>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                    <div className="text-3xl mb-2">📊</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">87.5%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">평균 가동률</div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">↗️ +2.3%</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                    <div className="text-3xl mb-2">🎯</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">94.2%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">품질 지수</div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">↗️ +1.8%</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
                    <div className="text-3xl mb-2">🔧</div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">24건</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">정비 완료</div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">↗️ +4건</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                    <div className="text-3xl mb-2">⚡</div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">168h</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">평균 MTBF</div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">↗️ +12h</div>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* 주요 성과 지표 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <Card.Header>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">설비별 종합 점수</h4>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-4">
                    {[
                      { name: 'CNC-LT-001', score: 95.8, grade: 'A+', color: 'green' },
                      { name: 'CNC-ML-001', score: 89.2, grade: 'A', color: 'blue' },
                      { name: 'CNC-DR-001', score: 84.7, grade: 'B+', color: 'yellow' },
                      { name: 'CNC-GR-001', score: 72.3, grade: 'C+', color: 'red' }
                    ].map((equipment) => (
                      <div key={equipment.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            equipment.color === 'green' ? 'bg-green-500' :
                            equipment.color === 'blue' ? 'bg-blue-500' :
                            equipment.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="font-medium text-gray-900 dark:text-white">{equipment.name}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900 dark:text-white">{equipment.score}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">점</div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            equipment.grade.startsWith('A') ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200' :
                            equipment.grade.startsWith('B') ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200' :
                            'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200'
                          }`}>
                            {equipment.grade}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Content>
              </Card>

              <Card>
                <Card.Header>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">정비 성과 분석</h4>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300">계획 대비 완료율</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">91.7%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300">평균 수리 시간</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">2.4시간</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300">예방정비 비율</span>
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">75%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300">정비팀 만족도</span>
                      <span className="text-lg font-bold text-orange-600 dark:text-orange-400">4.6/5.0</span>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            </div>

            {/* 주요 이슈 및 개선사항 */}
            <Card>
              <Card.Header>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">주요 이슈 및 해결 현황</h4>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-red-800 dark:text-red-200">CNC-GR-001 반복 고장</h5>
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 text-xs rounded">해결중</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      냉각 시스템 문제로 인한 반복적인 과열 발생
                    </p>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      • 예상 해결일: 2024-01-18 • 담당: 최정비사
                    </div>
                  </div>

                  <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-green-800 dark:text-green-200">정비 계획 시스템 개선</h5>
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded">완료</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      예방 정비 스케줄링 자동화로 효율성 15% 향상
                    </p>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      • 완료일: 2024-01-10 • 효과: 정비 계획 준수율 91.7% 달성
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>
        )

      case 'equipment-detail':
        return (
          <div className="space-y-6">
            {/* 설비 선택 */}
            <Card>
              <Card.Header>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">설비 선택</h4>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {['CNC-LT-001', 'CNC-ML-001', 'CNC-DR-001', 'CNC-GR-001'].map((equipment) => (
                    <button
                      key={equipment}
                      className="p-4 border-2 border-blue-200 dark:border-blue-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                    >
                      <div className="text-center">
                        <div className="text-xl mb-2">⚙️</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{equipment}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card.Content>
            </Card>

            {/* 선택된 설비 상세 분석 (CNC-LT-001 예시) */}
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">CNC-LT-001 상세 분석</h4>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    📊 상세 리포트
                  </Button>
                </div>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 기본 정보 */}
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-3">기본 정보</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">설비명</span>
                        <span className="font-medium">CNC Lathe Machine</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">위치</span>
                        <span className="font-medium">1공장 A라인</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">설치일</span>
                        <span className="font-medium">2020-03-15</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">마지막 정비</span>
                        <span className="font-medium">2024-01-10</span>
                      </div>
                    </div>
                  </div>

                  {/* 성능 지표 */}
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-3">성능 지표</h5>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">가동률</span>
                          <span className="font-medium text-green-600 dark:text-green-400">94.2%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '94.2%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">품질 지수</span>
                          <span className="font-medium text-blue-600 dark:text-blue-400">97.8%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '97.8%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">신뢰성 지수</span>
                          <span className="font-medium text-purple-600 dark:text-purple-400">98.2%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '98.2%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 정비 이력 */}
                <div className="mt-6">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">최근 정비 이력</h5>
                  <div className="space-y-2">
                    {[
                      { date: '2024-01-10', type: '정기 점검', result: '정상', technician: '박정비사' },
                      { date: '2023-12-28', type: '오일 교체', result: '완료', technician: '박정비사' },
                      { date: '2023-12-15', type: '필터 청소', result: '완료', technician: '이수리기사' },
                      { date: '2023-11-30', type: '정밀도 점검', result: '정상', technician: '박정비사' }
                    ].map((maintenance, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-600 dark:text-gray-400">{maintenance.date}</span>
                          <span className="font-medium">{maintenance.type}</span>
                          <span className="text-gray-600 dark:text-gray-400">{maintenance.technician}</span>
                        </div>
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded">
                          {maintenance.result}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>
        )

      case 'improvement':
        return (
          <div className="space-y-6">
            {/* AI 기반 개선 제안 */}
            <Card>
              <Card.Header>
                <div className="flex items-center space-x-2">
                  <div className="text-xl">🤖</div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">AI 기반 개선 제안</h4>
                </div>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 rounded">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-semibold text-red-800 dark:text-red-200">긴급 개선 필요</h5>
                      <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">High</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      CNC-GR-001의 냉각 시스템 교체를 통한 반복 고장 방지
                    </p>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div>• 예상 개선 효과: 가동률 +15%, MTBF +48시간</div>
                      <div>• 우선순위: 1순위</div>
                      <div>• 예상 작업시간: 8시간</div>
                    </div>
                  </div>

                  <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-semibold text-yellow-800 dark:text-yellow-200">예방 정비 주기 최적화</h5>
                      <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded">Medium</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      설비별 사용 패턴 분석을 통한 맞춤형 정비 스케줄 수립
                    </p>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div>• 예상 개선 효과: 정비 효율 +20%, 부품 수명 +30%</div>
                      <div>• 적용 대상: 전체 설비</div>
                      <div>• 시행 기간: 2주</div>
                    </div>
                  </div>

                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-semibold text-blue-800 dark:text-blue-200">정비팀 교육 프로그램</h5>
                      <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">Low</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      신기술 도입 및 전문성 향상을 위한 체계적 교육 실시
                    </p>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div>• 예상 개선 효과: 작업 품질 +10%, 처리 시간 -15%</div>
                      <div>• 대상 인원: 4명</div>
                      <div>• 교육 기간: 4주</div>
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* 개선 효과 예측 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <Card.Header>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">예상 개선 효과</h4>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                      <span className="text-sm text-gray-700 dark:text-gray-300">전체 가동률</span>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">92.3%</div>
                        <div className="text-xs text-green-600 dark:text-green-400">+4.8%p</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <span className="text-sm text-gray-700 dark:text-gray-300">평균 MTBF</span>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">196시간</div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">+28시간</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                      <span className="text-sm text-gray-700 dark:text-gray-300">정비 효율</span>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">96.2%</div>
                        <div className="text-xs text-purple-600 dark:text-purple-400">+4.5%p</div>
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>

              <Card>
                <Card.Header>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">실행 로드맵</h4>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">냉각 시스템 교체</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">1-2주차</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">정비 주기 최적화</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">3-4주차</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">교육 프로그램 실시</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">5-8주차</div>
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            </div>

            {/* 개선 추진 현황 */}
            <Card>
              <Card.Header>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">개선 추진 현황</h4>
              </Card.Header>
              <Card.Content>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">개선 항목</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">진행률</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">담당자</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">예정일</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { item: 'CNC-GR-001 냉각시스템 교체', progress: 25, manager: '최정비사', dueDate: '2024-01-18', status: '진행중' },
                        { item: '예방정비 스케줄 최적화', progress: 80, manager: '박정비사', dueDate: '2024-01-25', status: '진행중' },
                        { item: '정비팀 신기술 교육', progress: 0, manager: '김기술자', dueDate: '2024-02-15', status: '대기' }
                      ].map((improvement, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}>
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{improvement.item}</td>
                          <td className="text-center py-3 px-4">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${improvement.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">{improvement.progress}%</span>
                          </td>
                          <td className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">{improvement.manager}</td>
                          <td className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">{improvement.dueDate}</td>
                          <td className="text-center py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              improvement.status === '진행중' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                            }`}>
                              {improvement.status}
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
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">종합 리포트</h3>
              <p className="text-gray-600 dark:text-gray-400">선택한 리포트 유형의 데이터를 불러오는 중...</p>
            </Card.Content>
          </Card>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          📋 종합 리포트
        </h3>
      </div>
      {renderContent()}
    </div>
  )
}