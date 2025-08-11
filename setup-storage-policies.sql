-- Supabase Storage RLS 정책 설정 (company-assets 버킷용)
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- company-assets 버킷에 대한 SELECT 정책 (모든 인증된 사용자가 읽기 가능)
INSERT INTO storage.policies (id, bucket_id, name, definition, check, command, roles)
VALUES (
  'company-assets-select-policy',
  'company-assets',
  'Allow authenticated users to select company assets',
  '(auth.role() = ''authenticated''::text)',
  NULL,
  'SELECT',
  '{"authenticated"}'
) ON CONFLICT (id) DO NOTHING;

-- company-assets 버킷에 대한 INSERT 정책 (관리자만 업로드 가능)
INSERT INTO storage.policies (id, bucket_id, name, definition, check, command, roles)
VALUES (
  'company-assets-insert-policy',
  'company-assets',
  'Allow managers and system_admins to insert company assets',
  '(auth.role() = ''authenticated''::text) AND (
    EXISTS (
      SELECT 1 FROM auth.users u
      JOIN public.profiles p ON u.id = p.user_id
      WHERE u.id = auth.uid()
      AND p.role IN (''manager'', ''system_admin'')
    )
  )',
  '(auth.role() = ''authenticated''::text) AND (
    EXISTS (
      SELECT 1 FROM auth.users u
      JOIN public.profiles p ON u.id = p.user_id
      WHERE u.id = auth.uid()
      AND p.role IN (''manager'', ''system_admin'')
    )
  )',
  'INSERT',
  '{"authenticated"}'
) ON CONFLICT (id) DO NOTHING;

-- company-assets 버킷에 대한 DELETE 정책 (관리자만 삭제 가능)
INSERT INTO storage.policies (id, bucket_id, name, definition, check, command, roles)
VALUES (
  'company-assets-delete-policy',
  'company-assets',
  'Allow managers and system_admins to delete company assets',
  '(auth.role() = ''authenticated''::text) AND (
    EXISTS (
      SELECT 1 FROM auth.users u
      JOIN public.profiles p ON u.id = p.user_id
      WHERE u.id = auth.uid()
      AND p.role IN (''manager'', ''system_admin'')
    )
  )',
  NULL,
  'DELETE',
  '{"authenticated"}'
) ON CONFLICT (id) DO NOTHING;

-- 또는 더 간단한 정책 (모든 인증된 사용자가 접근 가능한 경우)
-- 위의 정책들을 대신 사용하고 싶다면, 아래 주석을 해제하고 위의 정책들은 주석 처리하세요

/*
-- 모든 인증된 사용자가 회사 자산을 조회할 수 있는 정책
INSERT INTO storage.policies (id, bucket_id, name, definition, check, command, roles)
VALUES (
  'company-assets-public-select-policy',
  'company-assets',
  'Allow all authenticated users to select company assets',
  '(auth.role() = ''authenticated''::text)',
  NULL,
  'SELECT',
  '{"authenticated"}'
) ON CONFLICT (id) DO NOTHING;

-- 모든 인증된 사용자가 회사 자산을 업로드할 수 있는 정책
INSERT INTO storage.policies (id, bucket_id, name, definition, check, command, roles)
VALUES (
  'company-assets-public-insert-policy',
  'company-assets',
  'Allow all authenticated users to insert company assets',
  '(auth.role() = ''authenticated''::text)',
  '(auth.role() = ''authenticated''::text)',
  'INSERT',
  '{"authenticated"}'
) ON CONFLICT (id) DO NOTHING;

-- 모든 인증된 사용자가 회사 자산을 삭제할 수 있는 정책
INSERT INTO storage.policies (id, bucket_id, name, definition, check, command, roles)
VALUES (
  'company-assets-public-delete-policy',
  'company-assets',
  'Allow all authenticated users to delete company assets',
  '(auth.role() = ''authenticated''::text)',
  NULL,
  'DELETE',
  '{"authenticated"}'
) ON CONFLICT (id) DO NOTHING;
*/

-- RLS 활성화 확인
-- storage.objects 테이블에 대한 RLS가 이미 활성화되어 있는지 확인
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 생성된 정책 확인
SELECT * FROM storage.policies WHERE bucket_id = 'company-assets';