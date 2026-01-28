-- =====================================================
-- CONFIGURACION COMPLETA DE PORTALES CCL
-- Todos los 32 estados + Federal
-- =====================================================

-- Tabla de portales CCL por estado
CREATE TABLE IF NOT EXISTS ccl_portales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estado VARCHAR(100) NOT NULL UNIQUE,
  estado_codigo VARCHAR(10) NOT NULL UNIQUE,
  nombre_oficial VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('estatal', 'federal')),
  url_portal VARCHAR(500),
  url_solicitud_linea VARCHAR(500),
  url_consulta_folio VARCHAR(500),
  telefono VARCHAR(50),
  email VARCHAR(255),
  direccion TEXT,
  horario_atencion VARCHAR(255),
  requisitos_digitales JSONB DEFAULT '[]',
  documentos_requeridos JSONB DEFAULT '[]',
  tiempo_respuesta_dias INTEGER DEFAULT 5,
  acepta_solicitud_electronica BOOLEAN DEFAULT false,
  requiere_cita_previa BOOLEAN DEFAULT true,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para tracking de solicitudes automaticas
CREATE TABLE IF NOT EXISTS ccl_solicitudes_automaticas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID REFERENCES casos(id),
  user_id UUID REFERENCES auth.users(id),
  abogado_id UUID REFERENCES auth.users(id),
  portal_id UUID REFERENCES ccl_portales(id),
  tipo_solicitud VARCHAR(50) NOT NULL CHECK (tipo_solicitud IN ('rescision', 'despido', 'salarios_caidos', 'reinstalacion', 'indemnizacion', 'otro')),
  estado_solicitud VARCHAR(50) DEFAULT 'pendiente' CHECK (estado_solicitud IN ('pendiente', 'en_proceso', 'enviada', 'confirmada', 'rechazada', 'completada', 'cancelada')),
  folio_ccl VARCHAR(100),
  fecha_audiencia DATE,
  datos_solicitud JSONB NOT NULL,
  datos_trabajador JSONB NOT NULL,
  datos_empleador JSONB NOT NULL,
  calculo_prescripcion JSONB,
  respuesta_portal JSONB,
  creditos_usados INTEGER DEFAULT 1,
  error_mensaje TEXT,
  intentos INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  enviada_at TIMESTAMPTZ,
  confirmada_at TIMESTAMPTZ
);

-- Funcion para calcular prescripcion
CREATE OR REPLACE FUNCTION calcular_prescripcion(
  fecha_despido DATE,
  tipo_terminacion VARCHAR(50)
) RETURNS JSONB AS $$
DECLARE
  dias_prescripcion INTEGER;
  fecha_limite DATE;
  dias_restantes INTEGER;
  esta_prescrito BOOLEAN;
BEGIN
  -- Segun LFT Art. 518: 2 meses para despido injustificado
  -- Art. 516: 1 año para acciones de trabajo
  IF tipo_terminacion IN ('despido', 'despido_injustificado') THEN
    dias_prescripcion := 60; -- 2 meses
  ELSIF tipo_terminacion = 'rescision' THEN
    dias_prescripcion := 30; -- 1 mes para rescision voluntaria
  ELSE
    dias_prescripcion := 365; -- 1 año para otras acciones
  END IF;
  
  fecha_limite := fecha_despido + dias_prescripcion;
  dias_restantes := fecha_limite - CURRENT_DATE;
  esta_prescrito := CURRENT_DATE > fecha_limite;
  
  RETURN jsonb_build_object(
    'fecha_despido', fecha_despido,
    'tipo_terminacion', tipo_terminacion,
    'dias_prescripcion', dias_prescripcion,
    'fecha_limite', fecha_limite,
    'dias_restantes', GREATEST(dias_restantes, 0),
    'esta_prescrito', esta_prescrito,
    'urgente', dias_restantes <= 15 AND NOT esta_prescrito,
    'mensaje', CASE 
      WHEN esta_prescrito THEN 'PRESCRITO - Ya no es posible iniciar solicitud de conciliacion'
      WHEN dias_restantes <= 7 THEN 'URGENTE - Quedan menos de 7 dias para prescribir'
      WHEN dias_restantes <= 15 THEN 'ATENCION - Quedan menos de 15 dias'
      WHEN dias_restantes <= 30 THEN 'Actuar pronto - Menos de 30 dias restantes'
      ELSE 'Tiempo disponible para presentar solicitud'
    END
  );
END;
$$ LANGUAGE plpgsql;

-- Limpiar datos anteriores para reinsertar completos
DELETE FROM ccl_portales;

