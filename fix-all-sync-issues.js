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

async function fixAllSyncIssues() {
  console.log('\n=== 🔧 CNC 유지보수 시스템 동기화 문제 수정 시작 ===\n')
  
  let fixedCount = 0
  let errorCount = 0
  
  try {
    // 1. 모든 설비 정보 가져오기
    console.log('1. 설비 정보 로드 중...')
    const { data: equipments, error: eqError } = await supabase
      .from('equipment_info')
      .select('*')
      .order('equipment_number')
    
    if (eqError) throw eqError
    console.log(`   ✅ ${equipments.length}개 설비 로드 완료`)
    
    // 2. 모든 설비 상태 가져오기
    console.log('\n2. 설비 상태 정보 로드 중...')
    const { data: statuses, error: statusError } = await supabase
      .from('equipment_status')
      .select('*')
    
    if (statusError) throw statusError
    console.log(`   ✅ ${statuses.length}개 상태 로드 완료`)
    
    // 3. 상태가 없는 설비에 기본 상태 생성
    console.log('\n3. 누락된 설비 상태 생성 중...')
    const statusMap = new Map(statuses.map(s => [s.equipment_id, s]))
    const missingStatuses = []
    
    for (const equipment of equipments) {
      if (!statusMap.has(equipment.id)) {
        missingStatuses.push({
          equipment_id: equipment.id,
          status: 'stopped',
          status_reason: '초기 상태',
          status_changed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    }
    
    if (missingStatuses.length > 0) {
      const { error: insertError } = await supabase
        .from('equipment_status')
        .insert(missingStatuses)
      
      if (insertError) {
        console.error('   ❌ 상태 생성 실패:', insertError)
        errorCount++
      } else {
        console.log(`   ✅ ${missingStatuses.length}개 누락된 상태 생성 완료`)
        fixedCount += missingStatuses.length
      }
    } else {
      console.log('   ✅ 모든 설비에 상태가 있습니다')
    }
    
    // 4. 고장 보고서와 설비 상태 동기화
    console.log('\n4. 고장 보고서와 설비 상태 동기화 중...')
    const { data: breakdowns, error: bError } = await supabase
      .from('breakdown_reports')
      .select('*')
      .in('status', ['reported', 'in_progress'])
    
    if (bError) throw bError
    console.log(`   활성 고장 보고서: ${breakdowns.length}개`)
    
    // 고장 중인 설비의 상태를 breakdown으로 업데이트
    for (const breakdown of breakdowns) {
      const currentStatus = statusMap.get(breakdown.equipment_id)
      
      if (currentStatus && currentStatus.status !== 'breakdown') {
        const { error: updateError } = await supabase
          .from('equipment_status')
          .update({
            status: 'breakdown',
            status_reason: `고장 신고: ${breakdown.breakdown_title || breakdown.description}`,
            status_changed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('equipment_id', breakdown.equipment_id)
        
        if (updateError) {
          console.error(`   ❌ 설비 ${breakdown.equipment_id} 상태 업데이트 실패:`, updateError)
          errorCount++
        } else {
          const equipment = equipments.find(e => e.id === breakdown.equipment_id)
          console.log(`   ✅ ${equipment?.equipment_number || breakdown.equipment_id} 상태를 breakdown으로 변경`)
          fixedCount++
        }
      }
    }
    
    // 5. 해결된 고장의 설비 상태 복구
    console.log('\n5. 해결된 고장의 설비 상태 복구 중...')
    const { data: resolvedBreakdowns, error: rError } = await supabase
      .from('breakdown_reports')
      .select('*')
      .in('status', ['completed', 'resolved'])
      .order('updated_at', { ascending: false })
    
    if (rError) throw rError
    
    // 각 설비의 최신 해결된 고장 찾기
    const latestResolved = new Map()
    for (const breakdown of resolvedBreakdowns) {
      if (!latestResolved.has(breakdown.equipment_id)) {
        latestResolved.set(breakdown.equipment_id, breakdown)
      }
    }
    
    // 활성 고장이 없고 상태가 breakdown인 설비를 running으로 변경
    const activeBreakdownEquipmentIds = new Set(breakdowns.map(b => b.equipment_id))
    
    for (const [equipmentId, status] of statusMap.entries()) {
      if (status.status === 'breakdown' && !activeBreakdownEquipmentIds.has(equipmentId)) {
        const { error: updateError } = await supabase
          .from('equipment_status')
          .update({
            status: 'running',
            status_reason: '고장 해결됨',
            status_changed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('equipment_id', equipmentId)
        
        if (updateError) {
          console.error(`   ❌ 설비 ${equipmentId} 상태 복구 실패:`, updateError)
          errorCount++
        } else {
          const equipment = equipments.find(e => e.id === equipmentId)
          console.log(`   ✅ ${equipment?.equipment_number || equipmentId} 상태를 running으로 복구`)
          fixedCount++
        }
      }
    }
    
    // 6. 고아 상태 레코드 정리
    console.log('\n6. 고아 상태 레코드 정리 중...')
    const equipmentIds = new Set(equipments.map(e => e.id))
    const orphanStatuses = statuses.filter(s => !equipmentIds.has(s.equipment_id))
    
    if (orphanStatuses.length > 0) {
      const orphanIds = orphanStatuses.map(s => s.id)
      const { error: deleteError } = await supabase
        .from('equipment_status')
        .delete()
        .in('id', orphanIds)
      
      if (deleteError) {
        console.error('   ❌ 고아 상태 삭제 실패:', deleteError)
        errorCount++
      } else {
        console.log(`   ✅ ${orphanStatuses.length}개 고아 상태 레코드 삭제`)
        fixedCount += orphanStatuses.length
      }
    } else {
      console.log('   ✅ 고아 상태 레코드가 없습니다')
    }
    
    // 7. 데이터 일관성 검증
    console.log('\n7. 데이터 일관성 검증 중...')
    const { data: finalStatuses, error: finalError } = await supabase
      .from('equipment_status')
      .select('*')
    
    if (finalError) throw finalError
    
    const statusCounts = finalStatuses.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1
      return acc
    }, {})
    
    console.log('   최종 상태 분포:', statusCounts)
    
  } catch (error) {
    console.error('\n❌ 수정 중 오류 발생:', error)
    errorCount++
  }
  
  // 결과 요약
  console.log('\n\n=== 📊 수정 결과 요약 ===\n')
  console.log(`✅ 수정된 항목: ${fixedCount}개`)
  console.log(`❌ 오류 발생: ${errorCount}개`)
  
  if (errorCount === 0) {
    console.log('\n🎉 모든 동기화 문제가 성공적으로 해결되었습니다!')
  } else {
    console.log('\n⚠️ 일부 문제가 남아있습니다. 로그를 확인하세요.')
  }
  
  // 권장사항
  console.log('\n\n=== 💡 다음 단계 권장사항 ===\n')
  console.log('1. 애플리케이션을 재시작하여 변경사항을 적용하세요')
  console.log('2. 브라우저 캐시를 강제 새로고침하세요 (Ctrl+Shift+R)')
  console.log('3. 대시보드에서 데이터가 올바르게 표시되는지 확인하세요')
  console.log('4. 고장 신고 시 설비 상태가 자동으로 변경되는지 테스트하세요')
  
  process.exit(errorCount > 0 ? 1 : 0)
}

fixAllSyncIssues()