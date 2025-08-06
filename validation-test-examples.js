// 설정 파일 검증 기능 테스트 예제
// 이 파일은 검증 기능의 동작을 보여주는 예제입니다.

// 1. 파일 크기 제한 테스트
console.log('=== 파일 크기 제한 테스트 ===')

// 정상적인 크기의 설정 파일 (통과)
const validSizeSettings = JSON.stringify({
  general: { systemName: "Test System" },
  // ... 기타 설정
})
console.log(`정상 크기 파일: ${validSizeSettings.length} bytes - 통과 예상`)

// 너무 큰 설정 파일 (실패)
const oversizedString = 'x'.repeat(1024 * 1024 + 1) // 1MB + 1byte
const oversizedSettings = JSON.stringify({
  general: { systemName: oversizedString }
})
console.log(`초과 크기 파일: ${oversizedSettings.length} bytes - 실패 예상`)

// 2. 스키마 검증 테스트
console.log('\n=== 스키마 검증 테스트 ===')

// 올바른 스키마 (통과)
const validSchema = {
  general: {
    systemName: "CNC 관리 시스템",
    companyName: "테스트 회사",
    offlineMode: false,
    language: "ko",
    timezone: "Asia/Seoul"
  },
  equipment: {
    categories: [
      { value: "CNC", label: "CNC" },
      { value: "CLEANING", label: "CLEANING" }
    ],
    locations: [
      { value: "BUILD_A", label: "BUILD A" }
    ],
    statuses: [
      { value: "operational", label: "가동중", color: "green" }
    ]
  },
  breakdown: {
    urgencyLevels: [],
    issueTypes: [],
    defaultUrgency: "medium",
    autoAssignment: false,
    requirePhotos: false
  },
  repair: {
    repairTypes: [],
    completionStatuses: [],
    requireTestResults: true,
    maxTimeSpent: 24,
    defaultTimeUnit: "hours"
  },
  notifications: {
    toastDuration: 5000,
    enableSound: false,
    autoHide: true,
    maxToasts: 5,
    position: "top-right"
  },
  data: {
    itemsPerPage: 10,
    exportFormat: "xlsx",
    autoSave: false,
    autoSaveInterval: 5,
    dataRetentionDays: 365
  },
  ui: {
    theme: "light",
    fontSize: "medium",
    compactMode: false,
    showHelpTexts: true,
    animationsEnabled: true
  },
  security: {
    sessionTimeout: 30,
    requireTwoFactor: false,
    passwordMinLength: 8,
    maxLoginAttempts: 5,
    lockoutDuration: 15
  }
}
console.log('✅ 올바른 스키마 - 통과 예상')

// 잘못된 스키마들 (실패)
const invalidSchemas = [
  // 필수 섹션 누락
  {
    general: { systemName: "Test" }
    // equipment, breakdown 등 누락
  },
  
  // 잘못된 데이터 타입
  {
    general: {
      systemName: 123, // 문자열이어야 함
      companyName: "Test",
      offlineMode: "false", // 불린이어야 함
      language: "invalid", // ko, en, vi 중 하나여야 함
      timezone: "Asia/Seoul"
    }
  },
  
  // 범위 초과 값들
  {
    notifications: {
      toastDuration: 100000, // 최대 60000
      enableSound: false,
      autoHide: true,
      maxToasts: 50, // 최대 20
      position: "invalid-position" // 유효하지 않은 위치
    },
    security: {
      sessionTimeout: 2000, // 최대 1440분
      passwordMinLength: 100, // 최대 50자
      maxLoginAttempts: 50 // 최대 10회
    }
  }
]

invalidSchemas.forEach((schema, index) => {
  console.log(`❌ 잘못된 스키마 ${index + 1} - 실패 예상`)
})

// 3. 실제 사용 예제
console.log('\n=== 실제 사용 예제 ===')
console.log(`
// SystemSettingsContext에서 사용할 때:

const importSettings = (settingsJson) => {
  try {
    // 1. 파일 크기 검증
    validateFileSize(settingsJson)
    
    // 2. JSON 파싱
    const parsed = JSON.parse(settingsJson)
    
    // 3. 스키마 검증
    if (!validateSettingsSchema(parsed)) {
      throw new Error('잘못된 설정 파일 형식입니다.')
    }
    
    // 4. 설정 적용
    setSettings(mergeWithDefaults(parsed, defaultSettings))
    showSuccess('설정 가져오기 성공!')
    
  } catch (error) {
    if (error.message.includes('너무 큽니다')) {
      showError('파일이 너무 큽니다 (최대 1MB)')
    } else if (error instanceof SyntaxError) {
      showError('올바른 JSON 형식이 아닙니다')
    } else {
      showError('설정 파일 형식이 올바르지 않습니다')
    }
  }
}
`)

console.log('\n=== 검증 규칙 요약 ===')
console.log(`
✅ 파일 크기 제한:
- 최대 1MB (1,048,576 bytes)

✅ 문자열 길이 제한:
- systemName, companyName 등: 최대 1000자

✅ 배열 길이 제한:
- categories, locations, statuses 등: 최대 100개

✅ 숫자 범위 제한:
- toastDuration: 1000-60000ms
- maxToasts: 1-20개
- sessionTimeout: 5-1440분
- passwordMinLength: 6-50자
- maxLoginAttempts: 3-10회

✅ 열거형 값 검증:
- language: 'ko', 'en', 'vi'
- position: 'top-right', 'top-left', 'bottom-right', 'bottom-left'
- theme: 'light', 'dark', 'auto'
- fontSize: 'small', 'medium', 'large'
`)