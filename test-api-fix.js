// API 수정 사항을 테스트하는 스크립트
async function testApiFix() {
  console.log('🔧 API 수정 사항 테스트 중...')
  
  try {
    // 1. Equipment Status API 테스트
    console.log('\n1. Equipment Status API 테스트...')
    const statusResponse = await fetch('http://localhost:3007/api/equipment/bulk-status')
    console.log('Status API Response:', statusResponse.status, statusResponse.statusText)
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json()
      console.log('✅ API 응답 성공!')
      console.log(`📊 로드된 설비 상태: ${statusData.count}개`)
      console.log('상태별 분포:', statusData.metadata?.statusCounts)
      
      if (statusData.metadata?.statusCounts?.breakdown > 0) {
        console.log(`🎯 고장중 설비: ${statusData.metadata.statusCounts.breakdown}개 - 정상!`)
      } else {
        console.log('⚠️ 고장중 설비가 0개입니다. 데이터 동기화 확인 필요.')
      }
    } else {
      const errorText = await statusResponse.text()
      console.error('❌ API 응답 실패:', errorText)
    }
    
    // 2. Breakdown Reports API 테스트
    console.log('\n2. Breakdown Reports API 테스트...')
    const breakdownResponse = await fetch('http://localhost:3007/api/breakdown-reports')
    console.log('Breakdown API Response:', breakdownResponse.status, breakdownResponse.statusText)
    
    if (breakdownResponse.ok) {
      const breakdownData = await breakdownResponse.json()
      console.log('✅ Breakdown API 응답 성공!')
      console.log(`📋 로드된 고장 신고: ${breakdownData.data?.length || 0}개`)
    } else {
      const errorText = await breakdownResponse.text()
      console.error('❌ Breakdown API 응답 실패:', errorText)
    }
    
    console.log('\n🎉 API 테스트 완료!')
    console.log('이제 브라우저에서 설비 관리 페이지의 "새로고침" 버튼을 클릭해보세요!')
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message)
  }
}

testApiFix().catch(console.error)