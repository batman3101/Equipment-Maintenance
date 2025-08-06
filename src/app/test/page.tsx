'use client'

export default function TestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>환경 변수 테스트 페이지</h1>
      <div style={{ marginTop: '20px' }}>
        <h2>현재 환경 변수:</h2>
        <ul style={{ fontFamily: 'monospace', fontSize: '14px' }}>
          <li>NODE_ENV: {process.env.NODE_ENV}</li>
          <li>NEXT_PUBLIC_OFFLINE_MODE: {process.env.NEXT_PUBLIC_OFFLINE_MODE}</li>
          <li>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</li>
          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '[설정됨]' : '[설정안됨]'}</li>
        </ul>
      </div>
    </div>
  )
}