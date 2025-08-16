// [DEPRECATED] 이 API는 중복되어 삭제 예정입니다.
// 대신 /api/analytics/dashboard를 사용하세요.

import { NextResponse } from 'next/server'

export async function GET() {
  // 통합 API로 리다이렉트
  return NextResponse.redirect(new URL('/api/analytics/dashboard', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
}