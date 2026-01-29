-- Tabla para almacenar las autorizaciones de los trabajadores para SINACOL
-- Esto es un requisito legal para que MeCorrieron.mx pueda actuar en su nombre

CREATE TABLE IF NOT EXISTS sinacol_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Autorizaciones específicas
  autoriza_mecorrieron BOOLEAN NOT NULL DEFAULT false,
  autoriza_abogado BOOLEAN NOT NULL DEFAULT false,
  autoriza_sinacol BOOLEAN NOT NULL DEFAULT false,
  autoriza_notificaciones BOOLEAN NOT NULL DEFAULT false,
  terminos_aceptados BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata de la firma
  fecha_autorizacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_autorizacion VARCHAR(45),
  user_agent TEXT,
  firma_electronica TEXT, -- Hash de la firma
  
  -- Datos del trabajador al momento de firmar
  curp_firmante VARCHAR(18),
  nombre_firmante VARCHAR(200),
  
  -- Datos de la empresa demandada
  empresa_razon_social VARCHAR(200),
  empresa_rfc VARCHAR(13),
  
  -- Estado CCL
  estado_ccl VARCHAR(50),
  url_sinacol TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Solo una autorización activa por caso
  UNIQUE(caso_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sinacol_auth_caso ON sinacol_authorizations(caso_id);
CREATE INDEX IF NOT EXISTS idx_sinacol_auth_user ON sinacol_authorizations(user_id);
CREATE INDEX IF NOT EXISTS idx_sinacol_auth_fecha ON sinacol_authorizations(fecha_autorizacion);

-- RLS
ALTER TABLE sinacol_authorizations ENABLE ROW LEVEL SECURITY;

-- Política: usuarios pueden ver sus propias autorizaciones
CREATE POLICY "Users can view own authorizations" ON sinacol_authorizations
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM casos c 
      WHERE c.id = sinacol_authorizations.caso_id 
      AND c.user_id = auth.uid()
    )
  );

-- Política: usuarios pueden crear autorizaciones para sus casos
CREATE POLICY "Users can create own authorizations" ON sinacol_authorizations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM casos c 
      WHERE c.id = caso_id 
      AND c.user_id = auth.uid()
    )
  );

-- Política: abogados pueden ver autorizaciones de casos asignados
CREATE POLICY "Lawyers can view assigned case authorizations" ON sinacol_authorizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM casos c 
      WHERE c.id = sinacol_authorizations.caso_id 
      AND c.abogado_id = auth.uid()
    )
  );

-- Política: admins pueden ver todas
CREATE POLICY "Admins can view all authorizations" ON sinacol_authorizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'superadmin')
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_sinacol_auth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sinacol_auth_updated_at ON sinacol_authorizations;
CREATE TRIGGER sinacol_auth_updated_at
  BEFORE UPDATE ON sinacol_authorizations
  FOR EACH ROW
  EXECUTE FUNCTION update_sinacol_auth_updated_at();

-- Comentarios
COMMENT ON TABLE sinacol_authorizations IS 'Autorizaciones legales de trabajadores para gestión de casos SINACOL';
COMMENT ON COLUMN sinacol_authorizations.autoriza_mecorrieron IS 'Autoriza a MeCorrieron.mx a gestionar el caso';
COMMENT ON COLUMN sinacol_authorizations.autoriza_abogado IS 'Autoriza al abogado asignado a representarle';
COMMENT ON COLUMN sinacol_authorizations.autoriza_sinacol IS 'Autoriza crear solicitud en portal SINACOL';
COMMENT ON COLUMN sinacol_authorizations.firma_electronica IS 'Hash SHA-256 de los datos de la autorización';
