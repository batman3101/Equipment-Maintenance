# 🚀 CNC 설비 관리 시스템 - 스키마 마이그레이션 가이드

## 📋 마이그레이션 개요

이 마이그레이션은 다음과 같은 핵심 기능을 추가하고 불필요한 기능을 제거합니다:

### ✅ 추가되는 핵심 기능
- **통합 상태 시스템**: 설비, 고장, 수리 상태를 일원화
- **실시간 알림 시스템**: 중요 이벤트 실시간 알림
- **상태 전환 로그**: 모든 상태 변경 이력 추적
- **향상된 데이터 무결성**: 관계 정리 및 최적화
- **성능 개선**: 전략적 인덱스 및 뷰 최적화

### ❌ 제거되는 기능
- **부품 재고 관리**: 현재 불필요한 재고 추적 시스템
- **IoT 연동**: QR코드 및 IoT 디바이스 연결 기능

## 🔧 마이그레이션 실행 방법

### 1단계: Supabase SQL Editor 접속
1. 브라우저에서 다음 URL로 이동:
   ```
   https://supabase.com/dashboard/project/ixgldvhxzcqlkxhjwupb/sql
   ```

2. 로그인 후 SQL Editor 화면으로 이동

### 2단계: 마이그레이션 SQL 실행
1. `final-migration.sql` 파일의 전체 내용을 복사
2. Supabase SQL Editor에 붙여넣기
3. **"Run"** 버튼 클릭하여 실행
4. 실행 완료까지 대기 (약 2-3분 소요)

### 3단계: 실행 결과 확인
마이그레이션이 성공하면 다음과 같은 메시지가 표시됩니다:
```
🎉 마이그레이션 완료! 시스템을 사용하실 수 있습니다.
```

### 4단계: 검증 실행
```bash
node verify-migration.js
```

## 📊 마이그레이션 내용 상세

### 새로 생성되는 테이블
1. **`status_transition_log`** - 상태 전환 이력 추적
2. **`system_status_definitions`** - 통합 상태 정의
3. **`system_notifications`** - 실시간 알림 시스템

### 확장되는 기존 테이블
1. **`equipment_info`** 추가 컬럼:
   - `asset_tag` - 자산 태그
   - `serial_number` - 시리얼 번호
   - `custom_fields` - 사용자 정의 필드 (JSONB)
   - `equipment_tags` - 설비 태그 배열

2. **`breakdown_reports`** 추가 컬럼:
   - `unified_status` - 통합 상태
   - `parent_breakdown_id` - 상위 고장 ID
   - `is_emergency` - 응급 여부
   - `impact_level` - 영향도 수준
   - `affected_operations` - 영향받는 작업들
   - `external_contractor_required` - 외부 업체 필요 여부
   - `resolution_date` - 해결 날짜

3. **`repair_reports`** 추가 컬럼:
   - `unified_status` - 통합 상태
   - `repair_category` - 수리 분류
   - `complexity_level` - 복잡도 수준
   - `required_skills` - 필요 기술
   - `completion_percentage` - 완료율

### 새로 생성되는 뷰
1. **`v_equipment_status_summary`** - 통합 설비 현황
2. **`v_dashboard_summary`** - 실시간 대시보드 요약
3. **`v_repair_with_equipment`** - 수리와 설비 정보 통합

### 새로 생성되는 함수
1. **`transition_unified_status()`** - 통합 상태 전환
2. **`validate_equipment_status_consistency()`** - 데이터 일관성 검증

## ⚠️ 주의사항

### 데이터 안전성
- 기존 데이터는 모두 보존됩니다
- 중복 컬럼(`repair_reports.equipment_id`)만 안전하게 제거됩니다
- 데이터 불일치 검증 후 진행됩니다

### 권한 및 보안
- Row Level Security (RLS) 정책 자동 적용
- 기존 인증 시스템과 완전 호환
- 새로운 테이블에 적절한 권한 설정

### 성능 최적화
- 전략적 인덱스 자동 생성
- LATERAL JOIN 최적화
- JSONB 및 배열 타입 최적화

## 🔍 마이그레이션 후 확인사항

### 1. 데이터 무결성 확인
```javascript
// verify-migration.js 실행 후 확인
✅ Status definitions: 15 entries
✅ Dashboard summary: 모든 통계 정상
✅ Data consistency check: 0 issues found
```

### 2. 새로운 기능 테스트
- 통합 상태 시스템 작동 확인
- 실시간 알림 기능 테스트
- 새로운 뷰들의 데이터 출력 확인

### 3. 애플리케이션 코드 업데이트
마이그레이션 후 다음 파일들을 업데이트하세요:
- `src/lib/supabase.ts` → `src/lib/supabase-core.ts` 사용
- 새로운 TypeScript 타입 정의 활용
- 통합 상태 시스템 API 사용

## 🎯 롤백 계획

만약 마이그레이션에 문제가 발생하면:

1. **즉시 연락**: 개발팀에 문의
2. **데이터 백업**: 자동 백업에서 복원 가능
3. **점진적 롤백**: 새로운 기능만 비활성화 가능

## 📞 지원 및 문의

마이그레이션 관련 문의사항:
- 기술 지원: 개발팀
- 긴급 상황: 즉시 연락 요망

---

**마이그레이션 실행 전 반드시 확인하세요:**
- [ ] 현재 시스템이 안정적으로 작동 중
- [ ] 사용자들에게 점검 시간 공지 완료
- [ ] 백업 상태 확인 완료
- [ ] 마이그레이션 SQL 파일 준비 완료