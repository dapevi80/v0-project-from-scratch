-- Tabla de Despachos (Law Firms)
-- Soporta modelos B2B, B2BL y B2C
CREATE TABLE IF NOT EXISTS despachos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  razon_social VARCHAR(255),
  rfc VARCHAR(13),
  tipo VARCHAR(20) DEFAULT 'independiente' CHECK (tipo IN ('independiente', 'despacho', 'corporativo')),
  modelo_negocio VARCHAR(10) DEFAULT 'B2C' CHECK (modelo_negocio IN ('B2B', 'B2BL', 'B2C', 'mixto')),
  
  -- Datos de contacto
  email VARCHAR(255),
  telefono VARCHAR(20),
  whatsapp VARCHAR(20),
  sitio_web VARCHAR(255),
  
  -- Direccion
  direccion_calle VARCHAR(255),
  direccion_numero VARCHAR(20),
  direccion_colonia VARCHAR(100),
  direccion_cp VARCHAR(10),
  direccion_ciudad VARCHAR(100),
  direccion_estado VARCHAR(50),
  
  -- Configuracion
  logo_url TEXT,
  descripcion TEXT,
  especialidades TEXT[], -- ['laboral', 'civil', 'mercantil']
  comision_plataforma DECIMAL(5,2) DEFAULT 15.00, -- Porcentaje que paga a la plataforma
  
  -- Estado
  activo BOOLEAN DEFAULT TRUE,
  verificado BOOLEAN DEFAULT FALSE,
  verificado_at TIMESTAMPTZ,
  verificado_por UUID REFERENCES profiles(id),
  
  -- Limites y metricas
  max_abogados INT DEFAULT 10,
  max_casos_activos INT DEFAULT 50,
  casos_totales INT DEFAULT 0,
  casos_ganados INT DEFAULT 0,
  rating_promedio DECIMAL(3,2) DEFAULT 0,
  
  -- Admin del despacho
  admin_id UUID REFERENCES profiles(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de relacion Despacho-Abogado
CREATE TABLE IF NOT EXISTS despacho_abogados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  despacho_id UUID NOT NULL REFERENCES despachos(id) ON DELETE CASCADE,
  lawyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rol VARCHAR(20) DEFAULT 'abogado' CHECK (rol IN ('admin', 'socio', 'abogado', 'pasante')),
  fecha_ingreso DATE DEFAULT CURRENT_DATE,
  activo BOOLEAN DEFAULT TRUE,
  porcentaje_comision DECIMAL(5,2) DEFAULT 70.00, -- Lo que recibe el abogado del caso
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(despacho_id, lawyer_id)
);

-- Tabla de invitaciones a despacho
CREATE TABLE IF NOT EXISTS despacho_invitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  despacho_id UUID NOT NULL REFERENCES despachos(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  rol VARCHAR(20) DEFAULT 'abogado',
  token VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para rendimiento
CREATE INDEX IF NOT EXISTS idx_despachos_activo ON despachos(activo);
CREATE INDEX IF NOT EXISTS idx_despachos_modelo ON despachos(modelo_negocio);
CREATE INDEX IF NOT EXISTS idx_despacho_abogados_despacho ON despacho_abogados(despacho_id);
CREATE INDEX IF NOT EXISTS idx_despacho_abogados_lawyer ON despacho_abogados(lawyer_id);

-- RLS Policies
ALTER TABLE despachos ENABLE ROW LEVEL SECURITY;
ALTER TABLE despacho_abogados ENABLE ROW LEVEL SECURITY;
ALTER TABLE despacho_invitaciones ENABLE ROW LEVEL SECURITY;

-- Politica: Admins pueden ver todo
CREATE POLICY "Admins can manage despachos" ON despachos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Politica: Miembros del despacho pueden ver su despacho
CREATE POLICY "Members can view their despacho" ON despachos
  FOR SELECT USING (
    id IN (
      SELECT despacho_id FROM despacho_abogados 
      WHERE lawyer_id = auth.uid() AND activo = TRUE
    )
    OR admin_id = auth.uid()
  );

-- Politica: Admins del despacho pueden actualizar
CREATE POLICY "Despacho admins can update" ON despachos
  FOR UPDATE USING (admin_id = auth.uid());

-- Politicas para despacho_abogados
CREATE POLICY "View despacho members" ON despacho_abogados
  FOR SELECT USING (
    despacho_id IN (
      SELECT despacho_id FROM despacho_abogados WHERE lawyer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins manage despacho members" ON despacho_abogados
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
    OR EXISTS (
      SELECT 1 FROM despachos 
      WHERE despachos.id = despacho_id 
      AND despachos.admin_id = auth.uid()
    )
  );
