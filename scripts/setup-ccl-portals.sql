-- Migracion: Configurar portales CCL reales por estado
-- Esta tabla contiene los URLs oficiales de los portales de conciliacion de cada estado

-- Agregar columnas para portales reales si no existen
ALTER TABLE centros_conciliacion 
ADD COLUMN IF NOT EXISTS portal_solicitud_url TEXT,
ADD COLUMN IF NOT EXISTS portal_consulta_url TEXT,
ADD COLUMN IF NOT EXISTS sistema_version TEXT DEFAULT 'v1',
ADD COLUMN IF NOT EXISTS requiere_efirma BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requiere_curp BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS permite_representante BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS documentos_requeridos JSONB DEFAULT '["identificacion", "curp"]',
ADD COLUMN IF NOT EXISTS campos_formulario JSONB,
ADD COLUMN IF NOT EXISTS notas_importantes TEXT;

-- Insertar/actualizar CCL de CDMX (Centro Local de Conciliacion Laboral)
INSERT INTO centros_conciliacion (
  id, clave_estado, tipo, nombre, direccion, municipio, codigo_postal,
  telefono, portal_url, portal_solicitud_url, portal_consulta_url,
  sistema, sistema_version, horario, activo, requiere_efirma,
  notas_importantes
) VALUES (
  gen_random_uuid(),
  'CDMX',
  'local',
  'Centro de Conciliacion Laboral de la Ciudad de Mexico',
  'Dr. Lavista 144, Col. Doctores, Alcaldia Cuauhtemoc',
  'Cuauhtemoc',
  '06720',
  '55 5134 0770',
  'https://www.centrodeconciliacionlaboral.cdmx.gob.mx/',
  'https://www.centrodeconciliacionlaboral.cdmx.gob.mx/solicitud',
  'https://www.centrodeconciliacionlaboral.cdmx.gob.mx/consulta',
  'SICCL-CDMX',
  'v2',
  'Lunes a Viernes 9:00 - 15:00 hrs',
  true,
  false,
  'La solicitud se puede realizar en linea. Se asigna cita para ratificacion en 5 dias habiles.'
) ON CONFLICT (clave_estado, tipo) DO UPDATE SET
  portal_solicitud_url = EXCLUDED.portal_solicitud_url,
  portal_consulta_url = EXCLUDED.portal_consulta_url,
  sistema_version = EXCLUDED.sistema_version,
  notas_importantes = EXCLUDED.notas_importantes;

-- CCL Jalisco
INSERT INTO centros_conciliacion (
  id, clave_estado, tipo, nombre, direccion, municipio, codigo_postal,
  telefono, portal_url, portal_solicitud_url, sistema, horario, activo
) VALUES (
  gen_random_uuid(),
  'JAL',
  'local',
  'Centro de Conciliacion Laboral del Estado de Jalisco',
  'Av. Alcalde 1351, Col. Miraflores, Guadalajara',
  'Guadalajara',
  '44270',
  '33 3030 5600',
  'https://conciliacion.jalisco.gob.mx/',
  'https://conciliacion.jalisco.gob.mx/solicitud-en-linea',
  'SICCL-JAL',
  'Lunes a Viernes 8:00 - 16:00 hrs',
  true
) ON CONFLICT (clave_estado, tipo) DO UPDATE SET
  portal_solicitud_url = EXCLUDED.portal_solicitud_url;

-- CCL Nuevo Leon
INSERT INTO centros_conciliacion (
  id, clave_estado, tipo, nombre, direccion, municipio, codigo_postal,
  telefono, portal_url, portal_solicitud_url, sistema, horario, activo
) VALUES (
  gen_random_uuid(),
  'NL',
  'local',
  'Centro de Conciliacion Laboral de Nuevo Leon',
  'Washington 2000 Ote, Col. Obrera, Monterrey',
  'Monterrey',
  '64010',
  '81 2020 9700',
  'https://conciliacionlaboral.nl.gob.mx/',
  'https://conciliacionlaboral.nl.gob.mx/solicitud',
  'SICCL-NL',
  'Lunes a Viernes 8:30 - 15:30 hrs',
  true
) ON CONFLICT (clave_estado, tipo) DO UPDATE SET
  portal_solicitud_url = EXCLUDED.portal_solicitud_url;

-- CCL Estado de Mexico
INSERT INTO centros_conciliacion (
  id, clave_estado, tipo, nombre, direccion, municipio, codigo_postal,
  telefono, portal_url, portal_solicitud_url, sistema, horario, activo
) VALUES (
  gen_random_uuid(),
  'MEX',
  'local',
  'Centro de Conciliacion Laboral del Estado de Mexico',
  'Av. Jose Maria Morelos y Pavon 1300, Col. Centro, Toluca',
  'Toluca',
  '50000',
  '722 226 1600',
  'https://ccl.edomex.gob.mx/',
  'https://ccl.edomex.gob.mx/solicitud-linea',
  'SICCL-MEX',
  'Lunes a Viernes 9:00 - 17:00 hrs',
  true
) ON CONFLICT (clave_estado, tipo) DO UPDATE SET
  portal_solicitud_url = EXCLUDED.portal_solicitud_url;

