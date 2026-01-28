-- Tabla para solicitudes de registro de abogados y despachos
-- Estas solicitudes seran revisadas y verificadas por super admin

CREATE TABLE IF NOT EXISTS solicitudes_abogados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo de solicitud
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('abogado', 'despacho')),
  
  -- Datos comunes
  nombre VARCHAR(255) NOT NULL,
  apellidos VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(50) NOT NULL,
  cedula VARCHAR(50) NOT NULL, -- Cedula del abogado o del responsable del despacho
  ciudad VARCHAR(100) NOT NULL,
  estado VARCHAR(100) NOT NULL,
  
  -- Datos especificos de abogado
  universidad VARCHAR(255),
  especialidad VARCHAR(100) DEFAULT 'laboral',
  experiencia_anos INTEGER,
  acerca TEXT,
  
  -- Datos especificos de despacho
  razon_social VARCHAR(255),
  rfc VARCHAR(20),
  direccion TEXT,
  modelo_negocio VARCHAR(10) CHECK (modelo_negocio IN ('B2B', 'B2BL', 'B2C')),
  descripcion TEXT,
  responsable_nombre VARCHAR(255),
  
  -- Status de verificacion
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  cedula_verificada BOOLEAN DEFAULT FALSE,
  motivo_rechazo TEXT,
  
  -- Auditoria
  verificado_por UUID REFERENCES auth.users(id),
  verificado_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_solicitudes_status ON solicitudes_abogados(status);
CREATE INDEX IF NOT EXISTS idx_solicitudes_email ON solicitudes_abogados(email);
CREATE INDEX IF NOT EXISTS idx_solicitudes_cedula ON solicitudes_abogados(cedula);
CREATE INDEX IF NOT EXISTS idx_solicitudes_tipo ON solicitudes_abogados(tipo);

-- Politicas RLS
ALTER TABLE solicitudes_abogados ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede insertar (registro publico)
CREATE POLICY "Cualquiera puede crear solicitud" ON solicitudes_abogados
  FOR INSERT WITH CHECK (true);

-- Solo admins pueden ver
CREATE POLICY "Admins pueden ver solicitudes" ON solicitudes_abogados
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Solo admins pueden actualizar
CREATE POLICY "Admins pueden actualizar solicitudes" ON solicitudes_abogados
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );
