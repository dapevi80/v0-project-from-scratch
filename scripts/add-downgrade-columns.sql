-- Agregar columnas para tracking de downgrade de cuentas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS downgrade_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS downgrade_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS previous_role TEXT;

-- Agregar 'documents_missing' como opcion valida de verification_status
COMMENT ON COLUMN profiles.verification_status IS 'none, pending, verified, rejected, documents_missing';
