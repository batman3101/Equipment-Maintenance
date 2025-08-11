# Supabase Storage RLS 설정 가이드

## 🔧 company-assets 버킷의 RLS 정책 설정

현재 이미지 업로드 시 "new row violates row-level security policy" 에러가 발생하고 있습니다. 
이를 해결하기 위해 Supabase 대시보드에서 다음 단계를 따라주세요.

## 📋 설정 단계

### 1. Supabase 대시보드 접속
1. https://supabase.com 접속
2. 프로젝트 선택 (ixgldvhxzcqlkxhjwupb)
3. 좌측 메뉴에서 **Storage** 클릭

### 2. 버킷 설정 확인
1. **company-assets** 버킷 클릭
2. 우측 상단의 **Settings** (⚙️) 버튼 클릭
3. **Public bucket** 옵션을 **ON**으로 설정
4. **Save** 클릭

### 3. 정책 적용 확인
다음 SQL을 실행하여 정책이 제대로 생성되었는지 확인:

```sql
-- 생성된 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

## 🔄 대안 방법 (더 간단함)

위 방법이 복잡하다면, 더 간단한 방법으로 버킷을 완전히 공개로 설정할 수 있습니다:

### 1. Storage → company-assets 버킷 선택
### 2. Settings에서 다음 옵션들 설정:
- **Public bucket**: ON
- **File size limit**: 5MB
- **Allowed MIME types**: image/jpeg, image/jpg, image/png, image/webp

### 3. Supabase UI에서 정책 생성 (더 쉬운 방법):

1. **Storage** → **Policies** 탭 클릭
2. **New Policy** 버튼 클릭  
3. **company-assets** 버킷 선택
4. 다음과 같이 설정:
   - **Policy Name**: `Allow public access to company assets`
   - **Allowed Operations**: `SELECT`, `INSERT`, `UPDATE`, `DELETE` 모두 체크
   - **Target Roles**: `authenticated`, `anon` 선택
   - **Policy Definition**: `true` 입력
5. **Save Policy** 클릭

### 4. 또는 SQL Editor 사용 (수정된 버전):

```sql
-- 각 작업별로 개별 정책 생성
CREATE POLICY "Allow public SELECT on company-assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-assets');

CREATE POLICY "Allow authenticated INSERT on company-assets" 
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-assets');

CREATE POLICY "Allow authenticated UPDATE on company-assets"
ON storage.objects FOR UPDATE  
TO authenticated
USING (bucket_id = 'company-assets')
WITH CHECK (bucket_id = 'company-assets');

CREATE POLICY "Allow authenticated DELETE on company-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-assets');
```

## ✅ 설정 완료 확인

설정이 완료되면:
1. 브랜딩 설정 페이지로 이동
2. 파일 선택 버튼을 클릭하여 이미지 업로드 테스트
3. 에러 없이 업로드가 성공하면 설정 완료

## 🔐 보안 고려사항

- 현재 설정은 모든 인증된 사용자가 접근 가능합니다
- 더 엄격한 보안이 필요하다면, 관리자 역할만 접근 가능하도록 정책을 수정할 수 있습니다
- 프로덕션 환경에서는 역할 기반 접근 제어를 권장합니다