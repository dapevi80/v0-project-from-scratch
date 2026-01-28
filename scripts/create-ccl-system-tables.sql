-- =============================================
-- SISTEMA AUTOCCL - Tablas para llenado automatico de solicitudes CCL
-- =============================================

-- Eliminar tablas existentes para recrearlas correctamente
DROP TABLE IF EXISTS solicitudes_ccl CASCADE;
DROP TABLE IF EXISTS creditos_ccl CASCADE;
DROP TABLE IF EXISTS centros_conciliacion CASCADE;
DROP TABLE IF EXISTS industrias_federales CASCADE;
DROP TABLE IF EXISTS dias_inhabiles CASCADE;

-- Tabla de Centros de Conciliacion Laboral (32 estados + federal)
CREATE TABLE centros_conciliacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estado TEXT NOT NULL,
  clave_estado TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('local', 'federal')),
  nombre TEXT NOT NULL,
  direccion TEXT NOT NULL,
  municipio TEXT,
  codigo_postal TEXT,
  coordenadas JSONB,
  telefono TEXT,
  email TEXT,
  horario TEXT,
  portal_url TEXT,
  sistema TEXT DEFAULT 'SINACOL',
  documentos_requeridos TEXT[] DEFAULT ARRAY['INE', 'CURP', 'Comprobante domicilio'],
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_centros_estado ON centros_conciliacion(clave_estado);
CREATE INDEX idx_centros_tipo ON centros_conciliacion(tipo);

-- Tabla de industrias federales (25 ramas de competencia federal)
CREATE TABLE industrias_federales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  ejemplos TEXT[],
  activo BOOLEAN DEFAULT true
);

-- Insertar las 25 industrias de competencia federal
INSERT INTO industrias_federales (clave, nombre, descripcion, ejemplos) VALUES
  ('aceites_grasas', 'Aceites y grasas vegetales', 'Industria de produccion de aceites y grasas de origen vegetal', ARRAY['Aceite de cocina', 'Margarina', 'Manteca vegetal']),
  ('automotriz', 'Automotriz', 'Ensamble y fabricacion de automoviles y autopartes', ARRAY['Armadoras', 'Autopartes', 'Ensamble de vehiculos']),
  ('azucarera', 'Azucarera', 'Produccion de azucar de cana', ARRAY['Ingenios azucareros', 'Refinadoras de azucar']),
  ('calera', 'Calera', 'Produccion de cal y derivados', ARRAY['Fabricas de cal', 'Procesadoras de caliza']),
  ('celulosa_papel', 'Celulosa y papel', 'Fabricacion de celulosa y papel', ARRAY['Papeleras', 'Fabricas de carton', 'Productoras de celulosa']),
  ('cementera', 'Cementera', 'Fabricacion de cemento', ARRAY['CEMEX', 'Holcim', 'Cementos Cruz Azul']),
  ('cinematografica', 'Cinematografica', 'Produccion y exhibicion de peliculas', ARRAY['Estudios de cine', 'Cinemas', 'Productoras de peliculas']),
  ('bebidas', 'Elaboracion de bebidas envasadas', 'Produccion de bebidas carbonatadas y envasadas', ARRAY['Coca-Cola', 'Pepsi', 'Cerveza', 'Refresqueras']),
  ('electrica', 'Electrica', 'Generacion, transmision y distribucion de energia electrica', ARRAY['CFE', 'Empresas de energia', 'Plantas electricas']),
  ('gobierno_federal', 'Administracion Publica Federal', 'Dependencias y entidades del gobierno federal', ARRAY['Secretarias', 'Dependencias federales', 'Organismos descentralizados']),
  ('concesion_federal', 'Empresas con contrato o concesion federal', 'Empresas que operan bajo concesion del gobierno federal', ARRAY['Concesionarias de carreteras', 'Aeropuertos', 'Puertos']),
  ('zonas_federales', 'Zonas federales', 'Empresas ubicadas en zonas de jurisdiccion federal', ARRAY['Zonas portuarias', 'Aeropuertos', 'Fronteras']),
  ('ferrocarrilera', 'Ferrocarrilera', 'Transporte ferroviario de carga y pasajeros', ARRAY['Ferromex', 'Kansas City Southern', 'Ferrocarriles']),
  ('hidrocarburos', 'Hidrocarburos', 'Extraccion, refinacion y distribucion de petroleo y gas', ARRAY['PEMEX', 'Gasolineras', 'Refineria', 'Petroquimica basica']),
  ('hulera', 'Hulera', 'Fabricacion de productos de hule', ARRAY['Llantas', 'Productos de caucho', 'Fabricas de hule']),
  ('maderera', 'Maderera', 'Explotacion forestal y procesamiento de madera en zonas federales', ARRAY['Aserraderos en bosques federales', 'Explotacion forestal']),
  ('metalurgica', 'Metalurgica y siderurgica', 'Fundicion y procesamiento de metales', ARRAY['Acereras', 'Fundidoras', 'AHMSA', 'Altos Hornos']),
  ('minera', 'Minera', 'Extraccion de minerales', ARRAY['Minas', 'Grupo Mexico', 'Penoles', 'Fresnillo']),
  ('petroquimica', 'Petroquimica', 'Procesamiento de derivados del petroleo', ARRAY['Plantas petroquimicas', 'Derivados del petroleo']),
  ('alimentos', 'Elaboracion de productos alimenticios', 'Empacado y procesamiento de alimentos cadenas nacionales', ARRAY['Bimbo', 'Lala', 'Sigma Alimentos', 'Empacadoras']),
  ('quimica_farmaceutica', 'Quimica y farmaceutica', 'Fabricacion de productos quimicos y medicamentos', ARRAY['Farmaceuticas', 'Laboratorios', 'Quimicas industriales']),
  ('banca_credito', 'Banca y credito', 'Instituciones financieras y de credito', ARRAY['Bancos', 'SOFOMES', 'Casas de bolsa', 'Aseguradoras']),
  ('tabacalera', 'Tabacalera', 'Produccion de productos de tabaco', ARRAY['Cigarreras', 'British American Tobacco', 'Philip Morris']),
  ('textil', 'Textil', 'Fabricacion de textiles e hilados', ARRAY['Fabricas textiles', 'Hilados', 'Tejidos']),
  ('vidriera', 'Vidriera', 'Fabricacion de vidrio y cristal', ARRAY['Vitro', 'Fabricas de vidrio', 'Cristalerias']);

