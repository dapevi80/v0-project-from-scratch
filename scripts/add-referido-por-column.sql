-- Agregar columna referido_por a profiles si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referido_por UUID REFERENCES profiles(id);

-- Crear indice para mejorar consultas de referidos
CREATE INDEX IF NOT EXISTS idx_profiles_referido_por ON profiles(referido_por);