-- Centro Federal de Conciliacion y Registro Laboral (CFCRL)
INSERT INTO centros_conciliacion (
  id, clave_estado, tipo, nombre, direccion, municipio, codigo_postal,
  telefono, portal_url, portal_solicitud_url, portal_consulta_url,
  sistema, horario, activo, requiere_efirma, notas_importantes
) VALUES (
  gen_random_uuid(),
  'FED',
  'federal',
  'Centro Federal de Conciliacion y Registro Laboral',
  'Av. Cuauhtemoc 80, Col. Doctores, CDMX',
  'Cuauhtemoc',
  '06720',
  '55 5998 0100',
  'https://www.gob.mx/cfcrl',
  'https://conciliacion.cfcrl.gob.mx/solicitud',
  'https://conciliacion.cfcrl.gob.mx/consulta',
  'SICCL-FEDERAL',
  'Lunes a Viernes 9:00 - 18:00 hrs',
  true,
  true,
  'Para industrias de competencia federal. Requiere e.firma (FIEL) para solicitudes en linea.'
) ON CONFLICT (clave_estado, tipo) DO UPDATE SET
  portal_solicitud_url = EXCLUDED.portal_solicitud_url,
  portal_consulta_url = EXCLUDED.portal_consulta_url,
  requiere_efirma = EXCLUDED.requiere_efirma,
  notas_importantes = EXCLUDED.notas_importantes;

-- Crear tabla para tracking de solicitudes automaticas
CREATE TABLE IF NOT EXISTS ccl_solicitudes_automaticas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_ccl_id UUID REFERENCES solicitudes_ccl(id),
  caso_id UUID,
  abogado_id UUID,
  trabajador_id UUID,
  
  -- Datos del portal
  centro_conciliacion_id UUID,
  portal_url TEXT,
  
  -- Estado del proceso automatico
  estado TEXT DEFAULT 'pendiente', -- pendiente, procesando, completado, error, requiere_manual
  
  -- Datos capturados del formulario
  campos_enviados JSONB,
  respuesta_portal JSONB,
  capturas_pantalla TEXT[], -- URLs de screenshots del proceso
  
  -- Resultado
  folio_generado TEXT,
  fecha_cita_ratificacion TIMESTAMPTZ,
  pdf_constancia_url TEXT,
  
  -- Errores y reintentos
  intentos INTEGER DEFAULT 0,
  max_intentos INTEGER DEFAULT 3,
  ultimo_error TEXT,
  errores_historico JSONB DEFAULT '[]',
  
  -- Metadatos
  ip_usada TEXT,
  user_agent TEXT,
  tiempo_procesamiento_ms INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completado_at TIMESTAMPTZ
);

-- Indice para busquedas rapidas
CREATE INDEX IF NOT EXISTS idx_ccl_auto_estado ON ccl_solicitudes_automaticas(estado);
CREATE INDEX IF NOT EXISTS idx_ccl_auto_abogado ON ccl_solicitudes_automaticas(abogado_id);
CREATE INDEX IF NOT EXISTS idx_ccl_auto_caso ON ccl_solicitudes_automaticas(caso_id);

-- Funcion para calcular dias de prescripcion segun tipo de conflicto
CREATE OR REPLACE FUNCTION calcular_prescripcion(
  tipo_conflicto TEXT,
  fecha_conflicto DATE
) RETURNS TABLE (
  dias_restantes INTEGER,
  fecha_limite DATE,
  urgente BOOLEAN
) AS $$
DECLARE
  dias_prescripcion INTEGER;
  fecha_lim DATE;
  dias_rest INTEGER;
BEGIN
  -- Determinar dias de prescripcion segun tipo
  CASE tipo_conflicto
    WHEN 'despido' THEN dias_prescripcion := 60;  -- 2 meses
    WHEN 'rescision' THEN dias_prescripcion := 30; -- 1 mes
    WHEN 'pago_prestaciones' THEN dias_prescripcion := 365; -- 1 ano
    WHEN 'terminacion_voluntaria' THEN dias_prescripcion := 365;
    ELSE dias_prescripcion := 60; -- Default a despido
  END CASE;
  
  fecha_lim := fecha_conflicto + dias_prescripcion;
  dias_rest := fecha_lim - CURRENT_DATE;
  
  RETURN QUERY SELECT 
    dias_rest,
    fecha_lim,
    dias_rest <= 15; -- Urgente si quedan 15 dias o menos
END;
$$ LANGUAGE plpgsql;
