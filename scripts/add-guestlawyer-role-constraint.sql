-- Agregar rol guestlawyer al constraint de roles en profiles
-- Este rol es para abogados en proceso de verificacion (similar a guest para trabajadores)

-- Primero eliminamos el constraint existente
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Recreamos el constraint incluyendo guestlawyer
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('guest', 'worker', 'guestlawyer', 'lawyer', 'admin', 'superadmin', 'agent', 'webagent'));
