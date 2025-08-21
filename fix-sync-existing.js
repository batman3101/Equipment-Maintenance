// 기존 고장 신고와 설비 상태를 동기화하는 스크립트
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://ixgldvhxzcqlkxhjwupb.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Z2xkdmh4emNxbGt4aGp3dXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDExNDg5NywiZXhwIjoyMDY5NjkwODk3fQ.kg9EJ_bqh2eG3XFCjM3M_OF3z3iRBXcQnnDPEuGYk0M'

async function syncExistingData() {
  console.log('기존 고장 신고와 설비 상태 동기화 시작...')
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    // 1. 활성 고장 신고들 조회 (reported, assigned, in_progress 상태)
    console.log('\n1. 활성 고장 신고 조회 중...')
    const { data: activeBreakdowns, error: breakdownError } = await supabase
      .from('breakdown_reports')
      .select(`
        id,
        equipment_id,
        status,
        breakdown_title,
        equipment_info:equipment_id (
          equipment_number,
          equipment_name
        )
      `)
      .in('status', ['reported', 'assigned', 'in_progress'])
    
    if (breakdownError) {
      console.error('❌ 활성 고장 신고 조회 실패:', breakdownError.message)
      return
    }
    
    console.log(`✅ ${activeBreakdowns?.length || 0}개의 활성 고장 신고 발견`)
    
    if (!activeBreakdowns || activeBreakdowns.length === 0) {
      console.log('활성 고장 신고가 없습니다.')
      return
    }
    
    // 2. 각 활성 고장 신고에 대해 설비 상태를 breakdown으로 설정
    console.log('\n2. 설비 상태 동기화 중...')
    let successCount = 0
    let errorCount = 0
    
    for (const breakdown of activeBreakdowns) {
      try {
        console.log(`   처리 중: ${breakdown.equipment_info?.equipment_number} (고장 신고 ID: ${breakdown.id})`)
        
        const { error: statusError } = await supabase
          .from('equipment_status')
          .upsert({
            equipment_id: breakdown.equipment_id,
            status: 'breakdown',
            status_reason: `활성 고장 신고 동기화 (ID: ${breakdown.id})`,
            status_changed_at: new Date().toISOString(),
            notes: `기존 데이터 동기화: ${breakdown.breakdown_title}`
          })
        
        if (statusError) {
          console.error(`   ❌ 실패 - ${breakdown.equipment_info?.equipment_number}: ${statusError.message}`)
          errorCount++
        } else {
          console.log(`   ✅ 성공 - ${breakdown.equipment_info?.equipment_number}: breakdown 상태로 변경`)
          successCount++
        }
        
        // API 호출 제한을 위한 짧은 대기
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (err) {
        console.error(`   ❌ 오류 - ${breakdown.equipment_info?.equipment_number}: ${err.message}`)
        errorCount++
      }
    }
    
    console.log(`\n✅ 동기화 완료: 성공 ${successCount}개, 실패 ${errorCount}개`)
    
    // 3. 동기화 후 상태 확인
    console.log('\n3. 동기화 결과 확인...')
    const { data: statusCounts } = await supabase
      .from('equipment_status')
      .select('status')
    
    const counts = statusCounts?.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {}) || {}
    
    console.log('📊 현재 설비 상태 분포:')
    Object.entries(counts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`)
    })
    
    console.log('\n🎉 데이터 동기화가 완료되었습니다!')
    console.log('이제 설비 관리 페이지에서 정확한 고장 중 설비 수를 확인할 수 있습니다.')
    
  } catch (error) {
    console.error('❌ 동기화 실패:', error.message)
  }
}

syncExistingData().then(() => {
  console.log('\n프로그램 종료')
}).catch(error => {
  console.error('❌ 프로그램 오류:', error)
})