-- =====================================================
-- MECORRIERON.MX - Tablas de Cotizaciones y Casos
-- =====================================================

-- Tabla de cotizaciones (leads del landing page)
CREATE TABLE IF NOT EXISTS cotizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Datos del trabajador
  nombre_trabajador TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  estado TEXT,
  -- Datos del empleo
  empresa_nombre TEXT,
  puesto TEXT,
  salario_mensual NUMERIC(12,2),
  antiguedad_meses INTEGER,
  fecha_ingreso DATE,
  fecha_despido DATE,
  motivo_separacion TEXT,
  -- Calculo
  indemnizacion_estimada NUMERIC(12,2),
  -- Status del lead
  status TEXT DEFAULT 'nueva' CHECK (status IN ('nueva', 'contactada', 'en_proceso', 'completada', 'descartada')),
  -- Usuario asociado (si creo cuenta)
  user_id UUID REFERENCES profiles(id),
  -- Referidos
  referido_por UUID REFERENCES profiles(id),
  -- Metadatos
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de casos (cuando una cotizacion se convierte en caso)
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id UUID REFERENCES cotizaciones(id),
  user_id UUID REFERENCES profiles(id),
  -- Status del caso
  status TEXT DEFAULT 'verificado' CHECK (status IN (
    'verificado',      -- Datos verificados, listo para asignar
    'en_revision',     -- En revision por admin
    'asignado',        -- Asignado a abogado
    'en_proceso',      -- Abogado trabajando
    'conciliacion',    -- En etapa de conciliacion
    'juicio',          -- En juicio
    'ganado',          -- Caso ganado
    'perdido',         -- Caso perdido
    'cerrado',         -- Cerrado sin resolucion
    'cancelado'        -- Cancelado por cliente
  )),
  priority TEXT DEFAULT 'media' CHECK (priority IN ('baja', 'media', 'alta', 'urgente')),
  -- Asignacion
  assigned_lawyer_id UUID REFERENCES profiles(id),
  assigned_despacho_id UUID REFERENCES despachos(id),
  assigned_at TIMESTAMPTZ,
  -- Notas
  notas_internas TEXT,
  notas_cliente TEXT,
  -- Fechas importantes
  fecha_audiencia DATE,
  fecha_siguiente_accion DATE,
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de actividad de casos
CREATE TABLE IF NOT EXISTS case_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL, -- 'created', 'assigned', 'status_changed', 'note_added', etc.
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_cotizaciones_status ON cotizaciones(status);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON cotizaciones(estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_created ON cotizaciones(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_referido ON cotizaciones(referido_por);

CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_lawyer ON cases(assigned_lawyer_id);
CREATE INDEX IF NOT EXISTS idx_cases_despacho ON cases(assigned_despacho_id);
CREATE INDEX IF NOT EXISTS idx_cases_cotizacion ON cases(cotizacion_id);

CREATE INDEX IF NOT EXISTS idx_case_activity_case ON case_activity(case_id);

-- RLS Policies
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_activity ENABLE ROW LEVEL SECURITY;

-- Cotizaciones: admin y superadmin ven todo, usuarios ven las suyas
CREATE POLICY "Admin ve todas las cotizaciones" ON cotizaciones
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin'))
  );

CREATE POLICY "Usuarios ven sus cotizaciones" ON cotizaciones
  FOR SELECT USING (user_id = auth.uid() OR referido_por = auth.uid());

-- Cases: admin, superadmin y abogados asignados
CREATE POLICY "Admin ve todos los casos" ON cases
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin'))
  );

CREATE POLICY "Abogados ven casos asignados" ON cases
  FOR SELECT USING (assigned_lawyer_id = auth.uid());

CREATE POLICY "Usuarios ven sus casos" ON cases
  FOR SELECT USING (user_id = auth.uid());

-- Activity: mismas reglas que cases
CREATE POLICY "Admin ve toda actividad" ON case_activity
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin'))
  );
