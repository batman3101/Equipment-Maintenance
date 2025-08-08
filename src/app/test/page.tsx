'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

// 프로덕션 환경에서 정적 생성 방지
export const dynamic = 'force-dynamic'

/**
 * [ISP] Rule: 개발 환경에서만 사용되는 테스트 페이지 인터페이스 분리
 * 프로덕션 환경에서는 접근을 차단하여 보안성 향상
 */
export default function TestPage() {
  // 프로덕션 환경에서는 접근 차단
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      redirect('/')
    }
  }, [])

  // 프로덕션 환경에서는 빈 화면 반환 (useEffect 실행 전까지)
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffeaa7', 
        borderRadius: '4px', 
        padding: '10px', 
        marginBottom: '20px' 
      }}>
        ⚠️ <strong>개발 모드 전용 페이지</strong> - 프로덕션 환경에서는 접근할 수 없습니다.
      </div>
      
      <h1>환경 변수 테스트 페이지</h1>
      <div style={{ marginTop: '20px' }}>
        <h2>현재 환경 변수:</h2>
        <ul style={{ fontFamily: 'monospace', fontSize: '14px' }}>
          <li>NODE_ENV: {process.env.NODE_ENV}</li>
          <li>NEXT_PUBLIC_OFFLINE_MODE: {process.env.NEXT_PUBLIC_OFFLINE_MODE}</li>
          <li>NEXT_PUBLIC_DEBUG_MODE: {process.env.NEXT_PUBLIC_DEBUG_MODE}</li>
          <li>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '[설정됨]' : '[설정안됨]'}</li>
          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '[설정됨]' : '[설정안됨]'}</li>
        </ul>
        
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
          <h3>보안 상태:</h3>
          <ul>
            <li>환경: {process.env.NODE_ENV}</li>
            <li>오프라인 모드: {process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true' ? '활성' : '비활성'}</li>
            <li>디버그 모드: {process.env.NEXT_PUBLIC_DEBUG_MODE === 'true' ? '활성' : '비활성'}</li>
            <li>HTTPS: {process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://') ? '사용' : '미사용'}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}