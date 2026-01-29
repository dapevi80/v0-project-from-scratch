-- =====================================================
-- SISTEMA DE CADENA DE REFERIDOS MULTINIVEL
-- =====================================================
-- Reglas:
-- 1. Admin sube caso con codigo referido -> puede asignarlo a abogados de su linea
-- 2. Abogados invitan trabajadores -> registran en su familia de referidos
-- 3. Admin de linea superior y superadmin pueden ver todos los clientes de su arbol
-- =====================================================

-- Tabla de arbol de referidos (estructura jerarquica)
CREATE TABLE IF NOT EXISTS referral_tree (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  root_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  level INT NOT NULL DEFAULT 1,
  path TEXT[] NOT NULL DEFAULT '{}',
  referral_code VARCHAR(20) UNIQUE,
  total_referidos INT DEFAULT 0,
  total_casos_familia INT DEFAULT 0,
  comision_acumulada DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Historial de referidos (quien invito a quien)
CREATE TABLE IF NOT EXISTS referral_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code_used VARCHAR(20),
  referred_role VARCHAR(50),
  bonus_credits INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id)
);

-- Tabla de visibilidad de casos por linea de referidos
CREATE TABLE IF NOT EXISTS caso_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visibility_type VARCHAR(20) NOT NULL CHECK (visibility_type IN ('owner', 'assigned', 'lineage', 'admin')),
  can_reassign BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(caso_id, user_id)
);

-- Agregar columnas a profiles si no existen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referral_code') THEN
    ALTER TABLE profiles ADD COLUMN referral_code VARCHAR(20) UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referred_by_code') THEN
    ALTER TABLE profiles ADD COLUMN referred_by_code VARCHAR(20);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referred_by_user') THEN
    ALTER TABLE profiles ADD COLUMN referred_by_user UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Agregar columnas a casos para tracking de origen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'casos' AND column_name = 'origen_referido') THEN
    ALTER TABLE casos ADD COLUMN origen_referido VARCHAR(20);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'casos' AND column_name = 'created_by_admin') THEN
    ALTER TABLE casos ADD COLUMN created_by_admin UUID REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'casos' AND column_name = 'asignable_a_linea') THEN
    ALTER TABLE casos ADD COLUMN asignable_a_linea BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_referral_tree_parent ON referral_tree(parent_id);
