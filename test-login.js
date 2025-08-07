require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

// 클라이언트 생성 (anon key 사용 - 실제 앱과 동일한 환경)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('🔐 로그인 테스트\n');
  console.log('Supabase URL:', supabaseUrl);
  console.log('=====================================\n');

  // 테스트할 계정 정보
  const testAccounts = [
    { email: 'zetooo1972@gmail.com', password: 'Admin@123456' },
    { email: 'zetooo1972@gmail.com', password: 'Zetooo1972@' },
    { email: 'zetooo1972@gmail.com', password: 'zetooo1972' }
  ];

  for (const account of testAccounts) {
    console.log(`\n📧 시도: ${account.email}`);
    console.log(`🔑 비밀번호: ${'*'.repeat(account.password.length)}`);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password
      });

      if (error) {
        console.log(`❌ 실패: ${error.message}`);
      } else {
        console.log('✅ 로그인 성공!');
        console.log(`   사용자 ID: ${data.user.id}`);
        console.log(`   이메일 확인: ${data.user.email_confirmed_at ? '완료' : '미확인'}`);
        console.log(`   세션 유효: ${data.session ? '예' : '아니오'}`);
        
        // profiles 테이블 확인
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          console.log(`⚠️  profiles 테이블 조회 실패: ${profileError.message}`);
        } else if (profile) {
          console.log(`👤 프로필 정보:`);
          console.log(`   - 이름: ${profile.full_name || '미설정'}`);
          console.log(`   - 역할: ${profile.role}`);
          console.log(`   - 부서: ${profile.department || '미설정'}`);
          console.log(`   - 활성: ${profile.is_active ? '예' : '아니오'}`);
        }
        
        // 로그아웃
        await supabase.auth.signOut();
        console.log('🔓 로그아웃 완료');
        
        break; // 성공하면 다른 비밀번호는 시도하지 않음
      }
    } catch (err) {
      console.log(`❌ 예외 발생: ${err.message}`);
    }
  }

  console.log('\n=====================================');
  console.log('💡 로그인이 실패하는 경우:');
  console.log('=====================================');
  console.log('1. Supabase 대시보드에서 비밀번호 재설정');
  console.log('2. database-schema-safe.sql 실행하여 profiles 테이블 생성');
  console.log('3. 이메일 확인이 필요한 경우 확인 메일 재전송');
  console.log('\n현재 설정된 비밀번호: Admin@123456');
}

// 실행
testLogin();