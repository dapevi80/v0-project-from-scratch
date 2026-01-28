-- Script para inicializar usuarios de prueba con todos los datos necesarios
-- Password para todos: Cancun2026

-- Nota: Los usuarios deben ser creados primero via Supabase Auth
-- Este script actualiza/crea los perfiles correspondientes

-- 1. Perfil: Usuario Guest (sin verificar)
INSERT INTO profiles (id, email, full_name, role, is_verified, verification_status, created_at)
SELECT id, email, 
  'Usuario Invitado',
  'guest',
  false,
  'none',
  NOW()
FROM auth.users WHERE email = 'guest123@mecorrieron.mx'
ON CONFLICT (id) DO UPDATE SET
  role = 'guest',
  full_name = 'Usuario Invitado',
  is_verified = false,
  verification_status = 'none';

-- 2. Perfil: Trabajador Verificado (con todos los datos completos)
INSERT INTO profiles (id, email, full_name, phone, role, is_verified, verification_status, 
  identificacion_verificada, datos_personales_completos, calculo_guardado, celebration_shown, created_at)
SELECT id, email,
  'Juan Perez Trabajador',
  '5551234567',
  'worker',
  true,
  'approved',
  true,
  true,
  true,
  true,
  NOW()
FROM auth.users WHERE email = 'trabajador123@mecorrieron.mx'
ON CONFLICT (id) DO UPDATE SET
  role = 'worker',
  full_name = 'Juan Perez Trabajador',
  phone = '5551234567',
  is_verified = true,
  verification_status = 'approved',
  identificacion_verificada = true,
  datos_personales_completos = true,
  calculo_guardado = true,
  celebration_shown = true;

-- 3. Perfil: GuestLawyer (abogado pendiente de verificacion)
INSERT INTO profiles (id, email, full_name, phone, role, is_verified, verification_status, created_at)
SELECT id, email,
  'Lic. Carlos Mendez',
  '5559876543',
  'guestlawyer',
  false,
  'pending',
  NOW()
FROM auth.users WHERE email = 'guestabogado123@mecorrieron.mx'
ON CONFLICT (id) DO UPDATE SET
  role = 'guestlawyer',
  full_name = 'Lic. Carlos Mendez',
  phone = '5559876543',
  is_verified = false,
  verification_status = 'pending';

-- Perfil de abogado para guestlawyer
INSERT INTO lawyer_profiles (id, display_name, cedula_profesional, universidad, especialidades, 
  estados_operacion, verification_status, is_available)
SELECT id,
  'Lic. Carlos Mendez',
  '12345678',
  'UNAM',
  ARRAY['laboral'],
  ARRAY['CDMX'],
  'pending',
  false
FROM auth.users WHERE email = 'guestabogado123@mecorrieron.mx'
ON CONFLICT (id) DO UPDATE SET
  display_name = 'Lic. Carlos Mendez',
  cedula_profesional = '12345678',
  verification_status = 'pending',
  is_available = false;

-- 4. Perfil: Abogado Verificado
INSERT INTO profiles (id, email, full_name, phone, role, is_verified, verification_status, created_at)
SELECT id, email,
  'Lic. Maria Garcia Lopez',
  '5551112233',
  'lawyer',
  true,
  'approved',
  NOW()
FROM auth.users WHERE email = 'abogado123@mecorrieron.mx'
ON CONFLICT (id) DO UPDATE SET
  role = 'lawyer',
  full_name = 'Lic. Maria Garcia Lopez',
  phone = '5551112233',
  is_verified = true,
  verification_status = 'approved';

-- Perfil de abogado verificado completo
INSERT INTO lawyer_profiles (id, display_name, cedula_profesional, universidad, especialidades, 
  estados_operacion, anos_experiencia, casos_ganados, rating, verification_status, is_available, bio)
SELECT id,
  'Lic. Maria Garcia Lopez',
  '87654321',
  'Universidad Panamericana',
  ARRAY['laboral', 'civil'],
  ARRAY['CDMX', 'Estado de Mexico', 'Jalisco'],
  8,
  45,
  4.8,
  'verified',
  true,
  'Abogada especialista en derecho laboral con 8 años de experiencia. Egresada de la Universidad Panamericana con maestria en Derecho del Trabajo.'
FROM auth.users WHERE email = 'abogado123@mecorrieron.mx'
ON CONFLICT (id) DO UPDATE SET
  display_name = 'Lic. Maria Garcia Lopez',
  cedula_profesional = '87654321',
  universidad = 'Universidad Panamericana',
  especialidades = ARRAY['laboral', 'civil'],
  estados_operacion = ARRAY['CDMX', 'Estado de Mexico', 'Jalisco'],
  anos_experiencia = 8,
  casos_ganados = 45,
  rating = 4.8,
  verification_status = 'verified',
  is_available = true,
  bio = 'Abogada especialista en derecho laboral con 8 años de experiencia. Egresada de la Universidad Panamericana con maestria en Derecho del Trabajo.';

-- 5. Perfil: Admin
INSERT INTO profiles (id, email, full_name, phone, role, is_verified, verification_status, created_at)
SELECT id, email,
  'Administrador Sistema',
  '5550001111',
  'admin',
  true,
  'approved',
  NOW()
FROM auth.users WHERE email = 'admin123@mecorrieron.mx'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'Administrador Sistema',
  phone = '5550001111',
  is_verified = true,
  verification_status = 'approved';

-- 6. Perfil: SuperAdmin
INSERT INTO profiles (id, email, full_name, phone, role, is_verified, verification_status, created_at)
SELECT id, email,
  'Super Administrador',
  '5550002222',
  'superadmin',
  true,
  'approved',
  NOW()
FROM auth.users WHERE email = 'superadmin123@mecorrieron.mx'
ON CONFLICT (id) DO UPDATE SET
  role = 'superadmin',
  full_name = 'Super Administrador',
  phone = '5550002222',
  is_verified = true,
  verification_status = 'approved';

-- Crear un despacho de prueba para el abogado
INSERT INTO despachos (id, nombre, rfc, direccion, telefono, email, status, codigo_referido, created_at)
VALUES (
  gen_random_uuid(),
  'Garcia & Asociados',
  'GAA123456ABC',
  'Av. Reforma 123, Col. Juarez, CDMX',
  '5551112233',
  'contacto@garciayasociados.mx',
  'active',
  'GARCIA2026',
  NOW()
)
ON CONFLICT DO NOTHING;

-- Asociar abogado al despacho
UPDATE lawyer_profiles 
SET despacho_id = (SELECT id FROM despachos WHERE nombre = 'Garcia & Asociados' LIMIT 1)
WHERE id = (SELECT id FROM auth.users WHERE email = 'abogado123@mecorrieron.mx');
