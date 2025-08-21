const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runSystemValidation() {
  console.log('🚀 CNC 설비 관리 시스템 - 전체 시스템 검증 시작')
  console.log('=' .repeat(80))
  
  const startTime = Date.now()
  let totalTests = 0
  let passedTests = 0
  let criticalIssues = []
  let warnings = []
  let recommendations = []

  // 1. 환경 설정 검증
  console.log('\n📋 1. 환경 설정 검증')
  console.log('-'.repeat(40))
  
  totalTests++
  try {
    const envChecks = {
      'NEXT_PUBLIC_SUPABASE_URL': !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'SUPABASE_SERVICE_ROLE_KEY': !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      'NEXT_PUBLIC_OFFLINE_MODE': process.env.NEXT_PUBLIC_OFFLINE_MODE
    }
    
    Object.entries(envChecks).forEach(([key, value]) => {
      console.log(`   ${value ? '✅' : '❌'} ${key}: ${value || 'Missing'}`)
    })
    
    const allEnvValid = Object.values(envChecks).slice(0, 3).every(Boolean)
    if (allEnvValid) {
      passedTests++
      console.log('   ✅ 환경 설정 검증 통과')
    } else {
      criticalIssues.push('필수 환경 변수가 누락되었습니다')
    }
  } catch (error) {
    criticalIssues.push(`환경 설정 검증 실패: ${error.message}`)
  }

  // 2. 데이터베이스 연결 및 스키마 검증
  console.log('\n📊 2. 데이터베이스 연결 및 스키마 검증')
  console.log('-'.repeat(40))
  
  const tables = [
    'profiles', 'equipment_info', 'equipment_status', 
    'breakdown_reports', 'repair_reports', 'system_settings'
  ]
  
  let dbTestsPassed = 0
  
  for (const table of tables) {
    totalTests++
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`)
        if (error.message.includes('permission denied')) {
          criticalIssues.push(`테이블 ${table} 접근 권한 없음`)
        } else if (error.message.includes('does not exist')) {
          criticalIssues.push(`테이블 ${table} 존재하지 않음`)
        }
      } else {
        console.log(`   ✅ ${table}: ${count} rows`)
        passedTests++
        dbTestsPassed++
      }
    } catch (err) {
      console.log(`   ❌ ${table}: ${err.message}`)
      criticalIssues.push(`테이블 ${table} 검증 실패`)
    }
  }

  // 3. 새로운 테이블 및 기능 검증
  console.log('\n🆕 3. 새로운 테이블 및 기능 검증')
  console.log('-'.repeat(40))
  
  const newTables = [
    'status_transition_log', 
    'system_status_definitions', 
    'system_notifications'
  ]
  
  for (const table of newTables) {
    totalTests++
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`   ⚠️ ${table}: 아직 생성되지 않음 (${error.message})`)
        warnings.push(`새로운 테이블 ${table}이 아직 마이그레이션되지 않았습니다`)
      } else {
        console.log(`   ✅ ${table}: ${count || 0} rows`)
        passedTests++
      }
    } catch (err) {
      console.log(`   ⚠️ ${table}: 접근 불가`)
      warnings.push(`새로운 테이블 ${table} 마이그레이션 필요`)
    }
  }

  // 4. 뷰 및 함수 검증
  console.log('\n👁️ 4. 뷰 및 함수 검증')
  console.log('-'.repeat(40))
  
  const views = [
    'v_equipment_status_summary',
    'v_dashboard_summary', 
    'v_repair_with_equipment'
  ]
  
  for (const view of views) {
    totalTests++
    try {
      const { count, error } = await supabase
        .from(view)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`   ⚠️ ${view}: 뷰가 생성되지 않음`)
        warnings.push(`뷰 ${view} 마이그레이션 필요`)
      } else {
        console.log(`   ✅ ${view}: ${count || 0} rows`)
        passedTests++
      }
    } catch (err) {
      warnings.push(`뷰 ${view} 검증 실패`)
    }
  }

  // 5. 데이터 일관성 검증
  console.log('\n🔍 5. 데이터 일관성 검증')
  console.log('-'.repeat(40))
  
  try {
    totalTests++
    
    // 설비와 상태 정보 일관성 검사
    const { data: equipments } = await supabase
      .from('equipment_info')
      .select('id, equipment_name')
    
    const { data: statuses } = await supabase
      .from('equipment_status')
      .select('equipment_id, status')
    
    if (equipments && statuses) {
      const equipmentIds = new Set(equipments.map(e => e.id))
      const statusIds = new Set(statuses.map(s => s.equipment_id))
      
      const missingStatuses = [...equipmentIds].filter(id => !statusIds.has(id))
      const orphanedStatuses = [...statusIds].filter(id => !equipmentIds.has(id))
      
      if (missingStatuses.length === 0 && orphanedStatuses.length === 0) {
        console.log(`   ✅ 설비-상태 일관성: ${equipments.length}개 설비, ${statuses.length}개 상태`)
        passedTests++
      } else {
        console.log(`   ⚠️ 설비-상태 불일치: 누락 ${missingStatuses.length}개, 고아 ${orphanedStatuses.length}개`)
        warnings.push(`설비-상태 정보 불일치 발견`)
      }
    } else {
      console.log('   ❌ 설비 또는 상태 데이터 로드 실패')
      criticalIssues.push('기본 데이터 로드 실패')
    }
  } catch (error) {
    console.log(`   ❌ 데이터 일관성 검사 실패: ${error.message}`)
    criticalIssues.push('데이터 일관성 검사 불가')
  }

  // 6. 고장 신고 시스템 검증
  console.log('\n🚨 6. 고장 신고 시스템 검증')
  console.log('-'.repeat(40))
  
  try {
    totalTests++
    
    const { data: breakdowns, error } = await supabase
      .from('breakdown_reports')
      .select('id, equipment_id, status, priority, breakdown_time')
      .limit(10)
    
    if (error) {
      console.log(`   ❌ 고장 신고 데이터 로드 실패: ${error.message}`)
      criticalIssues.push('고장 신고 시스템 접근 불가')
    } else {
      console.log(`   ✅ 고장 신고 시스템: ${breakdowns.length}개 최근 신고`)
      
      // 고장 신고 상태 분석
      const statusCounts = breakdowns.reduce((acc, br) => {
        acc[br.status] = (acc[br.status] || 0) + 1
        return acc
      }, {})
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`     - ${status}: ${count}건`)
      })
      
      passedTests++
    }
  } catch (error) {
    criticalIssues.push(`고장 신고 시스템 검증 실패: ${error.message}`)
  }

  // 7. 성능 메트릭 계산 검증
  console.log('\n📈 7. 성능 메트릭 계산 검증')
  console.log('-'.repeat(40))
  
  try {
    totalTests++
    
    // 간단한 메트릭 계산
    const { data: equipmentCount } = await supabase
      .from('equipment_info')
      .select('*', { count: 'exact', head: true })
    
    const { data: runningCount } = await supabase
      .from('equipment_status')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'running')
    
    const { data: breakdownCount } = await supabase
      .from('breakdown_reports')
      .select('*', { count: 'exact', head: true })
      .gte('breakdown_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    
    if (equipmentCount !== null) {
      const totalEquipment = equipmentCount
      const runningEquipment = runningCount || 0
      const recentBreakdowns = breakdownCount || 0
      
      const operationRate = totalEquipment > 0 ? Math.round((runningEquipment / totalEquipment) * 100) : 0
      
      console.log(`   ✅ 기본 메트릭 계산:`)
      console.log(`     - 전체 설비: ${totalEquipment}대`)
      console.log(`     - 정상 운영: ${runningEquipment}대 (${operationRate}%)`)
      console.log(`     - 최근 30일 고장: ${recentBreakdowns}건`)
      
      if (totalEquipment > 0) {
        passedTests++
      } else {
        warnings.push('설비 데이터가 없어 메트릭 계산이 의미가 없습니다')
      }
    } else {
      console.log('   ❌ 메트릭 계산을 위한 데이터 로드 실패')
      warnings.push('성능 메트릭 계산 불가')
    }
  } catch (error) {
    console.log(`   ❌ 성능 메트릭 검증 실패: ${error.message}`)
    warnings.push(`성능 메트릭 계산 오류: ${error.message}`)
  }

  // 8. 최종 결과 및 권장사항
  console.log('\n🎯 8. 최종 시스템 상태 분석')
  console.log('='.repeat(80))
  
  const totalDuration = Date.now() - startTime
  const passRate = Math.round((passedTests / totalTests) * 100)
  
  console.log(`📊 테스트 결과: ${passedTests}/${totalTests} 통과 (${passRate}%)`)
  console.log(`⏱️ 검증 소요 시간: ${totalDuration}ms`)
  
  // 시스템 상태 평가
  let systemStatus = 'unknown'
  let statusIcon = '❓'
  
  if (criticalIssues.length === 0 && passRate >= 90) {
    systemStatus = 'EXCELLENT'
    statusIcon = '🟢'
  } else if (criticalIssues.length === 0 && passRate >= 75) {
    systemStatus = 'GOOD'
    statusIcon = '🟡'
  } else if (criticalIssues.length <= 2 && passRate >= 60) {
    systemStatus = 'WARNING'
    statusIcon = '🟠'
  } else {
    systemStatus = 'CRITICAL'
    statusIcon = '🔴'
  }
  
  console.log(`${statusIcon} 시스템 상태: ${systemStatus}`)
  
  // 문제점 요약
  if (criticalIssues.length > 0) {
    console.log('\n🚨 치명적 문제:')
    criticalIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`)
    })
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️ 경고 사항:')
    warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`)
    })
  }
  
  // 권장 조치사항
  console.log('\n💡 권장 조치사항:')
  
  if (criticalIssues.length === 0 && warnings.length === 0) {
    console.log('   ✅ 모든 검증이 통과했습니다! 시스템이 정상적으로 작동하고 있습니다.')
    console.log('   📈 다음 단계: 실제 애플리케이션을 테스트해보세요.')
  } else {
    // 우선순위별 권장사항
    if (warnings.some(w => w.includes('마이그레이션'))) {
      console.log('   1. 🔄 Supabase SQL Editor에서 final-migration.sql 실행')
      console.log('      - 새로운 테이블, 뷰, 함수 생성')
      console.log('      - 데이터 일관성 개선')
    }
    
    if (criticalIssues.some(i => i.includes('권한'))) {
      console.log('   2. 🔐 RLS 정책 및 권한 설정 수정')
      console.log('      - anonymous 역할 권한 부여')
      console.log('      - 테이블별 읽기 권한 확인')
    }
    
    if (criticalIssues.length > 0) {
      console.log('   3. 🆘 치명적 문제 우선 해결')
      console.log('      - 환경 변수 설정 확인')
      console.log('      - 데이터베이스 연결 상태 점검')
    }
    
    console.log('   4. 🔄 수정 후 다시 검증 실행')
    console.log('      - node run-integration-test.js')
  }
  
  // 추가 리소스
  console.log('\n📚 추가 리소스:')
  console.log('   - 마이그레이션 가이드: MIGRATION_INSTRUCTIONS.md')
  console.log('   - 아키텍처 분석: BACKEND_ARCHITECTURE_ANALYSIS_REPORT.md')
  console.log('   - 시스템 수정 스크립트: fix-rls-and-auth-final.sql')
  
  console.log('\n' + '='.repeat(80))
  console.log(`${statusIcon} 시스템 검증 완료: ${systemStatus} 상태`)
  console.log('='.repeat(80))
  
  // 종료 코드 설정 (CI/CD용)
  if (criticalIssues.length > 0) {
    process.exit(1) // 실패
  } else if (warnings.length > 2) {
    process.exit(2) // 경고
  } else {
    process.exit(0) // 성공
  }
}

// 에러 핸들링
process.on('uncaughtException', (error) => {
  console.error('💥 치명적 오류 발생:', error.message)
  console.error('스택 트레이스:', error.stack)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 처리되지 않은 Promise 거부:', reason)
  process.exit(1)
})

// 실행
runSystemValidation().catch(error => {
  console.error('💥 시스템 검증 실행 실패:', error)
  process.exit(1)
})