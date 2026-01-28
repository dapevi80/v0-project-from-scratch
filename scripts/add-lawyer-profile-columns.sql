-- Agregar todas las columnas necesarias para lawyer_profiles
-- Columnas basicas de perfil
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS anos_experiencia INTEGER DEFAULT 0;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS firm_name TEXT;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS horario_atencion TEXT;

-- Columnas de especializacion
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS especialidades TEXT[] DEFAULT '{}';
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS estados_operacion TEXT[] DEFAULT '{}';

-- Columnas de verificacion
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS cedula_profesional TEXT;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS universidad TEXT;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT false;

-- Columnas de documentos
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS curp TEXT;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS rfc TEXT;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS ine_url TEXT;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS cedula_url TEXT;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS titulo_url TEXT;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS constancia_fiscal_url TEXT;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS foto_perfil_url TEXT;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS documentos_completos BOOLEAN DEFAULT false;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS fecha_envio_documentos TIMESTAMPTZ;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS notas_rechazo TEXT;

-- Columna de contacto
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Asegurar que verification_status tenga un valor por defecto
ALTER TABLE lawyer_profiles ALTER COLUMN verification_status SET DEFAULT 'pending';