-- Sistema de creditos para llenado automatico
CREATE TABLE creditos_ccl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  despacho_id UUID,
  abogado_id UUID,
  plan TEXT DEFAULT 'basico' CHECK (plan IN ('basico', 'pro', 'business', 'enterprise')),
  creditos_mensuales INT DEFAULT 0,
  creditos_usados INT DEFAULT 0,
  creditos_extra INT DEFAULT 0,
  fecha_renovacion DATE,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historial de solicitudes CCL generadas
CREATE TABLE solicitudes_ccl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID,
  abogado_id UUID,
  trabajador_id UUID,
  tipo TEXT NOT NULL CHECK (tipo IN ('automatico', 'manual')),
  credito_usado BOOLEAN DEFAULT false,
  competencia TEXT NOT NULL CHECK (competencia IN ('local', 'federal')),
  industria_federal TEXT,
  estado_ccl TEXT NOT NULL,
  municipio_ccl TEXT,
  centro_conciliacion_id UUID REFERENCES centros_conciliacion(id),
  direccion_centro_trabajo TEXT NOT NULL,
  coordenadas_trabajo JSONB,
  referencias_ubicacion TEXT,
  objeto_solicitud TEXT NOT NULL CHECK (objeto_solicitud IN ('despido', 'rescision', 'pago_prestaciones', 'terminacion_voluntaria', 'otro')),
  fecha_conflicto DATE NOT NULL,
  folio_ccl TEXT,
  pdf_guia_url TEXT,
  pdf_oficial_url TEXT,
  cita_ratificacion TIMESTAMPTZ,
  cita_confirmada BOOLEAN DEFAULT false,
  proxy_ip_usado TEXT,
  proxy_region TEXT,
  status TEXT DEFAULT 'borrador' CHECK (status IN ('borrador', 'generando', 'completado', 'error', 'cancelado')),
  error_mensaje TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dias inhabiles (para calcular siguiente dia habil)
CREATE TABLE dias_inhabiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  descripcion TEXT,
  aplica_federal BOOLEAN DEFAULT true,
  aplica_local BOOLEAN DEFAULT true,
  estado TEXT,
  anio INT GENERATED ALWAYS AS (EXTRACT(YEAR FROM fecha)) STORED
);

