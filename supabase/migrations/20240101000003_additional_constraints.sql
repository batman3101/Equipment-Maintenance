-- Additional constraints and optimizations for CNC Equipment Maintenance MVP
-- This migration adds additional business logic constraints and performance optimizations

-- Add check constraints for data validation
ALTER TABLE users ADD CONSTRAINT check_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE users ADD CONSTRAINT check_name_length 
  CHECK (LENGTH(TRIM(name)) >= 2);

ALTER TABLE equipment ADD CONSTRAINT check_equipment_type_length 
  CHECK (LENGTH(TRIM(equipment_type)) >= 2);

ALTER TABLE equipment ADD CONSTRAINT check_equipment_number_format 
  CHECK (equipment_number ~* '^[A-Z0-9-]+$');

ALTER TABLE breakdowns ADD CONSTRAINT check_symptoms_length 
  CHECK (LENGTH(TRIM(symptoms)) >= 10);

ALTER TABLE breakdowns ADD CONSTRAINT check_occurred_at_not_future 
  CHECK (occurred_at <= NOW());

ALTER TABLE repairs ADD CONSTRAINT check_action_taken_length 
  CHECK (LENGTH(TRIM(action_taken)) >= 10);

ALTER TABLE repairs ADD CONSTRAINT check_completed_at_not_future 
  CHECK (completed_at <= NOW());

ALTER TABLE repair_parts ADD CONSTRAINT check_part_name_length 
  CHECK (LENGTH(TRIM(part_name)) >= 2);

ALTER TABLE breakdown_attachments ADD CONSTRAINT check_file_size_limit 
  CHECK (file_size > 0 AND file_size <= 10485760); -- 10MB limit

ALTER TABLE breakdown_attachments ADD CONSTRAINT check_file_type_allowed 
  CHECK (file_type IN ('image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'));

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_breakdowns_plant_status_created ON breakdowns(plant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_breakdowns_equipment_occurred ON breakdowns(equipment_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_repairs_breakdown_completed ON repairs(breakdown_id, completed_at DESC);

-- Add partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_equipment_active ON equipment(plant_id, equipment_type) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_breakdowns_in_progress ON breakdowns(plant_id, created_at DESC) WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS idx_breakdowns_under_repair ON breakdowns(plant_id, created_at DESC) WHERE status = 'under_repair';

-- Create function to validate equipment exists before creating breakdown
CREATE OR REPLACE FUNCTION validate_breakdown_equipment()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if equipment exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM equipment 
        WHERE id = NEW.equipment_id 
        AND status = 'active'
        AND plant_id = NEW.plant_id
    ) THEN
        RAISE EXCEPTION 'Equipment does not exist or is not active in the specified plant';
    END IF;
    
    -- Auto-populate equipment details from equipment table
    SELECT equipment_type, equipment_number 
    INTO NEW.equipment_type, NEW.equipment_number
    FROM equipment 
    WHERE id = NEW.equipment_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for breakdown equipment validation
CREATE TRIGGER validate_breakdown_equipment_trigger
    BEFORE INSERT OR UPDATE ON breakdowns
    FOR EACH ROW EXECUTE FUNCTION validate_breakdown_equipment();

-- Create function to validate repair belongs to accessible breakdown
CREATE OR REPLACE FUNCTION validate_repair_breakdown()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if breakdown exists and is accessible to the technician
    IF NOT EXISTS (
        SELECT 1 FROM breakdowns b
        JOIN users u ON u.id = NEW.technician_id
        WHERE b.id = NEW.breakdown_id 
        AND b.plant_id = u.plant_id
    ) THEN
        RAISE EXCEPTION 'Breakdown does not exist or is not accessible to the technician';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for repair breakdown validation
CREATE TRIGGER validate_repair_breakdown_trigger
    BEFORE INSERT OR UPDATE ON repairs
    FOR EACH ROW EXECUTE FUNCTION validate_repair_breakdown();

-- Create function to auto-update breakdown status when repair is completed
CREATE OR REPLACE FUNCTION update_breakdown_status_on_repair()
RETURNS TRIGGER AS $$
BEGIN
    -- Update breakdown status to completed when repair is added
    UPDATE breakdowns 
    SET status = 'completed', updated_at = NOW()
    WHERE id = NEW.breakdown_id AND status != 'completed';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update breakdown status
CREATE TRIGGER update_breakdown_status_trigger
    AFTER INSERT ON repairs
    FOR EACH ROW EXECUTE FUNCTION update_breakdown_status_on_repair();

-- Create function to prevent deletion of breakdowns with repairs
CREATE OR REPLACE FUNCTION prevent_breakdown_deletion_with_repairs()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM repairs WHERE breakdown_id = OLD.id) THEN
        RAISE EXCEPTION 'Cannot delete breakdown that has associated repairs';
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent breakdown deletion
CREATE TRIGGER prevent_breakdown_deletion_trigger
    BEFORE DELETE ON breakdowns
    FOR EACH ROW EXECUTE FUNCTION prevent_breakdown_deletion_with_repairs();

