-- Agregar campo caso_creado a profiles para trackear si el usuario ya creo su primer caso
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS caso_creado BOOLEAN DEFAULT FALSE;

-- Comentario descriptivo
COMMENT ON COLUMN profiles.caso_creado IS 'Indica si el usuario guest ya creo su primer caso y esta pendiente de verificacion';
