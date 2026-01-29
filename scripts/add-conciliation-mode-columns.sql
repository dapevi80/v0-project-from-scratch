-- Agregar columnas para tipo de persona del citado y modalidad de conciliación
-- Ejecutar en Supabase SQL Editor

-- Columna para distinguir si el demandado es persona física o moral
ALTER TABLE casos ADD COLUMN IF NOT EXISTS citado_tipo_persona TEXT DEFAULT 'fisica' CHECK (citado_tipo_persona IN ('fisica', 'moral'));

-- Columna para la modalidad de conciliación preferida
ALTER TABLE casos ADD COLUMN IF NOT EXISTS modalidad_conciliacion TEXT DEFAULT 'presencial' CHECK (modalidad_conciliacion IN ('presencial', 'remota'));

-- Liga única proporcionada por el CCL para audiencias remotas
ALTER TABLE casos ADD COLUMN IF NOT EXISTS ccl_liga_unica TEXT;

-- Fecha límite para confirmar la solicitud (generalmente 3 días hábiles)
ALTER TABLE casos ADD COLUMN IF NOT EXISTS ccl_fecha_limite_confirmacion TIMESTAMPTZ;

-- Instrucciones específicas del CCL para confirmar la solicitud
ALTER TABLE casos ADD COLUMN IF NOT EXISTS ccl_instrucciones_confirmacion TEXT;

-- Comentarios para documentar los cambios
COMMENT ON COLUMN casos.citado_tipo_persona IS 'Tipo de persona del demandado: fisica (persona física) o moral (empresa/organización)';
COMMENT ON COLUMN casos.modalidad_conciliacion IS 'Modalidad de conciliación preferida: presencial o remota (videollamada)';
COMMENT ON COLUMN casos.ccl_liga_unica IS 'URL única proporcionada por el CCL para audiencias de conciliación remota';
COMMENT ON COLUMN casos.ccl_fecha_limite_confirmacion IS 'Fecha límite para confirmar la solicitud ante el CCL (generalmente 3 días hábiles)';
COMMENT ON COLUMN casos.ccl_instrucciones_confirmacion IS 'Instrucciones específicas del CCL para el proceso de confirmación de solicitud';

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_casos_modalidad_conciliacion ON casos(modalidad_conciliacion);
CREATE INDEX IF NOT EXISTS idx_casos_citado_tipo_persona ON casos(citado_tipo_persona);
