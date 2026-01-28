-- Agregar columnas de tracking para upgrades/downgrades en lawyer_profiles
ALTER TABLE lawyer_profiles 
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS notas_verificacion TEXT,
ADD COLUMN IF NOT EXISTS downgrade_reason TEXT,
ADD COLUMN IF NOT EXISTS downgrade_at TIMESTAMPTZ;

-- Crear indice para busquedas por estado
CREATE INDEX IF NOT EXISTS idx_lawyer_profiles_verification_status ON lawyer_profiles(verification_status);
