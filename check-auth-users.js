require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ 설정됨' : '❌ 없음');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ 설정됨' : '❌ 없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAuthUsers() {
  console.log('🔍 Supabase Auth 사용자 확인 중...\n');
  console.log('Supabase URL:', supabaseUrl);
  console.log('=====================================\n');

  try {
    // 1. auth.users 테이블의 모든 사용자 조회
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Auth 사용자 조회 실패:', authError.message);
      return;
    }

    console.log(`📋 전체 Auth 사용자 수: ${authUsers.users.length}명\n`);

    if (authUsers.users.length === 0) {
      console.log('⚠️  Auth에 등록된 사용자가 없습니다.');
      console.log('💡 사용자를 생성하려면 create-system-admin.js를 실행하세요.\n');
    } else {
      console.log('Auth 사용자 목록:');
      console.log('=====================================');
      
      for (const user of authUsers.users) {
        console.log(`\n👤 사용자 ID: ${user.id}`);
        console.log(`   📧 이메일: ${user.email}`);
        console.log(`   ✅ 이메일 확인: ${user.email_confirmed_at ? '완료' : '미확인'}`);
        console.log(`   📅 생성일: ${new Date(user.created_at).toLocaleString('ko-KR')}`);
        console.log(`   🔐 마지막 로그인: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('ko-KR') : '없음'}`);
        console.log(`   🔹 메타데이터:`, user.user_metadata);
      }
    }

    // 2. users 테이블 확인
    console.log('\n\n=====================================');
    console.log('📋 users 테이블 확인:');
    console.log('=====================================\n');

    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('❌ users 테이블 조회 실패:', dbError.message);
      console.log('💡 database-schema.sql을 실행하여 테이블을 생성하세요.\n');
      return;
    }

    if (dbUsers.length === 0) {
      console.log('⚠️  users 테이블에 데이터가 없습니다.');
    } else {
      console.log(`전체 사용자 수: ${dbUsers.length}명\n`);
      
      for (const user of dbUsers) {
        console.log(`👤 ${user.name} (${user.user_id})`);
        console.log(`   📧 이메일: ${user.email}`);
        console.log(`   👷 역할: ${user.role}`);
        console.log(`   🏢 부서: ${user.department || '미지정'}`);
        console.log(`   📱 연락처: ${user.phone || '없음'}`);
        console.log(`   🔹 상태: ${user.is_active ? '✅ 활성' : '❌ 비활성'}`);
        console.log('');
      }
    }

    // 3. 동기화 확인
    console.log('\n=====================================');
    console.log('🔄 Auth-DB 동기화 확인:');
    console.log('=====================================\n');

    let syncIssues = false;
    
    // Auth에는 있지만 DB에는 없는 사용자
    for (const authUser of authUsers.users) {
      const dbUser = dbUsers.find(u => u.user_id === authUser.id);
      if (!dbUser) {
        console.log(`⚠️  Auth에만 존재: ${authUser.email} (${authUser.id})`);
        syncIssues = true;
      }
    }

    // DB에는 있지만 Auth에는 없는 사용자
    for (const dbUser of dbUsers) {
      const authUser = authUsers.users.find(u => u.id === dbUser.user_id);
      if (!authUser) {
        console.log(`⚠️  DB에만 존재: ${dbUser.email} (${dbUser.user_id})`);
        syncIssues = true;
      }
    }

    if (!syncIssues) {
      console.log('✅ Auth와 DB가 완벽하게 동기화되어 있습니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

// 테스트 로그인 함수
async function testLogin(email, password) {
  console.log('\n\n=====================================');
  console.log('🔐 로그인 테스트:');
  console.log('=====================================\n');
  
  console.log(`이메일: ${email}`);
  console.log(`비밀번호: ${'*'.repeat(password.length)}`);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.log(`\n❌ 로그인 실패: ${error.message}`);
      
      if (error.message.includes('Invalid login credentials')) {
        console.log('\n가능한 원인:');
        console.log('1. 이메일 또는 비밀번호가 잘못되었습니다.');
        console.log('2. 계정이 존재하지 않습니다.');
        console.log('3. 이메일이 확인되지 않았습니다.');
      }
    } else {
      console.log('\n✅ 로그인 성공!');
      console.log('사용자 ID:', data.user.id);
      console.log('이메일:', data.user.email);
      console.log('세션 토큰:', data.session.access_token.substring(0, 20) + '...');
    }
  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error);
  }
}

// 실행
async function main() {
  await checkAuthUsers();
  
  // 테스트 로그인 (예시 - 실제 계정 정보로 변경 필요)
  // await testLogin('admin@almustech.com', 'Admin@123456');
}

main();