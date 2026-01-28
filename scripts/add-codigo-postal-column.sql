-- Agregar columna codigo_postal a solicitudes_abogados
ALTER TABLE solicitudes_abogados 
ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR(5);

-- Agregar columna codigo_postal a lawyer_profiles
ALTER TABLE lawyer_profiles 
ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR(5);

-- Agregar columna codigo_postal a profiles para ubicacion general
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR(5);

-- Comentarios
COMMENT ON COLUMN solicitudes_abogados.codigo_postal IS 'Codigo postal para ubicacion geografica del abogado';
COMMENT ON COLUMN lawyer_profiles.codigo_postal IS 'Codigo postal donde ejerce el abogado';
COMMENT ON COLUMN profiles.codigo_postal IS 'Codigo postal del usuario';
