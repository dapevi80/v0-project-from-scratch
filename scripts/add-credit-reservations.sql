-- Tabla de reservas de creditos (para no debitar hasta confirmar exito)
CREATE TABLE IF NOT EXISTS reservas_creditos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  abogado_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  despacho_id UUID REFERENCES despachos(id) ON DELETE SET NULL,
  solicitud_id UUID REFERENCES solicitudes_ccl(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'completado', 'cancelado', 'expirado')),
  motivo_cancelacion TEXT,
  expira_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de reembolsos de creditos
CREATE TABLE IF NOT EXISTS reembolsos_creditos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  abogado_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  despacho_id UUID REFERENCES despachos(id) ON DELETE SET NULL,
  solicitud_id UUID REFERENCES solicitudes_ccl(id) ON DELETE SET NULL,
  motivo TEXT NOT NULL,
  fecha TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar columnas a solicitudes_ccl para documento oficial del CCL
ALTER TABLE solicitudes_ccl ADD COLUMN IF NOT EXISTS documento_oficial_url TEXT;
ALTER TABLE solicitudes_ccl ADD COLUMN IF NOT EXISTS documento_oficial_nombre TEXT;
ALTER TABLE solicitudes_ccl ADD COLUMN IF NOT EXISTS documento_oficial_size INTEGER;
ALTER TABLE solicitudes_ccl ADD COLUMN IF NOT EXISTS reporte_fallo_url TEXT;
ALTER TABLE solicitudes_ccl ADD COLUMN IF NOT EXISTS screenshot_error_url TEXT;
ALTER TABLE solicitudes_ccl ADD COLUMN IF NOT EXISTS paso_error TEXT;
ALTER TABLE solicitudes_ccl ADD COLUMN IF NOT EXISTS reserva_credito_id UUID REFERENCES reservas_creditos(id);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_reservas_creditos_abogado ON reservas_creditos(abogado_id);
CREATE INDEX IF NOT EXISTS idx_reservas_creditos_status ON reservas_creditos(status);
CREATE INDEX IF NOT EXISTS idx_reservas_creditos_expira ON reservas_creditos(expira_at);
CREATE INDEX IF NOT EXISTS idx_reembolsos_creditos_abogado ON reembolsos_creditos(abogado_id);

-- RLS para reservas_creditos
ALTER TABLE reservas_creditos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reservations" ON reservas_creditos
  FOR SELECT USING (auth.uid() = abogado_id);

CREATE POLICY "Users can create their own reservations" ON reservas_creditos
  FOR INSERT WITH CHECK (auth.uid() = abogado_id);

CREATE POLICY "Users can update their own reservations" ON reservas_creditos
  FOR UPDATE USING (auth.uid() = abogado_id);

-- RLS para reembolsos_creditos
ALTER TABLE reembolsos_creditos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own refunds" ON reembolsos_creditos
  FOR SELECT USING (auth.uid() = abogado_id);

-- Funcion para limpiar reservas expiradas (ejecutar con cron)
CREATE OR REPLACE FUNCTION limpiar_reservas_expiradas()
RETURNS void AS $$
BEGIN
  UPDATE reservas_creditos 
  SET status = 'expirado' 
  WHERE status = 'pendiente' 
  AND expira_at < NOW();
END;
$$ LANGUAGE plpgsql;