-- =====================================================
-- INSERTAR TODOS LOS PORTALES CCL
-- 32 Estados + Federal
-- =====================================================

-- 1. AGUASCALIENTES
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Aguascalientes', 'AGS', 'Centro de Conciliacion Laboral del Estado de Aguascalientes', 'estatal', 
'https://conciliacionlaboral.aguascalientes.gob.mx', 'https://conciliacionlaboral.aguascalientes.gob.mx/solicitud', 
'449 910 2000', 'Av. Aguascalientes Sur 500, Centro, 20000 Aguascalientes, Ags.', true, true, 5);

-- 2. BAJA CALIFORNIA
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Baja California', 'BC', 'Centro de Conciliacion Laboral de Baja California', 'estatal',
'https://www.bajacalifornia.gob.mx/conciliacion', 'https://citas.bajacalifornia.gob.mx/conciliacion',
'686 558 1000', 'Calzada Independencia 994, Centro Civico, 21000 Mexicali, B.C.', true, true, 5);

-- 3. BAJA CALIFORNIA SUR
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Baja California Sur', 'BCS', 'Centro de Conciliacion Laboral de Baja California Sur', 'estatal',
'https://conciliacionlaboral.bcs.gob.mx', 'https://conciliacionlaboral.bcs.gob.mx/citas',
'612 123 6500', 'Isabel La Catolica e/ Allende, Centro, 23000 La Paz, B.C.S.', false, true, 7);

-- 4. CAMPECHE
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Campeche', 'CAM', 'Centro de Conciliacion Laboral del Estado de Campeche', 'estatal',
'https://conciliacion.campeche.gob.mx', 'https://conciliacion.campeche.gob.mx/solicitud',
'981 811 9200', 'Calle 8 No. 252, Centro, 24000 San Francisco de Campeche, Camp.', false, true, 7);

-- 5. CHIAPAS
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Chiapas', 'CHIS', 'Centro de Conciliacion Laboral del Estado de Chiapas', 'estatal',
'https://conciliacionlaboral.chiapas.gob.mx', 'https://conciliacionlaboral.chiapas.gob.mx/solicitud',
'961 617 0700', 'Blvd. Belisario Dominguez 950, 29000 Tuxtla Gutierrez, Chis.', true, true, 5);

-- 6. CHIHUAHUA
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Chihuahua', 'CHIH', 'Centro de Conciliacion Laboral del Estado de Chihuahua', 'estatal',
'https://conciliacion.chihuahua.gob.mx', 'https://conciliacion.chihuahua.gob.mx/citas',
'614 429 3300', 'Calle Victoria 800, Centro, 31000 Chihuahua, Chih.', true, true, 5);

-- 7. CIUDAD DE MEXICO
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias, notas) VALUES
('Ciudad de Mexico', 'CDMX', 'Centro de Conciliacion Laboral de la Ciudad de Mexico', 'estatal',
'https://www.centrodeconciliacion.cdmx.gob.mx', 'https://www.centrodeconciliacion.cdmx.gob.mx/solicitud',
'55 5134 0770', 'Dr. Lavista 144, Doctores, Cuauhtemoc, 06720 Ciudad de Mexico', true, true, 3,
'Portal mas avanzado con sistema electronico completo');

-- 8. COAHUILA
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Coahuila', 'COAH', 'Centro de Conciliacion Laboral del Estado de Coahuila', 'estatal',
'https://conciliacion.coahuila.gob.mx', 'https://conciliacion.coahuila.gob.mx/solicitud',
'844 411 8900', 'Blvd. Venustiano Carranza 1555, Republica, 25280 Saltillo, Coah.', true, true, 5);

-- 9. COLIMA
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Colima', 'COL', 'Centro de Conciliacion Laboral del Estado de Colima', 'estatal',
'https://conciliacionlaboral.col.gob.mx', 'https://conciliacionlaboral.col.gob.mx/citas',
'312 316 2000', 'Av. Rey Coliman 235, Centro, 28000 Colima, Col.', false, true, 7);

-- 10. DURANGO
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Durango', 'DGO', 'Centro de Conciliacion Laboral del Estado de Durango', 'estatal',
'https://conciliacion.durango.gob.mx', 'https://conciliacion.durango.gob.mx/solicitud',
'618 137 5200', '5 de Febrero esq. Bruno Martinez, Centro, 34000 Durango, Dgo.', false, true, 7);

