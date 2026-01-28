-- Script para crear usuarios de prueba con códigos únicos
-- Cada usuario tiene su propio identificador único

-- Nota: Los usuarios deben crearse primero en auth.users
-- Este script actualiza/inserta los perfiles correspondientes

-- Usuario: trabajador (role: worker)
-- Email: trabajador@mecorrieron.mx
-- Código: trabajadorxk7mn92

-- Usuario: abogado (role: lawyer)  
-- Email: abogado@mecorrieron.mx
-- Código: abogadoqw8tp45

-- Usuario: admin (role: admin)
-- Email: admin@mecorrieron.mx
-- Código: adminzr3vb67

-- Usuario: superadmin (role: superadmin)
-- Email: superadmin@mecorrieron.mx
-- Código: superadminjh5ck81

-- Usuario: agenteweb (role: guest - agente de captación web)
-- Email: agenteweb@mecorrieron.mx
-- Código: agentewebmf9dl23

-- Primero verificamos los usuarios existentes
SELECT id, email, role, full_name FROM profiles;

-- Los usuarios se crean mediante el sistema de autenticación de Supabase
-- Una vez creados en auth.users, los perfiles se actualizan aquí:

-- Actualizar perfil de trabajador (si existe)
UPDATE profiles 
SET role = 'worker', 
    full_name = 'Usuario Trabajador Prueba'
WHERE email = 'trabajador@mecorrieron.mx';

-- Actualizar perfil de abogado (si existe)
UPDATE profiles 
SET role = 'lawyer', 
    full_name = 'Abogado Prueba'
WHERE email = 'abogado@mecorrieron.mx';

-- Actualizar perfil de admin (si existe)
UPDATE profiles 
SET role = 'admin', 
    full_name = 'Administrador Prueba'
WHERE email = 'admin@mecorrieron.mx';

-- Actualizar perfil de superadmin (si existe)
UPDATE profiles 
SET role = 'superadmin', 
    full_name = 'Super Administrador'
WHERE email = 'superadmin@mecorrieron.mx';

-- Actualizar perfil de agenteweb (si existe)
UPDATE profiles 
SET role = 'guest', 
    full_name = 'Agente Web Prueba'
WHERE email = 'agenteweb@mecorrieron.mx';
