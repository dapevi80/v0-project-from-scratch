-- Sistema de Creditos para Leads de Abogados
-- Permite a abogados "tomar" casos usando creditos

-- Tabla de creditos de leads para abogados
CREATE TABLE IF NOT EXISTS creditos_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  abogado_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creditos_totales INTEGER DEFAULT 250, -- Default 250 creditos
  creditos_usados INTEGER DEFAULT 0,
  creditos_extra INTEGER DEFAULT 0,
  plan TEXT DEFAULT 'abogado', -- 'abogado' (500/mes) o 'despacho' (5000/mes)
  fecha_renovacion TIMESTAMPTZ,
  saldo_recargable DECIMAL(10,2) DEFAULT 0, -- Saldo para comprar creditos extra
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(abogado_id)
);

-- Historial de transacciones de creditos
CREATE TABLE IF NOT EXISTS creditos_leads_transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  abogado_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'tomar_caso', 'recarga', 'devolucion', 'suscripcion', 'bonus'
  creditos INTEGER NOT NULL, -- Positivo = agregar, Negativo = quitar
  caso_id UUID REFERENCES casos(id) ON DELETE SET NULL,
  descripcion TEXT,
  monto_pagado DECIMAL(10,2), -- Si fue una recarga
  referencia_pago TEXT, -- ID de MercadoPago u otro
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads disponibles (casos sin abogado asignado)
-- Ya existe la tabla casos, agregamos columna para marcar disponibilidad
ALTER TABLE casos ADD COLUMN IF NOT EXISTS disponible_para_leads BOOLEAN DEFAULT true;
ALTER TABLE casos ADD COLUMN IF NOT EXISTS estado_lead TEXT DEFAULT 'disponible'; -- 'disponible', 'visto', 'tomado'
ALTER TABLE casos ADD COLUMN IF NOT EXISTS visto_por_abogado_id UUID REFERENCES auth.users(id);
ALTER TABLE casos ADD COLUMN IF NOT EXISTS visto_at TIMESTAMPTZ;
ALTER TABLE casos ADD COLUMN IF NOT EXISTS creditos_cobrados INTEGER DEFAULT 10;

-- Indices para rendimiento
CREATE INDEX IF NOT EXISTS idx_creditos_leads_abogado ON creditos_leads(abogado_id);
CREATE INDEX IF NOT EXISTS idx_creditos_transacciones_abogado ON creditos_leads_transacciones(abogado_id);
CREATE INDEX IF NOT EXISTS idx_casos_disponibles ON casos(disponible_para_leads, estado) WHERE lawyer_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_casos_estado_lead ON casos(estado_lead);

-- RLS Policies
ALTER TABLE creditos_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE creditos_leads_transacciones ENABLE ROW LEVEL SECURITY;

-- Los abogados solo ven sus propios creditos
DROP POLICY IF EXISTS creditos_leads_select ON creditos_leads;
CREATE POLICY creditos_leads_select ON creditos_leads
  FOR SELECT USING (auth.uid() = abogado_id);

DROP POLICY IF EXISTS creditos_leads_update ON creditos_leads;
CREATE POLICY creditos_leads_update ON creditos_leads
  FOR UPDATE USING (auth.uid() = abogado_id);

DROP POLICY IF EXISTS creditos_leads_insert ON creditos_leads;
CREATE POLICY creditos_leads_insert ON creditos_leads
  FOR INSERT WITH CHECK (auth.uid() = abogado_id);

-- Transacciones
DROP POLICY IF EXISTS creditos_transacciones_select ON creditos_leads_transacciones;
CREATE POLICY creditos_transacciones_select ON creditos_leads_transacciones
  FOR SELECT USING (auth.uid() = abogado_id);

DROP POLICY IF EXISTS creditos_transacciones_insert ON creditos_leads_transacciones;
CREATE POLICY creditos_transacciones_insert ON creditos_leads_transacciones
  FOR INSERT WITH CHECK (auth.uid() = abogado_id);

-- Funcion para obtener o crear creditos de abogado
CREATE OR REPLACE FUNCTION obtener_creditos_leads(p_abogado_id UUID)
RETURNS TABLE (
  creditos_disponibles INTEGER,
  creditos_totales INTEGER,
  creditos_usados INTEGER,
  creditos_extra INTEGER,
  plan TEXT,
  saldo_recargable DECIMAL
) AS $$
DECLARE
  v_creditos creditos_leads%ROWTYPE;
BEGIN
  SELECT * INTO v_creditos FROM creditos_leads WHERE abogado_id = p_abogado_id;
  
  IF NOT FOUND THEN
    INSERT INTO creditos_leads (abogado_id, creditos_totales, creditos_usados, creditos_extra, plan)
    VALUES (p_abogado_id, 250, 0, 0, 'abogado')
    RETURNING * INTO v_creditos;
  END IF;
  
  RETURN QUERY SELECT 
    (v_creditos.creditos_totales - v_creditos.creditos_usados + v_creditos.creditos_extra)::INTEGER,
    v_creditos.creditos_totales,
    v_creditos.creditos_usados,
    v_creditos.creditos_extra,
    v_creditos.plan,
    v_creditos.saldo_recargable;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcion para tomar un caso (descontar creditos)
