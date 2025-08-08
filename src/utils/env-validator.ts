/**
 * Environment Variables Validation Utility
 * 프로덕션 환경에서 필수 환경 변수들을 검증하고 안전하게 관리
 */

interface EnvConfig {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  NODE_ENV: string
  NEXT_PUBLIC_APP_NAME?: string
  NEXT_PUBLIC_COMPANY_NAME?: string
  NEXT_PUBLIC_TIMEZONE?: string
  NEXT_PUBLIC_LOCALE?: string
  NEXT_PUBLIC_CURRENCY?: string
  NEXT_PUBLIC_OFFLINE_MODE?: string
  NEXT_PUBLIC_DEBUG_MODE?: string
}

/**
 * 환경 변수 검증 함수
 */
export function validateEnvironmentVariables(): {
  isValid: boolean
  missingVars: string[]
  warnings: string[]
} {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NODE_ENV'
  ]

  const missingVars: string[] = []
  const warnings: string[] = []

  // 필수 환경 변수 검증
  for (const varName of requiredVars) {
    const value = process.env[varName]
    if (!value || value.trim() === '') {
      missingVars.push(varName)
    }
  }

  // 프로덕션 환경에서의 추가 검증
  if (process.env.NODE_ENV === 'production') {
    // 프로덕션에서는 OFFLINE_MODE가 false여야 함
    if (process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true') {
      warnings.push('OFFLINE_MODE가 프로덕션에서 true로 설정되어 있습니다.')
    }

    // 프로덕션에서는 DEBUG_MODE가 false여야 함
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
      warnings.push('DEBUG_MODE가 프로덕션에서 true로 설정되어 있습니다.')
    }

    // Supabase URL 형식 검증
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
      warnings.push('Supabase URL이 HTTPS를 사용하지 않습니다.')
    }
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
    warnings
  }
}

/**
 * 환경 변수를 안전하게 가져오는 함수
 */
export function getEnvConfig(): EnvConfig {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    NODE_ENV: process.env.NODE_ENV || 'development',
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_COMPANY_NAME: process.env.NEXT_PUBLIC_COMPANY_NAME,
    NEXT_PUBLIC_TIMEZONE: process.env.NEXT_PUBLIC_TIMEZONE,
    NEXT_PUBLIC_LOCALE: process.env.NEXT_PUBLIC_LOCALE,
    NEXT_PUBLIC_CURRENCY: process.env.NEXT_PUBLIC_CURRENCY,
    NEXT_PUBLIC_OFFLINE_MODE: process.env.NEXT_PUBLIC_OFFLINE_MODE,
    NEXT_PUBLIC_DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE
  }
}

/**
 * 개발 환경에서 환경 변수 상태를 콘솔에 출력
 * 프로덕션 환경에서는 로그 출력하지 않음 (보안상 이유)
 */
export function logEnvironmentStatus(): void {
  if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
    const validation = validateEnvironmentVariables()
    
    console.log('🔧 Environment Variables Status:')
    console.log('- Valid:', validation.isValid ? '✅' : '❌')
    
    if (validation.missingVars.length > 0) {
      console.log('- Missing:', validation.missingVars)
    }
    
    if (validation.warnings.length > 0) {
      console.log('- Warnings:', validation.warnings)
    }
    
    console.log('- Environment:', process.env.NODE_ENV)
    console.log('- Offline Mode:', process.env.NEXT_PUBLIC_OFFLINE_MODE)
    console.log('- Debug Mode:', process.env.NEXT_PUBLIC_DEBUG_MODE)
  }
}

/**
 * 환경 변수가 프로덕션 준비가 되었는지 확인
 */
export function isProductionReady(): boolean {
  const validation = validateEnvironmentVariables()
  
  // 필수 환경 변수가 모두 있는지 확인
  if (!validation.isValid) {
    return false
  }
  
  // 프로덕션 환경 설정 확인
  if (process.env.NODE_ENV === 'production') {
    // OFFLINE_MODE와 DEBUG_MODE가 false인지 확인
    if (process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true' || 
        process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
      return false
    }
  }
  
  return true
}