CREATE INDEX IF NOT EXISTS idx_referral_tree_root ON referral_tree(root_admin_id);
CREATE INDEX IF NOT EXISTS idx_referral_tree_path ON referral_tree USING GIN(path);
CREATE INDEX IF NOT EXISTS idx_referral_history_referrer ON referral_history(referrer_id);
CREATE INDEX IF NOT EXISTS idx_caso_visibility_user ON caso_visibility(user_id);
CREATE INDEX IF NOT EXISTS idx_caso_visibility_caso ON caso_visibility(caso_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- =====================================================
-- FUNCIONES
-- =====================================================

-- Generar codigo de referido unico
CREATE OR REPLACE FUNCTION generar_codigo_referido(p_user_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  v_code VARCHAR(20);
  v_exists BOOLEAN;
  v_name VARCHAR(100);
BEGIN
  -- Obtener nombre del usuario
  SELECT UPPER(SUBSTRING(COALESCE(full_name, 'USER') FROM 1 FOR 3))
  INTO v_name
  FROM profiles WHERE id = p_user_id;
  
  -- Generar codigo unico
  LOOP
    v_code := v_name || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  -- Actualizar perfil
  UPDATE profiles SET referral_code = v_code WHERE id = p_user_id;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Registrar usuario con codigo de referido
CREATE OR REPLACE FUNCTION registrar_referido(
  p_new_user_id UUID,
  p_referral_code VARCHAR(20)
)
RETURNS JSONB AS $$
DECLARE
  v_referrer_id UUID;
  v_referrer_role VARCHAR(50);
  v_referrer_tree RECORD;
  v_new_path TEXT[];
  v_new_level INT;
  v_root_admin UUID;
BEGIN
  -- Buscar quien tiene el codigo
  SELECT id, role INTO v_referrer_id, v_referrer_role
  FROM profiles WHERE referral_code = p_referral_code;
  
  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Codigo de referido invalido');
  END IF;
  
  -- Obtener arbol del referidor
  SELECT * INTO v_referrer_tree FROM referral_tree WHERE user_id = v_referrer_id;
  
  -- Calcular nuevo path y nivel
  IF v_referrer_tree IS NOT NULL THEN
    v_new_path := v_referrer_tree.path || v_referrer_id::TEXT;
    v_new_level := v_referrer_tree.level + 1;
    v_root_admin := v_referrer_tree.root_admin_id;
  ELSE
    v_new_path := ARRAY[v_referrer_id::TEXT];
    v_new_level := 2;
    -- Si el referidor es admin, el es el root
    IF v_referrer_role IN ('admin', 'superadmin') THEN
      v_root_admin := v_referrer_id;
    ELSE
      v_root_admin := NULL;
    END IF;
  END IF;
  
  -- Insertar en arbol de referidos
  INSERT INTO referral_tree (user_id, parent_id, root_admin_id, level, path)
  VALUES (p_new_user_id, v_referrer_id, v_root_admin, v_new_level, v_new_path)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Registrar historial
  INSERT INTO referral_history (referrer_id, referred_id, referral_code_used, bonus_credits)
  VALUES (v_referrer_id, p_new_user_id, p_referral_code, 5)
  ON CONFLICT (referred_id) DO NOTHING;
  
  -- Actualizar perfil del nuevo usuario
  UPDATE profiles 
  SET referred_by_code = p_referral_code, referred_by_user = v_referrer_id
  WHERE id = p_new_user_id;
  
  -- Incrementar contador del referidor
  UPDATE referral_tree SET total_referidos = total_referidos + 1 WHERE user_id = v_referrer_id;
  
  -- Dar creditos de bono al referidor
  UPDATE creditos_leads SET saldo_actual = saldo_actual + 5 WHERE user_id = v_referrer_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'referrer_id', v_referrer_id,
    'level', v_new_level,
    'root_admin', v_root_admin
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtener abogados de primera linea (para admin)
CREATE OR REPLACE FUNCTION obtener_abogados_primera_linea(p_admin_id UUID)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  estado TEXT,
  casos_activos BIGINT,
  total_referidos INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rt.user_id,
    p.full_name,
    p.email,
    p.estado,
    (SELECT COUNT(*) FROM casos c WHERE c.lawyer_id = rt.user_id AND c.status != 'closed'),
    rt.total_referidos
  FROM referral_tree rt
  JOIN profiles p ON p.id = rt.user_id
  WHERE rt.parent_id = p_admin_id
  AND p.role IN ('abogado', 'guest_lawyer')
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtener toda la familia de referidos (arbol completo)
CREATE OR REPLACE FUNCTION obtener_familia_referidos(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  role TEXT,
  level INT,
  parent_name TEXT,
  casos_count BIGINT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE familia AS (
    -- Nodo raiz
    SELECT rt.user_id, rt.level, rt.parent_id
    FROM referral_tree rt
    WHERE rt.user_id = p_user_id
    
    UNION ALL
    
    -- Hijos recursivos
    SELECT rt.user_id, rt.level, rt.parent_id
    FROM referral_tree rt
    JOIN familia f ON rt.parent_id = f.user_id
  )
  SELECT 
    f.user_id,
    p.full_name,
    p.email,
    p.role,
    f.level,
    parent_p.full_name as parent_name,
    (SELECT COUNT(*) FROM casos c WHERE c.worker_id = f.user_id OR c.lawyer_id = f.user_id),
    p.created_at
  FROM familia f
  JOIN profiles p ON p.id = f.user_id
  LEFT JOIN profiles parent_p ON parent_p.id = f.parent_id
  WHERE f.user_id != p_user_id
  ORDER BY f.level, p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Asignar caso a abogado de primera linea
CREATE OR REPLACE FUNCTION asignar_caso_a_linea(
  p_caso_id UUID,
  p_admin_id UUID,
  p_abogado_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_es_primera_linea BOOLEAN;
  v_caso RECORD;
BEGIN
  -- Verificar que el abogado es de primera linea del admin
  SELECT EXISTS(
    SELECT 1 FROM referral_tree 
    WHERE user_id = p_abogado_id AND parent_id = p_admin_id
  ) INTO v_es_primera_linea;
  
  IF NOT v_es_primera_linea THEN
    RETURN jsonb_build_object('success', false, 'error', 'El abogado no pertenece a tu primera linea');
  END IF;
  
  -- Verificar que el caso fue creado por el admin o es asignable
  SELECT * INTO v_caso FROM casos WHERE id = p_caso_id;
  
  IF v_caso.created_by_admin != p_admin_id AND v_caso.asignable_a_linea = FALSE THEN
    RETURN jsonb_build_object('success', false, 'error', 'No tienes permiso para asignar este caso');
  END IF;
  
  -- Asignar caso
  UPDATE casos 
  SET lawyer_id = p_abogado_id, 
      status = 'asignado',
      updated_at = NOW()
  WHERE id = p_caso_id;
  
  -- Crear visibilidad
  INSERT INTO caso_visibility (caso_id, user_id, visibility_type, can_reassign)
  VALUES 
    (p_caso_id, p_abogado_id, 'assigned', false),
    (p_caso_id, p_admin_id, 'lineage', true)
  ON CONFLICT (caso_id, user_id) DO UPDATE SET visibility_type = EXCLUDED.visibility_type;
  
  RETURN jsonb_build_object('success', true, 'message', 'Caso asignado correctamente');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtener casos visibles por linea de referidos
CREATE OR REPLACE FUNCTION obtener_casos_familia(p_user_id UUID)
RETURNS TABLE (
  caso_id UUID,
  folio VARCHAR,
  empresa_nombre VARCHAR,
  worker_name TEXT,
  lawyer_name TEXT,
  monto_estimado DECIMAL,
  status VARCHAR,
  visibility_type VARCHAR,
  can_reassign BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_role VARCHAR(50);
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = p_user_id;
  
  -- Superadmin ve todo
  IF v_role = 'superadmin' THEN
    RETURN QUERY
    SELECT 
      c.id, c.folio, c.empresa_nombre,
      wp.full_name as worker_name,
      lp.full_name as lawyer_name,
      c.monto_estimado, c.status,
      'admin'::VARCHAR as visibility_type,
      true as can_reassign,
      c.created_at
    FROM casos c
    LEFT JOIN profiles wp ON wp.id = c.worker_id
    LEFT JOIN profiles lp ON lp.id = c.lawyer_id
    ORDER BY c.created_at DESC;
  ELSE
    -- Usuarios normales ven por visibilidad
    RETURN QUERY
    SELECT 
      c.id, c.folio, c.empresa_nombre,
      wp.full_name as worker_name,
      lp.full_name as lawyer_name,
      c.monto_estimado, c.status,
      cv.visibility_type,
      cv.can_reassign,
      c.created_at
    FROM casos c
    JOIN caso_visibility cv ON cv.caso_id = c.id AND cv.user_id = p_user_id
    LEFT JOIN profiles wp ON wp.id = c.worker_id
    LEFT JOIN profiles lp ON lp.id = c.lawyer_id
    ORDER BY c.created_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear visibilidad automatica cuando se crea un caso
CREATE OR REPLACE FUNCTION crear_visibilidad_caso()
RETURNS TRIGGER AS $$
DECLARE
  v_tree RECORD;
  v_ancestor UUID;
BEGIN
  -- Visibilidad para el trabajador (owner)
  IF NEW.worker_id IS NOT NULL THEN
    INSERT INTO caso_visibility (caso_id, user_id, visibility_type, can_reassign)
    VALUES (NEW.id, NEW.worker_id, 'owner', false)
    ON CONFLICT DO NOTHING;
    
    -- Obtener arbol del trabajador
    SELECT * INTO v_tree FROM referral_tree WHERE user_id = NEW.worker_id;
    
    IF v_tree IS NOT NULL THEN
      -- Dar visibilidad a toda la linea superior
      FOREACH v_ancestor IN ARRAY v_tree.path
      LOOP
        INSERT INTO caso_visibility (caso_id, user_id, visibility_type, can_reassign)
        VALUES (NEW.id, v_ancestor::UUID, 'lineage', 
          (SELECT role IN ('admin', 'superadmin') FROM profiles WHERE id = v_ancestor::UUID))
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
  END IF;
  
  -- Visibilidad para el abogado asignado
  IF NEW.lawyer_id IS NOT NULL THEN
    INSERT INTO caso_visibility (caso_id, user_id, visibility_type, can_reassign)
    VALUES (NEW.id, NEW.lawyer_id, 'assigned', false)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Visibilidad para admin que creo el caso
  IF NEW.created_by_admin IS NOT NULL THEN
    INSERT INTO caso_visibility (caso_id, user_id, visibility_type, can_reassign)
    VALUES (NEW.id, NEW.created_by_admin, 'admin', true)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para visibilidad automatica
DROP TRIGGER IF EXISTS trigger_caso_visibilidad ON casos;
CREATE TRIGGER trigger_caso_visibilidad
  AFTER INSERT OR UPDATE OF worker_id, lawyer_id ON casos
  FOR EACH ROW
  EXECUTE FUNCTION crear_visibilidad_caso();

-- Inicializar codigo de referido para usuarios existentes
UPDATE profiles 
SET referral_code = UPPER(SUBSTRING(COALESCE(full_name, 'USR') FROM 1 FOR 3)) || '-' || UPPER(SUBSTRING(MD5(id::TEXT) FROM 1 FOR 6))
WHERE referral_code IS NULL;

-- Crear entradas en referral_tree para admins existentes
INSERT INTO referral_tree (user_id, parent_id, root_admin_id, level, path)
SELECT id, NULL, id, 1, ARRAY[]::TEXT[]
FROM profiles 
WHERE role IN ('admin', 'superadmin')
AND NOT EXISTS (SELECT 1 FROM referral_tree WHERE user_id = profiles.id)
ON CONFLICT DO NOTHING;

-- RLS Policies
ALTER TABLE referral_tree ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE caso_visibility ENABLE ROW LEVEL SECURITY;

-- Politicas para referral_tree
DROP POLICY IF EXISTS "Users can view their own tree" ON referral_tree;
CREATE POLICY "Users can view their own tree" ON referral_tree
  FOR SELECT USING (
    auth.uid() = user_id 
    OR auth.uid() = parent_id
    OR auth.uid()::TEXT = ANY(path)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Politicas para caso_visibility
DROP POLICY IF EXISTS "Users can view their visibility" ON caso_visibility;
CREATE POLICY "Users can view their visibility" ON caso_visibility
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins full access visibility" ON caso_visibility;
CREATE POLICY "Admins full access visibility" ON caso_visibility
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Grant permisos
GRANT SELECT ON referral_tree TO authenticated;
GRANT SELECT ON referral_history TO authenticated;
GRANT SELECT, INSERT ON caso_visibility TO authenticated;
GRANT EXECUTE ON FUNCTION generar_codigo_referido TO authenticated;
GRANT EXECUTE ON FUNCTION registrar_referido TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_abogados_primera_linea TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_familia_referidos TO authenticated;
GRANT EXECUTE ON FUNCTION asignar_caso_a_linea TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_casos_familia TO authenticated;
