-- ================================================================
-- CNC 설비 관리 시스템 - 분석 함수들
-- 트렌드 데이터 조회를 위한 PostgreSQL 함수들
-- ================================================================

-- ================================================================
-- 1. 주간 트렌드 데이터 조회 함수
-- ================================================================

-- 기존 함수가 있다면 삭제
DROP FUNCTION IF EXISTS public.get_weekly_trend_data(INTEGER);

CREATE OR REPLACE FUNCTION public.get_weekly_trend_data(weeks_count INTEGER DEFAULT 4)
RETURNS TABLE (
  week_label TEXT,
  breakdown_count INTEGER,
  repair_count INTEGER,
  week_start_date DATE,
  week_end_date DATE
) AS $$
BEGIN
  RETURN QUERY
  WITH week_series AS (
    SELECT 
      generate_series(
        date_trunc('week', CURRENT_DATE) - INTERVAL '1 week' * (weeks_count - 1),
        date_trunc('week', CURRENT_DATE),
        INTERVAL '1 week'
      )::DATE as week_start
  ),
  week_ranges AS (
    SELECT 
      week_start,
      (week_start + INTERVAL '6 days')::DATE as week_end,
      CASE 
        WHEN week_start = date_trunc('week', CURRENT_DATE)::DATE THEN '현재주'
        ELSE EXTRACT(MONTH FROM week_start) || '월 ' || 
             CEIL(EXTRACT(DAY FROM week_start) / 7.0) || '주'
      END as week_label
    FROM week_series
  ),
  breakdown_counts AS (
    SELECT 
      wr.week_start,
      COUNT(br.id)::INTEGER as breakdown_count
    FROM week_ranges wr
    LEFT JOIN public.breakdown_reports br ON 
      br.occurred_at::DATE >= wr.week_start AND 
      br.occurred_at::DATE <= wr.week_end
    GROUP BY wr.week_start
  ),
  repair_counts AS (
    SELECT 
      wr.week_start,
      COUNT(rr.id)::INTEGER as repair_count
    FROM week_ranges wr
    LEFT JOIN public.repair_reports rr ON 
      rr.repair_completed_at::DATE >= wr.week_start AND 
      rr.repair_completed_at::DATE <= wr.week_end
    GROUP BY wr.week_start
  )
  SELECT 
    wr.week_label,
    COALESCE(bc.breakdown_count, 0) as breakdown_count,
    COALESCE(rc.repair_count, 0) as repair_count,
    wr.week_start as week_start_date,
    wr.week_end as week_end_date
  FROM week_ranges wr
  LEFT JOIN breakdown_counts bc ON wr.week_start = bc.week_start
  LEFT JOIN repair_counts rc ON wr.week_start = rc.week_start
  ORDER BY wr.week_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 2. 월간 트렌드 데이터 조회 함수
-- ================================================================

-- 기존 함수가 있다면 삭제
DROP FUNCTION IF EXISTS public.get_monthly_trend_data(INTEGER);

CREATE OR REPLACE FUNCTION public.get_monthly_trend_data(months_count INTEGER DEFAULT 4)
RETURNS TABLE (
  month_label TEXT,
  breakdown_count INTEGER,
  repair_count INTEGER,
  month_start_date DATE,
  month_end_date DATE
) AS $$
BEGIN
  RETURN QUERY
  WITH month_series AS (
    SELECT 
      generate_series(
        date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' * (months_count - 1),
        date_trunc('month', CURRENT_DATE),
        INTERVAL '1 month'
      )::DATE as month_start
  ),
  month_ranges AS (
    SELECT 
      month_start,
      (date_trunc('month', month_start) + INTERVAL '1 month' - INTERVAL '1 day')::DATE as month_end,
      CASE 
        WHEN month_start = date_trunc('month', CURRENT_DATE)::DATE THEN '이번달'
        ELSE EXTRACT(MONTH FROM month_start) || '월'
      END as month_label
    FROM month_series
  ),
  breakdown_counts AS (
    SELECT 
      mr.month_start,
      COUNT(br.id)::INTEGER as breakdown_count
    FROM month_ranges mr
    LEFT JOIN public.breakdown_reports br ON 
      br.occurred_at::DATE >= mr.month_start AND 
      br.occurred_at::DATE <= mr.month_end
    GROUP BY mr.month_start
  ),
  repair_counts AS (
    SELECT 
      mr.month_start,
      COUNT(rr.id)::INTEGER as repair_count
    FROM month_ranges mr
    LEFT JOIN public.repair_reports rr ON 
      rr.repair_completed_at::DATE >= mr.month_start AND 
      rr.repair_completed_at::DATE <= mr.month_end
    GROUP BY mr.month_start
  )
  SELECT 
    mr.month_label,
    COALESCE(bc.breakdown_count, 0) as breakdown_count,
    COALESCE(rc.repair_count, 0) as repair_count,
    mr.month_start as month_start_date,
    mr.month_end as month_end_date
  FROM month_ranges mr
  LEFT JOIN breakdown_counts bc ON mr.month_start = bc.month_start
  LEFT JOIN repair_counts rc ON mr.month_start = rc.month_start
  ORDER BY mr.month_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 3. 연간 트렌드 데이터 조회 함수
