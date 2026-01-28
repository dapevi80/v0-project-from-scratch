-- Agregar columna notas_rechazo a lawyer_profiles
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS notas_rechazo TEXT;
