// zetooo1972@gmail.com 계정 비밀번호 재설정
const { createClient } = require('@supabase/supabase-js')

const supabaseAdmin = createClient(
  'https://ixgldvhxzcqlkxhjwupb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Z2xkdmh4emNxbGt4aGp3dXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDExNDg5NywiZXhwIjoyMDY5NjkwODk3fQ.kg9EJ_bqh2eG3XFCjM3M_OF3z3iRBXcQnnDPEuGYk0M',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function resetPassword() {
  try {
    console.log('🔧 zetooo1972@gmail.com 비밀번호 재설정 중...\n')
    
    // 1. Auth 사용자 조회
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const targetUser = authUsers.users.find(u => u.email === 'zetooo1972@gmail.com')
    
    if (!targetUser) {
      console.error('❌ zetooo1972@gmail.com 계정을 찾을 수 없습니다')
      return
    }
    
    console.log('✅ 계정 발견:', targetUser.email)
    console.log('📅 생성일:', targetUser.created_at)
    console.log('🔗 마지막 로그인:', targetUser.last_sign_in_at || '없음')
    
    // 2. 비밀번호를 admin123!으로 재설정
    const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { password: 'admin123!' }
    )
    
    if (passwordError) {
      console.error('❌ 비밀번호 재설정 실패:', passwordError.message)
      return
    }
    
    console.log('✅ 비밀번호가 admin123!으로 재설정됨')
    
    // 3. 프로필 확인
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', targetUser.id)
      .single()
    
    console.log('\n📋 프로필 정보:')
    console.log('👤 이름:', profile?.full_name || '없음')
    console.log('🏢 부서:', profile?.department || '없음')
    console.log('👨‍💼 역할:', profile?.role || '없음')
    console.log('✅ 활성:', profile?.is_active)
    
    // 4. 테스트 로그인
    console.log('\n🧪 재설정된 비밀번호로 로그인 테스트...')
    const supabaseClient = createClient(
      'https://ixgldvhxzcqlkxhjwupb.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Z2xkdmh4emNxbGt4aGp3dXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMTQ4OTcsImV4cCI6MjA2OTY5MDg5N30.JECK1CDBgW_pawpp7JtPtKYxLlsvjaCoKoHLiBRAnxI'
    )
    
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: 'zetooo1972@gmail.com',
      password: 'admin123!'
    })
    
    if (loginError) {
      console.log('❌ 테스트 로그인 실패:', loginError.message)
    } else {
      console.log('✅ 테스트 로그인 성공!')
      console.log('🎉 웹 앱에서 이제 다음 정보로 로그인하세요:')
      console.log('📧 이메일: zetooo1972@gmail.com')
      console.log('🔐 비밀번호: admin123!')
      
      await supabaseClient.auth.signOut()
    }
    
  } catch (error) {
    console.error('💥 오류:', error.message)
  }
}

resetPassword()