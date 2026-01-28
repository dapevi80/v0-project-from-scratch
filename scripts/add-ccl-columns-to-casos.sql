-- Agregar columnas para información CCL en la tabla casos
ALTER TABLE casos 
ADD COLUMN IF NOT EXISTS ccl_folio TEXT,
ADD COLUMN IF NOT EXISTS ccl_fecha_cita DATE,
ADD COLUMN IF NOT EXISTS ccl_hora_cita TIME,
ADD COLUMN IF NOT EXISTS ccl_sede TEXT,
ADD COLUMN IF NOT EXISTS ccl_direccion TEXT,
ADD COLUMN IF NOT EXISTS ccl_estado TEXT DEFAULT 'pendiente',
ADD COLUMN IF NOT EXISTS ccl_url_comprobante TEXT;

-- Crear índice para búsqueda por folio CCL
CREATE INDEX IF NOT EXISTS idx_casos_ccl_folio ON casos(ccl_folio);

-- Comentarios
COMMENT ON COLUMN casos.ccl_folio IS 'Folio de la solicitud generada en el CCL';
COMMENT ON COLUMN casos.ccl_fecha_cita IS 'Fecha de la audiencia de conciliación';
COMMENT ON COLUMN casos.ccl_hora_cita IS 'Hora de la audiencia de conciliación';
COMMENT ON COLUMN casos.ccl_sede IS 'Nombre de la sede del CCL';
COMMENT ON COLUMN casos.ccl_direccion IS 'Dirección de la sede del CCL';
COMMENT ON COLUMN casos.ccl_estado IS 'Estado de la solicitud: pendiente, generada, confirmada, celebrada, no_acuerdo';
