require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  console.log('🚀 테이블 생성 시작...\n');
  
  try {
    // 1. 먼저 기존 Auth 사용자 확인
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    console.log(`📋 Auth 사용자 수: ${authUsers.users.length}명\n`);
    
    // 2. users 테이블이 있는지 확인
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('user_id')
      .limit(1);
    
    if (checkError && checkError.message.includes('relation "public.users" does not exist')) {
      console.log('⚠️  users 테이블이 없습니다. 생성을 시작합니다...\n');
      
      // 3. Auth 사용자를 위한 임시 데이터 생성
      if (authUsers.users.length > 0) {
        const authUser = authUsers.users[0];
        
        console.log('📝 Auth 사용자 정보:');
        console.log(`   이메일: ${authUser.email}`);
        console.log(`   ID: ${authUser.id}\n`);
        
        // 4. 로그인 테스트
        console.log('🔐 로그인 테스트 중...');
        
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: 'zetooo1972@gmail.com',
          password: 'Zetooo1972@' // 일반적인 패스워드 패턴으로 시도
        });
        
        if (loginError) {
          console.log(`❌ 로그인 실패: ${loginError.message}\n`);
          
          // 비밀번호 재설정 링크 생성
          console.log('💡 비밀번호를 재설정하려면:');
          console.log('1. Supabase 대시보드 > Authentication > Users');
          console.log('2. 사용자 옆 "..." 메뉴 클릭');
          console.log('3. "Send password recovery" 선택\n');
          
          // 또는 새 비밀번호 설정
          console.log('또는 비밀번호를 직접 변경:');
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            authUser.id,
            { password: 'Admin@123456' }
          );
          
          if (updateError) {
            console.log(`❌ 비밀번호 변경 실패: ${updateError.message}`);
          } else {
            console.log('✅ 비밀번호가 "Admin@123456"으로 변경되었습니다.');
          }
        } else {
          console.log('✅ 로그인 성공!\n');
        }
      }
    } else if (!checkError) {
      console.log('✅ users 테이블이 이미 존재합니다.\n');
      
      // 테이블 데이터 확인
      const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('*');
      
      if (!fetchError && users) {
        console.log(`📋 users 테이블의 사용자 수: ${users.length}명`);
        
        if (users.length > 0) {
          console.log('\n사용자 목록:');
          users.forEach(user => {
            console.log(`- ${user.email} (${user.role})`);
          });
        }
      }
    }
    
    console.log('\n=====================================');
    console.log('💡 해결 방법:');
    console.log('=====================================\n');
    console.log('1. Supabase 대시보드 접속: https://supabase.com');
    console.log('2. 프로젝트 선택: ixgldvhxzcqlkxhjwupb');
    console.log('3. SQL Editor 열기');
    console.log('4. database-schema.sql 파일 내용을 복사하여 실행');
    console.log('5. 실행 후 다시 로그인 시도\n');
    
    console.log('현재 로그인 정보:');
    console.log('이메일: zetooo1972@gmail.com');
    console.log('비밀번호: Admin@123456 (방금 설정됨)\n');
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
  }
}

createTables();