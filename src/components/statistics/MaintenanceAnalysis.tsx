'use client'

import React from 'react'
import { Card } from '@/components/ui'

interface MaintenanceAnalysisProps {
  subOption: string
  period: string
}

export function MaintenanceAnalysis({ subOption, period }: MaintenanceAnalysisProps) {
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
      case 'schedule-analysis':
        return (
          <div className="space-y-6">
            {/* 정비 일정 요약 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <Card.Content className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">24</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">계획된 정비</div>
                </Card.Content>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                <Card.Content className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">22</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">완료된 정비</div>
                </Card.Content>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
                <Card.Content className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">1</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">진행 중</div>
                </Card.Content>
              </Card>
              <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
                <Card.Content className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">1</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">지연</div>
                </Card.Content>
              </Card>
            </div>

            {/* 정비 계획 준수율 */}
            <Card>
              <Card.Header>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{getPeriodLabel(period)} 정비 계획 준수율</h4>
              </Card.Header>
              <Card.Content>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">전체 준수율</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">91.7%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-6">
                  <div className="bg-green-500 h-4 rounded-full" style={{ width: '91.7%' }}></div>
                </div>

                <div className="space-y-4">
                  {[
                    { equipment: 'CNC-LT-001', planned: 6, completed: 6, rate: 100 },
                    { equipment: 'CNC-ML-001', planned: 6, completed: 6, rate: 100 },
                    { equipment: 'CNC-DR-001', planned: 6, completed: 5, rate: 83.3 },
                    { equipment: 'CNC-GR-001', planned: 6, completed: 5, rate: 83.3 }
                  ].map((item) => (
                    <div key={item.equipment} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <span className="font-medium text-gray-900 dark:text-white">{item.equipment}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.completed}/{item.planned} 완료
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${item.rate === 100 ? 'bg-green-500' : item.rate >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${item.rate}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-semibold ${item.rate === 100 ? 'text-green-600' : item.rate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {item.rate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>

            {/* 예정된 정비 */}
            <Card>
              <Card.Header>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">예정된 정비 작업</h4>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  {[
                    { equipment: 'CNC-GR-001', type: '정기 점검', date: '2024-01-16', status: 'pending', priority: 'high' },
                    { equipment: 'CNC-DR-001', type: '부품 교체', date: '2024-01-18', status: 'scheduled', priority: 'medium' },
                    { equipment: 'CNC-LT-001', type: '오일 교체', date: '2024-01-20', status: 'scheduled', priority: 'low' }
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
                          {task.status === 'pending' ? '지연' : '예정'}
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
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">예방 정비</h4>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">18건</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">전체의 75%</div>
                </Card.Content>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
                <Card.Content className="p-6 text-center">
                  <div className="text-3xl mb-2">🔧</div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">사후 정비</h4>
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">5건</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">전체의 21%</div>
                </Card.Content>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
                <Card.Content className="p-6 text-center">
                  <div className="text-3xl mb-2">🚨</div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">긴급 정비</h4>
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">1건</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">전체의 4%</div>
                </Card.Content>
              </Card>
            </div>

            {/* 설비별 정비 유형 분석 */}
            <Card>
              <Card.Header>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">설비별 정비 유형 분석</h4>
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
                          <span className="text-sm text-gray-600 dark:text-gray-400">총 {total}건</span>
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
                          <span>예방: {equipment.preventive}건</span>
                          <span>사후: {equipment.corrective}건</span>
                          <span>긴급: {equipment.emergency}건</span>
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
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">정비 유형별 효과 분석</h4>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border border-green-200 dark:border-green-700 rounded-lg">
                    <div className="text-green-600 dark:text-green-400 font-semibold mb-2">예방 정비</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">평균 소요시간</div>
                    <div className="text-xl font-bold text-green-600">1.8시간</div>
                  </div>
                  <div className="text-center p-4 border border-orange-200 dark:border-orange-700 rounded-lg">
                    <div className="text-orange-600 dark:text-orange-400 font-semibold mb-2">사후 정비</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">평균 소요시간</div>
                    <div className="text-xl font-bold text-orange-600">3.2시간</div>
                  </div>
                  <div className="text-center p-4 border border-red-200 dark:border-red-700 rounded-lg">
                    <div className="text-red-600 dark:text-red-400 font-semibold mb-2">긴급 정비</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">평균 소요시간</div>
                    <div className="text-xl font-bold text-red-600">5.5시간</div>
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
                  <div className="text-sm text-gray-600 dark:text-gray-400">완료 작업</div>
                </Card.Content>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                <Card.Content className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">95.8%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">완료율</div>
                </Card.Content>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                <Card.Content className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">2.4h</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">평균 처리시간</div>
                </Card.Content>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                <Card.Content className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">98.2%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">품질 점수</div>
                </Card.Content>
              </Card>
            </div>

            {/* 정비팀별 성과 */}
            <Card>
              <Card.Header>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">정비팀별 성과 분석</h4>
              </Card.Header>
              <Card.Content>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">정비사</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">완료 작업</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">평균 시간</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">품질 점수</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">전문 분야</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: '박정비사', completed: 8, avgTime: 2.1, quality: 99.2, specialty: 'CNC 정밀가공' },
                        { name: '이수리기사', completed: 6, avgTime: 2.3, quality: 98.5, specialty: '드릴링 시스템' },
                        { name: '최정비사', completed: 7, avgTime: 2.8, quality: 97.8, specialty: '유압 시스템' },
                        { name: '김기술자', completed: 3, avgTime: 1.9, quality: 96.5, specialty: '전기 제어' }
                      ].map((technician, index) => (
                        <tr key={technician.name} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}>
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{technician.name}</td>
                          <td className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">{technician.completed}건</td>
                          <td className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">{technician.avgTime}시간</td>
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
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">기술자별 전문성 및 워크로드</h4>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { name: '박정비사', workload: 85, skills: ['CNC 가공', '정밀 측정', '품질 관리'], rating: 'A+' },
                    { name: '이수리기사', workload: 70, skills: ['드릴링', '타핑', '보링'], rating: 'A' },
                    { name: '최정비사', workload: 78, skills: ['유압', '공압', '냉각시스템'], rating: 'A-' },
                    { name: '김기술자', workload: 45, skills: ['전기', 'PLC', '센서'], rating: 'B+' }
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
                          <span className="text-gray-600 dark:text-gray-400">워크로드</span>
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
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">전문 기술</div>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">정비 분석</h3>
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
          🔧 정비 분석 - {getPeriodLabel(period)}
        </h3>
      </div>
      {renderContent()}
    </div>
  )
}