CREATE INDEX idx_dias_inhabiles_fecha ON dias_inhabiles(fecha);
CREATE INDEX idx_dias_inhabiles_anio ON dias_inhabiles(anio);

-- Insertar dias inhabiles 2026
INSERT INTO dias_inhabiles (fecha, descripcion) VALUES
  ('2026-01-01', 'Ano Nuevo'),
  ('2026-02-02', 'Dia de la Constitucion'),
  ('2026-03-16', 'Natalicio de Benito Juarez'),
  ('2026-04-02', 'Jueves Santo'),
  ('2026-04-03', 'Viernes Santo'),
  ('2026-05-01', 'Dia del Trabajo'),
  ('2026-09-16', 'Dia de la Independencia'),
  ('2026-11-16', 'Dia de la Revolucion'),
  ('2026-12-25', 'Navidad');

-- Tabla de configuracion de proxies/VPN por region
CREATE TABLE proxy_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  estado TEXT,
  provider TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  credenciales_encrypted TEXT,
  activo BOOLEAN DEFAULT true,
  ultimo_uso TIMESTAMPTZ,
  usos_hoy INT DEFAULT 0,
  max_usos_dia INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proxy_region ON proxy_config(region);
CREATE INDEX idx_proxy_activo ON proxy_config(activo);

-- Insertar configuracion inicial de proxies por region
INSERT INTO proxy_config (region, estado, provider, endpoint, max_usos_dia) VALUES
  ('noroeste', 'Baja California', 'rotating_proxy', 'pending_config', 50),
  ('noroeste', 'Baja California Sur', 'rotating_proxy', 'pending_config', 50),
  ('noroeste', 'Sonora', 'rotating_proxy', 'pending_config', 50),
  ('noroeste', 'Sinaloa', 'rotating_proxy', 'pending_config', 50),
  ('norte', 'Chihuahua', 'rotating_proxy', 'pending_config', 50),
  ('norte', 'Coahuila', 'rotating_proxy', 'pending_config', 50),
  ('norte', 'Durango', 'rotating_proxy', 'pending_config', 50),
  ('noreste', 'Nuevo Leon', 'rotating_proxy', 'pending_config', 50),
  ('noreste', 'Tamaulipas', 'rotating_proxy', 'pending_config', 50),
  ('occidente', 'Jalisco', 'rotating_proxy', 'pending_config', 50),
  ('occidente', 'Nayarit', 'rotating_proxy', 'pending_config', 50),
  ('occidente', 'Colima', 'rotating_proxy', 'pending_config', 50),
  ('occidente', 'Michoacan', 'rotating_proxy', 'pending_config', 50),
  ('centro_norte', 'Aguascalientes', 'rotating_proxy', 'pending_config', 50),
  ('centro_norte', 'San Luis Potosi', 'rotating_proxy', 'pending_config', 50),
  ('centro_norte', 'Zacatecas', 'rotating_proxy', 'pending_config', 50),
  ('centro', 'Ciudad de Mexico', 'rotating_proxy', 'pending_config', 100),
  ('centro', 'Estado de Mexico', 'rotating_proxy', 'pending_config', 100),
  ('centro', 'Morelos', 'rotating_proxy', 'pending_config', 50),
  ('centro', 'Puebla', 'rotating_proxy', 'pending_config', 50),
  ('centro', 'Tlaxcala', 'rotating_proxy', 'pending_config', 50),
  ('centro', 'Hidalgo', 'rotating_proxy', 'pending_config', 50),
  ('centro', 'Queretaro', 'rotating_proxy', 'pending_config', 50),
  ('centro', 'Guanajuato', 'rotating_proxy', 'pending_config', 50),
  ('golfo', 'Veracruz', 'rotating_proxy', 'pending_config', 50),
  ('golfo', 'Tabasco', 'rotating_proxy', 'pending_config', 50),
  ('sur', 'Guerrero', 'rotating_proxy', 'pending_config', 50),
  ('sur', 'Oaxaca', 'rotating_proxy', 'pending_config', 50),
  ('sur', 'Chiapas', 'rotating_proxy', 'pending_config', 50),
  ('sureste', 'Campeche', 'rotating_proxy', 'pending_config', 50),
  ('sureste', 'Yucatan', 'rotating_proxy', 'pending_config', 50),
  ('sureste', 'Quintana Roo', 'rotating_proxy', 'pending_config', 50);

