-- -- ===============================================
-- -- CNC 설비 유지보수 시스템 - 성능 최적화 스키마 (v2)
-- -- 변경점 요약:
-- -- - repair_reports 컬럼명 정합성: repair_started_at / repair_completed_at로 통일
-- -- - status 미존재 컬럼 참조 제거
-- -- - 최근 30일 완료 수리 집계 기준 수정
-- -- 본 파일은 이전 버전(database-optimization.sql)을 대체합니다.
-- -- ===============================================

-- -- 1. 인덱스 최적화
-- -- 자주 조회되는 컬럼들에 대한 복합 인덱스 생성

-- -- equipment_status 테이블 최적화
-- CREATE INDEX IF NOT EXISTS idx_equipment_status_equipment_id_updated_at 
-- ON equipment_status(equipment_id, updated_at DESC);

-- CREATE INDEX IF NOT EXISTS idx_equipment_status_status_updated_at 
-- ON equipment_status(status, updated_at DESC);

-- -- breakdown_reports 테이블 최적화
-- CREATE INDEX IF NOT EXISTS idx_breakdown_reports_equipment_id_occurred_at 
-- ON breakdown_reports(equipment_id, occurred_at DESC);

-- CREATE INDEX IF NOT EXISTS idx_breakdown_reports_priority_status_occurred_at 
-- ON breakdown_reports(priority, status, occurred_at DESC);

-- CREATE INDEX IF NOT EXISTS idx_breakdown_reports_occurred_at_status 
-- ON breakdown_reports(occurred_at DESC, status);

-- CREATE INDEX IF NOT EXISTS idx_repair_reports_equipment_id_repair_started_at 
-- ON repair_reports(equipment_id, repair_started_at DESC);

-- -- repair_reports에는 status 컬럼이 없으므로 완료일 기준 단일 인덱스 생성
-- CREATE INDEX IF NOT EXISTS idx_repair_reports_repair_completed_at 
-- ON repair_reports(repair_completed_at DESC);

-- -- maintenance_schedules 테이블 최적화
-- CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_equipment_id_scheduled_date 
-- ON maintenance_schedules(equipment_id, scheduled_date DESC);

-- CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_status_type_scheduled_date 
-- ON maintenance_schedules(status, type, scheduled_date DESC);

-- -- 2. 파티셔닝 (PostgreSQL 10+ 지원)
-- -- 대용량 데이터 처리를 위한 월별 파티셔닝

-- -- breakdown_reports 테이블 파티셔닝
-- CREATE TABLE IF NOT EXISTS breakdown_reports_partitioned (
--     LIKE breakdown_reports INCLUDING ALL
-- ) PARTITION BY RANGE (occurred_at);

-- -- 월별 파티션 생성 (최근 12개월)
-- CREATE TABLE IF NOT EXISTS breakdown_reports_2024_01 PARTITION OF breakdown_reports_partitioned
--     FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- CREATE TABLE IF NOT EXISTS breakdown_reports_2024_02 PARTITION OF breakdown_reports_partitioned
--     FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- CREATE TABLE IF NOT EXISTS breakdown_reports_2024_03 PARTITION OF breakdown_reports_partitioned
--     FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');
-- -- ... (필요한 월만큼 추가)

-- -- 3. 집계 테이블 (Materialized Views)
-- -- 실시간 대시보드 성능을 위한 사전 계산된 통계

-- -- 일별 통계 집계
-- CREATE MATERIALIZED VIEW IF NOT EXISTS daily_equipment_statistics AS
-- SELECT 
--     DATE(occurred_at) as stat_date,
--     equipment_id,
--     COUNT(*) as breakdown_count,
--     COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_count,
--     COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
--     AVG(CASE 
--         WHEN resolved_at IS NOT NULL 
--         THEN EXTRACT(EPOCH FROM (resolved_at - occurred_at))/3600 
--     END) as avg_resolution_hours
-- FROM breakdown_reports 
-- WHERE occurred_at >= CURRENT_DATE - INTERVAL '90 days'
-- GROUP BY DATE(occurred_at), equipment_id;

-- -- 일별 통계 인덱스
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_equipment_statistics_date_equipment 
-- ON daily_equipment_statistics(stat_date DESC, equipment_id);

