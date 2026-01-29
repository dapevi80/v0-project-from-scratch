-- Actualización de tabla ccl_user_accounts para SINACOL real
-- Este script actualiza la estructura para reflejar que SINACOL es el portal oficial
-- y que las solicitudes se completan manualmente por el trabajador

-- Agregar columna de notas si no existe
ALTER TABLE ccl_user_accounts 
ADD COLUMN IF NOT EXISTS notas TEXT;

-- Actualizar el tipo de status para incluir nuevo estado
ALTER TABLE ccl_user_accounts 
DROP CONSTRAINT IF EXISTS ccl_user_accounts_status_check;

-- El email y password ahora son opcionales (SINACOL no los requiere)
ALTER TABLE ccl_user_accounts 
ALTER COLUMN email_portal DROP NOT NULL;

ALTER TABLE ccl_user_accounts 
ALTER COLUMN password_portal DROP NOT NULL;

-- Agregar columna para URL de SINACOL si no existe
ALTER TABLE ccl_user_accounts 
ADD COLUMN IF NOT EXISTS url_sinacol TEXT;

-- Actualizar registros existentes para usar la nueva URL de SINACOL
UPDATE ccl_user_accounts 
SET url_sinacol = url_login 
WHERE url_sinacol IS NULL AND url_login IS NOT NULL;

-- Añadir comentario a la tabla
COMMENT ON TABLE ccl_user_accounts IS 'Referencias a portales SINACOL oficiales. Las solicitudes se completan manualmente por el trabajador en el portal gubernamental.';

COMMENT ON COLUMN ccl_user_accounts.url_login IS 'URL del formulario SINACOL para crear solicitud';
COMMENT ON COLUMN ccl_user_accounts.folio_solicitud IS 'Referencia interna de mecorrieron.mx - NO es folio oficial de SINACOL';
COMMENT ON COLUMN ccl_user_accounts.status IS 'pendiente_sinacol = trabajador debe completar en portal oficial';
