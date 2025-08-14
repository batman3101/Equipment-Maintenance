-- ================================================================
-- Equipment Info 테이블 권한 수정
-- 인증된 사용자가 설비 추가 가능하도록 RLS 정책 수정
-- ================================================================

-- 기존 정책 제거
DROP POLICY IF EXISTS "관리자만 설비 정보 수정 가능" ON public.equipment_info;

-- 새로운 정책 생성
-- 인증된 사용자는 설비 정보 추가 가능
CREATE POLICY "인증된 사용자는 설비 정보 추가 가능" ON public.equipment_info
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 관리자만 설비 정보 수정/삭제 가능
CREATE POLICY "관리자만 설비 정보 수정/삭제 가능" ON public.equipment_info
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "관리자만 설비 정보 삭제 가능" ON public.equipment_info
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- equipment_status 테이블도 INSERT 권한 확인
DROP POLICY IF EXISTS "인증된 사용자는 설비 현황 업데이트 가능" ON public.equipment_status;

-- 인증된 사용자는 설비 상태 추가 가능
CREATE POLICY "인증된 사용자는 설비 상태 추가 가능" ON public.equipment_status
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 인증된 사용자는 설비 현황 업데이트 가능
CREATE POLICY "인증된 사용자는 설비 현황 업데이트 가능" ON public.equipment_status
  FOR UPDATE USING (auth.role() = 'authenticated');