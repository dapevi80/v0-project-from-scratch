-- Agregar columna de honorarios estimados a cotizaciones
ALTER TABLE cotizaciones 
ADD COLUMN IF NOT EXISTS honorarios_estimados NUMERIC(12,2);

-- Agregar columna de comision plataforma
ALTER TABLE cotizaciones 
ADD COLUMN IF NOT EXISTS comision_plataforma NUMERIC(12,2);

-- Agregar codigo de usuario anonimo
ALTER TABLE cotizaciones 
ADD COLUMN IF NOT EXISTS codigo_usuario TEXT;

-- Actualizar cotizaciones existentes con honorarios calculados (25%)
UPDATE cotizaciones 
SET honorarios_estimados = indemnizacion_estimada * 0.25,
    comision_plataforma = indemnizacion_estimada * 0.25 * 0.10
WHERE honorarios_estimados IS NULL AND indemnizacion_estimada IS NOT NULL;

-- Generar codigos de usuario para cotizaciones existentes que no tengan
UPDATE cotizaciones 
SET codigo_usuario = 'MC' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))
WHERE codigo_usuario IS NULL;
