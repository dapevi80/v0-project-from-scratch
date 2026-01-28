-- Fix RLS policies for profiles table to allow inserts

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow insert for service role" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for signup flow)
CREATE POLICY "Allow public insert on profiles"
ON profiles FOR INSERT
WITH CHECK (true);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Allow admins and superadmins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'superadmin')
  )
);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow admins to update any profile
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'superadmin')
  )
);

-- Fix lawyer_profiles RLS too
DROP POLICY IF EXISTS "Allow insert on lawyer_profiles" ON lawyer_profiles;
DROP POLICY IF EXISTS "lawyer_profiles_insert_policy" ON lawyer_profiles;
DROP POLICY IF EXISTS "lawyer_profiles_select_policy" ON lawyer_profiles;
DROP POLICY IF EXISTS "lawyer_profiles_update_policy" ON lawyer_profiles;

ALTER TABLE lawyer_profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert lawyer_profiles (for signup flow)
CREATE POLICY "Allow public insert on lawyer_profiles"
ON lawyer_profiles FOR INSERT
WITH CHECK (true);

-- Allow users to view their own lawyer_profile
CREATE POLICY "Users can view own lawyer_profile"
ON lawyer_profiles FOR SELECT
USING (auth.uid() = user_id);

-- Allow admins to view all lawyer_profiles
CREATE POLICY "Admins can view all lawyer_profiles"
ON lawyer_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'superadmin', 'lawyer')
  )
);

-- Allow users to update their own lawyer_profile
CREATE POLICY "Users can update own lawyer_profile"
ON lawyer_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow admins to update any lawyer_profile
CREATE POLICY "Admins can update all lawyer_profiles"
ON lawyer_profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'superadmin')
  )
);
