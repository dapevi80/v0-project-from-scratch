-- Agregar campos para soporte de guestlawyer y codigo de referido

-- Agregar user_id a solicitudes_abogados para vincular con cuenta creada
ALTER TABLE solicitudes_abogados 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Agregar despacho_referido_id para tracking de referidos
ALTER TABLE solicitudes_abogados 
ADD COLUMN IF NOT EXISTS despacho_referido_id UUID REFERENCES despachos(id);

-- Agregar codigo_referido a despachos
ALTER TABLE despachos 
ADD COLUMN IF NOT EXISTS codigo_referido VARCHAR(20) UNIQUE;

-- Generar codigos de referido para despachos existentes
UPDATE despachos 
SET codigo_referido = 'DESP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))
WHERE codigo_referido IS NULL;

-- Agregar campo despacho_referido a lawyer_profiles
ALTER TABLE lawyer_profiles 
ADD COLUMN IF NOT EXISTS despacho_referido UUID REFERENCES despachos(id);

-- Crear indice para busqueda por codigo de referido
CREATE INDEX IF NOT EXISTS idx_despachos_codigo_referido ON despachos(codigo_referido);

-- Crear indice para busqueda de solicitudes por user_id
CREATE INDEX IF NOT EXISTS idx_solicitudes_user_id ON solicitudes_abogados(user_id);
