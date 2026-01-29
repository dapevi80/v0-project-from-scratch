-- Agregar campo is_profile_public a profiles para controlar visibilidad del codigo de referido
-- y campos para el sistema de bienvenida inteligente

-- Campo para modo público/privado del perfil
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN DEFAULT true;

-- Campo para tracking de primer inicio de sesión (para mensaje de bienvenida)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMP WITH TIME ZONE;

-- Campo para contar inicios de sesión (para personalizar bienvenida)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- Campo para última vez que se mostró mensaje de bienvenida
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_welcome_shown_at TIMESTAMP WITH TIME ZONE;

-- Comentarios
COMMENT ON COLUMN profiles.is_profile_public IS 'Si true, el código de referido y nombre se muestran públicamente';
COMMENT ON COLUMN profiles.first_login_at IS 'Timestamp del primer inicio de sesión para mensaje de bienvenida';
COMMENT ON COLUMN profiles.login_count IS 'Contador de inicios de sesión para personalizar experiencia';
COMMENT ON COLUMN profiles.last_welcome_shown_at IS 'Última vez que se mostró el mensaje de bienvenida del chat';