CREATE OR REPLACE FUNCTION tomar_caso_lead(
  p_abogado_id UUID,
  p_caso_id UUID,
  p_creditos_costo INTEGER DEFAULT 10
)
RETURNS JSON AS $$
DECLARE
  v_creditos creditos_leads%ROWTYPE;
  v_disponibles INTEGER;
  v_caso casos%ROWTYPE;
BEGIN
  -- Verificar que el caso existe y esta disponible
  SELECT * INTO v_caso FROM casos WHERE id = p_caso_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Caso no encontrado');
  END IF;
  
  IF v_caso.lawyer_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Este caso ya tiene abogado asignado');
  END IF;
  
  IF v_caso.disponible_para_leads = false THEN
    RETURN json_build_object('success', false, 'error', 'Este caso no esta disponible');
  END IF;
  
  -- Obtener creditos del abogado
  SELECT * INTO v_creditos FROM creditos_leads WHERE abogado_id = p_abogado_id FOR UPDATE;
  
  IF NOT FOUND THEN
    -- Crear registro si no existe
    INSERT INTO creditos_leads (abogado_id, creditos_totales, creditos_usados)
    VALUES (p_abogado_id, 250, 0)
    RETURNING * INTO v_creditos;
  END IF;
  
  v_disponibles := v_creditos.creditos_totales - v_creditos.creditos_usados + v_creditos.creditos_extra;
  
  IF v_disponibles < p_creditos_costo THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Creditos insuficientes', 
      'creditos_disponibles', v_disponibles,
      'creditos_requeridos', p_creditos_costo
    );
  END IF;
  
  -- Descontar creditos (primero extra, luego normales)
  IF v_creditos.creditos_extra >= p_creditos_costo THEN
    UPDATE creditos_leads 
    SET creditos_extra = creditos_extra - p_creditos_costo,
        updated_at = NOW()
    WHERE abogado_id = p_abogado_id;
  ELSE
    UPDATE creditos_leads 
    SET creditos_usados = creditos_usados + p_creditos_costo,
        updated_at = NOW()
    WHERE abogado_id = p_abogado_id;
  END IF;
  
  -- Registrar transaccion
  INSERT INTO creditos_leads_transacciones (abogado_id, tipo, creditos, caso_id, descripcion)
  VALUES (p_abogado_id, 'tomar_caso', -p_creditos_costo, p_caso_id, 'Tomar caso: ' || v_caso.folio);
  
  -- Asignar caso al abogado
  UPDATE casos 
  SET lawyer_id = p_abogado_id,
      status = 'assigned',
      disponible_para_leads = false,
      estado_lead = 'tomado',
      assigned_at = NOW(),
      updated_at = NOW()
  WHERE id = p_caso_id;
  
  RETURN json_build_object(
    'success', true,
    'caso_id', p_caso_id,
    'creditos_usados', p_creditos_costo,
    'creditos_restantes', v_disponibles - p_creditos_costo
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcion para obtener un lead disponible para el abogado (uno a la vez, de su estado)
CREATE OR REPLACE FUNCTION obtener_lead_disponible(p_abogado_id UUID, p_estado TEXT)
RETURNS TABLE (
  id UUID,
  folio TEXT,
  empresa_nombre TEXT,
  ciudad TEXT,
  estado TEXT,
  monto_estimado DECIMAL,
  antiguedad_anios DECIMAL,
  tipo_despido TEXT,
  created_at TIMESTAMPTZ,
  creditos_costo INTEGER,
  trabajador_nombre TEXT,
  trabajador_telefono TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.folio,
    c.employer_name AS empresa_nombre,
    c.city AS ciudad,
    c.state AS estado,
    c.total_settlement AS monto_estimado,
    EXTRACT(YEAR FROM AGE(c.end_date::DATE, c.start_date::DATE)) + 
    EXTRACT(MONTH FROM AGE(c.end_date::DATE, c.start_date::DATE)) / 12 AS antiguedad_anios,
    c.termination_type AS tipo_despido,
    c.created_at,
    COALESCE(c.creditos_cobrados, 10) AS creditos_costo,
    p.full_name AS trabajador_nombre,
    p.phone AS trabajador_telefono
  FROM casos c
  LEFT JOIN profiles p ON p.id = c.worker_id
  WHERE c.lawyer_id IS NULL
    AND c.disponible_para_leads = true
    AND c.state = p_estado
    AND c.estado_lead = 'disponible'
    AND c.status NOT IN ('closed', 'resolved')
  ORDER BY c.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Marcar caso como disponible para leads (desde calculos completados)
UPDATE casos 
SET disponible_para_leads = true, 
    estado_lead = 'disponible',
    creditos_cobrados = 10
WHERE lawyer_id IS NULL 
  AND status NOT IN ('closed', 'resolved');

-- Dar 250 creditos iniciales a abogados verificados existentes
INSERT INTO creditos_leads (abogado_id, creditos_totales, creditos_usados, plan)
SELECT id, 250, 0, 'abogado'
FROM profiles 
WHERE role IN ('lawyer', 'guestlawyer')
  AND id NOT IN (SELECT abogado_id FROM creditos_leads)
ON CONFLICT (abogado_id) DO NOTHING;
