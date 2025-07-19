-- Test script to validate database schema and constraints
-- Run this after applying migrations to ensure everything works correctly

-- Test 1: Verify all tables exist
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('plants', 'users', 'equipment', 'breakdowns', 'breakdown_attachments', 'repairs', 'repair_parts')) = 7,
           'Not all required tables exist';
    RAISE NOTICE 'Test 1 PASSED: All tables exist';
END $$;

-- Test 2: Verify foreign key constraints
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM information_schema.table_constraints 
            WHERE constraint_type = 'FOREIGN KEY' 
            AND table_schema = 'public') >= 8,
           'Missing foreign key constraints';
    RAISE NOTICE 'Test 2 PASSED: Foreign key constraints exist';
END $$;

-- Test 3: Verify indexes exist
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND indexname LIKE 'idx_%') >= 15,
           'Missing performance indexes';
    RAISE NOTICE 'Test 3 PASSED: Performance indexes exist';
END $$;

-- Test 4: Verify RLS is enabled
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM pg_tables 
            WHERE schemaname = 'public' 
            AND rowsecurity = true) = 7,
           'RLS not enabled on all tables';
    RAISE NOTICE 'Test 4 PASSED: RLS enabled on all tables';
END $$;

-- Test 5: Verify RLS policies exist
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM pg_policies 
            WHERE schemaname = 'public') >= 20,
           'Missing RLS policies';
    RAISE NOTICE 'Test 5 PASSED: RLS policies exist';
END $$;

-- Test 6: Verify triggers exist
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM information_schema.triggers 
            WHERE trigger_schema = 'public') >= 10,
           'Missing database triggers';
    RAISE NOTICE 'Test 6 PASSED: Database triggers exist';
END $$;

-- Test 7: Verify check constraints
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM information_schema.check_constraints 
            WHERE constraint_schema = 'public') >= 10,
           'Missing check constraints';
    RAISE NOTICE 'Test 7 PASSED: Check constraints exist';
END $$;

-- Test 8: Verify materialized view exists
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM pg_matviews 
            WHERE schemaname = 'public' 
            AND matviewname = 'dashboard_stats') = 1,
           'Dashboard stats materialized view missing';
    RAISE NOTICE 'Test 8 PASSED: Materialized view exists';
END $$;

-- Test 9: Test data insertion with constraints
DO $$
DECLARE
    test_plant_id UUID;
    test_user_id UUID;
    test_equipment_id UUID;
    test_breakdown_id UUID;
    test_repair_id UUID;
BEGIN
    -- Insert test plant
    INSERT INTO plants (name, location) 
    VALUES ('Test Plant', 'Test Location') 
    RETURNING id INTO test_plant_id;
    
    -- Insert test user
    INSERT INTO users (email, name, role, plant_id) 
    VALUES ('test@example.com', 'Test User', 'engineer', test_plant_id) 
    RETURNING id INTO test_user_id;
    
    -- Insert test equipment
    INSERT INTO equipment (equipment_type, equipment_number, plant_id) 
    VALUES ('Test Machine', 'TEST-001', test_plant_id) 
    RETURNING id INTO test_equipment_id;
    
    -- Insert test breakdown
    INSERT INTO breakdowns (equipment_id, equipment_type, equipment_number, occurred_at, symptoms, reporter_id, plant_id) 
    VALUES (test_equipment_id, 'Test Machine', 'TEST-001', NOW(), 'Test symptoms for validation', test_user_id, test_plant_id) 
    RETURNING id INTO test_breakdown_id;
    
    -- Insert test repair
    INSERT INTO repairs (breakdown_id, action_taken, technician_id, completed_at) 
    VALUES (test_breakdown_id, 'Test repair action performed', test_user_id, NOW()) 
    RETURNING id INTO test_repair_id;
    
    -- Insert test repair parts
    INSERT INTO repair_parts (repair_id, part_name, quantity, unit_price) 
    VALUES (test_repair_id, 'Test Part', 2, 100.00);
    
    -- Verify total cost was calculated
    ASSERT (SELECT total_cost FROM repairs WHERE id = test_repair_id) = 200.00,
           'Repair total cost not calculated correctly';
    
    -- Verify breakdown status was updated
    ASSERT (SELECT status FROM breakdowns WHERE id = test_breakdown_id) = 'completed',
           'Breakdown status not updated after repair';
    
    -- Clean up test data
    DELETE FROM repair_parts WHERE repair_id = test_repair_id;
    DELETE FROM repairs WHERE id = test_repair_id;
    DELETE FROM breakdowns WHERE id = test_breakdown_id;
    DELETE FROM equipment WHERE id = test_equipment_id;
    DELETE FROM users WHERE id = test_user_id;
    DELETE FROM plants WHERE id = test_plant_id;
    
    RAISE NOTICE 'Test 9 PASSED: Data insertion and business logic work correctly';
END $$;

-- Test 10: Test constraint violations
DO $$
DECLARE
    test_plant_id UUID;
    constraint_violated BOOLEAN := FALSE;
BEGIN
    -- Insert test plant
    INSERT INTO plants (name, location) 
    VALUES ('Constraint Test Plant', 'Test Location') 
    RETURNING id INTO test_plant_id;
    
    -- Test email format constraint
    BEGIN
        INSERT INTO users (email, name, role, plant_id) 
        VALUES ('invalid-email', 'Test User', 'engineer', test_plant_id);
        constraint_violated := FALSE;
    EXCEPTION
        WHEN check_violation THEN
            constraint_violated := TRUE;
    END;
    
    ASSERT constraint_violated, 'Email format constraint not working';
    
    -- Test equipment number format constraint
    constraint_violated := FALSE;
    BEGIN
        INSERT INTO equipment (equipment_type, equipment_number, plant_id) 
        VALUES ('Test Machine', 'invalid equipment number!', test_plant_id);
        constraint_violated := FALSE;
    EXCEPTION
        WHEN check_violation THEN
            constraint_violated := TRUE;
    END;
    
    ASSERT constraint_violated, 'Equipment number format constraint not working';
    
    -- Clean up
    DELETE FROM plants WHERE id = test_plant_id;
    
    RAISE NOTICE 'Test 10 PASSED: Constraint validations work correctly';
END $$;

RAISE NOTICE '=== ALL TESTS PASSED ===';
RAISE NOTICE 'Database schema is properly configured and functional';