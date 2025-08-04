// app/api/admin/create-user-flexible/route.ts
// 제약조건 완화된 사용자 생성 API - Auth user 생성 없이도 profiles 생성 가능
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
  create_auth_user?: boolean // 선택적으로 Auth user 생성
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
    const { email, password, role, full_name, department, phone, create_auth_user = true } = body

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

    // 이메일 중복 체크 (profiles 테이블에서)
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single()
    
    if (existingProfile) {
      return NextResponse.json({ 
        error: '이미 존재하는 이메일 주소입니다' 
      }, { status: 400 })
    }

    let authUserId = null
    let authUserCreated = false

    // Auth user 생성 (선택적)
    if (create_auth_user) {
      try {
        // Auth Users에서 이메일 중복 체크
        const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers()
        const emailExists = existingAuthUsers?.users.some(u => u.email === email)
        
        if (!emailExists) {
          const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              full_name,
              role,
              department
            }
          })

          if (!authCreateError && authData.user) {
            authUserId = authData.user.id
            authUserCreated = true
          } else {
            console.warn('Auth user creation failed, proceeding with profile-only creation:', authCreateError?.message)
          }
        } else {
          console.warn('Auth user already exists, proceeding with profile-only creation')
        }
      } catch (error) {
        console.warn('Auth user creation error, proceeding with profile-only creation:', error)
      }
    }

    // Profile 생성 (기존 스키마 구조에 맞게)
    let profileData, profileCreateError
    
    if (authUserId) {
      // Auth user가 생성된 경우: 기존 방식 (id = auth.users.id)
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authUserId, // auth.users.id 사용
          email,
          role,
          full_name,
          department,
          phone,
          is_active: true
        })
        .select()
        .single()
      
      profileData = data
      profileCreateError = error
    } else {
      // Auth user가 생성되지 않은 경우: 임시 UUID를 생성하여 사용
      // 외래키 제약조건이 제거되었으므로 auth.users에 없는 UUID도 사용 가능
      const profileId = crypto.randomUUID()
      
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: profileId, // 독립적인 UUID 사용 (외래키 제약조건 제거로 가능)
          email,
          role,
          full_name,
          department,
          phone,
          is_active: true
        })
        .select()
        .single()
      
      profileData = data
      profileCreateError = error
    }

    if (profileCreateError) {
      // Profile 생성 실패시 Auth user 롤백 (생성된 경우)
      if (authUserCreated && authUserId) {
        await supabaseAdmin.auth.admin.deleteUser(authUserId)
      }
      
      return NextResponse.json({ 
        error: `프로필 생성 실패: ${profileCreateError.message}` 
      }, { status: 400 })
    }

    // 로그 기록
    await supabaseAdmin
      .from('system_settings')
      .insert({
        setting_key: `user_creation_flexible_${Date.now()}`,
        setting_value: JSON.stringify({
          action: 'create_user_flexible',
          created_by: user.id,
          created_profile_id: profileData.id,
          auth_user_created: authUserCreated,
          auth_user_id: authUserId,
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
        id: profileData.id,
        email: profileData.email,
        role: profileData.role,
        full_name: profileData.full_name,
        department: profileData.department,
        auth_linked: authUserCreated,
        profile_id: profileData.id
      },
      credentials: {
        email,
        password: authUserCreated ? password : null, // Auth user가 생성된 경우에만 비밀번호 제공
        note: authUserCreated 
          ? '첫 로그인 후 비밀번호를 변경해주세요' 
          : '시스템 관리자가 로그인 권한을 부여할 때까지 대기해주세요'
      },
      auth_status: {
        auth_user_created: authUserCreated,
        can_login: authUserCreated,
        auth_user_id: authUserId
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Flexible user creation API error:', error)
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// Auth 권한 부여 API (별도 엔드포인트)
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { profile_id, password } = await request.json()

    // 현재 사용자가 시스템 관리자인지 확인
    const { data: currentProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (currentProfile?.role !== 'system_admin') {
      return NextResponse.json({ error: '시스템 관리자만 Auth 권한을 부여할 수 있습니다' }, { status: 403 })
    }

    // 대상 프로필 조회
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', profile_id)
      .single()

    if (!targetProfile) {
      return NextResponse.json({ error: '프로필을 찾을 수 없습니다' }, { status: 404 })
    }

    // Auth user 생성
    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email: targetProfile.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: targetProfile.full_name,
        role: targetProfile.role,
        department: targetProfile.department
      }
    })

    if (authCreateError) {
      return NextResponse.json({ 
        error: `Auth 사용자 생성 실패: ${authCreateError.message}` 
      }, { status: 400 })
    }

    // 기존 스키마에서는 프로필 ID를 auth.users.id로 업데이트해야 함
    // 하지만 이는 primary key를 변경하는 것이므로, 실제로는 새로운 프로필을 생성하고 기존 것을 삭제해야 함
    
    // 기존 프로필 백업
    const profileBackup = { ...targetProfile }
    
    // 기존 프로필 삭제
    const { error: deleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', profile_id)

    if (deleteError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ 
        error: `기존 프로필 삭제 실패: ${deleteError.message}` 
      }, { status: 400 })
    }

    // 새로운 프로필 생성 (auth.users.id를 사용)
    const { error: createError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id, // auth.users.id 사용
        email: profileBackup.email,
        role: profileBackup.role,
        full_name: profileBackup.full_name,
        department: profileBackup.department,
        phone: profileBackup.phone,
        is_active: profileBackup.is_active
      })

    if (createError) {
      // 실패시 Auth user 삭제하고 기존 프로필 복구 시도
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      
      try {
        await supabaseAdmin
          .from('profiles')
          .insert(profileBackup)
      } catch (error) {
        // 복구 실패해도 무시
        console.error('Profile backup restore failed:', error)
      }
      
      return NextResponse.json({ 
        error: `새 프로필 생성 실패: ${createError.message}` 
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Auth 권한이 성공적으로 부여되었습니다',
      auth_user_id: authData.user.id,
      credentials: {
        email: targetProfile.email,
        password
      }
    })

  } catch (error) {
    console.error('Auth grant error:', error)
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}