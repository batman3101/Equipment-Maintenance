# Database Schema Documentation

This directory contains the database schema and configuration for the CNC Equipment Maintenance MVP application.

## Overview

The database is designed to support a multi-tenant CNC equipment maintenance system with the following key features:

- **Plant-based data isolation** using Row Level Security (RLS)
- **Role-based access control** (Engineer, Manager, Admin)
- **Equipment breakdown tracking** with file attachments
- **Repair management** with parts tracking and cost calculation
- **Real-time dashboard statistics** via materialized views

## Schema Structure

### Core Tables

1. **plants** - Manufacturing facilities
2. **users** - System users with role-based access
3. **equipment** - CNC machines and equipment
4. **breakdowns** - Equipment failure reports
5. **breakdown_attachments** - Files (images/videos) attached to breakdowns
6. **repairs** - Repair work performed on breakdowns
7. **repair_parts** - Parts used in repairs with cost tracking

### Views

- **dashboard_stats** - Materialized view for dashboard KPIs

## Migration Files

### 20240101000001_initial_schema.sql
- Creates all core tables with proper relationships
- Sets up indexes for performance optimization
- Creates triggers for automatic timestamp updates
- Establishes foreign key constraints

### 20240101000002_rls_policies.sql
- Enables Row Level Security on all tables
- Creates plant-based data isolation policies
- Implements role-based access control
- Sets up automatic cost calculation triggers

### 20240101000003_additional_constraints.sql
- Adds business logic validation constraints
- Creates composite indexes for query optimization
- Implements data validation triggers
- Sets up materialized view for dashboard statistics

## Security Features

### Row Level Security (RLS)
All tables have RLS enabled with policies that ensure:
- Users can only access data from their assigned plant
- Role-based permissions (Engineer < Manager < Admin)
- Data modification restrictions based on ownership

### Data Validation
- Email format validation
- File size and type restrictions (10MB max, specific formats)
- Business logic constraints (e.g., no future dates)
- Equipment validation before breakdown creation

### Access Control
- **Engineers**: Can create breakdowns and repairs, view plant data
- **Managers**: Can modify any data within their plant
- **Admins**: Full access to plant data and user management

## Performance Optimizations

### Indexes
- Primary key indexes on all tables
- Foreign key indexes for join performance
- Composite indexes for common query patterns
- Partial indexes for filtered queries (e.g., active equipment)

### Materialized Views
- Dashboard statistics are pre-calculated and cached
- Automatic refresh triggers on data changes
- Optimized for dashboard query performance

## Data Types and Constraints

### Equipment
- Equipment numbers must be alphanumeric with hyphens
- Status limited to 'active' or 'inactive'
- Unique constraint on (equipment_number, plant_id)

### Breakdowns
- Symptoms must be at least 10 characters
- Occurred time cannot be in the future
- Status progression: in_progress → under_repair → completed

### Repairs
- Action taken must be at least 10 characters
- Completed time cannot be in the future
- Total cost automatically calculated from parts

### File Attachments
- Maximum file size: 10MB
- Allowed types: JPEG, PNG, WebP, MP4, WebM
- Files stored in Supabase Storage with metadata in database

## Usage Examples

### Creating a Breakdown
```sql
INSERT INTO breakdowns (
  equipment_id, 
  equipment_type, 
  equipment_number, 
  occurred_at, 
  symptoms, 
  reporter_id, 
  plant_id
) VALUES (
  'equipment-uuid',
  'CNC 밀링머신',
  'CNC-001',
  NOW(),
  '스핀들 모터에서 이상 소음 발생',
  'user-uuid',
  'plant-uuid'
);
```

### Recording a Repair
```sql
-- Insert repair
INSERT INTO repairs (
  breakdown_id,
  action_taken,
  technician_id,
  completed_at
) VALUES (
  'breakdown-uuid',
  '베어링 교체 및 정렬 조정',
  'technician-uuid',
  NOW()
);

-- Add parts used
INSERT INTO repair_parts (
  repair_id,
  part_name,
  quantity,
  unit_price
) VALUES 
  ('repair-uuid', '베어링', 2, 50000),
  ('repair-uuid', '그리스', 1, 15000);
```

### Dashboard Statistics
```sql
SELECT * FROM dashboard_stats WHERE plant_id = 'plant-uuid';
```

## Development Setup

1. Install Supabase CLI
2. Run `supabase start` to start local development
3. Apply migrations: `supabase db reset`
4. Seed test data: `supabase db seed`

## Production Deployment

1. Create Supabase project
2. Apply migrations via Supabase Dashboard or CLI
3. Set up environment variables in application
4. Configure RLS policies and user roles

## Monitoring and Maintenance

### Performance Monitoring
- Monitor query performance via Supabase Dashboard
- Check index usage and optimize as needed
- Refresh materialized views during low-traffic periods

### Data Maintenance
- Regular cleanup of old attachment files
- Archive completed breakdowns older than retention period
- Monitor database size and implement partitioning if needed

### Security Auditing
- Regular review of RLS policies
- Monitor failed authentication attempts
- Audit user role assignments and permissions