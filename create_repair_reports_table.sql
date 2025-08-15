# Creating repair_reports table SQL
CREATE TABLE IF NOT EXISTS public.repair_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES equipment_info(id),
  technician_id UUID NOT NULL REFERENCES profiles(id),
  technician_name TEXT NOT NULL,
  repair_type TEXT NOT NULL CHECK (repair_type IN ('preventive', 'corrective', 'emergency', 'upgrade')),
  completion_status TEXT NOT NULL CHECK (completion_status IN ('completed', 'partial', 'failed')),
  work_description TEXT NOT NULL,
  time_spent NUMERIC NOT NULL,
  test_results TEXT NOT NULL,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policy
ALTER TABLE public.repair_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.repair_reports
FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.repair_reports
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON public.repair_reports
FOR UPDATE USING (auth.role() = 'authenticated');

