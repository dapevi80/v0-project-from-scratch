// CCL Account Service - Helper functions for CCL portal integration
// Database operations are handled via API routes at /api/ccl/create-account

// Configuracion de portales CCL por estado
export const PORTALES_CCL: Record<string, {
  nombre: string
  url: string
  urlRegistro: string
  urlLogin: string
  urlBuzon: string
  tieneRegistroEnLinea: boolean
  tieneBuzonElectronico: boolean
  requiereCaptcha: boolean
}> = {
  'Aguascalientes': {
    nombre: 'CCL Aguascalientes',
    url: 'https://ccl.aguascalientes.gob.mx',
    urlRegistro: 'https://ccl.aguascalientes.gob.mx/registro',
    urlLogin: 'https://ccl.aguascalientes.gob.mx/login',
    urlBuzon: 'https://ccl.aguascalientes.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: true
  },
  'Baja California': {
    nombre: 'CCL Baja California',
    url: 'https://centrolaboral.bajacalifornia.gob.mx',
    urlRegistro: 'https://centrolaboral.bajacalifornia.gob.mx/registro',
    urlLogin: 'https://centrolaboral.bajacalifornia.gob.mx/acceso',
    urlBuzon: 'https://centrolaboral.bajacalifornia.gob.mx/notificaciones',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: true
  },
  'Baja California Sur': {
    nombre: 'CCL Baja California Sur',
    url: 'https://ccl.bcs.gob.mx',
    urlRegistro: 'https://ccl.bcs.gob.mx/registro',
    urlLogin: 'https://ccl.bcs.gob.mx/login',
    urlBuzon: 'https://ccl.bcs.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false
  },
  'Ciudad de Mexico': {
    nombre: 'Centro de Conciliacion Laboral CDMX',
    url: 'https://centrolaboral.cdmx.gob.mx',
    urlRegistro: 'https://centrolaboral.cdmx.gob.mx/solicitud',
    urlLogin: 'https://centrolaboral.cdmx.gob.mx/acceso',
    urlBuzon: 'https://centrolaboral.cdmx.gob.mx/notificaciones',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: true
  },
  'Jalisco': {
    nombre: 'CCL Jalisco',
    url: 'https://ccl.jalisco.gob.mx',
    urlRegistro: 'https://ccl.jalisco.gob.mx/solicitud-en-linea',
    urlLogin: 'https://ccl.jalisco.gob.mx/mi-cuenta',
    urlBuzon: 'https://ccl.jalisco.gob.mx/notificaciones',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: true
  },
  'Nuevo Leon': {
    nombre: 'Centro de Conciliacion Laboral NL',
    url: 'https://conciliacion.nl.gob.mx',
    urlRegistro: 'https://conciliacion.nl.gob.mx/registro',
    urlLogin: 'https://conciliacion.nl.gob.mx/login',
    urlBuzon: 'https://conciliacion.nl.gob.mx/buzon-electronico',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false
  },
  'Federal': {
    nombre: 'Centro Federal de Conciliacion y Registro Laboral (CFCRL)',
    url: 'https://cfcrl.gob.mx',
    urlRegistro: 'https://cfcrl.gob.mx/solicitud',
    urlLogin: 'https://cfcrl.gob.mx/login',
    urlBuzon: 'https://cfcrl.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: true
  }
}

// Agregar el resto de estados con configuracion por defecto
const ESTADOS_RESTANTES = [
  'Campeche', 'Chiapas', 'Chihuahua', 'Coahuila', 'Colima', 'Durango',
  'Estado de Mexico', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Michoacan',
  'Morelos', 'Nayarit', 'Oaxaca', 'Puebla', 'Queretaro', 'Quintana Roo',
  'San Luis Potosi', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas',
  'Tlaxcala', 'Veracruz', 'Yucatan', 'Zacatecas'
]

ESTADOS_RESTANTES.forEach(estado => {
  const slug = estado.toLowerCase().replace(/ /g, '')
  PORTALES_CCL[estado] = {
    nombre: `CCL ${estado}`,
    url: `https://ccl.${slug}.gob.mx`,
    urlRegistro: `https://ccl.${slug}.gob.mx/registro`,
    urlLogin: `https://ccl.${slug}.gob.mx/login`,
    urlBuzon: `https://ccl.${slug}.gob.mx/buzon`,
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: Math.random() > 0.5 // Simulado para demo
  }
})