-- Create materialized view for dashboard statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT 
    p.id as plant_id,
    p.name as plant_name,
    COUNT(DISTINCT e.id) as total_equipment,
    COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.id END) as active_equipment,
    COUNT(DISTINCT b.id) as total_breakdowns,
    COUNT(DISTINCT CASE WHEN b.status = 'in_progress' THEN b.id END) as in_progress_breakdowns,
    COUNT(DISTINCT CASE WHEN b.status = 'under_repair' THEN b.id END) as under_repair_breakdowns,
    COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_breakdowns,
    COUNT(DISTINCT r.id) as total_repairs,
    COALESCE(SUM(r.total_cost), 0) as total_repair_cost,
    COUNT(DISTINCT CASE WHEN b.created_at >= CURRENT_DATE THEN b.id END) as today_breakdowns,
    COUNT(DISTINCT CASE WHEN b.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN b.id END) as week_breakdowns,
    COUNT(DISTINCT CASE WHEN r.completed_at >= CURRENT_DATE THEN r.id END) as today_repairs,
    COUNT(DISTINCT CASE WHEN r.completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN r.id END) as week_repairs
FROM plants p
LEFT JOIN equipment e ON e.plant_id = p.id
LEFT JOIN breakdowns b ON b.plant_id = p.id
LEFT JOIN repairs r ON r.breakdown_id = b.id
GROUP BY p.id, p.name;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_plant_id ON dashboard_stats(plant_id);

-- Create function to refresh dashboard stats
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically refresh stats on data changes
CREATE OR REPLACE FUNCTION trigger_dashboard_stats_refresh()
RETURNS TRIGGER AS $$
BEGIN
    -- Use pg_notify to signal that stats need refreshing
    -- This can be picked up by the application to refresh asynchronously
    PERFORM pg_notify('dashboard_stats_refresh', '');
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh dashboard stats
CREATE TRIGGER refresh_stats_on_breakdown_change
    AFTER INSERT OR UPDATE OR DELETE ON breakdowns
    FOR EACH ROW EXECUTE FUNCTION trigger_dashboard_stats_refresh();

CREATE TRIGGER refresh_stats_on_repair_change
    AFTER INSERT OR UPDATE OR DELETE ON repairs
    FOR EACH ROW EXECUTE FUNCTION trigger_dashboard_stats_refresh();

CREATE TRIGGER refresh_stats_on_equipment_change
    AFTER INSERT OR UPDATE OR DELETE ON equipment
    FOR EACH ROW EXECUTE FUNCTION trigger_dashboard_stats_refresh();

-- Add comments for documentation
COMMENT ON TABLE plants IS 'Manufacturing plants/facilities';
COMMENT ON TABLE users IS 'System users with role-based access';
COMMENT ON TABLE equipment IS 'Manufacturing equipment/machines';
COMMENT ON TABLE breakdowns IS 'Equipment breakdown/failure reports';
COMMENT ON TABLE breakdown_attachments IS 'Files attached to breakdown reports';
COMMENT ON TABLE repairs IS 'Repair work performed on breakdowns';
COMMENT ON TABLE repair_parts IS 'Parts used in repair work';
COMMENT ON MATERIALIZED VIEW dashboard_stats IS 'Aggregated statistics for dashboard display';

-- Add column comments
COMMENT ON COLUMN users.role IS 'User role: engineer, manager, or admin';
COMMENT ON COLUMN equipment.status IS 'Equipment status: active or inactive';
COMMENT ON COLUMN breakdowns.status IS 'Breakdown status: in_progress, under_repair, or completed';
COMMENT ON COLUMN breakdown_attachments.file_size IS 'File size in bytes (max 10MB)';
COMMENT ON COLUMN repair_parts.total_price IS 'Calculated as quantity * unit_price';