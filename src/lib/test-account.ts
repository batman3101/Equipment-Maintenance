// 테스트 계정 정보 (개발 환경에서만 사용)
export const TEST_EMAIL = 'test@example.com';
export const TEST_PASSWORD = 'password123';

// 개발 환경용 테스트 사용자 데이터
export const TEST_USER = {
  id: 'test-user-id',
  email: TEST_EMAIL,
  name: '테스트 사용자',
  role: 'engineer' as const,
  plant_id: '1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

/**
 * 개발 환경에서 테스트 계정 정보 반환
 * 실제 계정 생성은 하지 않고 모의 데이터만 제공
 */
export function getTestAccount() {
  return {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    user: TEST_USER
  };
}