-- 11. GUANAJUATO
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Guanajuato', 'GTO', 'Centro de Conciliacion Laboral del Estado de Guanajuato', 'estatal',
'https://conciliacion.guanajuato.gob.mx', 'https://conciliacion.guanajuato.gob.mx/solicitud-en-linea',
'473 735 1500', 'Plaza de la Paz 77, Centro, 36000 Guanajuato, Gto.', true, true, 5);

-- 12. GUERRERO
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Guerrero', 'GRO', 'Centro de Conciliacion Laboral del Estado de Guerrero', 'estatal',
'https://conciliacionlaboral.guerrero.gob.mx', 'https://conciliacionlaboral.guerrero.gob.mx/citas',
'747 471 9800', 'Av. Juarez 63, Centro, 39000 Chilpancingo, Gro.', false, true, 7);

-- 13. HIDALGO
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Hidalgo', 'HGO', 'Centro de Conciliacion Laboral del Estado de Hidalgo', 'estatal',
'https://conciliacion.hidalgo.gob.mx', 'https://conciliacion.hidalgo.gob.mx/solicitud',
'771 717 2000', 'Plaza Juarez s/n, Centro, 42000 Pachuca, Hgo.', true, true, 5);

-- 14. JALISCO
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias, notas) VALUES
('Jalisco', 'JAL', 'Centro de Conciliacion Laboral del Estado de Jalisco', 'estatal',
'https://conciliacion.jalisco.gob.mx', 'https://conciliacion.jalisco.gob.mx/tramites/solicitud',
'33 3030 1000', 'Av. Fray Antonio Alcalde 1351, Centro, 44100 Guadalajara, Jal.', true, true, 3,
'Segundo portal mas avanzado, alta demanda');

-- 15. ESTADO DE MEXICO
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias, notas) VALUES
('Estado de Mexico', 'EDOMEX', 'Centro de Conciliacion Laboral del Estado de Mexico', 'estatal',
'https://conciliacion.edomex.gob.mx', 'https://conciliacion.edomex.gob.mx/solicitud-linea',
'722 226 1900', 'Av. Jose Maria Morelos 1300, Centro, 50000 Toluca, Edo. Mex.', true, true, 5,
'Multiples sedes por zona metropolitana');

-- 16. MICHOACAN
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Michoacan', 'MICH', 'Centro de Conciliacion Laboral del Estado de Michoacan', 'estatal',
'https://conciliacion.michoacan.gob.mx', 'https://conciliacion.michoacan.gob.mx/solicitud',
'443 322 8800', 'Av. Madero Poniente 63, Centro, 58000 Morelia, Mich.', true, true, 5);

-- 17. MORELOS
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Morelos', 'MOR', 'Centro de Conciliacion Laboral del Estado de Morelos', 'estatal',
'https://conciliacionlaboral.morelos.gob.mx', 'https://conciliacionlaboral.morelos.gob.mx/citas',
'777 329 2200', 'Pericón 14, Centro, 62000 Cuernavaca, Mor.', true, true, 5);

-- 18. NAYARIT
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Nayarit', 'NAY', 'Centro de Conciliacion Laboral del Estado de Nayarit', 'estatal',
'https://conciliacion.nayarit.gob.mx', 'https://conciliacion.nayarit.gob.mx/solicitud',
'311 215 2000', 'Av. Mexico Norte 55, Centro, 63000 Tepic, Nay.', false, true, 7);

-- 19. NUEVO LEON
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias, notas) VALUES
('Nuevo Leon', 'NL', 'Centro de Conciliacion Laboral del Estado de Nuevo Leon', 'estatal',
'https://conciliacion.nl.gob.mx', 'https://conciliacion.nl.gob.mx/solicitud-electronica',
'81 2020 9700', 'Washington 2000 Ote., Centro, 64000 Monterrey, N.L.', true, true, 3,
'Portal electronico avanzado, zona industrial importante');

-- 20. OAXACA
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Oaxaca', 'OAX', 'Centro de Conciliacion Laboral del Estado de Oaxaca', 'estatal',
'https://conciliacionlaboral.oaxaca.gob.mx', 'https://conciliacionlaboral.oaxaca.gob.mx/solicitud',
'951 501 5000', 'Bustamante 500, Centro, 68000 Oaxaca, Oax.', false, true, 7);

-- 21. PUEBLA
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Puebla', 'PUE', 'Centro de Conciliacion Laboral del Estado de Puebla', 'estatal',
'https://conciliacion.puebla.gob.mx', 'https://conciliacion.puebla.gob.mx/citas',
'222 309 5000', 'Av. Reforma 711, Centro, 72000 Puebla, Pue.', true, true, 5);

