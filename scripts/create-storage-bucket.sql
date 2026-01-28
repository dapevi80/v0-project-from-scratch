-- Crear bucket de storage para la bóveda
-- Este script crea el bucket 'boveda' si no existe

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'boveda', 
  'boveda', 
  false,
  52428800,
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic',
    'video/mp4', 'video/quicktime', 'video/webm', 'video/mpeg',
    'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/aac',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas de storage para el bucket boveda
-- Los usuarios solo pueden acceder a sus propios archivos (carpeta con su user_id)

-- Política SELECT
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'boveda' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política INSERT  
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'boveda' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política UPDATE
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
CREATE POLICY "Users can update own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'boveda' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política DELETE
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'boveda' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
