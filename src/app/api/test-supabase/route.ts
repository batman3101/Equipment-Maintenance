import { NextResponse } from 'next/server';
import { testSupabaseConnection, testLogin } from '@/lib/supabase-test';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email') || 'test@example.com';
  const password = url.searchParams.get('password') || 'password123';
  
  try {
    // 1. Supabase 연결 테스트
    const connectionTest = await testSupabaseConnection();
    
    // 2. 로그인 테스트
    const loginTest = await testLogin(email, password);
    
    return NextResponse.json({
      success: true,
      connectionTest,
      loginTest,
      env: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        // 보안을 위해 키의 일부만 표시
        supabaseKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) + '...',
        nodeEnv: process.env.NODE_ENV,
      }
    });
  } catch (error) {
    console.error('API 테스트 중 오류 발생:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}