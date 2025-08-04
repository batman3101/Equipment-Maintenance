// zetooo1972@gmail.com 계정 로그인 테스트
const { createClient } = require('@supabase/supabase-js')

const supabaseClient = createClient(
  'https://ixgldvhxzcqlkxhjwupb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Z2xkdmh4emNxbGt4aGp3dXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMTQ4OTcsImV4cCI6MjA2OTY5MDg5N30.JECK1CDBgW_pawpp7JtPtKYxLlsvjaCoKoHLiBRAnxI'
)

async function testLogin() {
  console.log('🧪 zetooo1972@gmail.com 로그인 테스트...\n')
  
  const passwords = ['admin123!', 'admin123', 'Admin123!', 'system123!', 'password123', 'zetooo1972']
  
  for (const password of passwords) {
    console.log(`🔑 비밀번호 시도: ${password}`)
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: 'zetooo1972@gmail.com',
      password: password
    })
    
    if (error) {
      console.log(`❌ 실패: ${error.message}`)
    } else {
      console.log(`✅ 성공! 사용자 ID: ${data.user.id}`)
      console.log(`📧 이메일: ${data.user.email}`)
      
      // 로그아웃
      await supabaseClient.auth.signOut()
      return
    }
  }
  
  console.log('\n❌ 모든 비밀번호 시도 실패')
}

testLogin().catch(console.error)