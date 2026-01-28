-- Crear tabla caso_eventos para alertas de prescripcion y eventos del calendario
CREATE TABLE IF NOT EXISTS caso_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- prescripcion_rescision, prescripcion_despido, audiencia, cita, etc.
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fecha_evento DATE NOT NULL,
  hora_evento TIME,
  created_by UUID REFERENCES profiles(id),
  metadata JSONB DEFAULT '{}',
  completado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busquedas por caso y fecha
CREATE INDEX IF NOT EXISTS idx_caso_eventos_caso_id ON caso_eventos(caso_id);
CREATE INDEX IF NOT EXISTS idx_caso_eventos_fecha ON caso_eventos(fecha_evento);
CREATE INDEX IF NOT EXISTS idx_caso_eventos_tipo ON caso_eventos(tipo);

-- Habilitar RLS
ALTER TABLE caso_eventos ENABLE ROW LEVEL SECURITY;

-- Politicas RLS
CREATE POLICY "Users can view eventos de sus casos" ON caso_eventos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM casos 
      WHERE casos.id = caso_eventos.caso_id 
      AND (casos.worker_id = auth.uid() OR casos.lawyer_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin', 'webagent', 'lawyer')
    )
  );

CREATE POLICY "Users can insert eventos en sus casos" ON caso_eventos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM casos 
      WHERE casos.id = caso_eventos.caso_id 
      AND (casos.worker_id = auth.uid() OR casos.lawyer_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin', 'webagent', 'lawyer')
    )
  );

CREATE POLICY "Users can update eventos de sus casos" ON caso_eventos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM casos 
      WHERE casos.id = caso_eventos.caso_id 
      AND (casos.worker_id = auth.uid() OR casos.lawyer_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin', 'webagent', 'lawyer')
    )
  );
