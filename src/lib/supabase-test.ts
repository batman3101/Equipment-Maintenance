import { supabase } from './supabase';

/**
 * Supabase 연결 테스트 함수
 * 콘솔에 결과를 출력합니다.
 */
export async function testSupabaseConnection() {
  console.log('Supabase 연결 테스트 시작...');
  
  try {
    // 1. 서버 시간 확인 (가장 기본적인 쿼리)
    const { data: serverTimeData, error: serverTimeError } = await supabase.rpc('get_server_time');
    
    if (serverTimeError) {
      console.error('서버 시간 확인 실패:', serverTimeError);
    } else {
      console.log('서버 시간 확인 성공:', serverTimeData);
    }
    
    // 2. 인증 상태 확인
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('인증 상태 확인 실패:', authError);
    } else {
      console.log('인증 상태 확인 성공:', authData);
    }
    
    // 3. 테이블 접근 테스트
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('count()')
      .limit(1);
    
    if (usersError) {
      console.error('users 테이블 접근 실패:', usersError);
    } else {
      console.log('users 테이블 접근 성공:', usersData);
    }
    
    return {
      success: !serverTimeError && !authError && !usersError,
      serverTime: serverTimeData,
      authData,
      usersData
    };
  } catch (error) {
    console.error('Supabase 연결 테스트 중 오류 발생:', error);
    return {
      success: false,
      error
    };
  }
}

/**
 * 테스트 계정으로 로그인 시도
 */
export async function testLogin(email: string, password: string) {
  console.log(`테스트 로그인 시도: ${email}`);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('로그인 실패:', error);
      return { success: false, error };
    }
    
    console.log('로그인 성공:', data);
    
    // 사용자 정보 조회
    if (data.user) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (userError) {
        console.error('사용자 정보 조회 실패:', userError);
      } else {
        console.log('사용자 정보 조회 성공:', userData);
      }
      
      return { success: true, user: data.user, profile: userData };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('로그인 테스트 중 오류 발생:', error);
    return { success: false, error };
  }
}