-- ================================================================

-- 기존 함수가 있다면 삭제
DROP FUNCTION IF EXISTS public.get_yearly_trend_data(INTEGER);

CREATE OR REPLACE FUNCTION public.get_yearly_trend_data(years_count INTEGER DEFAULT 4)
RETURNS TABLE (
  year_label TEXT,
  breakdown_count INTEGER,
  repair_count INTEGER,
  year_start_date DATE,
  year_end_date DATE
) AS $$
BEGIN
  RETURN QUERY
  WITH year_series AS (
    SELECT 
      generate_series(
        date_trunc('year', CURRENT_DATE) - INTERVAL '1 year' * (years_count - 1),
        date_trunc('year', CURRENT_DATE),
        INTERVAL '1 year'
      )::DATE as year_start
  ),
  year_ranges AS (
    SELECT 
      year_start,
      (date_trunc('year', year_start) + INTERVAL '1 year' - INTERVAL '1 day')::DATE as year_end,
      EXTRACT(YEAR FROM year_start)::TEXT as year_label
    FROM year_series
  ),
  breakdown_counts AS (
    SELECT 
      yr.year_start,
      COUNT(br.id)::INTEGER as breakdown_count
    FROM year_ranges yr
    LEFT JOIN public.breakdown_reports br ON 
      br.occurred_at::DATE >= yr.year_start AND 
      br.occurred_at::DATE <= yr.year_end
    GROUP BY yr.year_start
  ),
  repair_counts AS (
    SELECT 
      yr.year_start,
      COUNT(rr.id)::INTEGER as repair_count
    FROM year_ranges yr
    LEFT JOIN public.repair_reports rr ON 
      rr.repair_completed_at::DATE >= yr.year_start AND 
      rr.repair_completed_at::DATE <= yr.year_end
    GROUP BY yr.year_start
  )
  SELECT 
    yr.year_label,
    COALESCE(bc.breakdown_count, 0) as breakdown_count,
    COALESCE(rc.repair_count, 0) as repair_count,
    yr.year_start as year_start_date,
    yr.year_end as year_end_date
  FROM year_ranges yr
  LEFT JOIN breakdown_counts bc ON yr.year_start = bc.year_start
  LEFT JOIN repair_counts rc ON yr.year_start = rc.year_start
  ORDER BY yr.year_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 4. 오프라인 모드 상태 확인 함수 (에러 메시지에서 언급된 함수)
-- ================================================================

-- 기존 함수가 있다면 삭제
DROP FUNCTION IF EXISTS public.get_offline_mode_status();

CREATE OR REPLACE FUNCTION public.get_offline_mode_status()
RETURNS TABLE (
  is_offline BOOLEAN,
  last_sync_time TIMESTAMP WITH TIME ZONE,
  pending_sync_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN current_setting('app.offline_mode', true) = 'true' THEN true
      ELSE false
    END as is_offline,
    NOW() as last_sync_time,
    0 as pending_sync_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 5. 함수 권한 설정
-- ================================================================

-- 인증된 사용자에게 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.get_weekly_trend_data(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_trend_data(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_yearly_trend_data(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_offline_mode_status() TO authenticated;

-- 익명 사용자에게도 오프라인 모드 상태 확인 권한 부여
GRANT EXECUTE ON FUNCTION public.get_offline_mode_status() TO anon;

-- ================================================================
-- 6. 함수 테스트 쿼리 (주석 처리)
-- ================================================================

/*
-- 주간 트렌드 데이터 테스트
SELECT * FROM public.get_weekly_trend_data(4);

-- 월간 트렌드 데이터 테스트
SELECT * FROM public.get_monthly_trend_data(4);

-- 연간 트렌드 데이터 테스트
SELECT * FROM public.get_yearly_trend_data(4);

-- 오프라인 모드 상태 테스트
SELECT * FROM public.get_offline_mode_status();
*/