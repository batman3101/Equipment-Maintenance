// 기존 시스템 관리자 계정 수정 및 비밀번호 재설정
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

async function fixAdminAccount() {
  try {
    console.log('🔧 기존 관리자 계정 수정 중...\n')
    
    // 1. 기존 시스템 관리자 찾기
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const adminUser = authUsers.users.find(u => u.email === 'zetooo1972@gmail.com')
    
    if (!adminUser) {
      console.error('❌ 기존 관리자 계정을 찾을 수 없습니다')
      return
    }
    
    console.log('✅ 기존 관리자 계정 발견:', adminUser.email)
    
    // 2. 프로필 역할을 system_admin으로 업데이트
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        role: 'system_admin',
        full_name: '시스템 관리자',
        department: 'IT'
      })
      .eq('id', adminUser.id)
    
    if (updateError) {
      console.error('❌ 프로필 업데이트 실패:', updateError.message)
      return
    }
    
    console.log('✅ 프로필 역할이 system_admin으로 업데이트됨')
    
    // 3. 비밀번호를 알려진 값으로 재설정
    const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
      adminUser.id,
      { password: 'admin123!' }
    )
    
    if (passwordError) {
      console.error('❌ 비밀번호 재설정 실패:', passwordError.message)
      return
    }
    
    console.log('✅ 비밀번호가 재설정됨')
    
    // 4. 업데이트된 정보 확인
    const { data: updatedProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single()
    
    console.log('\n🎉 계정 수정 완료!')
    console.log('📧 이메일:', adminUser.email)
    console.log('🔐 비밀번호: admin123!')
    console.log('👤 역할:', updatedProfile.role)
    console.log('🏢 부서:', updatedProfile.department)
    
    // 5. 테스트 로그인
    console.log('\n🧪 로그인 테스트 중...')
    const supabaseClient = createClient(
      'https://ixgldvhxzcqlkxhjwupb.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Z2xkdmh4emNxbGt4aGp3dXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMTQ4OTcsImV4cCI6MjA2OTY5MDg5N30.JECK1CDBgW_pawpp7JtPtKYxLlsvjaCoKoHLiBRAnxI'
    )
    
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: adminUser.email,
      password: 'admin123!'
    })
    
    if (loginError) {
      console.log('❌ 테스트 로그인 실패:', loginError.message)
    } else {
      console.log('✅ 테스트 로그인 성공!')
    }
    
  } catch (error) {
    console.error('💥 계정 수정 중 오류:', error.message)
  }
}

fixAdminAccount()