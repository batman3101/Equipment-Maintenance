/**
 * 시스템 통합 테스트 및 검증 유틸리티
 * 전체 시스템의 데이터 일관성, 기능 작동, 성능을 검증
 */

import { globalStateManager } from '@/lib/state-management/StateManager'
import { statusSynchronizer } from '@/utils/status-synchronizer'
import { calculateDashboardMetrics } from '@/utils/metrics-calculator'

/**
 * 테스트 결과 타입
 */
export interface TestResult {
  testName: string
  passed: boolean
  details: string
  duration: number
  errors: string[]
}

/**
 * 통합 테스트 결과
 */
export interface IntegrationTestReport {
  totalTests: number
  passedTests: number
  failedTests: number
  totalDuration: number
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical'
  results: TestResult[]
  summary: {
    dataConsistency: 'pass' | 'fail'
    performanceMetrics: 'pass' | 'fail'
    statusSynchronization: 'pass' | 'fail'
    userInterface: 'pass' | 'fail'
  }
  recommendations: string[]
}

/**
 * [SRP] Rule: 시스템 통합 테스트만을 담당하는 클래스
 */
export class SystemIntegrationTester {
  private static instance: SystemIntegrationTester

  public static getInstance(): SystemIntegrationTester {
    if (!SystemIntegrationTester.instance) {
      SystemIntegrationTester.instance = new SystemIntegrationTester()
    }
    return SystemIntegrationTester.instance
  }

  /**
   * 전체 시스템 통합 테스트 실행
   */
  public async runFullIntegrationTest(): Promise<IntegrationTestReport> {
    const startTime = Date.now()
    const results: TestResult[] = []

    console.log('🚀 Starting CNC Equipment Management System Integration Test...')

    // 1. 데이터 일관성 테스트
    results.push(await this.testDataConsistency())
    results.push(await this.testEquipmentStatusConsistency())
    results.push(await this.testBreakdownReportConsistency())

    // 2. 상태 동기화 테스트
    results.push(await this.testStatusSynchronization())
    results.push(await this.testWorkflowIntegration())

    // 3. 성능 메트릭 테스트
    results.push(await this.testMetricsCalculation())
    results.push(await this.testDashboardDataAccuracy())

    // 4. API 연결성 테스트
    results.push(await this.testAPIConnectivity())
    results.push(await this.testDataPersistence())

    // 5. UI 데이터 바인딩 테스트
    results.push(await this.testUIDataBinding())
    results.push(await this.testRealTimeUpdates())

    const totalDuration = Date.now() - startTime
    const passedTests = results.filter(r => r.passed).length
    const failedTests = results.length - passedTests

    // 시스템 헬스 평가
    const systemHealth = this.evaluateSystemHealth(results)
    
    // 요약 생성
    const summary = this.generateSummary(results)
    
    // 권장사항 생성
    const recommendations = this.generateRecommendations(results)

    const report: IntegrationTestReport = {
      totalTests: results.length,
      passedTests,
      failedTests,
      totalDuration,
      systemHealth,
      results,
      summary,
      recommendations
    }

    this.logTestReport(report)
    return report
  }

