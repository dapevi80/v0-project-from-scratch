-- Crear tablas faltantes para el sistema completo
-- Ejecutar despues de las tablas principales

-- =====================================================
-- TABLA: despachos (firmas de abogados)
-- =====================================================
CREATE TABLE IF NOT EXISTS despachos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  razon_social TEXT,
  rfc TEXT,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  sitio_web TEXT,
  logo_url TEXT,
  codigo_referido TEXT UNIQUE,
  owner_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice para codigo de referido
CREATE INDEX IF NOT EXISTS idx_despachos_codigo ON despachos(codigo_referido);

-- =====================================================
-- TABLA: wallets (billeteras crypto)
-- =====================================================
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  address TEXT,
  network TEXT DEFAULT 'polygon',
  balance DECIMAL(18, 8) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- TABLA: achievements (logros) - recrear si existe
-- =====================================================
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT DEFAULT 'general',
  reward_usdt DECIMAL(10, 2) DEFAULT 0,
  criteria JSONB DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: user_achievements (logros de usuarios)
-- =====================================================
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  UNIQUE(user_id, achievement_id)
);

-- =====================================================
-- TABLA: crypto_payouts (retiros crypto)
-- =====================================================
CREATE TABLE IF NOT EXISTS crypto_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id),
  amount DECIMAL(18, 8) NOT NULL,
  network TEXT DEFAULT 'polygon',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  tx_hash TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice para payouts pendientes
CREATE INDEX IF NOT EXISTS idx_crypto_payouts_status ON crypto_payouts(status);
CREATE INDEX IF NOT EXISTS idx_crypto_payouts_user ON crypto_payouts(user_id);

-- =====================================================
-- TABLA: despacho_abogados (relacion despacho-abogado)
-- =====================================================
CREATE TABLE IF NOT EXISTS despacho_abogados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  despacho_id UUID REFERENCES despachos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(despacho_id, user_id)
);

-- =====================================================
-- RLS Policies
-- =====================================================

-- Despachos: lectura publica, escritura para admins
ALTER TABLE despachos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "despachos_select" ON despachos;
DROP POLICY IF EXISTS "despachos_all" ON despachos;
CREATE POLICY "despachos_select" ON despachos FOR SELECT USING (true);
CREATE POLICY "despachos_all" ON despachos FOR ALL USING (true);

-- Wallets: solo el usuario puede ver/editar su wallet
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wallets_user" ON wallets;
DROP POLICY IF EXISTS "wallets_all" ON wallets;
CREATE POLICY "wallets_user" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wallets_all" ON wallets FOR ALL USING (true);

-- Achievements: lectura publica
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "achievements_select" ON achievements;
DROP POLICY IF EXISTS "achievements_all" ON achievements;
CREATE POLICY "achievements_select" ON achievements FOR SELECT USING (true);
CREATE POLICY "achievements_all" ON achievements FOR ALL USING (true);

-- User achievements: usuario puede ver los suyos
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_achievements_user" ON user_achievements;
DROP POLICY IF EXISTS "user_achievements_all" ON user_achievements;
CREATE POLICY "user_achievements_user" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_achievements_all" ON user_achievements FOR ALL USING (true);

-- Crypto payouts: usuario puede ver los suyos
ALTER TABLE crypto_payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crypto_payouts_user" ON crypto_payouts;
DROP POLICY IF EXISTS "crypto_payouts_all" ON crypto_payouts;
CREATE POLICY "crypto_payouts_user" ON crypto_payouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "crypto_payouts_all" ON crypto_payouts FOR ALL USING (true);

-- Despacho abogados
ALTER TABLE despacho_abogados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "despacho_abogados_select" ON despacho_abogados;
DROP POLICY IF EXISTS "despacho_abogados_all" ON despacho_abogados;
CREATE POLICY "despacho_abogados_select" ON despacho_abogados FOR SELECT USING (true);
CREATE POLICY "despacho_abogados_all" ON despacho_abogados FOR ALL USING (true);

-- =====================================================
-- Insertar algunos achievements por defecto
-- =====================================================
INSERT INTO achievements (code, name, description, icon, category, reward_usdt, order_index) VALUES
  ('first_calc', 'Primera Cotizacion', 'Completaste tu primera cotizacion de liquidacion', 'calculator', 'onboarding', 1.00, 1),
  ('profile_complete', 'Perfil Completo', 'Completaste todos los datos de tu perfil', 'user', 'onboarding', 2.00, 2),
  ('first_case', 'Primer Caso', 'Iniciaste tu primer caso legal', 'briefcase', 'casos', 5.00, 3),
  ('referral_1', 'Primer Referido', 'Referiste a tu primer usuario', 'users', 'referidos', 3.00, 4),
  ('referral_5', 'Influencer', 'Referiste a 5 usuarios', 'star', 'referidos', 10.00, 5)
ON CONFLICT (code) DO NOTHING;
