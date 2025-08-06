# ⚠️ 환경 변수 보안 경고 ⚠️

## 🚨 중요: .env 파일 보안

**절대로 실제 API 키나 비밀 정보가 포함된 .env 파일을 Git에 커밋하지 마세요!**

## 📁 환경 변수 파일 구조

```
✅ Git에 포함되는 파일 (안전):
- .env.local.example      # 로컬 개발 환경 예제
- .env.production.example # 프로덕션 환경 예제

❌ Git에서 제외되는 파일 (민감한 정보):
- .env                   # 기본 환경 변수
- .env.local            # 로컬 개발 환경 변수
- .env.production       # 프로덕션 환경 변수
- .env.development      # 개발 환경 변수
- .env.test            # 테스트 환경 변수
```

## 🔐 보안 체크리스트

- [ ] `.gitignore`에 모든 `.env` 파일이 추가되어 있는지 확인
- [ ] 실제 API 키는 `.env.local` 또는 `.env.production`에만 저장
- [ ] 예제 파일(`.env.*.example`)에는 더미 값만 포함
- [ ] Service Role Key는 절대 클라이언트 코드에 노출 금지
- [ ] 프로덕션 배포시 Vercel/Netlify 대시보드에서 환경 변수 설정

## 🛠️ 설정 방법

### 1. 로컬 개발 환경 설정
```bash
# .env.local.example 파일을 복사
cp .env.local.example .env.local

# .env.local 파일을 열어서 실제 값 입력
# 주의: 이 파일은 Git에 커밋되지 않습니다
```

### 2. 프로덕션 환경 설정
```bash
# Vercel 대시보드에서 설정
# Project → Settings → Environment Variables
# 또는 Vercel CLI 사용:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

## ⚡ 긴급 조치 (키가 노출된 경우)

만약 실수로 API 키를 커밋한 경우:

1. **즉시 해당 키를 무효화하고 새로운 키 발급**
2. Git 히스토리에서 해당 커밋 제거:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env*" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. 강제 푸시 (주의: 팀원과 사전 협의 필요):
   ```bash
   git push origin --force --all
   ```

## 📝 추가 보안 권장사항

1. **환경 변수 검증**: `src/utils/env-validator.ts` 사용
2. **정기적인 키 순환**: 3개월마다 API 키 갱신
3. **접근 권한 최소화**: 필요한 권한만 부여
4. **모니터링**: API 사용량 및 이상 활동 모니터링

## 🔍 현재 .gitignore 설정

```gitignore
# env files
.env
.env.*
.env.local
.env.production
.env.development
.env.test
!.env.local.example
!.env.production.example
```

---

**마지막 업데이트**: 2025-08-06
**담당자**: System Administrator
**문의**: security@yourcompany.com