-- Crear bucket privado para documentos sensibles (efirma, etc)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'private-documents',
  'private-documents',
  false,
  5242880, -- 5MB max
  ARRAY['application/x-x509-ca-cert', 'application/pkcs8', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- Politicas de seguridad para el bucket
-- Solo el propietario puede ver/subir sus propios archivos

-- Permitir lectura solo al propietario
CREATE POLICY "Users can view own private documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'private-documents' 
  AND (storage.foldername(name))[1] = 'efirma'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Permitir subida solo al propietario
CREATE POLICY "Users can upload own private documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'private-documents'
  AND (storage.foldername(name))[1] = 'efirma'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Permitir eliminacion solo al propietario
CREATE POLICY "Users can delete own private documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'private-documents'
  AND (storage.foldername(name))[1] = 'efirma'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
