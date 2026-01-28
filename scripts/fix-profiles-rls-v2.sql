-- =====================================================
-- ARREGLAR RECURSION INFINITA EN POLITICAS RLS
-- El problema es que las politicas referencian la misma tabla
-- =====================================================

-- Eliminar TODAS las politicas existentes de profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role full access" ON profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;
DROP POLICY IF EXISTS "profiles_auth_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_own_update" ON profiles;
DROP POLICY IF EXISTS "profiles_read_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Eliminar politicas de lawyer_profiles
DROP POLICY IF EXISTS "lawyer_profiles_select_policy" ON lawyer_profiles;
DROP POLICY IF EXISTS "lawyer_profiles_insert_policy" ON lawyer_profiles;
DROP POLICY IF EXISTS "lawyer_profiles_update_policy" ON lawyer_profiles;
DROP POLICY IF EXISTS "Users can view own lawyer profile" ON lawyer_profiles;
DROP POLICY IF EXISTS "Users can update own lawyer profile" ON lawyer_profiles;
DROP POLICY IF EXISTS "Users can insert own lawyer profile" ON lawyer_profiles;
DROP POLICY IF EXISTS "lawyer_profiles_public_read" ON lawyer_profiles;
DROP POLICY IF EXISTS "lawyer_profiles_auth_insert" ON lawyer_profiles;
DROP POLICY IF EXISTS "lawyer_profiles_own_update" ON lawyer_profiles;
DROP POLICY IF EXISTS "lawyer_profiles_read_all" ON lawyer_profiles;
DROP POLICY IF EXISTS "lawyer_profiles_insert_own" ON lawyer_profiles;
DROP POLICY IF EXISTS "lawyer_profiles_update_own" ON lawyer_profiles;

-- =====================================================
-- POLITICAS SIMPLES SIN RECURSION para profiles
-- =====================================================

-- Cualquiera puede leer profiles (necesario para mostrar info publica)
CREATE POLICY "profiles_read_all" ON profiles
  FOR SELECT USING (true);

-- Usuarios autenticados pueden insertar su propio perfil
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Usuarios pueden actualizar solo su propio perfil
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- POLITICAS SIMPLES SIN RECURSION para lawyer_profiles
-- =====================================================

-- Cualquiera puede leer lawyer_profiles
CREATE POLICY "lawyer_profiles_read_all" ON lawyer_profiles
  FOR SELECT USING (true);

-- Usuarios autenticados pueden insertar su propio lawyer_profile
CREATE POLICY "lawyer_profiles_insert_own" ON lawyer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden actualizar solo su propio lawyer_profile
CREATE POLICY "lawyer_profiles_update_own" ON lawyer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- POLITICAS SIMPLES para cotizaciones
-- =====================================================
DROP POLICY IF EXISTS "cotizaciones_insert_public" ON cotizaciones;
DROP POLICY IF EXISTS "cotizaciones_select_all" ON cotizaciones;
DROP POLICY IF EXISTS "cotizaciones_update_auth" ON cotizaciones;

CREATE POLICY "cotizaciones_read_all" ON cotizaciones
  FOR SELECT USING (true);

CREATE POLICY "cotizaciones_insert_all" ON cotizaciones
  FOR INSERT WITH CHECK (true);

CREATE POLICY "cotizaciones_update_all" ON cotizaciones
  FOR UPDATE USING (true);

-- =====================================================
-- POLITICAS SIMPLES para cases
-- =====================================================
DROP POLICY IF EXISTS "cases_insert_auth" ON cases;
DROP POLICY IF EXISTS "cases_select_all" ON cases;
DROP POLICY IF EXISTS "cases_update_auth" ON cases;

CREATE POLICY "cases_read_all" ON cases
  FOR SELECT USING (true);

CREATE POLICY "cases_insert_all" ON cases
  FOR INSERT WITH CHECK (true);

CREATE POLICY "cases_update_all" ON cases
  FOR UPDATE USING (true);
