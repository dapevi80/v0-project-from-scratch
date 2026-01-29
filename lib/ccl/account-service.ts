'use server'

import { createClient } from '@/lib/supabase/server'

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

// Crear cuenta en portal CCL
export async function crearCuentaCCL(
  estado: string,
  datosTrabajador: DatosTrabajador,
  opciones?: {
    userId?: string
    casoId?: string
    cotizacionId?: string
    esPrueba?: boolean
    sesionDiagnosticoId?: string
  }
): Promise<ResultadoCreacionCuenta> {
  const supabase = await createClient()
  
  const portal = PORTALES_CCL[estado]
  if (!portal) {
    return { exito: false, error: `Portal no configurado para ${estado}` }
  }
  
  if (!portal.tieneRegistroEnLinea) {
    return { exito: false, error: 'Este CCL no tiene registro en linea' }
  }
  
  // Generar credenciales
  const emailPortal = generarEmailCCL(datosTrabajador.curp, estado)
  const passwordPortal = generarPasswordCCL()
  
  // Simular proceso de registro en el portal
  // En produccion, aqui iria la automatizacion real con Puppeteer/Playwright
  
  const tiempoSimulado = 2000 + Math.random() * 3000
  await new Promise(resolve => setTimeout(resolve, tiempoSimulado))
  
  // Determinar si tiene CAPTCHA
  if (portal.requiereCaptcha) {
    // En modo real, aqui se detectaria el CAPTCHA
    // Por ahora simulamos que algunos tienen y otros no
    const tieneCaptchaActivo = Math.random() > 0.4
    
    if (tieneCaptchaActivo) {
      // Guardar cuenta en estado pendiente de CAPTCHA
      const { data: account, error } = await supabase
        .from('ccl_user_accounts')
        .insert({
          user_id: opciones?.userId,
          caso_id: opciones?.casoId,
          cotizacion_id: opciones?.cotizacionId,
          estado,
          portal_url: portal.url,
          portal_nombre: portal.nombre,
          email_portal: emailPortal,
          password_portal: passwordPortal,
          curp_usado: datosTrabajador.curp,
          rfc_usado: datosTrabajador.rfc,
          cuenta_creada: false,
          cuenta_verificada: false,
          buzon_activo: false,
          error_ultimo: 'CAPTCHA pendiente de resolver',
          intentos_creacion: 1,
          es_prueba: opciones?.esPrueba || false,
          sesion_diagnostico_id: opciones?.sesionDiagnosticoId,
          datos_trabajador: datosTrabajador
        })
        .select()
        .single()
      
      if (error) {
        return { exito: false, error: error.message }
      }
      
      return {
        exito: false,
        accountId: account.id,
        email_portal: emailPortal,
        password_portal: passwordPortal,
        url_login: portal.urlLogin,
        requiereCaptcha: true,
        captchaUrl: portal.urlRegistro,
        error: 'CAPTCHA detectado - Requiere intervencion manual'
      }
    }
  }
  
  // Simular exito en creacion de cuenta
  const folioGenerado = generarFolioCCL(estado)
  
  // Guardar cuenta exitosa
  const { data: account, error } = await supabase
    .from('ccl_user_accounts')
    .insert({
      user_id: opciones?.userId,
      caso_id: opciones?.casoId,
      cotizacion_id: opciones?.cotizacionId,
      estado,
      portal_url: portal.url,
      portal_nombre: portal.nombre,
      email_portal: emailPortal,
      password_portal: passwordPortal,
      curp_usado: datosTrabajador.curp,
      rfc_usado: datosTrabajador.rfc,
      cuenta_creada: true,
      cuenta_verificada: true,
      buzon_activo: portal.tieneBuzonElectronico,
      folio_solicitud: folioGenerado,
      fecha_solicitud: new Date().toISOString(),
      intentos_creacion: 1,
      es_prueba: opciones?.esPrueba || false,
      sesion_diagnostico_id: opciones?.sesionDiagnosticoId,
      datos_trabajador: datosTrabajador
    })
    .select()
    .single()
  
  if (error) {
    return { exito: false, error: error.message }
  }
  
  // Crear notificacion inicial de solicitud recibida
  if (account && portal.tieneBuzonElectronico) {
    await supabase
      .from('ccl_buzon_notificaciones')
      .insert({
        account_id: account.id,
        tipo: 'solicitud_recibida',
        titulo: 'Solicitud de Conciliacion Registrada',
        descripcion: `Su solicitud ha sido registrada con el folio ${folioGenerado}. En breve recibira la fecha de su audiencia de conciliacion.`,
        fecha_notificacion: new Date().toISOString(),
        documento_url: `${portal.url}/constancia/${folioGenerado}`,
        documento_tipo: 'PDF'
      })
  }
  
  return {
    exito: true,
    accountId: account.id,
    email_portal: emailPortal,
    password_portal: passwordPortal,
    folio: folioGenerado,
    url_login: portal.urlLogin,
    url_buzon: portal.urlBuzon
  }
}

// Generar folio de CCL
function generarFolioCCL(estado: string): string {
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

// Obtener cuenta CCL por ID
export async function obtenerCuentaCCL(accountId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('ccl_user_accounts')
    .select(`
      *,
      notificaciones:ccl_buzon_notificaciones(*)
    `)
    .eq('id', accountId)
    .single()
  
  if (error) return null
  return data
}

// Obtener cuentas CCL de una sesion de diagnostico
export async function obtenerCuentasDiagnostico(sesionId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('ccl_user_accounts')
    .select('*')
    .eq('sesion_diagnostico_id', sesionId)
    .order('created_at', { ascending: true })
  
  if (error) return []
  return data
}

// Verificar estado del buzon de una cuenta
export async function verificarBuzonCCL(accountId: string) {
  const supabase = await createClient()
  
  // Obtener cuenta
  const { data: account } = await supabase
    .from('ccl_user_accounts')
    .select('*')
    .eq('id', accountId)
    .single()
  
  if (!account || !account.buzon_activo) {
    return { exito: false, error: 'Cuenta no encontrada o buzon inactivo' }
  }
  
  // Simular revision del buzon
  // En produccion, aqui iria la automatizacion real
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // Actualizar timestamp de ultimo check
  await supabase
    .from('ccl_user_accounts')
    .update({ ultimo_check_buzon: new Date().toISOString() })
    .eq('id', accountId)
  
  // Obtener notificaciones actuales
  const { data: notificaciones } = await supabase
    .from('ccl_buzon_notificaciones')
    .select('*')
    .eq('account_id', accountId)
    .order('fecha_notificacion', { ascending: false })
  
  return {
    exito: true,
    notificaciones: notificaciones || [],
    ultimoCheck: new Date().toISOString()
  }
}