-- Insertar datos de los 32 CCL estatales + federal
INSERT INTO centros_conciliacion (estado, clave_estado, tipo, nombre, direccion, municipio, codigo_postal, telefono, portal_url, sistema, horario) VALUES
  -- Centro Federal
  ('Federal', 'FED', 'federal', 'Centro Federal de Conciliacion y Registro Laboral', 'Av. Cuauhtemoc 80, Col. Doctores', 'Ciudad de Mexico', '06720', '800 911 7877', 'https://www.gob.mx/cfcrl', 'propio', 'Lunes a Viernes 9:00-15:00'),
  
  -- Estados
  ('Aguascalientes', 'AGS', 'local', 'Centro de Conciliacion Laboral de Aguascalientes', 'Av. Aguascalientes Norte 1603', 'Aguascalientes', '20270', '449 978 3600', 'https://ccl.aguascalientes.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Baja California', 'BC', 'local', 'Centro de Conciliacion Laboral de Baja California', 'Blvd. Benito Juarez 1750', 'Tijuana', '22420', '664 624 2000', 'https://ccl.bajacalifornia.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Baja California Sur', 'BCS', 'local', 'Centro de Conciliacion Laboral de BCS', 'Isabel la Catolica esq. Allende', 'La Paz', '23000', '612 123 4567', 'https://ccl.bcs.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Campeche', 'CAM', 'local', 'Centro de Conciliacion Laboral de Campeche', 'Av. 16 de Septiembre s/n', 'Campeche', '24000', '981 811 9200', 'https://ccl.campeche.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Chiapas', 'CHIS', 'local', 'Centro de Conciliacion Laboral de Chiapas', 'Boulevard Belisario Dominguez 950', 'Tuxtla Gutierrez', '29000', '961 617 0700', 'https://ccl.chiapas.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Chihuahua', 'CHIH', 'local', 'Centro de Conciliacion Laboral de Chihuahua', 'Av. Venustiano Carranza 601', 'Chihuahua', '31000', '614 429 3300', 'https://ccl.chihuahua.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Ciudad de Mexico', 'CDMX', 'local', 'Centro de Conciliacion Laboral de CDMX', 'Dr. Lavista 144, Col. Doctores', 'Cuauhtemoc', '06720', '55 5134 0770', 'https://conciliacion.cdmx.gob.mx', 'propio', 'Lunes a Viernes 9:00-15:00'),
  ('Coahuila', 'COAH', 'local', 'Centro de Conciliacion Laboral de Coahuila', 'Blvd. Venustiano Carranza 4880', 'Saltillo', '25000', '844 411 8900', 'https://ccl.coahuila.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Colima', 'COL', 'local', 'Centro de Conciliacion Laboral de Colima', 'Av. Rey Coliman 235', 'Colima', '28000', '312 316 2000', 'https://ccl.colima.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Durango', 'DGO', 'local', 'Centro de Conciliacion Laboral de Durango', '5 de Febrero esq. Bruno Martinez', 'Durango', '34000', '618 811 8900', 'https://ccl.durango.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Estado de Mexico', 'MEX', 'local', 'Centro de Conciliacion Laboral del Estado de Mexico', 'Paseo Tollocan 700', 'Toluca', '50120', '722 226 1900', 'https://cclaboral.edomex.gob.mx', 'propio', 'Lunes a Viernes 9:00-17:00'),
  ('Guanajuato', 'GTO', 'local', 'Centro de Conciliacion Laboral de Guanajuato', 'Paseo de la Presa 97', 'Guanajuato', '36000', '473 735 1500', 'https://ccl.guanajuato.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Guerrero', 'GRO', 'local', 'Centro de Conciliacion Laboral de Guerrero', 'Av. Ruffo Figueroa 6', 'Chilpancingo', '39000', '747 471 9700', 'https://ccl.guerrero.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Hidalgo', 'HGO', 'local', 'Centro de Conciliacion Laboral de Hidalgo', 'Blvd. Felipe Angeles s/n', 'Pachuca', '42080', '771 717 8700', 'https://ccl.hidalgo.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Jalisco', 'JAL', 'local', 'Centro de Conciliacion Laboral de Jalisco', 'Av. Fray Antonio Alcalde 1855', 'Guadalajara', '44280', '33 3030 8200', 'https://citasccljalisco.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Michoacan', 'MICH', 'local', 'Centro de Conciliacion Laboral de Michoacan', 'Av. Acueducto 1910', 'Morelia', '58290', '443 322 4500', 'https://cclmichoacan.gob.mx', 'SICONCILIO', 'Lunes a Viernes 8:00-15:00'),
  ('Morelos', 'MOR', 'local', 'Centro de Conciliacion Laboral de Morelos', 'Av. Domingo Diez 1589', 'Cuernavaca', '62250', '777 329 5500', 'https://ccl.morelos.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Nayarit', 'NAY', 'local', 'Centro de Conciliacion Laboral de Nayarit', 'Av. Mexico Norte 37', 'Tepic', '63000', '311 215 7200', 'https://ccl.nayarit.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Nuevo Leon', 'NL', 'local', 'Centro de Conciliacion Laboral de Nuevo Leon', 'Washington 648 Ote, Centro', 'Monterrey', '64000', '81 2020 9700', 'https://sinacol.nl.gob.mx', 'SINACOL', 'Lunes a Viernes 8:30-14:30'),
  ('Oaxaca', 'OAX', 'local', 'Centro de Conciliacion Laboral de Oaxaca', 'Av. Gerardo Pandal Graff 1', 'Oaxaca', '68050', '951 501 5000', 'https://ccl.oaxaca.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Puebla', 'PUE', 'local', 'Centro de Conciliacion Laboral de Puebla', '11 Norte 1203, Centro', 'Puebla', '72000', '222 309 4600', 'https://ccl.puebla.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Queretaro', 'QRO', 'local', 'Centro de Conciliacion Laboral de Queretaro', 'Av. 5 de Febrero 35', 'Queretaro', '76000', '442 238 5000', 'https://ccl.queretaro.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Quintana Roo', 'QROO', 'local', 'Centro de Conciliacion Laboral de Quintana Roo', 'Av. Insurgentes 991, SM 63', 'Cancun', '77500', '998 881 1800', 'https://cclqroo.qroo.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('San Luis Potosi', 'SLP', 'local', 'Centro de Conciliacion Laboral de San Luis Potosi', 'Av. Venustiano Carranza 830', 'San Luis Potosi', '78000', '444 834 9700', 'https://ccl.slp.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Sinaloa', 'SIN', 'local', 'Centro de Conciliacion Laboral de Sinaloa', 'Av. Insurgentes 1855 Pte', 'Culiacan', '80020', '667 758 7000', 'https://ccl.sinaloa.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Sonora', 'SON', 'local', 'Centro de Conciliacion Laboral de Sonora', 'Blvd. Paseo Rio Sonora Sur 205', 'Hermosillo', '83280', '662 289 6500', 'https://ccl.sonora.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-14:00'),
  ('Tabasco', 'TAB', 'local', 'Centro de Conciliacion Laboral de Tabasco', 'Paseo Tabasco 1203', 'Villahermosa', '86040', '993 310 8700', 'https://ccl.tabasco.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Tamaulipas', 'TAMPS', 'local', 'Centro de Conciliacion Laboral de Tamaulipas', '16 Hidalgo y Juarez 436', 'Ciudad Victoria', '87000', '834 318 7200', 'https://ccl.tamaulipas.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Tlaxcala', 'TLAX', 'local', 'Centro de Conciliacion Laboral de Tlaxcala', 'Av. Juarez 62, Centro', 'Tlaxcala', '90000', '246 465 0900', 'https://ccl.tlaxcala.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Veracruz', 'VER', 'local', 'Centro de Conciliacion Laboral de Veracruz', 'Leandro Valle 408, Centro', 'Xalapa', '91000', '228 842 0200', 'https://ccl.veracruz.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Yucatan', 'YUC', 'local', 'Centro de Conciliacion Laboral de Yucatan', 'Calle 20 x 25, Centro', 'Merida', '97000', '999 930 3100', 'https://ccl.yucatan.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00'),
  ('Zacatecas', 'ZAC', 'local', 'Centro de Conciliacion Laboral de Zacatecas', 'Blvd. Heroes de Chapultepec 1902', 'Zacatecas', '98060', '492 923 9100', 'https://ccl.zacatecas.gob.mx', 'SINACOL', 'Lunes a Viernes 8:00-15:00');
