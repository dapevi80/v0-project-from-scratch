-- Agregar columnas para documentos de verificacion de abogados
-- Estas columnas almacenan URLs de documentos y datos de identificacion

-- CURP y RFC
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS curp TEXT;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS rfc TEXT;

-- URLs de documentos
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS ine_url TEXT;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS cedula_url TEXT;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS titulo_url TEXT;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS constancia_fiscal_url TEXT;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS foto_perfil_url TEXT;

-- Estado de documentos
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS documentos_completos BOOLEAN DEFAULT false;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS fecha_envio_documentos TIMESTAMPTZ;

-- Notas de verificacion (para admin)
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS notas_verificacion TEXT;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS verificado_por UUID REFERENCES profiles(id);

-- Indice para busqueda por estado de documentos
CREATE INDEX IF NOT EXISTS idx_lawyer_profiles_docs_completos ON lawyer_profiles(documentos_completos);
