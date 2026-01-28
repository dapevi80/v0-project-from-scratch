-- Agregar columnas para tracking de upgrades
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS upgrade_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS upgrade_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS upgraded_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS upgrade_type TEXT; -- 'verification', 'subscription', 'admin_promotion'

-- Indice para buscar usuarios upgradeados recientemente
CREATE INDEX IF NOT EXISTS idx_profiles_upgrade_at ON profiles(upgrade_at) WHERE upgrade_at IS NOT NULL;
