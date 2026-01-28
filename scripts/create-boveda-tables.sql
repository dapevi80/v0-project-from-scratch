-- ==============================================
-- BÓVEDA DIGITAL - mecorrieron.mx
-- Almacena documentos, evidencias, audios, cálculos
-- ==============================================

-- Eliminar tablas existentes para recrear con nuevo esquema
DROP TABLE IF EXISTS calculos_liquidacion CASCADE;
DROP TABLE IF EXISTS documentos_boveda CASCADE;

-- Tabla principal de documentos de la bóveda
CREATE TABLE documentos_boveda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Categorización
  categoria VARCHAR(50) NOT NULL DEFAULT 'documento',
  -- Categorías válidas: calculo_liquidacion, propuesta_empresa, evidencia_foto, 
  -- evidencia_video, evidencia_audio, grabacion_audio, contrato_laboral, 
  -- hoja_renuncia, ine_frente, ine_reverso, pasaporte, comprobante_domicilio, otro
  
  subcategoria VARCHAR(50),
  -- Subcategorías: captura_pantalla, conversacion_whatsapp, correo, etc.
  
  -- Datos del archivo
  nombre VARCHAR(255) NOT NULL,
  nombre_original VARCHAR(255),
  descripcion TEXT,
  archivo_path VARCHAR(500) NOT NULL,
  archivo_url VARCHAR(1000),
  mime_type VARCHAR(100),
  tamanio_bytes BIGINT DEFAULT 0,
  
  -- Metadatos adicionales
  metadata JSONB DEFAULT '{}',
  -- Para cálculos: { salarioDiario, antiguedad, totalConciliacion, totalJuicio }
  -- Para audios: { duracion_segundos, transcripcion }
  -- Para fotos: { ancho, alto, fecha_captura }
  
  -- Estado y verificación
  estado VARCHAR(20) DEFAULT 'activo',
  -- Estados: activo, archivado, eliminado
  
  verificado BOOLEAN DEFAULT FALSE,
  fecha_verificacion TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para historial de cálculos de liquidación
CREATE TABLE calculos_liquidacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Datos de entrada
  salario_diario DECIMAL(12,2) NOT NULL,
  salario_mensual DECIMAL(12,2),
  fecha_ingreso DATE NOT NULL,
  fecha_salida DATE,
  
  -- Resultados conciliación
  total_conciliacion DECIMAL(12,2),
  neto_conciliacion DECIMAL(12,2),
  
  -- Resultados juicio
  total_juicio DECIMAL(12,2),
  neto_juicio DECIMAL(12,2),
  
  -- Datos calculados
  antiguedad_anios INTEGER DEFAULT 0,
  antiguedad_meses INTEGER DEFAULT 0,
  antiguedad_dias INTEGER DEFAULT 0,
  
  -- Desglose (JSONB para flexibilidad)
  desglose_conciliacion JSONB DEFAULT '{}',
  desglose_juicio JSONB DEFAULT '{}',
  
  -- Referencias a PDFs generados
  pdf_liquidacion_id UUID REFERENCES documentos_boveda(id) ON DELETE SET NULL,
  pdf_propuesta_id UUID REFERENCES documentos_boveda(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- ÍNDICES
-- ==============================================

-- Índices para documentos_boveda
CREATE INDEX IF NOT EXISTS idx_documentos_boveda_user_id ON documentos_boveda(user_id);
CREATE INDEX IF NOT EXISTS idx_documentos_boveda_categoria ON documentos_boveda(categoria);
CREATE INDEX IF NOT EXISTS idx_documentos_boveda_created_at ON documentos_boveda(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documentos_boveda_estado ON documentos_boveda(estado);

-- Índices para calculos_liquidacion
CREATE INDEX IF NOT EXISTS idx_calculos_liquidacion_user_id ON calculos_liquidacion(user_id);
CREATE INDEX IF NOT EXISTS idx_calculos_liquidacion_created_at ON calculos_liquidacion(created_at DESC);

-- ==============================================
-- ROW LEVEL SECURITY
-- ==============================================

-- RLS para documentos_boveda
ALTER TABLE documentos_boveda ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own documents" ON documentos_boveda;
CREATE POLICY "Users can view own documents" ON documentos_boveda
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own documents" ON documentos_boveda;
CREATE POLICY "Users can insert own documents" ON documentos_boveda
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own documents" ON documentos_boveda;
CREATE POLICY "Users can update own documents" ON documentos_boveda
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own documents" ON documentos_boveda;
CREATE POLICY "Users can delete own documents" ON documentos_boveda
  FOR DELETE USING (auth.uid() = user_id);

-- RLS para calculos_liquidacion
ALTER TABLE calculos_liquidacion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own calculos" ON calculos_liquidacion;
CREATE POLICY "Users can view own calculos" ON calculos_liquidacion
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own calculos" ON calculos_liquidacion;
CREATE POLICY "Users can insert own calculos" ON calculos_liquidacion
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own calculos" ON calculos_liquidacion;
CREATE POLICY "Users can update own calculos" ON calculos_liquidacion
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own calculos" ON calculos_liquidacion;
CREATE POLICY "Users can delete own calculos" ON calculos_liquidacion
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================
-- TRIGGERS
-- ==============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para documentos_boveda
DROP TRIGGER IF EXISTS trigger_documentos_boveda_updated_at ON documentos_boveda;
CREATE TRIGGER trigger_documentos_boveda_updated_at
  BEFORE UPDATE ON documentos_boveda
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para calculos_liquidacion
DROP TRIGGER IF EXISTS trigger_calculos_liquidacion_updated_at ON calculos_liquidacion;
CREATE TRIGGER trigger_calculos_liquidacion_updated_at
  BEFORE UPDATE ON calculos_liquidacion
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- STORAGE BUCKET (ejecutar manualmente si es necesario)
-- ==============================================
-- Nota: Esto se debe ejecutar en el dashboard de Supabase o vía API
-- 
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'boveda', 
--   'boveda', 
--   false,
--   52428800, -- 50MB max
--   ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 
--         'video/mp4', 'video/quicktime', 'video/webm',
--         'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg',
--         'application/pdf', 'application/msword',
--         'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
-- );

-- ==============================================
-- COMENTARIOS
-- ==============================================

COMMENT ON TABLE documentos_boveda IS 'Bóveda digital: almacena documentos, evidencias, audios y archivos del caso laboral';
COMMENT ON COLUMN documentos_boveda.categoria IS 'Categoría: calculo_liquidacion, propuesta_empresa, evidencia_foto, evidencia_video, evidencia_audio, grabacion_audio, contrato_laboral, hoja_renuncia, ine_frente, ine_reverso, pasaporte, comprobante_domicilio, otro';
COMMENT ON COLUMN documentos_boveda.archivo_path IS 'Ruta del archivo en Supabase Storage (bucket: boveda)';
COMMENT ON COLUMN documentos_boveda.metadata IS 'Metadatos adicionales: para cálculos incluye montos, para audios incluye duración, etc';

COMMENT ON TABLE calculos_liquidacion IS 'Historial de cálculos de liquidación realizados por el usuario';
COMMENT ON COLUMN calculos_liquidacion.desglose_conciliacion IS 'Desglose detallado de conceptos para conciliación en formato JSON';
COMMENT ON COLUMN calculos_liquidacion.desglose_juicio IS 'Desglose detallado de conceptos para juicio en formato JSON';
