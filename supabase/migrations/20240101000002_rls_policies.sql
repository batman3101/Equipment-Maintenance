-- Row Level Security (RLS) Policies for CNC Equipment Maintenance MVP
-- These policies ensure users can only access data from their own plant

-- Enable RLS on all tables
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdown_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_parts ENABLE ROW LEVEL SECURITY;

-- Plants policies
-- Users can only view their own plant
CREATE POLICY "Users can view own plant" ON plants
  FOR SELECT USING (
    id = (SELECT plant_id FROM users WHERE id = auth.uid())
  );

-- Only admins can modify plants
CREATE POLICY "Admins can modify plants" ON plants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND plant_id = plants.id
    )
  );

-- Users policies
-- Users can view other users in their plant
CREATE POLICY "Users can view plant members" ON users
  FOR SELECT USING (
    plant_id = (SELECT plant_id FROM users WHERE id = auth.uid())
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Only admins can create/delete users
CREATE POLICY "Admins can manage users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND plant_id = users.plant_id
    )
  );

-- Equipment policies
-- Users can view equipment in their plant
CREATE POLICY "Users can view plant equipment" ON equipment
  FOR SELECT USING (
    plant_id = (SELECT plant_id FROM users WHERE id = auth.uid())
  );

-- Engineers and above can create/update equipment
CREATE POLICY "Engineers can manage equipment" ON equipment
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND plant_id = equipment.plant_id
      AND role IN ('engineer', 'manager', 'admin')
    )
  );

-- Breakdowns policies
-- Users can view breakdowns in their plant
CREATE POLICY "Users can view plant breakdowns" ON breakdowns
  FOR SELECT USING (
    plant_id = (SELECT plant_id FROM users WHERE id = auth.uid())
  );

-- Engineers can create breakdowns
CREATE POLICY "Engineers can create breakdowns" ON breakdowns
  FOR INSERT WITH CHECK (
    reporter_id = auth.uid() AND
    plant_id = (SELECT plant_id FROM users WHERE id = auth.uid())
  );

-- Users can update breakdowns they reported or if they're managers/admins
CREATE POLICY "Users can update own breakdowns or managers can update all" ON breakdowns
  FOR UPDATE USING (
    reporter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND plant_id = breakdowns.plant_id
      AND role IN ('manager', 'admin')
    )
  );

-- Only managers and admins can delete breakdowns
CREATE POLICY "Managers can delete breakdowns" ON breakdowns
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND plant_id = breakdowns.plant_id
      AND role IN ('manager', 'admin')
    )
  );

-- Breakdown attachments policies
-- Users can view attachments for breakdowns in their plant
CREATE POLICY "Users can view plant breakdown attachments" ON breakdown_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM breakdowns 
      WHERE id = breakdown_attachments.breakdown_id 
      AND plant_id = (SELECT plant_id FROM users WHERE id = auth.uid())
    )
  );

-- Users can create attachments for breakdowns they can access
CREATE POLICY "Users can create breakdown attachments" ON breakdown_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM breakdowns 
      WHERE id = breakdown_attachments.breakdown_id 
      AND plant_id = (SELECT plant_id FROM users WHERE id = auth.uid())
    )
  );

-- Users can delete their own attachments or managers can delete any
CREATE POLICY "Users can manage breakdown attachments" ON breakdown_attachments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM breakdowns b
      JOIN users u ON u.id = auth.uid()
      WHERE b.id = breakdown_attachments.breakdown_id 
      AND b.plant_id = u.plant_id
      AND (b.reporter_id = auth.uid() OR u.role IN ('manager', 'admin'))
    )
  );

-- Repairs policies
-- Users can view repairs for breakdowns in their plant
CREATE POLICY "Users can view plant repairs" ON repairs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM breakdowns 
      WHERE id = repairs.breakdown_id 
      AND plant_id = (SELECT plant_id FROM users WHERE id = auth.uid())
    )
  );

