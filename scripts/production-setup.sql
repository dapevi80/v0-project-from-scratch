-- ===========================================
-- SCRIPT DE SETUP PARA PRODUCCION
-- Sistema CCL - Base de datos limpia
-- ===========================================

-- Este script configura las tablas necesarias SIN datos de prueba
-- Solo ejecutar una vez en producción

-- 1. Verificar/crear tabla de perfiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'abogado', 'admin', 'superadmin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  cedula_profesional TEXT,
  especialidad TEXT,
  despacho_id UUID,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear tabla de créditos CCL
CREATE TABLE IF NOT EXISTS creditos_ccl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  abogado_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  despacho_id UUID,
  creditos_mensuales INTEGER DEFAULT 0,
  creditos_usados INTEGER DEFAULT 0,
  creditos_extra INTEGER DEFAULT 0,
  plan TEXT DEFAULT 'gratuito',
  fecha_renovacion DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(abogado_id, despacho_id)
);

-- 3. Crear tabla de reservas de créditos
CREATE TABLE IF NOT EXISTS reservas_creditos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  abogado_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  despacho_id UUID,
  solicitud_id UUID,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'completado', 'cancelado', 'expirado')),
  motivo_cancelacion TEXT,
  expira_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Crear tabla de reembolsos
CREATE TABLE IF NOT EXISTS reembolsos_creditos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  abogado_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  despacho_id UUID,
  motivo TEXT NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Crear tabla de solicitudes CCL
CREATE TABLE IF NOT EXISTS solicitudes_ccl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio TEXT UNIQUE,
  abogado_id UUID REFERENCES profiles(id),
  trabajador_id UUID REFERENCES profiles(id),
  calculo_id UUID,
  estado TEXT NOT NULL, -- Estado de México (Aguascalientes, CDMX, etc.)
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'exitoso', 'fallido', 'requiere_intervencion')),
  documento_oficial_url TEXT,
  documento_oficial_path TEXT,
  reporte_fallo_url TEXT,
  screenshot_fallo_url TEXT,
  paso_fallo TEXT,
  error_mensaje TEXT,
  tiempo_proceso_ms INTEGER,
  reserva_credito_id UUID REFERENCES reservas_creditos(id),
  credito_debitado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Crear tabla de notificaciones de email
CREATE TABLE IF NOT EXISTS notificaciones_email (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID REFERENCES solicitudes_ccl(id),
  tipo TEXT NOT NULL,
  destinatario TEXT NOT NULL,
  asunto TEXT NOT NULL,
  enviado BOOLEAN DEFAULT FALSE,
  message_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Crear tabla de cálculos de liquidación
CREATE TABLE IF NOT EXISTS calculos_liquidacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  abogado_id UUID REFERENCES profiles(id),
  nombre_trabajador TEXT,
  curp TEXT,
  rfc TEXT,
  nombre_empresa TEXT,
  fecha_ingreso DATE,
  fecha_salida DATE,
  salario_diario DECIMAL(12,2),
  causa_separacion TEXT,
  total_liquidacion DECIMAL(12,2),
  datos_calculo JSONB,
  status TEXT DEFAULT 'borrador',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_solicitudes_ccl_abogado ON solicitudes_ccl(abogado_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_ccl_status ON solicitudes_ccl(status);
CREATE INDEX IF NOT EXISTS idx_creditos_ccl_abogado ON creditos_ccl(abogado_id);
CREATE INDEX IF NOT EXISTS idx_reservas_creditos_status ON reservas_creditos(status);

-- 9. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Triggers para updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_solicitudes_ccl_updated_at ON solicitudes_ccl;
CREATE TRIGGER update_solicitudes_ccl_updated_at
  BEFORE UPDATE ON solicitudes_ccl
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calculos_liquidacion_updated_at ON calculos_liquidacion;
CREATE TRIGGER update_calculos_liquidacion_updated_at
  BEFORE UPDATE ON calculos_liquidacion
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. RLS (Row Level Security) - IMPORTANTE para producción
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creditos_ccl ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_ccl ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculos_liquidacion ENABLE ROW LEVEL SECURITY;

-- Políticas básicas de RLS
-- Usuarios pueden ver su propio perfil
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Usuarios pueden actualizar su propio perfil  
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins pueden ver todos los perfiles
CREATE POLICY IF NOT EXISTS "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Política para créditos
CREATE POLICY IF NOT EXISTS "Users can view own credits" ON creditos_ccl
  FOR SELECT USING (abogado_id = auth.uid());

-- Política para solicitudes
CREATE POLICY IF NOT EXISTS "Users can view own solicitudes" ON solicitudes_ccl
  FOR SELECT USING (abogado_id = auth.uid() OR trabajador_id = auth.uid());

-- Política para cálculos
CREATE POLICY IF NOT EXISTS "Users can view own calculos" ON calculos_liquidacion
  FOR SELECT USING (user_id = auth.uid() OR abogado_id = auth.uid());

-- ===========================================
-- SETUP COMPLETADO
-- Siguiente paso: Crear primer usuario superadmin
-- desde el panel de Supabase Auth
-- ===========================================
