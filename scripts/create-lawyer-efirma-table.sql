-- Tabla para almacenar configuracion de e.firma de abogados
CREATE TABLE IF NOT EXISTS lawyer_efirma (
  lawyer_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  certificado_url TEXT,
  key_url TEXT,
  password_encrypted TEXT,
  certificado_serial TEXT,
  certificado_valid_from TIMESTAMPTZ,
  certificado_valid_to TIMESTAMPTZ,
  rfc TEXT,
  configured_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice para buscar por RFC
CREATE INDEX IF NOT EXISTS idx_lawyer_efirma_rfc ON lawyer_efirma(rfc);

-- RLS
ALTER TABLE lawyer_efirma ENABLE ROW LEVEL SECURITY;

-- Solo el abogado puede ver/modificar su efirma
CREATE POLICY "Lawyers can manage own efirma" ON lawyer_efirma
  FOR ALL USING (auth.uid() = lawyer_id);

-- Admins pueden ver todas
CREATE POLICY "Admins can view all efirma" ON lawyer_efirma
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );
