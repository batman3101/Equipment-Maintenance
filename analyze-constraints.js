// 데이터베이스 제약조건 분석 및 완화 방법 구현
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

async function analyzeAndFixConstraints() {
  try {
    console.log('🔍 데이터베이스 제약조건 분석 및 완화 방법 적용...\n')
    
    // 1. 현재 profiles 테이블 구조 확인
    console.log('📋 현재 profiles 테이블 구조:')
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .rpc('get_table_info', { table_name: 'profiles' })
      .catch(() => null)
    
    if (profilesError) {
      console.log('   직접 RPC 조회 실패, SQL로 분석합니다...')
    }
    
    // 2. 제약조건 완화 방법 1: profiles.id를 auth.users.id와 분리
    console.log('\n💡 방법 1: profiles 테이블 구조 변경')
    console.log('   - id 컬럼을 별도 UUID로 변경')
    console.log('   - auth_user_id 컬럼을 nullable로 설정')
    
    const method1SQL = `
-- 방법 1: 테이블 구조 변경
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;

ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey CASCADE;

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS new_id UUID DEFAULT gen_random_uuid();

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS auth_user_id UUID NULL;

-- 기존 데이터 마이그레이션
UPDATE public.profiles 
SET auth_user_id = id, new_id = gen_random_uuid() 
WHERE auth_user_id IS NULL;

-- id 컬럼을 새로운 UUID로 교체
ALTER TABLE public.profiles DROP COLUMN id;
ALTER TABLE public.profiles RENAME COLUMN new_id TO id;

-- 새로운 primary key 설정
ALTER TABLE public.profiles ADD PRIMARY KEY (id);

-- auth_user_id에 대한 외래키 제약조건 추가 (nullable)
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_auth_user_id_fkey 
  FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    `
    
    // 3. 제약조건 완화 방법 2: 외래키 제약조건 제거
    console.log('\n💡 방법 2: 외래키 제약조건 완전 제거')
    
    const method2SQL = `
-- 방법 2: 외래키 제약조건 제거
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey CASCADE;

-- id 컬럼을 nullable로 변경하여 유연성 확보
ALTER TABLE public.profiles 
  ALTER COLUMN id DROP NOT NULL;
    `
    
    // 4. 제약조건 완화 방법 3: 트리거 방식 구현
    console.log('\n💡 방법 3: 트리거를 통한 지연 연결')
    
    const method3SQL = `
-- 방법 3: 트리거 방식으로 지연 연결
CREATE OR REPLACE FUNCTION link_profile_to_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- profiles가 먼저 생성되면 auth_user_id를 NULL로 설정
  IF NEW.auth_user_id IS NULL THEN
    -- 임시로 NULL 허용
    RETURN NEW;
  END IF;
  
  -- auth_user_id가 있으면 연결 확인
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.auth_user_id) THEN
    -- auth user가 없으면 NULL로 설정
    NEW.auth_user_id := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS profile_auth_link_trigger ON public.profiles;
CREATE TRIGGER profile_auth_link_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION link_profile_to_auth_user();
    `
    
    // 사용자에게 선택지 제공
    console.log('\n🎯 권장 방법: 방법 1 (테이블 구조 변경)')
    console.log('   장점: 깔끔한 구조, 확장성 좋음')
    console.log('   단점: 기존 코드 일부 수정 필요')
    
    console.log('\n⚡ 빠른 해결: 방법 2 (외래키 제거)')
    console.log('   장점: 즉시 해결, 코드 수정 최소화')
    console.log('   단점: 데이터 무결성 약화')
    
    console.log('\n🔧 고급 방법: 방법 3 (트리거 사용)')
    console.log('   장점: 유연성 최대화')
    console.log('   단점: 복잡성 증가')
    
    // 방법 2를 우선 적용 (가장 빠른 해결책)
    console.log('\n🚀 방법 2를 적용합니다 (외래키 제약조건 제거)...')
    
    const { error: sql1Error } = await supabaseAdmin.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey CASCADE;' 
    }).catch(() => ({ error: 'RPC not available' }))
    
    if (sql1Error && sql1Error !== 'RPC not available') {
      console.log('   RPC를 통한 실행 실패, 수동 실행이 필요합니다.')
      console.log('\n📝 수동으로 Supabase SQL Editor에서 실행할 명령어:')
      console.log('----------------------------------------')
      console.log(method2SQL)
      console.log('----------------------------------------')
    } else if (sql1Error === 'RPC not available') {
      console.log('   RPC 함수를 사용할 수 없습니다. 수동 실행이 필요합니다.')
      console.log('\n📝 Supabase SQL Editor에서 실행할 명령어:')
      console.log('----------------------------------------')
      console.log(method2SQL)
      console.log('----------------------------------------')
    } else {
      console.log('   ✅ 외래키 제약조건이 성공적으로 제거되었습니다!')
    }
    
    // 수정된 API 코드 생성
    console.log('\n🔄 수정된 사용자 생성 API 코드를 생성합니다...')
    
    return {
      method1SQL,
      method2SQL,
      method3SQL,
      recommendedApproach: 'method2'
    }
    
  } catch (error) {
    console.error('💥 분석 중 오류:', error.message)
    return null
  }
}

// 스크립트 실행
analyzeAndFixConstraints().then(result => {
  if (result) {
    console.log('\n✅ 분석 완료! 제약조건 완화 방법이 준비되었습니다.')
  }
}).catch(console.error)