// Generador de password seguro pero memorable
export function generarPasswordCCL(): string {
  const palabras = ['Labor', 'Concilia', 'Trabajo', 'Derecho', 'Justicia']
  const palabra = palabras[Math.floor(Math.random() * palabras.length)]
  const numero = Math.floor(Math.random() * 9000) + 1000
  const especial = ['!', '@', '#', '$'][Math.floor(Math.random() * 4)]
  return `${palabra}${numero}${especial}`
}

// Generador de email para la cuenta CCL basado en CURP
export function generarEmailCCL(curp: string, estado: string): string {
  const estadoSlug = estado.toLowerCase().replace(/ /g, '').slice(0, 3)
  const curpCorto = curp.slice(0, 10).toLowerCase()
  return `${curpCorto}.${estadoSlug}@mecorrieron.mx`
}

// Generador de folio CCL
export function generarFolioCCL(estado: string): string {
  const prefijos: Record<string, string> = {
    'Aguascalientes': 'AGU', 'Baja California': 'BAJ', 'Baja California Sur': 'BCS',
    'Campeche': 'CAM', 'Chiapas': 'CHS', 'Chihuahua': 'CHH', 'Ciudad de Mexico': 'CIU',
    'Coahuila': 'COA', 'Colima': 'COL', 'Durango': 'DUR', 'Estado de Mexico': 'EST',
    'Guanajuato': 'GUA', 'Guerrero': 'GUE', 'Hidalgo': 'HID', 'Jalisco': 'JAL',
    'Michoacan': 'MIC', 'Morelos': 'MOR', 'Nayarit': 'NAY', 'Nuevo Leon': 'NUE',
    'Oaxaca': 'OAX', 'Puebla': 'PUE', 'Queretaro': 'QUE', 'Quintana Roo': 'QUI',
    'San Luis Potosi': 'SAN', 'Sinaloa': 'SIN', 'Sonora': 'SON', 'Tabasco': 'TAB',
    'Tamaulipas': 'TAM', 'Tlaxcala': 'TLA', 'Veracruz': 'VER', 'Yucatan': 'YUC',
    'Zacatecas': 'ZAC', 'Federal': 'FED'
  }
  
  const prefijo = prefijos[estado] || estado.slice(0, 3).toUpperCase()
  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const numero = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  
  return `CCL-${prefijo}-${fecha}-${numero}`
}

// Type definitions for CCL operations
export interface DatosTrabajador {
  nombre_completo: string
  curp: string
  rfc: string
  nss?: string
  fecha_nacimiento: string
  sexo: 'H' | 'M'
  email_personal: string
  telefono: string
  direccion: string
  ciudad: string
  codigo_postal: string
  empresa_nombre: string
  puesto: string
  salario_diario: number
  fecha_ingreso: string
  fecha_despido: string
}

export interface ResultadoCreacionCuenta {
  exito: boolean
  accountId?: string
  email_portal?: string
  password_portal?: string
  folio?: string
  url_login?: string
  url_buzon?: string
  error?: string
  requiereCaptcha?: boolean
  captchaUrl?: string
}

export interface CCLUserAccount {
  id: string
  user_id: string | null
  caso_id: string | null
  cotizacion_id: string | null
  estado: string
  portal_url: string
  portal_nombre: string | null
  email_portal: string
  password_portal: string
  curp_usado: string | null
  rfc_usado: string | null
  cuenta_creada: boolean
  cuenta_verificada: boolean
  buzon_activo: boolean
  folio_solicitud: string | null
  fecha_solicitud: string | null
  pdf_solicitud_url: string | null
  ultimo_check_buzon: string | null
  notificaciones_pendientes: number
  error_ultimo: string | null
  intentos_creacion: number
  max_intentos: number
  es_prueba: boolean
  sesion_diagnostico_id: string | null
  datos_trabajador: DatosTrabajador | null
  created_at: string
  updated_at: string
}

export interface CCLBuzonNotificacion {
  id: string
  account_id: string
  tipo: 'solicitud_recibida' | 'citatorio_audiencia' | 'acta_audiencia' | 'convenio' | 'constancia_no_conciliacion' | 'resolucion' | 'otro'
  titulo: string
  descripcion: string | null
  fecha_notificacion: string
  fecha_evento: string | null
  documento_url: string | null
  documento_tipo: string | null
  documento_descargado: boolean
  leida: boolean
  procesada: boolean
  id_externo: string | null
  raw_data: unknown
  created_at: string
}
