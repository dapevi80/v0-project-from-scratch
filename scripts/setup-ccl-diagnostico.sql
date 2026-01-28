-- =====================================================
-- CCL DIAGNOSTICO - Tablas para pruebas automatizadas
-- Solo visible para superadmin
-- Datos se eliminan automaticamente despues de 8 horas
-- =====================================================

-- Tabla de sesiones de diagnostico
CREATE TABLE IF NOT EXISTS ccl_diagnostico_sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '8 hours'),
  created_by UUID REFERENCES auth.users(id),
  modo TEXT NOT NULL CHECK (modo IN ('dry_run', 'live_test')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'cancelled')),
  total_pruebas INTEGER DEFAULT 33,
  pruebas_completadas INTEGER DEFAULT 0,
  pruebas_exitosas INTEGER DEFAULT 0,
  pruebas_fallidas INTEGER DEFAULT 0,
  pruebas_parciales INTEGER DEFAULT 0,
  tiempo_total_segundos INTEGER DEFAULT 0,
  notas TEXT
);

-- Tabla de usuarios ficticios de prueba
CREATE TABLE IF NOT EXISTS ccl_diagnostico_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id UUID REFERENCES ccl_diagnostico_sesiones(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Datos del usuario ficticio
  estado_asignado TEXT NOT NULL,
  nombre_completo TEXT NOT NULL,
  curp TEXT NOT NULL,
  rfc TEXT NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  sexo TEXT NOT NULL,
  direccion TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  codigo_postal TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Datos laborales ficticios
  empresa_nombre TEXT NOT NULL,
  empresa_direccion TEXT NOT NULL,
  empresa_rfc TEXT NOT NULL,
  puesto TEXT NOT NULL,
  salario_diario DECIMAL(10,2) NOT NULL,
  fecha_ingreso DATE NOT NULL,
  fecha_despido DATE NOT NULL,
  tipo_terminacion TEXT NOT NULL,
  motivo_despido TEXT,
  
  -- Calculo simulado
  antiguedad_dias INTEGER NOT NULL,
  monto_liquidacion DECIMAL(12,2) NOT NULL,
  dias_prescripcion INTEGER NOT NULL,
  fecha_limite_prescripcion DATE NOT NULL
);

-- Tabla de resultados de prueba por portal CCL
CREATE TABLE IF NOT EXISTS ccl_diagnostico_resultados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id UUID REFERENCES ccl_diagnostico_sesiones(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES ccl_diagnostico_usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Portal CCL
  estado TEXT NOT NULL,
  portal_nombre TEXT NOT NULL,
  portal_url TEXT,
  es_federal BOOLEAN DEFAULT FALSE,
  
  -- Resultados de conectividad
  conectividad_ok BOOLEAN DEFAULT FALSE,
  conectividad_tiempo_ms INTEGER,
  conectividad_error TEXT,
  
  -- Resultados de formulario
  formulario_detectado BOOLEAN DEFAULT FALSE,
  formulario_campos_encontrados JSONB,
  formulario_error TEXT,
  
  -- Resultados de envio
  envio_intentado BOOLEAN DEFAULT FALSE,
  envio_exitoso BOOLEAN DEFAULT FALSE,
  envio_error TEXT,
  envio_captcha_detectado BOOLEAN DEFAULT FALSE,
  
  -- Resultados de PDF
  pdf_obtenido BOOLEAN DEFAULT FALSE,
  pdf_url TEXT,
  pdf_folio TEXT,
  pdf_fecha_cita TIMESTAMPTZ,
  pdf_contenido_ia TEXT,
  
  -- Metricas
  tiempo_total_ms INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'partial', 'error', 'not_supported')),
  
  -- Screenshot para debug (base64 o URL)
  screenshot_error TEXT
);

-- Indices para consultas rapidas
CREATE INDEX IF NOT EXISTS idx_ccl_diag_sesiones_expires ON ccl_diagnostico_sesiones(expires_at);
CREATE INDEX IF NOT EXISTS idx_ccl_diag_sesiones_status ON ccl_diagnostico_sesiones(status);
CREATE INDEX IF NOT EXISTS idx_ccl_diag_usuarios_sesion ON ccl_diagnostico_usuarios(sesion_id);
CREATE INDEX IF NOT EXISTS idx_ccl_diag_resultados_sesion ON ccl_diagnostico_resultados(sesion_id);
CREATE INDEX IF NOT EXISTS idx_ccl_diag_resultados_estado ON ccl_diagnostico_resultados(estado);

-- Funcion para limpiar datos expirados (ejecutar con cron cada hora)
CREATE OR REPLACE FUNCTION limpiar_diagnosticos_expirados()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ccl_diagnostico_sesiones 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcion para generar CURP ficticio valido por estado
CREATE OR REPLACE FUNCTION generar_curp_ficticio(
  p_nombre TEXT,
  p_apellido_paterno TEXT,
  p_apellido_materno TEXT,
  p_fecha_nacimiento DATE,
  p_sexo TEXT,
  p_estado TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_curp TEXT;
  v_estado_code TEXT;
  v_estados JSONB := '{
    "Aguascalientes": "AS", "Baja California": "BC", "Baja California Sur": "BS",
    "Campeche": "CC", "Chiapas": "CS", "Chihuahua": "CH", "Ciudad de Mexico": "DF",
    "Coahuila": "CL", "Colima": "CM", "Durango": "DG", "Guanajuato": "GT",
    "Guerrero": "GR", "Hidalgo": "HG", "Jalisco": "JC", "Estado de Mexico": "MC",
    "Michoacan": "MN", "Morelos": "MS", "Nayarit": "NT", "Nuevo Leon": "NL",
    "Oaxaca": "OC", "Puebla": "PL", "Queretaro": "QT", "Quintana Roo": "QR",
    "San Luis Potosi": "SP", "Sinaloa": "SL", "Sonora": "SR", "Tabasco": "TC",
    "Tamaulipas": "TS", "Tlaxcala": "TL", "Veracruz": "VZ", "Yucatan": "YN",
    "Zacatecas": "ZS", "Federal": "DF"
  }'::JSONB;
BEGIN
  v_estado_code := COALESCE(v_estados->>p_estado, 'DF');
  
  v_curp := UPPER(SUBSTRING(p_apellido_paterno FROM 1 FOR 2)) ||
            UPPER(SUBSTRING(p_apellido_materno FROM 1 FOR 1)) ||
            UPPER(SUBSTRING(p_nombre FROM 1 FOR 1)) ||
            TO_CHAR(p_fecha_nacimiento, 'YYMMDD') ||
            UPPER(SUBSTRING(p_sexo FROM 1 FOR 1)) ||
            v_estado_code ||
            'XXX' ||
            LPAD(FLOOR(RANDOM() * 100)::TEXT, 2, '0');
  
  RETURN v_curp;
END;
$$ LANGUAGE plpgsql;

-- RLS para que solo superadmin pueda ver estos datos
ALTER TABLE ccl_diagnostico_sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccl_diagnostico_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccl_diagnostico_resultados ENABLE ROW LEVEL SECURITY;

-- Politicas RLS - Solo superadmin
CREATE POLICY "superadmin_sesiones" ON ccl_diagnostico_sesiones
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "superadmin_usuarios" ON ccl_diagnostico_usuarios
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "superadmin_resultados" ON ccl_diagnostico_resultados
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );
