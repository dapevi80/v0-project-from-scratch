-- Agregar campos de contacto profesional para abogados
-- Estos campos se usan en la Cédula Digital que aparece en los PDFs

-- Agregar campos a lawyer_profiles
ALTER TABLE lawyer_profiles 
ADD COLUMN IF NOT EXISTS cedula_numero TEXT,
ADD COLUMN IF NOT EXISTS direccion_oficina TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS horario_atencion TEXT DEFAULT '9:00 AM - 6:00 PM';

-- Comentarios descriptivos
COMMENT ON COLUMN lawyer_profiles.cedula_numero IS 'Número de cédula profesional del abogado';
COMMENT ON COLUMN lawyer_profiles.direccion_oficina IS 'Dirección completa de la oficina del abogado';
COMMENT ON COLUMN lawyer_profiles.whatsapp IS 'Número de WhatsApp con código de país (ej: 529985933232)';
COMMENT ON COLUMN lawyer_profiles.horario_atencion IS 'Horario de atención al público';

-- Crear índice para búsqueda por cédula
CREATE INDEX IF NOT EXISTS idx_lawyer_cedula ON lawyer_profiles(cedula_numero);
