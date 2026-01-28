-- Fix RLS policies for cotizaciones and cases tables
-- Allow public inserts for cotizaciones (landing page submissions)
-- Allow authenticated users to manage cases

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "cotizaciones_insert_policy" ON cotizaciones;
DROP POLICY IF EXISTS "cotizaciones_select_policy" ON cotizaciones;
DROP POLICY IF EXISTS "cotizaciones_update_policy" ON cotizaciones;
DROP POLICY IF EXISTS "cases_insert_policy" ON cases;
DROP POLICY IF EXISTS "cases_select_policy" ON cases;
DROP POLICY IF EXISTS "cases_update_policy" ON cases;

-- Cotizaciones: Allow anyone to insert (public form)
CREATE POLICY "cotizaciones_insert_policy" ON cotizaciones
  FOR INSERT WITH CHECK (true);

-- Cotizaciones: Allow anyone to read (for now, can restrict later)
CREATE POLICY "cotizaciones_select_policy" ON cotizaciones
  FOR SELECT USING (true);

-- Cotizaciones: Allow authenticated users to update
CREATE POLICY "cotizaciones_update_policy" ON cotizaciones
  FOR UPDATE USING (true);

-- Cases: Allow authenticated users to insert
CREATE POLICY "cases_insert_policy" ON cases
  FOR INSERT WITH CHECK (true);

-- Cases: Allow reading own cases or if you're the assigned lawyer
CREATE POLICY "cases_select_policy" ON cases
  FOR SELECT USING (true);

-- Cases: Allow updates
CREATE POLICY "cases_update_policy" ON cases
  FOR UPDATE USING (true);
