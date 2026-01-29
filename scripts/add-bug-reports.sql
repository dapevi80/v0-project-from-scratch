-- Tabla de reportes de bugs/fallas
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  
  -- Detalles del reporte
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  pagina_url TEXT,
  tipo TEXT DEFAULT 'bug' CHECK (tipo IN ('bug', 'mejora', 'error_critico', 'ui_ux', 'otro')),
  severidad TEXT DEFAULT 'media' CHECK (severidad IN ('baja', 'media', 'alta', 'critica')),
  
  -- Screenshot opcional (base64 o URL)
  screenshot_url TEXT,
  
  -- Metadata del navegador/dispositivo
  user_agent TEXT,
  viewport_size TEXT,
  
  -- Estado del reporte
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'revisando', 'en_progreso', 'resuelto', 'no_procede', 'duplicado')),
  prioridad INTEGER DEFAULT 0,
  
  -- Respuesta del admin
  respuesta_admin TEXT,
  admin_id UUID REFERENCES auth.users(id),
  
  -- Recompensa
  credito_otorgado BOOLEAN DEFAULT FALSE,
  credito_fecha TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_bug_reports_user ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created ON bug_reports(created_at DESC);

-- RLS
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver sus propios reportes
CREATE POLICY "Users can view own reports" ON bug_reports
  FOR SELECT USING (auth.uid() = user_id);

-- Usuarios pueden crear reportes
CREATE POLICY "Users can create reports" ON bug_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins pueden ver todos
CREATE POLICY "Admins can view all reports" ON bug_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Admins pueden actualizar
CREATE POLICY "Admins can update reports" ON bug_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_bug_report_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bug_reports_timestamp
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_bug_report_timestamp();
