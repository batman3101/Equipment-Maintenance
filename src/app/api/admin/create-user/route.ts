// app/api/admin/create-user/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service Role Key로 Supabase Admin 클라이언트 생성
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service Role Key 사용
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

interface CreateUserRequest {
  email: string
  password: string
  role: 'system_admin' | 'manager' | 'user'
  full_name: string
  department?: string
  phone?: string
}

export async function POST(request: NextRequest) {
  try {
    // 현재 요청자의 권한 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // 토큰으로 현재 사용자 확인
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 현재 사용자의 프로필 확인
    const { data: currentProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !currentProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
    }

    // 요청 본문 파싱
    const body: CreateUserRequest = await request.json()
    const { email, password, role, full_name, department, phone } = body

    // 권한 체크
    if (currentProfile.role === 'system_admin') {
      // 시스템 관리자는 모든 계정 생성 가능
    } else if (currentProfile.role === 'manager' && role !== 'user') {
      return NextResponse.json(
        { error: '관리자는 일반 사용자만 생성할 수 있습니다' }, 
        { status: 403 }
      )
    } else if (currentProfile.role !== 'system_admin' && currentProfile.role !== 'manager') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    // 이메일 중복 체크
    const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers()
    const emailExists = existingAuthUsers?.users.some(u => u.email === email)
    
    if (emailExists) {
      return NextResponse.json({ 
        error: '이미 존재하는 이메일 주소입니다' 
      }, { status: 400 })
    }

    // 1단계: Auth Users에 사용자 생성
    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 이메일 확인 건너뛰기
      user_metadata: {
        full_name,
        role,
        department
      }
    })

    if (authCreateError) {
      console.error('Auth user creation error:', authCreateError)
      return NextResponse.json({ 
        error: authCreateError.message || '사용자 생성 실패' 
      }, { status: 400 })
    }

    // 2단계: Profiles 테이블에 프로필 생성 (재시도 로직 포함)
    let profileData = null
    let attempts = 0
    const maxAttempts = 3
    
    while (attempts < maxAttempts && !profileData) {
      attempts++
      
      try {
        const { data: profile, error: profileCreateError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: authData.user.id,
            email,
            role,
            full_name,
            department,
            phone,
            is_active: true
          })
          .select()
          .single()

        if (profileCreateError) {
          console.error(`Profile creation error (attempt ${attempts}):`, profileCreateError)
          
          if (attempts === maxAttempts) {
            // 마지막 시도에서도 실패시 auth user 삭제 (롤백)
            console.log('Rolling back auth user creation...')
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
            
            return NextResponse.json({ 
              error: `프로필 생성 실패 (${attempts}번 시도): ${profileCreateError.message}` 
            }, { status: 400 })
          }
          
          // 재시도 전 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 1000))
        } else {
          profileData = profile
          console.log(`Profile created successfully on attempt ${attempts}`)
        }
      } catch (error) {
        console.error(`Unexpected error on attempt ${attempts}:`, error)
        if (attempts === maxAttempts) {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
          return NextResponse.json({ 
            error: '프로필 생성 중 예상치 못한 오류가 발생했습니다' 
          }, { status: 500 })
        }
      }
    }

    // 3단계: 로그 기록
    await supabaseAdmin
      .from('system_settings')
      .insert({
        setting_key: `user_creation_${Date.now()}`,
        setting_value: JSON.stringify({
          action: 'create_user_via_api',
          created_by: user.id,
          created_user_id: authData.user.id,
          target_email: email,
          role: role,
          timestamp: new Date().toISOString()
        }),
        category: 'audit_log',
        updated_by: user.id
      })

    // 성공 응답
    return NextResponse.json({
      success: true,
      message: '사용자가 성공적으로 생성되었습니다',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: profileData.role,
        full_name: profileData.full_name,
        department: profileData.department
      },
      credentials: {
        email,
        password, // 임시 비밀번호 (실제로는 이메일로 발송해야 함)
        note: '첫 로그인 후 비밀번호를 변경해주세요'
      }
    }, { status: 201 })

  } catch (error) {
    console.error('User creation API error:', error)
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}