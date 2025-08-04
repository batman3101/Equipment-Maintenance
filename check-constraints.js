// 데이터베이스 제약조건 분석 스크립트
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

async function checkConstraints() {
  try {
    console.log('🔍 데이터베이스 제약조건 분석 중...\n')
    
    // 1. profiles 테이블 제약조건 확인 (간접적으로)
    try {
      const { data: constraintData, error } = await supabaseAdmin
        .from('information_schema.table_constraints')
        .select('*')
        .eq('table_name', 'profiles')
      
      if (error) throw error
    
      console.log('📊 Profiles 테이블 제약조건:')
      if (constraintData) {
        constraintData.forEach(constraint => {
          console.log(`   - ${constraint.constraint_name}: ${constraint.constraint_type}`)
        })
      } else {
        console.log('   제약조건 정보를 직접 조회할 수 없음')
      }
    } catch (error) {
      console.log('   제약조건 조회 실패:', error.message)
    }
    
    // 2. 외래키 관계 확인
    const { data: fkData, error: fkError } = await supabaseAdmin
      .from('information_schema.key_column_usage')
      .select('*')
      .eq('table_name', 'profiles')
      .catch(() => null)
    
    console.log('\n🔗 외래키 관계:')
    if (fkData && fkData.length > 0) {
      fkData.forEach(fk => {
        console.log(`   - ${fk.column_name} → ${fk.referenced_table_name}.${fk.referenced_column_name}`)
      })
    } else {
      console.log('   외래키 정보를 조회할 수 없음')
    }
    
    // 3. 트리거 확인
    const { data: triggerData, error: triggerError } = await supabaseAdmin
      .from('information_schema.triggers')
      .select('*')
      .eq('event_object_table', 'profiles')
      .catch(() => null)
    
    console.log('\n⚡ 트리거:')
    if (triggerData && triggerData.length > 0) {
      triggerData.forEach(trigger => {
        console.log(`   - ${trigger.trigger_name}: ${trigger.action_timing} ${trigger.event_manipulation}`)
      })
    } else {
      console.log('   트리거를 찾을 수 없음')
    }
    
    // 4. RLS 정책 확인
    const { data: rlsData, error: rlsError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'profiles')
      .catch(() => null)
    
    console.log('\n🔒 RLS 정책:')
    if (rlsData && rlsData.length > 0) {
      rlsData.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd} (${policy.permissive})`)
      })
    } else {
      console.log('   RLS 정책을 찾을 수 없음')
    }
    
    // 5. 테이블 구조 직접 확인
    console.log('\n📋 Profiles 테이블 구조:')
    const { data: tableData, error: tableError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(0)
    
    if (tableError) {
      console.log('   테이블 구조 조회 실패:', tableError.message)
    } else {
      console.log('   테이블에 접근 가능함')
    }
    
    // 6. 제약조건 완화 방법 제안
    console.log('\n💡 제약조건 완화 방법:')
    console.log('   1. profiles.id를 auth.users.id와 분리')
    console.log('   2. profiles에 별도의 UUID 컬럼 추가')
    console.log('   3. 외래키 제약조건 일시적 비활성화')
    console.log('   4. auth_user_id 컬럼을 nullable로 변경')
    
  } catch (error) {
    console.error('💥 오류:', error.message)
  }
}

checkConstraints()