-- Engineers can create repairs
CREATE POLICY "Engineers can create repairs" ON repairs
  FOR INSERT WITH CHECK (
    technician_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM breakdowns b
      JOIN users u ON u.id = auth.uid()
      WHERE b.id = repairs.breakdown_id 
      AND b.plant_id = u.plant_id
      AND u.role IN ('engineer', 'manager', 'admin')
    )
  );

-- Users can update repairs they created or managers can update any
CREATE POLICY "Users can update own repairs or managers can update all" ON repairs
  FOR UPDATE USING (
    technician_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM breakdowns b
      JOIN users u ON u.id = auth.uid()
      WHERE b.id = repairs.breakdown_id 
      AND b.plant_id = u.plant_id
      AND u.role IN ('manager', 'admin')
    )
  );

-- Only managers and admins can delete repairs
CREATE POLICY "Managers can delete repairs" ON repairs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM breakdowns b
      JOIN users u ON u.id = auth.uid()
      WHERE b.id = repairs.breakdown_id 
      AND b.plant_id = u.plant_id
      AND u.role IN ('manager', 'admin')
    )
  );

-- Repair parts policies
-- Users can view repair parts for repairs they can access
CREATE POLICY "Users can view repair parts" ON repair_parts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM repairs r
      JOIN breakdowns b ON b.id = r.breakdown_id
      WHERE r.id = repair_parts.repair_id 
      AND b.plant_id = (SELECT plant_id FROM users WHERE id = auth.uid())
    )
  );

-- Users can create repair parts for repairs they can access
CREATE POLICY "Users can create repair parts" ON repair_parts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM repairs r
      JOIN breakdowns b ON b.id = r.breakdown_id
      JOIN users u ON u.id = auth.uid()
      WHERE r.id = repair_parts.repair_id 
      AND b.plant_id = u.plant_id
      AND (r.technician_id = auth.uid() OR u.role IN ('manager', 'admin'))
    )
  );

-- Users can update repair parts for repairs they created or managers can update any
CREATE POLICY "Users can update repair parts" ON repair_parts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM repairs r
      JOIN breakdowns b ON b.id = r.breakdown_id
      JOIN users u ON u.id = auth.uid()
      WHERE r.id = repair_parts.repair_id 
      AND b.plant_id = u.plant_id
      AND (r.technician_id = auth.uid() OR u.role IN ('manager', 'admin'))
    )
  );

-- Users can delete repair parts for repairs they created or managers can delete any
CREATE POLICY "Users can delete repair parts" ON repair_parts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM repairs r
      JOIN breakdowns b ON b.id = r.breakdown_id
      JOIN users u ON u.id = auth.uid()
      WHERE r.id = repair_parts.repair_id 
      AND b.plant_id = u.plant_id
      AND (r.technician_id = auth.uid() OR u.role IN ('manager', 'admin'))
    )
  );

-- Create function to automatically update repair total_cost when parts are modified
CREATE OR REPLACE FUNCTION update_repair_total_cost()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE repairs 
    SET total_cost = (
        SELECT COALESCE(SUM(total_price), 0) 
        FROM repair_parts 
        WHERE repair_id = COALESCE(NEW.repair_id, OLD.repair_id)
    )
    WHERE id = COALESCE(NEW.repair_id, OLD.repair_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update repair total_cost
CREATE TRIGGER update_repair_cost_on_parts_insert
    AFTER INSERT ON repair_parts
    FOR EACH ROW EXECUTE FUNCTION update_repair_total_cost();

CREATE TRIGGER update_repair_cost_on_parts_update
    AFTER UPDATE ON repair_parts
    FOR EACH ROW EXECUTE FUNCTION update_repair_total_cost();

CREATE TRIGGER update_repair_cost_on_parts_delete
    AFTER DELETE ON repair_parts
    FOR EACH ROW EXECUTE FUNCTION update_repair_total_cost();