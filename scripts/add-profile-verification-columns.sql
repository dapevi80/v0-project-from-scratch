-- =====================================================
-- Agregar columnas de verificación al perfil de usuario
-- is_verified: indica si el usuario ha sido verificado
-- celebration_shown: indica si ya se mostró la celebración de verificación
-- =====================================================

-- Agregar columna is_verified si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN profiles.is_verified IS 'Indica si el usuario ha sido verificado por un administrador o abogado';
  END IF;
END $$;

-- Agregar columna celebration_shown si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'celebration_shown'
  ) THEN
    ALTER TABLE profiles ADD COLUMN celebration_shown BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN profiles.celebration_shown IS 'Indica si el usuario ya vio la animación de celebración post-verificación';
  END IF;
END $$;

-- Crear índice para búsquedas por verificación
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified);