-- -- 월별 설비별 성능 지표
-- CREATE MATERIALIZED VIEW IF NOT EXISTS monthly_equipment_performance AS
-- SELECT 
--     DATE_TRUNC('month', occurred_at) as month,
--     equipment_id,
--     COUNT(breakdown_reports.id) as total_breakdowns,
--     AVG(CASE 
--         WHEN resolved_at IS NOT NULL 
--         THEN EXTRACT(EPOCH FROM (resolved_at - occurred_at))/3600 
--     END) as avg_mttr_hours,
--     COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_breakdowns,
--     -- MTBF 계산 (운영시간 / 고장횟수)
--     CASE 
--         WHEN COUNT(breakdown_reports.id) > 0 
--         THEN (30 * 24) / COUNT(breakdown_reports.id)::DECIMAL 
--         ELSE NULL 
--     END as mtbf_hours
-- FROM breakdown_reports
-- WHERE occurred_at >= CURRENT_DATE - INTERVAL '12 months'
-- GROUP BY DATE_TRUNC('month', occurred_at), equipment_id;

-- -- 월별 성능 지표 인덱스
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_equipment_performance_month_equipment 
-- ON monthly_equipment_performance(month DESC, equipment_id);

-- -- 실시간 설비 상태 요약 (자주 조회되는 데이터)
-- CREATE MATERIALIZED VIEW IF NOT EXISTS equipment_status_summary AS
-- SELECT 
--     e.id as equipment_id,
--     e.equipment_number,
--     e.equipment_name,
--     e.category,
--     e.location,
--     es.status as current_status,
--     es.updated_at as status_updated_at,
--     -- 최근 30일 고장 횟수
--     COALESCE(breakdown_stats.breakdown_count, 0) as recent_breakdown_count,
--     -- 최근 완료된 수리 횟수
--     COALESCE(repair_stats.completed_repairs, 0) as recent_completed_repairs,
--     -- 예정된 정비 개수
--     COALESCE(maintenance_stats.scheduled_maintenance, 0) as scheduled_maintenance_count
-- FROM equipment_info e
-- LEFT JOIN equipment_status es ON e.id = es.equipment_id
-- LEFT JOIN (
--     SELECT 
--         equipment_id,
--         COUNT(*) as breakdown_count
--     FROM breakdown_reports 
--     WHERE occurred_at >= CURRENT_DATE - INTERVAL '30 days'
--     GROUP BY equipment_id
-- ) breakdown_stats ON e.id = breakdown_stats.equipment_id
-- LEFT JOIN (
--     SELECT 
--         equipment_id,
--         COUNT(*) as completed_repairs
--     FROM repair_reports 
--     WHERE repair_completed_at >= CURRENT_DATE - INTERVAL '30 days'
--     GROUP BY equipment_id
-- ) repair_stats ON e.id = repair_stats.equipment_id
-- LEFT JOIN (
--     SELECT 
--         equipment_id,
--         COUNT(*) as scheduled_maintenance
--     FROM maintenance_schedules 
--     WHERE status = 'scheduled' 
--         AND scheduled_date >= CURRENT_DATE
--     GROUP BY equipment_id
-- ) maintenance_stats ON e.id = maintenance_stats.equipment_id;

-- -- 설비 상태 요약 인덱스
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_equipment_status_summary_equipment_id 
-- ON equipment_status_summary(equipment_id);

-- CREATE INDEX IF NOT EXISTS idx_equipment_status_summary_status 
-- ON equipment_status_summary(current_status);

-- -- 4. 자동 통계 갱신 함수
-- CREATE OR REPLACE FUNCTION refresh_statistics_materialized_views()
-- RETURNS void AS $$
-- BEGIN
--     -- 동시 갱신으로 락 최소화
--     REFRESH MATERIALIZED VIEW CONCURRENTLY daily_equipment_statistics;
--     REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_equipment_performance;
--     REFRESH MATERIALIZED VIEW CONCURRENTLY equipment_status_summary;
    
--     -- 통계 갱신 로그
--     INSERT INTO system_logs (log_type, message, created_at) 
--     VALUES ('system', 'Materialized views refreshed', NOW());
-- EXCEPTION
--     WHEN OTHERS THEN
--         INSERT INTO system_logs (log_type, message, created_at) 
--         VALUES ('error', 'Failed to refresh materialized views: ' || SQLERRM, NOW());
-- END;
-- $$ LANGUAGE plpgsql;

-- -- 5. 자동화된 통계 갱신 스케줄링 (pg_cron 확장 필요)
-- -- 매 5분마다 실시간 요약 갱신
-- -- SELECT cron.schedule('refresh-realtime-stats', '*/5 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY equipment_status_summary;');

-- -- 매 시간마다 일별 통계 갱신
-- -- SELECT cron.schedule('refresh-daily-stats', '0 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY daily_equipment_statistics;');

-- -- 매일 자정에 월별 성능 지표 갱신
-- -- SELECT cron.schedule('refresh-monthly-stats', '0 0 * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_equipment_performance;');

