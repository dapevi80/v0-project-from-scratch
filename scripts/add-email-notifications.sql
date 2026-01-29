-- Tabla para registrar notificaciones de email enviadas
CREATE TABLE IF NOT EXISTS notificaciones_email (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id UUID REFERENCES solicitudes_ccl(id) ON DELETE CASCADE,
  tipo VARCHAR(100) NOT NULL, -- 'solicitud_enviada_abogado', 'solicitud_enviada_trabajador', 'fallo_proceso', etc.
  destinatario VARCHAR(255) NOT NULL,
  asunto VARCHAR(500),
  enviado BOOLEAN DEFAULT false,
  message_id VARCHAR(255), -- ID del servicio de email
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_notificaciones_solicitud ON notificaciones_email(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON notificaciones_email(tipo);
CREATE INDEX IF NOT EXISTS idx_notificaciones_destinatario ON notificaciones_email(destinatario);
CREATE INDEX IF NOT EXISTS idx_notificaciones_created ON notificaciones_email(created_at DESC);

-- RLS
ALTER TABLE notificaciones_email ENABLE ROW LEVEL SECURITY;

-- Politica: Solo admins y superadmins pueden ver notificaciones
CREATE POLICY "Admins pueden ver notificaciones" ON notificaciones_email
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Politica: El sistema puede insertar (service role)
CREATE POLICY "Sistema puede insertar notificaciones" ON notificaciones_email
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE notificaciones_email IS 'Registro de notificaciones de email enviadas por el sistema';
