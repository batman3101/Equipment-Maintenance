-- Initial database schema for CNC Equipment Maintenance MVP
-- This migration creates the core tables with proper constraints and indexes

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create plants table first (referenced by other tables)
CREATE TABLE IF NOT EXISTS plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('engineer', 'manager', 'admin')),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_type VARCHAR(100) NOT NULL,
  equipment_number VARCHAR(100) NOT NULL,
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(equipment_number, plant_id)
);

-- Create breakdowns table
CREATE TABLE IF NOT EXISTS breakdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  equipment_type VARCHAR(100) NOT NULL,
  equipment_number VARCHAR(100) NOT NULL,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  symptoms TEXT NOT NULL,
  cause TEXT,
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'under_repair', 'completed')),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create breakdown_attachments table for file uploads
CREATE TABLE IF NOT EXISTS breakdown_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breakdown_id UUID NOT NULL REFERENCES breakdowns(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create repairs table
CREATE TABLE IF NOT EXISTS repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breakdown_id UUID NOT NULL REFERENCES breakdowns(id) ON DELETE CASCADE,
  action_taken TEXT NOT NULL,
  technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  total_cost DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create repair_parts table for tracking parts used in repairs
CREATE TABLE IF NOT EXISTS repair_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id UUID NOT NULL REFERENCES repairs(id) ON DELETE CASCADE,
  part_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_plant_id ON users(plant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_equipment_plant_id ON equipment(plant_id);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(equipment_type);
CREATE INDEX IF NOT EXISTS idx_equipment_number ON equipment(equipment_number);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);

CREATE INDEX IF NOT EXISTS idx_breakdowns_equipment_id ON breakdowns(equipment_id);
CREATE INDEX IF NOT EXISTS idx_breakdowns_plant_id ON breakdowns(plant_id);
CREATE INDEX IF NOT EXISTS idx_breakdowns_reporter_id ON breakdowns(reporter_id);
CREATE INDEX IF NOT EXISTS idx_breakdowns_status ON breakdowns(status);
CREATE INDEX IF NOT EXISTS idx_breakdowns_occurred_at ON breakdowns(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_breakdowns_created_at ON breakdowns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_breakdown_attachments_breakdown_id ON breakdown_attachments(breakdown_id);

CREATE INDEX IF NOT EXISTS idx_repairs_breakdown_id ON repairs(breakdown_id);
CREATE INDEX IF NOT EXISTS idx_repairs_technician_id ON repairs(technician_id);
CREATE INDEX IF NOT EXISTS idx_repairs_completed_at ON repairs(completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_repair_parts_repair_id ON repair_parts(repair_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_plants_updated_at BEFORE UPDATE ON plants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_breakdowns_updated_at BEFORE UPDATE ON breakdowns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repairs_updated_at BEFORE UPDATE ON repairs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();