-- -- 6. 성능 최적화를 위한 설정
-- -- 쿼리 성능 최적화 설정

-- -- 통계 수집 빈도 조정
-- ALTER SYSTEM SET default_statistics_target = 1000; -- 더 정확한 통계

-- -- 작업 메모리 증가 (복잡한 쿼리 성능 향상)
-- ALTER SYSTEM SET work_mem = '256MB';

-- -- 공유 버퍼 최적화
-- ALTER SYSTEM SET shared_buffers = '256MB';

-- -- 체크포인트 최적화 (쓰기 성능 향상)
-- ALTER SYSTEM SET checkpoint_completion_target = 0.9;

-- -- 7. 성능 모니터링 뷰
-- CREATE VIEW performance_monitor AS
-- SELECT 
--     schemaname,
--     tablename,
--     attname,
--     n_distinct,
--     correlation,
--     most_common_vals,
--     most_common_freqs
-- FROM pg_stats 
-- WHERE schemaname = 'public' 
--     AND tablename IN ('equipment_info', 'equipment_status', 'breakdown_reports', 'repair_reports', 'maintenance_schedules')
-- ORDER BY tablename, attname;

-- -- 8. 느린 쿼리 분석을 위한 뷰
-- CREATE VIEW slow_queries AS
-- SELECT 
--     query,
--     calls,
--     total_time,
--     mean_time,
--     rows,
--     100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
-- FROM pg_stat_statements 
-- WHERE mean_time > 100  -- 100ms 이상 쿼리만
-- ORDER BY mean_time DESC;

-- -- 9. 데이터 정리 정책
-- -- 오래된 로그 데이터 자동 정리 (6개월 이상)
-- CREATE OR REPLACE FUNCTION cleanup_old_data()
-- RETURNS void AS $$
-- BEGIN
--     -- 6개월 이상된 resolved 상태의 breakdown_reports 아카이브
--     INSERT INTO breakdown_reports_archive 
--     SELECT * FROM breakdown_reports 
--     WHERE status = 'resolved' 
--         AND resolved_at < CURRENT_DATE - INTERVAL '6 months';
    
--     DELETE FROM breakdown_reports 
--     WHERE status = 'resolved' 
--         AND resolved_at < CURRENT_DATE - INTERVAL '6 months';
    
--     -- 1년 이상 지난 완료 수리(완료일 기준) 아카이브
--     INSERT INTO repair_reports_archive 
--     SELECT * FROM repair_reports 
--     WHERE repair_completed_at < CURRENT_DATE - INTERVAL '1 year';
    
--     DELETE FROM repair_reports 
--     WHERE repair_completed_at < CURRENT_DATE - INTERVAL '1 year';
    
--     -- 통계 갱신
--     ANALYZE;
    
--     INSERT INTO system_logs (log_type, message, created_at) 
--     VALUES ('system', 'Old data cleanup completed', NOW());
-- END;
-- $$ LANGUAGE plpgsql;

-- -- 월 1회 데이터 정리 스케줄링
-- -- SELECT cron.schedule('cleanup-old-data', '0 2 1 * *', 'SELECT cleanup_old_data();');

-- -- 10. 성능 테스트를 위한 샘플 쿼리
-- -- 대시보드 메인 쿼리 (최적화된 버전)
-- /*
-- -- 실시간 대시보드 데이터 (집계 테이블 사용)
-- SELECT 
--     COUNT(*) as total_equipment,
--     COUNT(CASE WHEN current_status = 'running' THEN 1 END) as running_equipment,
--     SUM(recent_breakdown_count) as total_recent_breakdowns,
--     SUM(recent_completed_repairs) as total_recent_repairs,
--     AVG(CASE WHEN recent_breakdown_count > 0 THEN recent_breakdown_count END) as avg_breakdown_rate
-- FROM equipment_status_summary;

-- -- 월별 트렌드 데이터 (집계 테이블 사용)
-- SELECT 
--     month,
--     SUM(total_breakdowns) as total_breakdowns,
--     AVG(avg_mttr_hours) as avg_mttr,
--     AVG(mtbf_hours) as avg_mtbf
-- FROM monthly_equipment_performance 
-- WHERE month >= CURRENT_DATE - INTERVAL '12 months'
-- GROUP BY month
-- ORDER BY month DESC;
-- */

-- -- 11. 백업 및 복구 최적화
-- -- 증분 백업을 위한 WAL 설정
-- ALTER SYSTEM SET wal_level = 'replica';
-- ALTER SYSTEM SET archive_mode = 'on';
-- ALTER SYSTEM SET max_wal_senders = 3;

-- -- 성능 최적화 적용
-- -- SELECT pg_reload_conf();