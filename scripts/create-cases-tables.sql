-- ==============================================
-- CASOS Y SEGUIMIENTO - mecorrieron.mx
-- Tablas para casos, mensajes, eventos y documentos
-- ==============================================

-- ==============================================
-- TABLA: casos
-- ==============================================
CREATE TABLE IF NOT EXISTS casos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio TEXT UNIQUE NOT NULL,
  
  -- Relaciones
  worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lawyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Estado del caso
  status TEXT NOT NULL DEFAULT 'open' 
    CHECK (status IN ('draft', 'open', 'assigned', 'in_progress', 'conciliation', 'lawsuit', 'closed', 'paid')),
  
  -- Datos de la empresa
  empresa_nombre TEXT NOT NULL,
  empresa_rfc TEXT,
  ciudad TEXT,
  estado TEXT,
  
  -- Montos
  monto_estimado DECIMAL(12,2),
  monto_final DECIMAL(12,2),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funcion para generar folio unico
CREATE OR REPLACE FUNCTION generate_case_folio()
RETURNS TRIGGER AS $$
DECLARE
  year_suffix TEXT;
  random_part TEXT;
  new_folio TEXT;
BEGIN
  year_suffix := TO_CHAR(NOW(), 'YY');
  random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
  new_folio := 'MC-' || year_suffix || '-' || random_part;
  
  -- Verificar unicidad
  WHILE EXISTS (SELECT 1 FROM casos WHERE folio = new_folio) LOOP
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    new_folio := 'MC-' || year_suffix || '-' || random_part;
  END LOOP;
  
  NEW.folio := new_folio;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_case_folio ON casos;
CREATE TRIGGER trigger_generate_case_folio
  BEFORE INSERT ON casos
  FOR EACH ROW
  WHEN (NEW.folio IS NULL OR NEW.folio = '')
  EXECUTE FUNCTION generate_case_folio();

-- ==============================================
-- TABLA: case_messages
-- ==============================================
CREATE TABLE IF NOT EXISTS case_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('worker', 'lawyer', 'admin', 'superadmin')),
  
  -- Contenido
  body TEXT NOT NULL,
  
  -- Estado de lectura
  read_by_worker_at TIMESTAMPTZ,
  read_by_lawyer_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- TABLA: case_events (calendario/audiencias)
-- ==============================================
CREATE TABLE IF NOT EXISTS case_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Datos del evento
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'audiencia' 
    CHECK (event_type IN ('audiencia', 'cita', 'recordatorio', 'deadline', 'otro')),
  
  -- Fechas
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  
  -- Ubicacion
  location TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- TABLA: case_documents
-- ==============================================
CREATE TABLE IF NOT EXISTS case_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  
  -- Tipo de documento
  doc_type TEXT NOT NULL DEFAULT 'other'
    CHECK (doc_type IN ('terms', 'service_contract', 'power_of_attorney', 'settlement', 'other')),
  
  -- Estado
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'uploaded', 'signed', 'rejected')),
  
  -- Firma
  signed_at TIMESTAMPTZ,
  signed_by UUID REFERENCES auth.users(id),
  
  -- Archivo
  url TEXT,
  file_path TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- INDICES
-- ==============================================

-- Indices para casos
CREATE INDEX IF NOT EXISTS idx_casos_worker_id ON casos(worker_id);
CREATE INDEX IF NOT EXISTS idx_casos_lawyer_id ON casos(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_casos_status ON casos(status);
CREATE INDEX IF NOT EXISTS idx_casos_created_at ON casos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_casos_folio ON casos(folio);

-- Indices para case_messages
CREATE INDEX IF NOT EXISTS idx_case_messages_case_id ON case_messages(case_id);
CREATE INDEX IF NOT EXISTS idx_case_messages_sender_id ON case_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_case_messages_created_at ON case_messages(created_at DESC);

-- Indices para case_events
CREATE INDEX IF NOT EXISTS idx_case_events_case_id ON case_events(case_id);
CREATE INDEX IF NOT EXISTS idx_case_events_starts_at ON case_events(starts_at);
CREATE INDEX IF NOT EXISTS idx_case_events_event_type ON case_events(event_type);

-- Indices para case_documents
CREATE INDEX IF NOT EXISTS idx_case_documents_case_id ON case_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_case_documents_doc_type ON case_documents(doc_type);

-- ==============================================
-- ROW LEVEL SECURITY
-- ==============================================

-- RLS para casos
ALTER TABLE casos ENABLE ROW LEVEL SECURITY;

-- Workers pueden ver sus propios casos
DROP POLICY IF EXISTS "Workers can view own cases" ON casos;
CREATE POLICY "Workers can view own cases" ON casos
  FOR SELECT USING (auth.uid() = worker_id);

-- Lawyers pueden ver casos asignados
DROP POLICY IF EXISTS "Lawyers can view assigned cases" ON casos;
CREATE POLICY "Lawyers can view assigned cases" ON casos
  FOR SELECT USING (auth.uid() = lawyer_id);

-- Workers pueden crear casos
DROP POLICY IF EXISTS "Workers can create cases" ON casos;
CREATE POLICY "Workers can create cases" ON casos
  FOR INSERT WITH CHECK (auth.uid() = worker_id);

-- Admins pueden ver todos los casos (basado en rol en profiles)
DROP POLICY IF EXISTS "Admins can view all cases" ON casos;
CREATE POLICY "Admins can view all cases" ON casos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Admins pueden actualizar casos
DROP POLICY IF EXISTS "Admins can update cases" ON casos;
CREATE POLICY "Admins can update cases" ON casos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- RLS para case_messages
ALTER TABLE case_messages ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver mensajes de sus casos
DROP POLICY IF EXISTS "Users can view case messages" ON case_messages;
CREATE POLICY "Users can view case messages" ON case_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM casos 
      WHERE casos.id = case_messages.case_id 
      AND (casos.worker_id = auth.uid() OR casos.lawyer_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Usuarios pueden enviar mensajes a sus casos
DROP POLICY IF EXISTS "Users can send messages" ON case_messages;
CREATE POLICY "Users can send messages" ON case_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM casos 
      WHERE casos.id = case_messages.case_id 
      AND (casos.worker_id = auth.uid() OR casos.lawyer_id = auth.uid())
    )
  );

