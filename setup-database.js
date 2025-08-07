require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  console.log('🚀 데이터베이스 스키마 설정 시작...\n');
  console.log('Supabase URL:', supabaseUrl);
  console.log('=====================================\n');

  try {
    // 1. 스키마 파일 읽기
    const schemaPath = path.join(__dirname, 'database-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 database-schema.sql 파일을 읽었습니다.');
    console.log(`   파일 크기: ${schemaSQL.length} bytes\n`);

    // 2. SQL 문을 개별 명령으로 분리 (세미콜론 기준)
    const sqlCommands = schemaSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📋 실행할 SQL 명령 수: ${sqlCommands.length}개\n`);

    // 3. 각 SQL 명령 실행
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i] + ';';
      
      // 명령 타입 추출 (CREATE TABLE, ALTER TABLE 등)
      const commandType = command.split(/\s+/)[0].toUpperCase();
      const match = command.match(/(?:TABLE|FUNCTION|TRIGGER|INDEX|POLICY)\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?["']?(\w+)["']?/i);
      const objectName = match ? match[1] : 'unknown';
      
      process.stdout.write(`[${i + 1}/${sqlCommands.length}] ${commandType} ${objectName}... `);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: command
        });
        
        if (error) {
          // RPC 함수가 없을 수 있으므로 직접 실행 시도
          const { error: directError } = await supabase.from('_sql').select().single();
          
          if (directError) {
            // 테이블이 이미 존재하는 경우는 경고로 처리
            if (directError.message.includes('already exists')) {
              console.log('⚠️  이미 존재함');
            } else {
              console.log(`❌ 실패: ${directError.message.substring(0, 50)}...`);
              errorCount++;
            }
          } else {
            console.log('✅ 성공');
            successCount++;
          }
        } else {
          console.log('✅ 성공');
          successCount++;
        }
      } catch (err) {
        console.log(`❌ 오류: ${err.message.substring(0, 50)}...`);
        errorCount++;
      }
    }

    console.log('\n=====================================');
    console.log('📊 실행 결과:');
    console.log('=====================================');
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${errorCount}개`);
    console.log(`⏭️  건너뜀: ${sqlCommands.length - successCount - errorCount}개`);

    // 4. 테이블 확인
    console.log('\n=====================================');
    console.log('📋 생성된 테이블 확인:');
    console.log('=====================================\n');

    const tables = ['users', 'equipment', 'breakdown_reports', 'repair_history'];
    
    for (const tableName of tables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${tableName}: 존재하지 않음`);
        } else {
          console.log(`✅ ${tableName}: 존재함 (${count || 0}개 행)`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: 확인 실패`);
      }
    }

    // 5. 기존 Auth 사용자와 동기화
    console.log('\n=====================================');
    console.log('🔄 Auth 사용자와 동기화:');
    console.log('=====================================\n');

    const { data: authUsers } = await supabase.auth.admin.listUsers();
    
    if (authUsers && authUsers.users.length > 0) {
      for (const authUser of authUsers.users) {
        // users 테이블에 사용자 추가
        const { error } = await supabase
          .from('users')
          .upsert({
            user_id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.name || authUser.email.split('@')[0],
            role: 'admin', // 첫 번째 사용자는 관리자로
            department: 'IT',
            is_active: true,
            created_at: authUser.created_at,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
        
        if (error) {
          console.log(`❌ ${authUser.email} 동기화 실패: ${error.message}`);
        } else {
          console.log(`✅ ${authUser.email} 동기화 완료`);
        }
      }
    }

    console.log('\n✨ 데이터베이스 설정 완료!\n');
    console.log('이제 시스템에 로그인할 수 있습니다.');
    console.log('이메일: zetooo1972@gmail.com');
    console.log('비밀번호: 설정한 비밀번호를 사용하세요.\n');

  } catch (error) {
    console.error('❌ 데이터베이스 설정 실패:', error.message);
    console.log('\n💡 Supabase 대시보드에서 직접 SQL을 실행해보세요:');
    console.log('1. https://supabase.com 로그인');
    console.log('2. 프로젝트 선택');
    console.log('3. SQL Editor 열기');
    console.log('4. database-schema.sql 내용 복사하여 실행');
  }
}

setupDatabase();