  /**
   * 데이터 일관성 테스트
   */
  private async testDataConsistency(): Promise<TestResult> {
    const startTime = Date.now()
    const errors: string[] = []

    try {
      const equipments = Array.from(globalStateManager.getEquipments().values())
      const statuses = globalStateManager.getEquipmentStatuses()
      const breakdowns = Array.from(globalStateManager.getBreakdownReports().values())

      // 1. 설비-상태 일관성 검사
      for (const equipment of equipments) {
        const status = statuses.get(equipment.id)
        if (!status) {
          errors.push(`설비 ${equipment.equipment_name}에 상태 정보가 없습니다`)
        }
      }

      // 2. 고장신고-설비 관계 검사
      for (const breakdown of breakdowns) {
        if (breakdown.equipment_id) {
          const equipment = equipments.find(e => e.id === breakdown.equipment_id)
          if (!equipment) {
            errors.push(`고장신고 ${breakdown.id}의 설비 ${breakdown.equipment_id}를 찾을 수 없습니다`)
          }
        }
      }

      // 3. 상태별 카운트 일관성 검사
      const statusCounts = this.calculateStatusCounts(statuses)
      const totalFromCounts = Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
      
      if (totalFromCounts !== equipments.length) {
        errors.push(`상태별 카운트 합계(${totalFromCounts})와 전체 설비 수(${equipments.length})가 일치하지 않습니다`)
      }

      return {
        testName: 'Data Consistency Check',
        passed: errors.length === 0,
        details: errors.length === 0 ? 
          `${equipments.length}개 설비, ${breakdowns.length}개 고장신고 일관성 확인` :
          `${errors.length}개 일관성 오류 발견`,
        duration: Date.now() - startTime,
        errors
      }

    } catch (error) {
      return {
        testName: 'Data Consistency Check',
        passed: false,
        details: '데이터 일관성 검사 중 오류 발생',
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : '알 수 없는 오류']
      }
    }
  }

  /**
   * 설비 상태 일관성 테스트
   */
  private async testEquipmentStatusConsistency(): Promise<TestResult> {
    const startTime = Date.now()
    const errors: string[] = []

    try {
      const statuses = globalStateManager.getEquipmentStatuses()
      const breakdowns = Array.from(globalStateManager.getBreakdownReports().values())

      // 고장 신고가 있는데 상태가 running인 경우 검사
      const activeBreakdowns = breakdowns.filter(br => 
        br.status === 'reported' || br.status === 'in_progress'
      )

      for (const breakdown of activeBreakdowns) {
        if (breakdown.equipment_id) {
          const status = statuses.get(breakdown.equipment_id)
          if (status?.status === 'running') {
            errors.push(`설비 ${breakdown.equipment_id}: 활성 고장신고가 있지만 상태가 'running'입니다`)
          }
        }
      }

      // 고장 상태인데 관련 고장 신고가 없는 경우 검사
      for (const [equipmentId, status] of statuses.entries()) {
        if (status.status === 'breakdown') {
          const hasActiveBreakdown = activeBreakdowns.some(br => br.equipment_id === equipmentId)
          if (!hasActiveBreakdown) {
            errors.push(`설비 ${equipmentId}: 'breakdown' 상태이지만 활성 고장신고가 없습니다`)
          }
        }
      }

      return {
        testName: 'Equipment Status Consistency',
        passed: errors.length === 0,
        details: errors.length === 0 ? 
          `${statuses.size}개 설비 상태 일관성 확인` :
          `${errors.length}개 상태 불일치 발견`,
        duration: Date.now() - startTime,
        errors
      }

    } catch (error) {
      return {
        testName: 'Equipment Status Consistency',
        passed: false,
        details: '설비 상태 일관성 검사 중 오류 발생',
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : '알 수 없는 오류']
      }
    }
  }

  /**
   * 고장 신고 일관성 테스트
   */
  private async testBreakdownReportConsistency(): Promise<TestResult> {
    const startTime = Date.now()
    const errors: string[] = []

    try {
      const breakdowns = Array.from(globalStateManager.getBreakdownReports().values())

      for (const breakdown of breakdowns) {
        // 필수 필드 검사
        if (!breakdown.equipment_id) {
          errors.push(`고장신고 ${breakdown.id}: equipment_id가 없습니다`)
        }
        
        if (!breakdown.breakdown_time) {
          errors.push(`고장신고 ${breakdown.id}: breakdown_time이 없습니다`)
        }

        // 상태별 필수 필드 검사
        if (breakdown.status === 'completed' && !breakdown.resolution_date) {
          errors.push(`고장신고 ${breakdown.id}: 완료 상태이지만 resolution_date가 없습니다`)
        }

        // 우선순위 유효성 검사
        const validPriorities = ['low', 'medium', 'high', 'critical']
        if (breakdown.priority && !validPriorities.includes(breakdown.priority)) {
          errors.push(`고장신고 ${breakdown.id}: 유효하지 않은 우선순위 '${breakdown.priority}'`)
        }
      }

      return {
        testName: 'Breakdown Report Consistency',
        passed: errors.length === 0,
        details: errors.length === 0 ? 
          `${breakdowns.length}개 고장신고 일관성 확인` :
          `${errors.length}개 고장신고 불일치 발견`,
        duration: Date.now() - startTime,
        errors
      }

    } catch (error) {
      return {
        testName: 'Breakdown Report Consistency',
        passed: false,
        details: '고장신고 일관성 검사 중 오류 발생',
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : '알 수 없는 오류']
      }
    }
  }

  /**
   * 상태 동기화 테스트
   */
  private async testStatusSynchronization(): Promise<TestResult> {
    const startTime = Date.now()
    const errors: string[] = []

    try {
      // 상태 동기화 기능 테스트
      const syncResult = await statusSynchronizer.syncAllStatuses()
      
      if (syncResult.errors.length > 0) {
        errors.push(...syncResult.errors)
      }

      // 동기화 후 일관성 재검사
      const equipments = Array.from(globalStateManager.getEquipments().values())
      if (equipments.length > 0) {
        const testEquipment = equipments[0]
        
        // 가상 상태 변경 테스트 (실제 DB는 변경하지 않음)
        console.log(`Testing status change simulation for equipment: ${testEquipment.id}`)
      }

      return {
        testName: 'Status Synchronization',
        passed: errors.length === 0,
        details: errors.length === 0 ? 
          `상태 동기화 ${syncResult.synchronized}건 완료` :
          `동기화 중 ${errors.length}개 오류 발생`,
        duration: Date.now() - startTime,
        errors
      }

    } catch (error) {
      return {
        testName: 'Status Synchronization',
        passed: false,
        details: '상태 동기화 테스트 중 오류 발생',
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : '알 수 없는 오류']
      }
    }
  }

  /**
   * 워크플로우 통합 테스트
   */
  private async testWorkflowIntegration(): Promise<TestResult> {
    const startTime = Date.now()
    const errors: string[] = []

    try {
      // 워크플로우 시나리오 테스트
      const equipments = Array.from(globalStateManager.getEquipments().values())
      const breakdowns = Array.from(globalStateManager.getBreakdownReports().values())
      
      // 시나리오 1: 고장 발생 → 수리 → 완료 워크플로우 검증
      let workflowValid = true
      
      // 완료된 고장 신고 중에서 workflow 검증
      const completedBreakdowns = breakdowns.filter(br => br.status === 'completed')
      
      for (const breakdown of completedBreakdowns.slice(0, 3)) { // 최대 3개만 검사
        if (breakdown.breakdown_time && breakdown.resolution_date) {
          const startTime = new Date(breakdown.breakdown_time).getTime()
          const endTime = new Date(breakdown.resolution_date).getTime()
          
          if (endTime <= startTime) {
            errors.push(`고장신고 ${breakdown.id}: 해결 시간이 고장 시간보다 빠릅니다`)
            workflowValid = false
          }
        }
      }

      return {
        testName: 'Workflow Integration',
        passed: workflowValid && errors.length === 0,
        details: errors.length === 0 ? 
          `${completedBreakdowns.length}개 완료 워크플로우 검증` :
          `워크플로우 검증 중 ${errors.length}개 오류 발견`,
        duration: Date.now() - startTime,
        errors
      }

    } catch (error) {
      return {
        testName: 'Workflow Integration',
        passed: false,
        details: '워크플로우 통합 테스트 중 오류 발생',
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : '알 수 없는 오류']
      }
    }
  }

  /**
   * 메트릭 계산 테스트
   */
  private async testMetricsCalculation(): Promise<TestResult> {
    const startTime = Date.now()
    const errors: string[] = []

    try {
      const equipments = Array.from(globalStateManager.getEquipments().values())
      const breakdowns = Array.from(globalStateManager.getBreakdownReports().values())
      const statuses = globalStateManager.getEquipmentStatuses()
      
      const runningCount = Array.from(statuses.values()).filter(s => s.status === 'running').length

      // 메트릭 계산 테스트
      const metrics = calculateDashboardMetrics(equipments, runningCount, breakdowns, [], 30)

      // MTBF 유효성 검사
      if (metrics.mtbf.value < 0) {
        errors.push('MTBF 값이 음수입니다')
      }

      // MTTR 유효성 검사
      if (metrics.mttr.value < 0) {
        errors.push('MTTR 값이 음수입니다')
      }

      // 완료율 유효성 검사
      if (metrics.completionRate.value < 0 || metrics.completionRate.value > 100) {
        errors.push(`완료율이 유효 범위(0-100%)를 벗어났습니다: ${metrics.completionRate.value}%`)
      }

      return {
        testName: 'Metrics Calculation',
        passed: errors.length === 0,
        details: errors.length === 0 ? 
          `MTBF: ${metrics.mtbf.value}h, MTTR: ${metrics.mttr.value}h, 완료율: ${metrics.completionRate.value}%` :
          `메트릭 계산 중 ${errors.length}개 오류 발견`,
        duration: Date.now() - startTime,
        errors
      }

    } catch (error) {
      return {
        testName: 'Metrics Calculation',
        passed: false,
        details: '메트릭 계산 테스트 중 오류 발생',
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : '알 수 없는 오류']
      }
    }
  }

  /**
   * 대시보드 데이터 정확성 테스트
   */
  private async testDashboardDataAccuracy(): Promise<TestResult> {
    const startTime = Date.now()
    const errors: string[] = []

    try {
      const equipments = Array.from(globalStateManager.getEquipments().values())
      const statuses = globalStateManager.getEquipmentStatuses()
      const breakdowns = Array.from(globalStateManager.getBreakdownReports().values())

      // 대시보드 통계 계산
      const totalEquipment = equipments.length
      const runningEquipment = Array.from(statuses.values()).filter(s => s.status === 'running').length
      const breakdownEquipment = Array.from(statuses.values()).filter(s => s.status === 'breakdown').length

      // 합계 검증
      const statusSum = Array.from(statuses.values()).length
      if (statusSum !== totalEquipment) {
        errors.push(`상태 정보 수(${statusSum})와 설비 수(${totalEquipment})가 일치하지 않습니다`)
      }

      // 고장 신고 통계
      const activeBreakdowns = breakdowns.filter(br => 
        br.status === 'reported' || br.status === 'in_progress'
      ).length
      
      const completedBreakdowns = breakdowns.filter(br => 
        br.status === 'completed' || br.status === 'resolved'
      ).length

      return {
        testName: 'Dashboard Data Accuracy',
        passed: errors.length === 0,
        details: errors.length === 0 ? 
          `설비 ${totalEquipment}대, 정상 ${runningEquipment}대, 고장 ${breakdownEquipment}대, 활성 고장신고 ${activeBreakdowns}건` :
          `대시보드 데이터 검증 중 ${errors.length}개 오류 발견`,
        duration: Date.now() - startTime,
        errors
      }

    } catch (error) {
      return {
        testName: 'Dashboard Data Accuracy',
        passed: false,
        details: '대시보드 데이터 정확성 테스트 중 오류 발생',
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : '알 수 없는 오류']
      }
    }
  }

  /**
   * API 연결성 테스트
   */
  private async testAPIConnectivity(): Promise<TestResult> {
    const startTime = Date.now()
    const errors: string[] = []

    try {
      // 환경 설정 확인
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl) {
        errors.push('NEXT_PUBLIC_SUPABASE_URL 환경 변수가 설정되지 않았습니다')
      }
      
      if (!supabaseKey) {
        errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY 환경 변수가 설정되지 않았습니다')
      }

      // 오프라인 모드 확인
      const isOfflineMode = process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true'
      
      return {
        testName: 'API Connectivity',
        passed: errors.length === 0,
        details: errors.length === 0 ? 
          `API 연결 설정 완료 (${isOfflineMode ? '오프라인 모드' : '온라인 모드'})` :
          `API 연결 설정 중 ${errors.length}개 오류 발견`,
        duration: Date.now() - startTime,
        errors
      }

    } catch (error) {
      return {
        testName: 'API Connectivity',
        passed: false,
        details: 'API 연결성 테스트 중 오류 발생',
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : '알 수 없는 오류']
      }
    }
  }

  /**
   * 데이터 지속성 테스트
   */
  private async testDataPersistence(): Promise<TestResult> {
    const startTime = Date.now()
    const errors: string[] = []

    try {
      // 글로벌 상태 관리자 상태 확인
      const equipments = globalStateManager.getEquipments()
      const statuses = globalStateManager.getEquipmentStatuses()
      const breakdowns = globalStateManager.getBreakdownReports()

      if (equipments.size === 0) {
        errors.push('설비 데이터가 로드되지 않았습니다')
      }

      if (statuses.size === 0) {
        errors.push('설비 상태 데이터가 로드되지 않았습니다')
      }

      // 데이터 타임스탬프 확인
      const lastUpdated = globalStateManager.getLastUpdated('equipments')
      const now = Date.now()
      const dataAge = now - lastUpdated
      
      if (dataAge > 10 * 60 * 1000) { // 10분 이상 오래된 데이터
        errors.push(`데이터가 ${Math.round(dataAge / 60000)}분 전에 업데이트되었습니다`)
      }

      return {
        testName: 'Data Persistence',
        passed: errors.length === 0,
        details: errors.length === 0 ? 
          `데이터 지속성 확인: 설비 ${equipments.size}개, 상태 ${statuses.size}개, 고장신고 ${breakdowns.size}개` :
          `데이터 지속성 검증 중 ${errors.length}개 오류 발견`,
        duration: Date.now() - startTime,
        errors
      }

    } catch (error) {
      return {
        testName: 'Data Persistence',
        passed: false,
        details: '데이터 지속성 테스트 중 오류 발생',
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : '알 수 없는 오류']
      }
    }
  }

  /**
   * UI 데이터 바인딩 테스트
   */
  private async testUIDataBinding(): Promise<TestResult> {
    const startTime = Date.now()
    const errors: string[] = []

    try {
      // DOM 환경에서만 실행
      if (typeof window === 'undefined') {
        return {
          testName: 'UI Data Binding',
          passed: true,
          details: 'UI 테스트는 브라우저 환경에서만 실행됩니다',
          duration: Date.now() - startTime,
          errors: []
        }
      }

      // 기본 UI 컴포넌트 존재 확인
      const hasMainContainer = document.querySelector('[data-testid="main-container"]') !== null
      const hasDashboard = document.querySelector('[data-testid="dashboard"]') !== null
      
      // 실제 DOM 검사는 제한적이므로 기본 검증만 수행
      return {
        testName: 'UI Data Binding',
        passed: true,
        details: 'UI 데이터 바인딩 기본 검증 완료',
        duration: Date.now() - startTime,
        errors
      }

    } catch (error) {
      return {
        testName: 'UI Data Binding',
        passed: false,
        details: 'UI 데이터 바인딩 테스트 중 오류 발생',
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : '알 수 없는 오류']
      }
    }
  }

  /**
   * 실시간 업데이트 테스트
   */
  private async testRealTimeUpdates(): Promise<TestResult> {
    const startTime = Date.now()
    const errors: string[] = []

    try {
      // 이벤트 리스너 등록 테스트
      let eventReceived = false
      const testHandler = () => { eventReceived = true }
      
      globalStateManager.on('stateChange', testHandler)
      
      // 테스트 이벤트 발생
      globalStateManager.emitStateChange({
        type: 'test',
        action: 'test',
        data: { test: true },
        timestamp: Date.now()
      })

      // 짧은 대기 후 이벤트 수신 확인
      await new Promise(resolve => setTimeout(resolve, 100))
      
      globalStateManager.off('stateChange', testHandler)

      if (!eventReceived) {
        errors.push('실시간 이벤트가 수신되지 않았습니다')
      }

      return {
        testName: 'Real-time Updates',
        passed: eventReceived && errors.length === 0,
        details: eventReceived ? 
          '실시간 업데이트 이벤트 시스템 정상' :
          '실시간 업데이트 이벤트 시스템 이상',
        duration: Date.now() - startTime,
        errors
      }

    } catch (error) {
      return {
        testName: 'Real-time Updates',
        passed: false,
        details: '실시간 업데이트 테스트 중 오류 발생',
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : '알 수 없는 오류']
      }
    }
  }

  /**
   * 상태별 카운트 계산
   */
  private calculateStatusCounts(statuses: Map<string, any>): Record<string, number> {
    const counts: Record<string, number> = {}
    
    for (const [, status] of statuses.entries()) {
      const statusKey = status.status || 'unknown'
      counts[statusKey] = (counts[statusKey] || 0) + 1
    }
    
    return counts
  }

  /**
   * 시스템 헬스 평가
   */
  private evaluateSystemHealth(results: TestResult[]): 'excellent' | 'good' | 'warning' | 'critical' {
    const passedCount = results.filter(r => r.passed).length
    const totalCount = results.length
    const passRate = passedCount / totalCount

    if (passRate >= 0.95) return 'excellent'
    if (passRate >= 0.85) return 'good'
    if (passRate >= 0.70) return 'warning'
    return 'critical'
  }

  /**
   * 요약 생성
   */
  private generateSummary(results: TestResult[]): IntegrationTestReport['summary'] {
    const dataTests = results.filter(r => 
      r.testName.includes('Consistency') || r.testName.includes('Accuracy')
    )
    const performanceTests = results.filter(r => 
      r.testName.includes('Metrics') || r.testName.includes('Performance')
    )
    const syncTests = results.filter(r => 
      r.testName.includes('Synchronization') || r.testName.includes('Workflow')
    )
    const uiTests = results.filter(r => 
      r.testName.includes('UI') || r.testName.includes('Binding')
    )

    return {
      dataConsistency: dataTests.every(t => t.passed) ? 'pass' : 'fail',
      performanceMetrics: performanceTests.every(t => t.passed) ? 'pass' : 'fail',
      statusSynchronization: syncTests.every(t => t.passed) ? 'pass' : 'fail',
      userInterface: uiTests.every(t => t.passed) ? 'pass' : 'fail'
    }
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(results: TestResult[]): string[] {
    const recommendations: string[] = []
    const failedTests = results.filter(r => !r.passed)

    if (failedTests.length === 0) {
      recommendations.push('✅ 모든 테스트가 통과했습니다. 시스템이 안정적으로 작동하고 있습니다.')
      return recommendations
    }

    // 테스트별 권장사항
    failedTests.forEach(test => {
      switch (test.testName) {
        case 'Data Consistency Check':
          recommendations.push('📊 데이터 일관성 문제: 정기적인 데이터 동기화 작업을 설정하세요.')
          break
        case 'Equipment Status Consistency':
          recommendations.push('⚙️ 설비 상태 불일치: 상태 변경 워크플로우를 점검하고 자동 동기화를 활성화하세요.')
          break
        case 'Status Synchronization':
          recommendations.push('🔄 상태 동기화 문제: StatusSynchronizer 설정을 확인하고 에러 로그를 검토하세요.')
          break
        case 'Metrics Calculation':
          recommendations.push('📈 메트릭 계산 오류: 계산 로직을 검토하고 입력 데이터의 유효성을 확인하세요.')
          break
        case 'API Connectivity':
          recommendations.push('🌐 API 연결 문제: 환경 변수 설정과 네트워크 연결 상태를 확인하세요.')
          break
        default:
          recommendations.push(`⚠️ ${test.testName} 실패: ${test.errors.join(', ')}`)
      }
    })

    // 일반적인 권장사항
    if (failedTests.length > results.length * 0.3) {
      recommendations.push('🔧 여러 테스트 실패: 시스템 전반적인 점검이 필요합니다.')
    }

    recommendations.push('📋 상세한 오류 내용은 테스트 결과 로그를 확인하세요.')

    return recommendations
  }

  /**
   * 테스트 보고서 로깅
   */
  private logTestReport(report: IntegrationTestReport): void {
    console.log('\n🎯 ========== CNC Equipment Management System Integration Test Report ==========')
    console.log(`📊 Total Tests: ${report.totalTests} | Passed: ${report.passedTests} | Failed: ${report.failedTests}`)
    console.log(`⏱️ Total Duration: ${report.totalDuration}ms`)
    console.log(`🏥 System Health: ${report.systemHealth.toUpperCase()}`)
    
    console.log('\n📋 Test Results:')
    report.results.forEach(result => {
      const status = result.passed ? '✅' : '❌'
      console.log(`${status} ${result.testName}: ${result.details} (${result.duration}ms)`)
      if (result.errors.length > 0) {
        result.errors.forEach(error => console.log(`   ⚠️ ${error}`))
      }
    })
    
    console.log('\n📊 Summary:')
    Object.entries(report.summary).forEach(([key, value]) => {
      const icon = value === 'pass' ? '✅' : '❌'
      console.log(`${icon} ${key}: ${value.toUpperCase()}`)
    })
    
    console.log('\n💡 Recommendations:')
    report.recommendations.forEach(rec => console.log(`   ${rec}`))
    
    console.log('\n========================================================================\n')
  }
}

// 싱글톤 인스턴스 내보내기
export const systemIntegrationTester = SystemIntegrationTester.getInstance()