-- RLS para case_events
ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver eventos de sus casos
DROP POLICY IF EXISTS "Users can view case events" ON case_events;
CREATE POLICY "Users can view case events" ON case_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM casos 
      WHERE casos.id = case_events.case_id 
      AND (casos.worker_id = auth.uid() OR casos.lawyer_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Lawyers y admins pueden crear eventos
DROP POLICY IF EXISTS "Lawyers can create events" ON case_events;
CREATE POLICY "Lawyers can create events" ON case_events
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND (
      EXISTS (
        SELECT 1 FROM casos 
        WHERE casos.id = case_events.case_id 
        AND casos.lawyer_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'superadmin')
      )
    )
  );

-- Lawyers y admins pueden actualizar eventos
DROP POLICY IF EXISTS "Lawyers can update events" ON case_events;
CREATE POLICY "Lawyers can update events" ON case_events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM casos 
      WHERE casos.id = case_events.case_id 
      AND casos.lawyer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Lawyers y admins pueden eliminar eventos
DROP POLICY IF EXISTS "Lawyers can delete events" ON case_events;
CREATE POLICY "Lawyers can delete events" ON case_events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM casos 
      WHERE casos.id = case_events.case_id 
      AND casos.lawyer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- RLS para case_documents
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver documentos de sus casos
DROP POLICY IF EXISTS "Users can view case documents" ON case_documents;
CREATE POLICY "Users can view case documents" ON case_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM casos 
      WHERE casos.id = case_documents.case_id 
      AND (casos.worker_id = auth.uid() OR casos.lawyer_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- ==============================================
-- TRIGGERS
-- ==============================================

-- Trigger para actualizar updated_at en casos
DROP TRIGGER IF EXISTS trigger_casos_updated_at ON casos;
CREATE TRIGGER trigger_casos_updated_at
  BEFORE UPDATE ON casos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en case_events
DROP TRIGGER IF EXISTS trigger_case_events_updated_at ON case_events;
CREATE TRIGGER trigger_case_events_updated_at
  BEFORE UPDATE ON case_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en case_documents
DROP TRIGGER IF EXISTS trigger_case_documents_updated_at ON case_documents;
CREATE TRIGGER trigger_case_documents_updated_at
  BEFORE UPDATE ON case_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- COMENTARIOS
-- ==============================================

COMMENT ON TABLE casos IS 'Casos laborales de trabajadores';
COMMENT ON COLUMN casos.folio IS 'Folio unico del caso (MC-YY-XXXXXX)';
COMMENT ON COLUMN casos.status IS 'Estado: draft, open, assigned, in_progress, conciliation, lawsuit, closed, paid';

COMMENT ON TABLE case_messages IS 'Mensajes del chat entre trabajador y abogado';
COMMENT ON COLUMN case_messages.sender_role IS 'Rol del remitente: worker, lawyer, admin, superadmin';

COMMENT ON TABLE case_events IS 'Eventos del calendario: audiencias, citas, recordatorios';
COMMENT ON COLUMN case_events.event_type IS 'Tipo: audiencia, cita, recordatorio, deadline, otro';

COMMENT ON TABLE case_documents IS 'Documentos del caso: T&C, contrato, poder, convenio';
COMMENT ON COLUMN case_documents.doc_type IS 'Tipo: terms, service_contract, power_of_attorney, settlement, other';