-- 22. QUERETARO
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Queretaro', 'QRO', 'Centro de Conciliacion Laboral del Estado de Queretaro', 'estatal',
'https://conciliacionlaboral.queretaro.gob.mx', 'https://conciliacionlaboral.queretaro.gob.mx/solicitud',
'442 238 5000', 'Av. Luis Pasteur Sur 8, Centro, 76000 Queretaro, Qro.', true, true, 5);

-- 23. QUINTANA ROO
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Quintana Roo', 'QROO', 'Centro de Conciliacion Laboral del Estado de Quintana Roo', 'estatal',
'https://conciliacion.qroo.gob.mx', 'https://conciliacion.qroo.gob.mx/solicitud',
'983 835 0500', 'Av. Heroes 79, Centro, 77000 Chetumal, Q.R.', true, true, 5);

-- 24. SAN LUIS POTOSI
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('San Luis Potosi', 'SLP', 'Centro de Conciliacion Laboral del Estado de San Luis Potosi', 'estatal',
'https://conciliacionlaboral.slp.gob.mx', 'https://conciliacionlaboral.slp.gob.mx/citas',
'444 814 4100', 'Av. Venustiano Carranza 830, Centro, 78000 San Luis Potosi, S.L.P.', true, true, 5);

-- 25. SINALOA
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Sinaloa', 'SIN', 'Centro de Conciliacion Laboral del Estado de Sinaloa', 'estatal',
'https://conciliacion.sinaloa.gob.mx', 'https://conciliacion.sinaloa.gob.mx/solicitud',
'667 758 7000', 'Av. Insurgentes s/n, Centro, 80000 Culiacan, Sin.', true, true, 5);

-- 26. SONORA
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Sonora', 'SON', 'Centro de Conciliacion Laboral del Estado de Sonora', 'estatal',
'https://conciliacionlaboral.sonora.gob.mx', 'https://conciliacionlaboral.sonora.gob.mx/citas',
'662 217 0000', 'Comonfort y Dr. Paliza, Centro, 83000 Hermosillo, Son.', true, true, 5);

-- 27. TABASCO
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Tabasco', 'TAB', 'Centro de Conciliacion Laboral del Estado de Tabasco', 'estatal',
'https://conciliacion.tabasco.gob.mx', 'https://conciliacion.tabasco.gob.mx/solicitud',
'993 310 3100', 'Av. Paseo Tabasco 1504, Tabasco 2000, 86035 Villahermosa, Tab.', true, true, 5);

-- 28. TAMAULIPAS
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Tamaulipas', 'TAMPS', 'Centro de Conciliacion Laboral del Estado de Tamaulipas', 'estatal',
'https://conciliacionlaboral.tamaulipas.gob.mx', 'https://conciliacionlaboral.tamaulipas.gob.mx/solicitud',
'834 318 8000', 'Calle 15 y 16 Juarez, Centro, 87000 Ciudad Victoria, Tamps.', true, true, 5);

-- 29. TLAXCALA
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Tlaxcala', 'TLAX', 'Centro de Conciliacion Laboral del Estado de Tlaxcala', 'estatal',
'https://conciliacion.tlaxcala.gob.mx', 'https://conciliacion.tlaxcala.gob.mx/citas',
'246 462 1700', 'Av. Juarez 62, Centro, 90000 Tlaxcala, Tlax.', false, true, 7);

-- 30. VERACRUZ
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Veracruz', 'VER', 'Centro de Conciliacion Laboral del Estado de Veracruz', 'estatal',
'https://conciliacionlaboral.veracruz.gob.mx', 'https://conciliacionlaboral.veracruz.gob.mx/solicitud',
'228 842 1700', 'Av. Xalapa 301, Centro, 91000 Xalapa, Ver.', true, true, 5);

-- 31. YUCATAN
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Yucatan', 'YUC', 'Centro de Conciliacion Laboral del Estado de Yucatan', 'estatal',
'https://conciliacion.yucatan.gob.mx', 'https://conciliacion.yucatan.gob.mx/solicitud-en-linea',
'999 930 3000', 'Calle 61 No. 492, Centro, 97000 Merida, Yuc.', true, true, 5);

-- 32. ZACATECAS
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias) VALUES
('Zacatecas', 'ZAC', 'Centro de Conciliacion Laboral del Estado de Zacatecas', 'estatal',
'https://conciliacionlaboral.zacatecas.gob.mx', 'https://conciliacionlaboral.zacatecas.gob.mx/citas',
'492 922 3600', 'Blvd. Heroes de Chapultepec 1902, Centro, 98000 Zacatecas, Zac.', false, true, 7);

