-- Tabla para jobs del agente CCL
-- Rastrea el progreso de solicitudes automatizadas

CREATE TABLE IF NOT EXISTS ccl_agent_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  abogado_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Estado del job
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  current_step TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Configuración del job
  modalidad_conciliacion TEXT NOT NULL CHECK (modalidad_conciliacion IN ('presencial', 'remota')),
  citado_tipo_persona TEXT NOT NULL CHECK (citado_tipo_persona IN ('fisica', 'moral')),
  estado_ccl TEXT NOT NULL,
  portal_url TEXT,
  
  -- Logs y resultado
  logs JSONB DEFAULT '[]'::jsonb,
  screenshots JSONB DEFAULT '[]'::jsonb,  -- URLs de screenshots de cada paso
  resultado JSONB,  -- Folio, fechas, PDF URL, etc.
  error_message TEXT,
  error_details JSONB,
  
  -- Datos extraídos del portal
  folio_solicitud TEXT,
  pdf_acuse_url TEXT,
  liga_unica_audiencia TEXT,
  fecha_limite_confirmacion DATE,
  instrucciones_confirmacion TEXT[],
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_ccl_agent_jobs_caso ON ccl_agent_jobs(caso_id);
CREATE INDEX IF NOT EXISTS idx_ccl_agent_jobs_abogado ON ccl_agent_jobs(abogado_id);
CREATE INDEX IF NOT EXISTS idx_ccl_agent_jobs_status ON ccl_agent_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ccl_agent_jobs_created ON ccl_agent_jobs(created_at DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_ccl_agent_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ccl_agent_jobs_updated_at ON ccl_agent_jobs;
CREATE TRIGGER trigger_ccl_agent_jobs_updated_at
  BEFORE UPDATE ON ccl_agent_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_ccl_agent_jobs_updated_at();

-- Tabla para logs detallados del agente (opcional, para debugging)
CREATE TABLE IF NOT EXISTS ccl_agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES ccl_agent_jobs(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
  step TEXT,
  message TEXT NOT NULL,
  data JSONB,
  screenshot_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ccl_agent_logs_job ON ccl_agent_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_ccl_agent_logs_created ON ccl_agent_logs(created_at DESC);

-- RLS Policies
ALTER TABLE ccl_agent_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccl_agent_logs ENABLE ROW LEVEL SECURITY;

-- Los abogados solo ven sus propios jobs
CREATE POLICY "Abogados ven sus jobs" ON ccl_agent_jobs
  FOR SELECT USING (auth.uid() = abogado_id);

CREATE POLICY "Abogados crean sus jobs" ON ccl_agent_jobs
  FOR INSERT WITH CHECK (auth.uid() = abogado_id);

CREATE POLICY "Abogados actualizan sus jobs" ON ccl_agent_jobs
  FOR UPDATE USING (auth.uid() = abogado_id);

-- Service role puede hacer todo (para el agente backend)
CREATE POLICY "Service role full access jobs" ON ccl_agent_jobs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access logs" ON ccl_agent_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Los abogados ven los logs de sus jobs
CREATE POLICY "Abogados ven logs de sus jobs" ON ccl_agent_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ccl_agent_jobs 
      WHERE ccl_agent_jobs.id = ccl_agent_logs.job_id 
      AND ccl_agent_jobs.abogado_id = auth.uid()
    )
  );

-- Comentarios
COMMENT ON TABLE ccl_agent_jobs IS 'Jobs del agente de IA para automatizar solicitudes CCL';
COMMENT ON COLUMN ccl_agent_jobs.status IS 'Estado: pending, running, completed, failed, cancelled';
COMMENT ON COLUMN ccl_agent_jobs.current_step IS 'Paso actual del proceso (ej: llenando_formulario, resolviendo_captcha)';
COMMENT ON COLUMN ccl_agent_jobs.screenshots IS 'Array de URLs de screenshots de cada paso para evidencia';
COMMENT ON COLUMN ccl_agent_jobs.liga_unica_audiencia IS 'URL única para audiencias remotas proporcionada por el CCL';
