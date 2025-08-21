const dotenv = require('dotenv')
const path = require('path')

// 환경 변수 로드
dotenv.config({ path: path.join(__dirname, '.env.local') })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseStateIssues() {
  console.log('\n=== CNC 유지보수 시스템 상태 진단 시작 ===\n')
  
  const issues = []
  const recommendations = []
  
  try {
    // 1. 데이터베이스 연결 확인
    console.log('1. 데이터베이스 연결 확인...')
    const { data: testData, error: testError } = await supabase
      .from('equipment_info')
      .select('count')
      .limit(1)
    
    if (testError) {
      issues.push('데이터베이스 연결 실패: ' + testError.message)
    } else {
      console.log('✅ 데이터베이스 연결 성공')
    }
    
    // 2. 설비 정보 확인
    console.log('\n2. 설비 정보 확인...')
    const { data: equipments, error: eqError } = await supabase
      .from('equipment_info')
      .select('*')
    
    if (eqError) {
      issues.push('설비 정보 조회 실패: ' + eqError.message)
    } else {
      console.log(`✅ 설비 정보: ${equipments?.length || 0}개`)
      if (!equipments || equipments.length === 0) {
        issues.push('설비 정보가 없습니다')
        recommendations.push('설비 정보를 먼저 등록해야 합니다')
      }
    }
    
    // 3. 설비 상태 확인
    console.log('\n3. 설비 상태 정보 확인...')
    const { data: statuses, error: statusError } = await supabase
      .from('equipment_status')
      .select('*')
    
    if (statusError) {
      issues.push('설비 상태 조회 실패: ' + statusError.message)
    } else {
      console.log(`✅ 설비 상태: ${statuses?.length || 0}개`)
      
      // 상태별 카운트
      if (statuses && statuses.length > 0) {
        const statusCounts = statuses.reduce((acc, s) => {
          acc[s.status] = (acc[s.status] || 0) + 1
          return acc
        }, {})
        console.log('   상태 분포:', statusCounts)
      }
    }
    
    // 4. 설비-상태 매칭 확인
    console.log('\n4. 설비-상태 매칭 확인...')
    if (equipments && statuses) {
      const equipmentIds = new Set(equipments.map(e => e.id))
      const statusEquipmentIds = new Set(statuses.map(s => s.equipment_id))
      
      const missingStatuses = []
      equipmentIds.forEach(id => {
        if (!statusEquipmentIds.has(id)) {
          const eq = equipments.find(e => e.id === id)
          missingStatuses.push(`${eq.equipment_number} (${eq.equipment_name})`)
        }
      })
      
      if (missingStatuses.length > 0) {
        issues.push(`${missingStatuses.length}개 설비에 상태 정보가 없습니다`)
        console.log('   상태 없는 설비:', missingStatuses)
        recommendations.push('모든 설비에 초기 상태를 설정해야 합니다')
      } else {
        console.log('✅ 모든 설비에 상태 정보가 있습니다')
      }
      
      // 잘못된 참조 확인
      const orphanStatuses = []
      statusEquipmentIds.forEach(id => {
        if (!equipmentIds.has(id)) {
          orphanStatuses.push(id)
        }
      })
      
      if (orphanStatuses.length > 0) {
        issues.push(`${orphanStatuses.length}개의 고아 상태 레코드가 있습니다`)
        recommendations.push('존재하지 않는 설비를 참조하는 상태 레코드를 정리해야 합니다')
      }
    }
    
    // 5. 고장 보고서 확인
    console.log('\n5. 고장 보고서 확인...')
    const { data: breakdowns, error: bError } = await supabase
      .from('breakdown_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (bError) {
      issues.push('고장 보고서 조회 실패: ' + bError.message)
    } else {
      console.log(`✅ 최근 고장 보고서: ${breakdowns?.length || 0}개`)
      
      // 상태 동기화 확인
      if (breakdowns && breakdowns.length > 0) {
        for (const breakdown of breakdowns) {
          if (breakdown.status === 'reported' || breakdown.status === 'in_progress') {
            const status = statuses?.find(s => s.equipment_id === breakdown.equipment_id)
            if (status && status.status !== 'breakdown') {
              issues.push(`설비 ${breakdown.equipment_number}: 고장 보고가 있지만 상태가 'breakdown'이 아닙니다`)
              recommendations.push('고장 보고와 설비 상태를 동기화해야 합니다')
            }
          }
        }
      }
    }
    
    // 6. 실시간 구독 테스트
    console.log('\n6. 실시간 구독 기능 확인...')
    const channel = supabase
      .channel('test_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment_status' }, (payload) => {
        console.log('   실시간 이벤트 수신:', payload.eventType)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ 실시간 구독 성공')
          channel.unsubscribe()
        } else {
          issues.push('실시간 구독 실패: ' + status)
        }
      })
    
    // 7. 사용자 및 권한 확인
    console.log('\n7. 사용자 및 권한 확인...')
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('*')
    
    if (pError) {
      issues.push('사용자 프로필 조회 실패: ' + pError.message)
    } else {
      console.log(`✅ 등록된 사용자: ${profiles?.length || 0}명`)
      
      if (profiles && profiles.length > 0) {
        const roleCounts = profiles.reduce((acc, p) => {
          acc[p.role] = (acc[p.role] || 0) + 1
          return acc
        }, {})
        console.log('   역할 분포:', roleCounts)
        
        if (!roleCounts['system_admin']) {
          issues.push('시스템 관리자가 없습니다')
          recommendations.push('최소 1명의 시스템 관리자가 필요합니다')
        }
      }
    }
    
  } catch (error) {
    console.error('진단 중 오류 발생:', error)
    issues.push('진단 프로세스 오류: ' + error.message)
  }
  
  // 진단 결과 출력
  console.log('\n\n=== 진단 결과 ===\n')
  
  if (issues.length === 0) {
    console.log('✅ 시스템 상태 정상')
  } else {
    console.log(`❌ 발견된 문제: ${issues.length}개\n`)
    issues.forEach((issue, idx) => {
      console.log(`  ${idx + 1}. ${issue}`)
    })
  }
  
  if (recommendations.length > 0) {
    console.log(`\n💡 권장사항: ${recommendations.length}개\n`)
    recommendations.forEach((rec, idx) => {
      console.log(`  ${idx + 1}. ${rec}`)
    })
  }
  
  // 긴급 수정 필요 항목
  console.log('\n\n=== 🔥 긴급 수정 필요 항목 ===\n')
  console.log('1. StateManager와 DataSynchronizer의 실시간 동기화 문제')
  console.log('   - 이벤트 리스너가 제대로 작동하지 않음')
  console.log('   - 상태 변경이 다른 컴포넌트에 전파되지 않음')
  console.log('\n2. 고장 보고 시 설비 상태 자동 변경 미작동')
  console.log('   - updateEquipmentStatusFromBreakdown 함수가 호출되지 않거나 실패')
  console.log('\n3. 페이지 간 데이터 불일치')
  console.log('   - useUnifiedState Hook이 모든 페이지에서 동일한 인스턴스를 참조하지 않음')
  console.log('\n4. 캐시 관리 문제')
  console.log('   - 데이터 새로고침 시 캐시가 제대로 무효화되지 않음')
  
  process.exit(issues.length > 0 ? 1 : 0)
}

diagnoseStateIssues()