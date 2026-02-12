-- Tabla para verificación de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_verifications_user ON whatsapp_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_verifications_phone ON whatsapp_verifications(phone);

-- Tabla para verificación de correo
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
