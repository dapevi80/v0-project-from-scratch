// Constantes compartidas entre cliente y servidor para CCL

// Lista de claves de estado para mapeo
export const ESTADOS_MEXICO: Record<string, string> = {
  'Aguascalientes': 'AGS',
  'Baja California': 'BC',
  'Baja California Sur': 'BCS',
  'Campeche': 'CAM',
  'Chiapas': 'CHIS',
  'Chihuahua': 'CHIH',
  'Ciudad de Mexico': 'CDMX',
  'CDMX': 'CDMX',
  'Coahuila': 'COAH',
  'Colima': 'COL',
  'Durango': 'DGO',
  'Estado de Mexico': 'MEX',
  'Mexico': 'MEX',
  'Guanajuato': 'GTO',
  'Guerrero': 'GRO',
  'Hidalgo': 'HGO',
  'Jalisco': 'JAL',
  'Michoacan': 'MICH',
  'Morelos': 'MOR',
  'Nayarit': 'NAY',
  'Nuevo Leon': 'NL',
  'Oaxaca': 'OAX',
  'Puebla': 'PUE',
  'Queretaro': 'QRO',
  'Quintana Roo': 'QROO',
  'San Luis Potosi': 'SLP',
  'Sinaloa': 'SIN',
  'Sonora': 'SON',
  'Tabasco': 'TAB',
  'Tamaulipas': 'TAMPS',
  'Tlaxcala': 'TLAX',
  'Veracruz': 'VER',
  'Yucatan': 'YUC',
  'Zacatecas': 'ZAC'
}

// Lista simple de estados para selects
export const ESTADOS_LISTA = Object.keys(ESTADOS_MEXICO).filter(e => e !== 'CDMX' && e !== 'Mexico')

// Industrias federales principales (para referencia rapida)
export const INDUSTRIAS_FEDERALES_PRINCIPALES = [
  { clave: 'TEXTIL', nombre: 'Industria textil' },
  { clave: 'ELECTRICA', nombre: 'Industria electrica' },
  { clave: 'CINEMATOGRAFICA', nombre: 'Industria cinematografica' },
  { clave: 'HULERA', nombre: 'Industria hulera' },
  { clave: 'AZUCARERA', nombre: 'Industria azucarera' },
  { clave: 'MINERA', nombre: 'Industria minera' },
  { clave: 'METALURGICA', nombre: 'Industria metalurgica y siderurgica' },
  { clave: 'HIDROCARBUROS', nombre: 'Hidrocarburos' },
  { clave: 'PETROQUIMICA', nombre: 'Petroquimica' },
  { clave: 'CEMENTERA', nombre: 'Industria cementera' },
  { clave: 'CALERA', nombre: 'Industria calera' },
  { clave: 'AUTOMOTRIZ', nombre: 'Industria automotriz' },
  { clave: 'QUIMICA', nombre: 'Industria quimica farmaceutica y medicamentos' },
  { clave: 'CELULOSA', nombre: 'Industria de celulosa y papel' },
  { clave: 'ACEITES', nombre: 'Industria de aceites y grasas vegetales' },
  { clave: 'ALIMENTOS', nombre: 'Industria productora de alimentos' },
  { clave: 'BEBIDAS', nombre: 'Industria elaboradora de bebidas' },
  { clave: 'FERROCARRILERA', nombre: 'Industria ferrocarrilera' },
  { clave: 'MADERERA', nombre: 'Industria maderera basica' },
  { clave: 'VIDRIERA', nombre: 'Industria vidriera' },
  { clave: 'TABACALERA', nombre: 'Industria tabacalera' },
  { clave: 'BANCA', nombre: 'Servicios de banca y credito' }
]
