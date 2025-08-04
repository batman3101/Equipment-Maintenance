// Supabase에서 시스템 관리자 계정 생성 스크립트
const { createClient } = require('@supabase/supabase-js')

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ixgldvhxzcqlkxhjwupb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Z2xkdmh4emNxbGt4aGp3dXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDExNDg5NywiZXhwIjoyMDY5NjkwODk3fQ.kg9EJ_bqh2eG3XFCjM3M_OF3z3iRBXcQnnDPEuGYk0M',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function createSystemAdmin() {
  try {
    console.log('🚀 시스템 관리자 계정 생성 중...')
    
    // 1. Auth 사용자 생성
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@almustech.com',
      password: 'admin123!',
      email_confirm: true,
      user_metadata: {
        full_name: '시스템 관리자',
        role: 'system_admin',
        department: 'IT'
      }
    })

    if (authError) {
      console.error('❌ Auth 사용자 생성 실패:', authError.message)
      return
    }

    console.log('✅ Auth 사용자 생성 성공:', authData.user.email)

    // 2. 프로필 생성
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: 'admin@almustech.com',
        role: 'system_admin',
        full_name: '시스템 관리자',
        department: 'IT',
        phone: '+84-28-1234-5678',
        is_active: true
      })
      .select()
      .single()

    if (profileError) {
      console.error('❌ 프로필 생성 실패:', profileError.message)
      // Auth 사용자 롤백
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return
    }

    console.log('✅ 프로필 생성 성공:', profileData.email)
    
    console.log('\n🎉 시스템 관리자 계정 생성 완료!')
    console.log('📧 이메일: admin@almustech.com')
    console.log('🔐 비밀번호: admin123!')
    console.log('👤 역할: 시스템 관리자')
    
  } catch (error) {
    console.error('💥 예상치 못한 오류:', error.message)
  }
}

// 기존 계정 존재 확인 함수
async function checkExistingAccount() {
  try {
    console.log('🔍 기존 계정 확인 중...')
    
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', 'admin@almustech.com')
    
    if (error) {
      console.error('❌ 계정 확인 실패:', error.message)
      return false
    }
    
    if (profiles && profiles.length > 0) {
      console.log('✅ 기존 계정 발견:', profiles[0].email)
      console.log('👤 역할:', profiles[0].role)
      console.log('🔗 활성 상태:', profiles[0].is_active)
      return true
    }
    
    console.log('📭 기존 계정 없음')
    return false
    
  } catch (error) {
    console.error('💥 계정 확인 오류:', error.message)
    return false
  }
}

// 실행
async function main() {
  const exists = await checkExistingAccount()
  
  if (!exists) {
    await createSystemAdmin()
  } else {
    console.log('ℹ️  기존 계정이 있으므로 새로 생성하지 않습니다.')
    console.log('📧 로그인 정보: admin@almustech.com / admin123!')
  }
}

main().catch(console.error)