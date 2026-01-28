-- Funciones SQL para el sistema AutoCCL

-- Funcion para descontar credito de forma atomica
CREATE OR REPLACE FUNCTION descontar_credito_ccl(p_abogado_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_credito RECORD;
  v_disponibles INT;
BEGIN
  -- Obtener creditos con lock
  SELECT * INTO v_credito
  FROM creditos_ccl
  WHERE abogado_id = p_abogado_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Calcular disponibles
  v_disponibles := v_credito.creditos_mensuales - v_credito.creditos_usados + v_credito.creditos_extra;
  
  IF v_disponibles <= 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Descontar (primero extra, luego mensuales)
  IF v_credito.creditos_extra > 0 THEN
    UPDATE creditos_ccl
    SET creditos_extra = creditos_extra - 1,
        updated_at = NOW()
    WHERE id = v_credito.id;
  ELSE
    UPDATE creditos_ccl
    SET creditos_usados = creditos_usados + 1,
        updated_at = NOW()
    WHERE id = v_credito.id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Funcion para incrementar uso de proxy
CREATE OR REPLACE FUNCTION incrementar_uso_proxy(p_proxy_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE proxy_config
  SET usos_hoy = usos_hoy + 1,
      ultimo_uso = NOW()
  WHERE id = p_proxy_id;
END;
$$ LANGUAGE plpgsql;

-- Funcion para resetear contadores de proxy (llamar diariamente)
CREATE OR REPLACE FUNCTION resetear_usos_proxy()
RETURNS VOID AS $$
BEGIN
  UPDATE proxy_config
  SET usos_hoy = 0;
END;
$$ LANGUAGE plpgsql;

-- Funcion para renovar creditos mensuales (llamar el dia 1 de cada mes)
CREATE OR REPLACE FUNCTION renovar_creditos_mensuales()
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
BEGIN
  UPDATE creditos_ccl
  SET creditos_usados = 0,
      fecha_renovacion = (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE,
      updated_at = NOW()
  WHERE plan != 'basico'
    AND fecha_renovacion <= CURRENT_DATE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Funcion para obtener siguiente dia habil
CREATE OR REPLACE FUNCTION siguiente_dia_habil(p_fecha DATE DEFAULT CURRENT_DATE, p_dias INT DEFAULT 1)
RETURNS DATE AS $$
DECLARE
  v_fecha DATE := p_fecha;
  v_dias_contados INT := 0;
BEGIN
  WHILE v_dias_contados < p_dias LOOP
    v_fecha := v_fecha + 1;
    
    -- Si no es fin de semana y no es dia inhabil
    IF EXTRACT(DOW FROM v_fecha) NOT IN (0, 6) THEN
      IF NOT EXISTS (
        SELECT 1 FROM dias_inhabiles 
        WHERE fecha = v_fecha
      ) THEN
        v_dias_contados := v_dias_contados + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN v_fecha;
END;
$$ LANGUAGE plpgsql;

-- Indices adicionales para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_solicitudes_ccl_abogado ON solicitudes_ccl(abogado_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_ccl_caso ON solicitudes_ccl(caso_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_ccl_status ON solicitudes_ccl(status);
CREATE INDEX IF NOT EXISTS idx_creditos_ccl_abogado ON creditos_ccl(abogado_id);
