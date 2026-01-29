-- Agregar columnas de ubicacion del lugar de trabajo a la tabla casos
ALTER TABLE casos ADD COLUMN IF NOT EXISTS ubicacion_coordenadas TEXT;
ALTER TABLE casos ADD COLUMN IF NOT EXISTS ubicacion_lat DOUBLE PRECISION;
ALTER TABLE casos ADD COLUMN IF NOT EXISTS ubicacion_lng DOUBLE PRECISION;
ALTER TABLE casos ADD COLUMN IF NOT EXISTS ubicacion_street_view_url TEXT;
ALTER TABLE casos ADD COLUMN IF NOT EXISTS ubicacion_street_view_image TEXT;
ALTER TABLE casos ADD COLUMN IF NOT EXISTS ubicacion_maps_url TEXT;
ALTER TABLE casos ADD COLUMN IF NOT EXISTS ubicacion_heading INTEGER;
ALTER TABLE casos ADD COLUMN IF NOT EXISTS ubicacion_pitch INTEGER;
ALTER TABLE casos ADD COLUMN IF NOT EXISTS ubicacion_timestamp TIMESTAMPTZ;
