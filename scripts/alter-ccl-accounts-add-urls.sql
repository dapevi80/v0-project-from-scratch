-- Agregar columnas faltantes a ccl_user_accounts

-- URLs del portal
ALTER TABLE ccl_user_accounts ADD COLUMN IF NOT EXISTS url_login TEXT;
ALTER TABLE ccl_user_accounts ADD COLUMN IF NOT EXISTS url_buzon TEXT;

-- Status de la cuenta
ALTER TABLE ccl_user_accounts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendiente' 
  CHECK (status IN ('pendiente', 'activa', 'pendiente_captcha', 'error', 'suspendida', 'cerrada'));

-- Indices adicionales
CREATE INDEX IF NOT EXISTS idx_ccl_accounts_status ON ccl_user_accounts(status);
CREATE INDEX IF NOT EXISTS idx_ccl_accounts_buzon_activo ON ccl_user_accounts(buzon_activo) WHERE buzon_activo = TRUE;
