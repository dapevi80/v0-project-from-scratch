-- Agregar campo para trackear si el usuario ya vio la celebración de verificación
-- Esto evita mostrar la celebración múltiples veces

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS celebration_shown BOOLEAN DEFAULT FALSE;

-- Comentario descriptivo
COMMENT ON COLUMN profiles.celebration_shown IS 'Indica si el usuario ya vio la animación de celebración post-verificación';