-- =====================================================
-- CENTRO FEDERAL DE CONCILIACION Y REGISTRO LABORAL
-- =====================================================
INSERT INTO ccl_portales (estado, estado_codigo, nombre_oficial, tipo, url_portal, url_solicitud_linea, telefono, email, direccion, acepta_solicitud_electronica, requiere_cita_previa, tiempo_respuesta_dias, notas) VALUES
('Federal', 'FED', 'Centro Federal de Conciliacion y Registro Laboral (CFCRL)', 'federal',
'https://www.gob.mx/cfcrl', 'https://www.gob.mx/cfcrl/articulos/solicitud-de-conciliacion',
'55 5000 2700', 'contacto@cfcrl.gob.mx',
'Av. Insurgentes Sur 1940, Florida, Alvaro Obregon, 01030 Ciudad de Mexico',
true, true, 5,
'Competencia federal: trabajadores de empresas federales, industrias extractivas, ferrocarriles, autotransporte federal, comunicaciones, empresas de jurisdiccion federal');

-- =====================================================
-- INDICES PARA BUSQUEDA RAPIDA
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_ccl_portales_estado ON ccl_portales(estado);
CREATE INDEX IF NOT EXISTS idx_ccl_portales_estado_codigo ON ccl_portales(estado_codigo);
CREATE INDEX IF NOT EXISTS idx_ccl_portales_tipo ON ccl_portales(tipo);
CREATE INDEX IF NOT EXISTS idx_ccl_portales_activo ON ccl_portales(activo);

CREATE INDEX IF NOT EXISTS idx_ccl_solicitudes_caso ON ccl_solicitudes_automaticas(caso_id);
CREATE INDEX IF NOT EXISTS idx_ccl_solicitudes_user ON ccl_solicitudes_automaticas(user_id);
CREATE INDEX IF NOT EXISTS idx_ccl_solicitudes_abogado ON ccl_solicitudes_automaticas(abogado_id);
CREATE INDEX IF NOT EXISTS idx_ccl_solicitudes_estado ON ccl_solicitudes_automaticas(estado_solicitud);
CREATE INDEX IF NOT EXISTS idx_ccl_solicitudes_folio ON ccl_solicitudes_automaticas(folio_ccl);

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE ccl_portales ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccl_solicitudes_automaticas ENABLE ROW LEVEL SECURITY;

-- Portales: lectura publica
DROP POLICY IF EXISTS "Portales CCL lectura publica" ON ccl_portales;
CREATE POLICY "Portales CCL lectura publica" ON ccl_portales
  FOR SELECT USING (activo = true);

-- Solicitudes: solo el usuario, abogado asignado o admin
DROP POLICY IF EXISTS "Solicitudes CCL acceso usuario" ON ccl_solicitudes_automaticas;
CREATE POLICY "Solicitudes CCL acceso usuario" ON ccl_solicitudes_automaticas
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.uid() = abogado_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- =====================================================
-- FUNCION PARA OBTENER PORTAL POR UBICACION
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_portal_ccl(
  p_estado VARCHAR,
  p_es_empresa_federal BOOLEAN DEFAULT false
) RETURNS TABLE (
  portal_id UUID,
  nombre_oficial VARCHAR,
  tipo VARCHAR,
  url_portal VARCHAR,
  url_solicitud VARCHAR,
  telefono VARCHAR,
  direccion TEXT,
  acepta_electronica BOOLEAN,
  requiere_cita BOOLEAN,
  tiempo_respuesta INTEGER
) AS $$
BEGIN
  IF p_es_empresa_federal THEN
    RETURN QUERY
    SELECT p.id, p.nombre_oficial, p.tipo, p.url_portal, p.url_solicitud_linea, 
           p.telefono, p.direccion, p.acepta_solicitud_electronica, 
           p.requiere_cita_previa, p.tiempo_respuesta_dias
    FROM ccl_portales p
    WHERE p.tipo = 'federal' AND p.activo = true
    LIMIT 1;
  ELSE
    RETURN QUERY
    SELECT p.id, p.nombre_oficial, p.tipo, p.url_portal, p.url_solicitud_linea, 
           p.telefono, p.direccion, p.acepta_solicitud_electronica, 
           p.requiere_cita_previa, p.tiempo_respuesta_dias
    FROM ccl_portales p
    WHERE (p.estado ILIKE p_estado OR p.estado_codigo ILIKE p_estado)
      AND p.tipo = 'estatal' AND p.activo = true
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql;
