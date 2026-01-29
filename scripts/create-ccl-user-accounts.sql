-- Tabla para almacenar cuentas creadas en portales CCL
-- Permite acceso a buzon electronico y monitoreo de notificaciones

-- Tabla principal de cuentas CCL del trabajador
CREATE TABLE IF NOT EXISTS ccl_user_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Relaciones
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  caso_id UUID REFERENCES casos(id) ON DELETE SET NULL,
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE SET NULL,
  
  -- Datos del portal
  estado TEXT NOT NULL,
  portal_url TEXT NOT NULL,
  portal_nombre TEXT,
  
  -- Credenciales generadas
  email_portal TEXT NOT NULL,
  password_portal TEXT NOT NULL,
  curp_usado TEXT,
  rfc_usado TEXT,
  
  -- Estado de la cuenta
  cuenta_creada BOOLEAN DEFAULT FALSE,
  cuenta_verificada BOOLEAN DEFAULT FALSE,
  buzon_activo BOOLEAN DEFAULT FALSE,
  
  -- Folio y solicitud
  folio_solicitud TEXT,
  fecha_solicitud TIMESTAMPTZ,
  pdf_solicitud_url TEXT,
  
  -- Monitoreo de buzon
  ultimo_check_buzon TIMESTAMPTZ,
  notificaciones_pendientes INTEGER DEFAULT 0,
  
  -- Errores y reintentos
  error_ultimo TEXT,
  intentos_creacion INTEGER DEFAULT 0,
  max_intentos INTEGER DEFAULT 3,
  
  -- Metadata
  es_prueba BOOLEAN DEFAULT FALSE,
  sesion_diagnostico_id UUID,
  datos_trabajador JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para notificaciones del buzon electronico CCL
CREATE TABLE IF NOT EXISTS ccl_buzon_notificaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES ccl_user_accounts(id) ON DELETE CASCADE,
  
  -- Tipo de notificacion
  tipo TEXT NOT NULL CHECK (tipo IN (
    'solicitud_recibida',
    'citatorio_audiencia',
    'acta_audiencia',
    'convenio',
    'constancia_no_conciliacion',
    'resolucion',
    'otro'
  )),
  
  -- Contenido
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha_notificacion TIMESTAMPTZ NOT NULL,
  fecha_evento TIMESTAMPTZ, -- Fecha de audiencia, etc.
  
  -- Documentos adjuntos
  documento_url TEXT,
  documento_tipo TEXT, -- PDF, etc.
  documento_descargado BOOLEAN DEFAULT FALSE,
  
  -- Estado
  leida BOOLEAN DEFAULT FALSE,
  procesada BOOLEAN DEFAULT FALSE,
  
  -- Metadata del portal
  id_externo TEXT, -- ID de la notificacion en el portal
  raw_data JSONB, -- Datos crudos del portal
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para tracking de sesiones de monitoreo del agente IA
CREATE TABLE IF NOT EXISTS ccl_monitor_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Estado de la sesion
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'ejecutando', 'completado', 'error')),
  
  -- Estadisticas
  cuentas_revisadas INTEGER DEFAULT 0,
  notificaciones_encontradas INTEGER DEFAULT 0,
  errores INTEGER DEFAULT 0,
  
  -- Tiempos
  inicio TIMESTAMPTZ DEFAULT NOW(),
  fin TIMESTAMPTZ,
  
  -- Logs
  log_detalle JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_ccl_accounts_user ON ccl_user_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_ccl_accounts_caso ON ccl_user_accounts(caso_id);
CREATE INDEX IF NOT EXISTS idx_ccl_accounts_estado ON ccl_user_accounts(estado);
CREATE INDEX IF NOT EXISTS idx_ccl_accounts_buzon_activo ON ccl_user_accounts(buzon_activo) WHERE buzon_activo = true;
CREATE INDEX IF NOT EXISTS idx_ccl_notif_account ON ccl_buzon_notificaciones(account_id);
CREATE INDEX IF NOT EXISTS idx_ccl_notif_no_leida ON ccl_buzon_notificaciones(account_id, leida) WHERE leida = false;

-- Funcion para actualizar updated_at
CREATE OR REPLACE FUNCTION update_ccl_account_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-update de timestamp
DROP TRIGGER IF EXISTS update_ccl_accounts_timestamp ON ccl_user_accounts;
CREATE TRIGGER update_ccl_accounts_timestamp
  BEFORE UPDATE ON ccl_user_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_ccl_account_timestamp();

-- RLS Policies
ALTER TABLE ccl_user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccl_buzon_notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccl_monitor_sessions ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver sus propias cuentas CCL
CREATE POLICY "Users can view own ccl accounts" ON ccl_user_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- Abogados pueden ver cuentas de sus casos asignados
CREATE POLICY "Lawyers can view ccl accounts of their cases" ON ccl_user_accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM casos c 
      WHERE c.id = ccl_user_accounts.caso_id 
      AND c.abogado_id = auth.uid()
    )
  );

-- Superadmins pueden ver todo
CREATE POLICY "Superadmins can manage all ccl accounts" ON ccl_user_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'superadmin'
    )
  );

-- Politicas para notificaciones
CREATE POLICY "Users can view own notifications" ON ccl_buzon_notificaciones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ccl_user_accounts a 
      WHERE a.id = ccl_buzon_notificaciones.account_id 
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can manage all notifications" ON ccl_buzon_notificaciones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'superadmin'
    )
  );

-- Politicas para sesiones de monitoreo (solo superadmins)
CREATE POLICY "Superadmins can manage monitor sessions" ON ccl_monitor_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'superadmin'
    )
  );

-- Comentarios de documentacion
COMMENT ON TABLE ccl_user_accounts IS 'Cuentas creadas en portales CCL estatales para trabajadores';
COMMENT ON TABLE ccl_buzon_notificaciones IS 'Notificaciones recibidas del buzon electronico CCL';
COMMENT ON TABLE ccl_monitor_sessions IS 'Sesiones del agente IA que monitorea buzones CCL';
COMMENT ON COLUMN ccl_user_accounts.email_portal IS 'Email usado para crear la cuenta en el portal CCL';
COMMENT ON COLUMN ccl_user_accounts.password_portal IS 'Password generado para la cuenta CCL (encriptado en produccion)';
COMMENT ON COLUMN ccl_user_accounts.buzon_activo IS 'Indica si el buzon electronico esta habilitado y funcionando';
