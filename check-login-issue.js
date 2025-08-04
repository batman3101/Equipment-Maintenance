// 로그인 문제 진단 스크립트
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

async function checkLoginIssue() {
  console.log('🔍 로그인 문제 진단 중...\n')
  
  try {
    // 1. Auth 사용자 목록 확인
    console.log('1️⃣ Auth 사용자 확인:')
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Auth 사용자 조회 실패:', authError.message)
    } else {
      console.log(`✅ 총 ${authUsers.users.length}명의 Auth 사용자 발견`)
      authUsers.users.forEach(user => {
        console.log(`   - ${user.email} (확인됨: ${user.email_confirmed_at ? '✅' : '❌'})`)
      })
    }
    
    // 2. Profiles 테이블 확인
    console.log('\n2️⃣ Profiles 테이블 확인:')
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
    
    if (profileError) {
      console.error('❌ 프로필 조회 실패:', profileError.message)
    } else {
      console.log(`✅ 총 ${profiles.length}명의 프로필 발견`)
      profiles.forEach(profile => {
        console.log(`   - ${profile.email} (역할: ${profile.role}, 활성: ${profile.is_active})`)
      })
    }
    
    // 3. 특정 계정 상세 확인
    console.log('\n3️⃣ admin@almustech.com 계정 상세 확인:')
    
    // Auth 사용자 확인
    const adminAuthUser = authUsers?.users.find(u => u.email === 'admin@almustech.com')
    if (adminAuthUser) {
      console.log(`✅ Auth 사용자 존재:`)
      console.log(`   - ID: ${adminAuthUser.id}`)
      console.log(`   - 이메일 확인: ${adminAuthUser.email_confirmed_at ? '✅' : '❌'}`)
      console.log(`   - 생성일: ${adminAuthUser.created_at}`)
      console.log(`   - 마지막 로그인: ${adminAuthUser.last_sign_in_at || '없음'}`)
    } else {
      console.log('❌ Auth 사용자 없음')
    }
    
    // Profile 확인
    const adminProfile = profiles?.find(p => p.email === 'admin@almustech.com')
    if (adminProfile) {
      console.log(`✅ 프로필 존재:`)
      console.log(`   - ID: ${adminProfile.id}`)
      console.log(`   - 역할: ${adminProfile.role}`)
      console.log(`   - 활성 상태: ${adminProfile.is_active}`)
      console.log(`   - 이름: ${adminProfile.full_name}`)
    } else {
      console.log('❌ 프로필 없음')
    }
    
    // 4. 테스트 로그인 시도
    console.log('\n4️⃣ 테스트 로그인 시도:')
    const supabaseClient = createClient(
      'https://ixgldvhxzcqlkxhjwupb.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Z2xkdmh4emNxbGt4aGp3dXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMTQ4OTcsImV4cCI6MjA2OTY5MDg5N30.JECK1CDBgW_pawpp7JtPtKYxLlsvjaCoKoHLiBRAnxI'
    )
    
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: 'admin@almustech.com',
      password: 'admin123!'
    })
    
    if (loginError) {
      console.log('❌ 로그인 실패:', loginError.message)
      
      // 다른 일반적인 비밀번호들도 시도해보기
      console.log('\n🔄 다른 비밀번호 시도:')
      const passwords = ['admin123', 'Admin123!', 'system123!', 'password123']
      
      for (const pwd of passwords) {
        const { error: testError } = await supabaseClient.auth.signInWithPassword({
          email: 'admin@almustech.com',
          password: pwd
        })
        
        if (!testError) {
          console.log(`✅ 로그인 성공! 비밀번호: ${pwd}`)
          break
        } else {
          console.log(`❌ ${pwd}: ${testError.message}`)
        }
      }
    } else {
      console.log('✅ 로그인 성공!')
      console.log(`   - 사용자 ID: ${loginData.user.id}`)
      console.log(`   - 이메일: ${loginData.user.email}`)
    }
    
  } catch (error) {
    console.error('💥 진단 중 오류:', error.message)
  }
}

checkLoginIssue()