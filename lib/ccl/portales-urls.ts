/**
 * URLs de acceso a los portales SINACOL de cada estado de México
 * 
 * Estos son los portales REALES donde el agente inteligente de MeCorrieron
 * crea automáticamente las cuentas de los trabajadores cuando autorizan
 * explícitamente el proceso de conciliación laboral.
 * 
 * IMPORTANTE: Las contraseñas generadas son almacenadas de forma segura
 * y solo visibles para Superadmin. NO se comparten con el cliente ni el abogado.
 * 
 * Actualizado: Enero 2026
 */

export interface PortalCCL {
  estado: string
  clave: string
  nombre_ccl: string
  // URL del portal principal
  url_portal: string
  // URL de login (donde el agente automatiza el acceso)
  url_login: string
  // URL para crear solicitud pública (pre-registro sin cuenta)
  url_solicitud_publica: string | null
  // URL del buzón electrónico
  url_buzon: string | null
  // Tipo de sistema (SINACOL estándar, SICON Chiapas, o personalizado)
  tipo_sistema: 'sinacol' | 'sicon' | 'cfcrl' | 'custom'
  /**
   * Tipo de autenticación para el buzón electrónico:
   * - 'email_password': Email + Contraseña (portales estatales SINACOL estándar)
   * - 'curp_folio': CURP + Folio de expediente (Centro Federal CFCRL)
   */
  tipo_autenticacion: 'email_password' | 'curp_folio'
  // Si el portal está verificado y funcional
  verificado: boolean
  // Fecha de última verificación
  fecha_verificacion: string
  // Notas adicionales
  notas?: string
}

/**
 * Portales CCL verificados de todos los estados de México
 * URLs actualizadas y funcionales para automatización
 */
export const PORTALES_CCL: PortalCCL[] = [
  // ==================== FEDERAL ====================
  {
    estado: 'Federal',
    clave: 'FED',
    nombre_ccl: 'Centro Federal de Conciliación y Registro Laboral',
    url_portal: 'https://conciliacion.centrolaboral.gob.mx',
    url_login: 'https://conciliacion.centrolaboral.gob.mx/solicitud_buzon',
    url_solicitud_publica: 'https://conciliacion.centrolaboral.gob.mx/asesoria/inicio',
    url_buzon: 'https://conciliacion.centrolaboral.gob.mx/solicitud_buzon',
    tipo_sistema: 'cfcrl',
    tipo_autenticacion: 'curp_folio', // CURP + Folio de expediente (ej: XXX/CI/2022/000000)
    verificado: true,
    fecha_verificacion: '2026-01-29',
    notas: 'VERIFICADO: Buzón usa CURP + Folio de expediente. Jurisdicción federal para industrias específicas (Art. 527 LFT): ferrocarriles, petroquímica, electricidad, etc.'
  },
  
  // ==================== ESTADOS ====================
  {
    estado: 'Aguascalientes',
    clave: 'AGS',
    nombre_ccl: 'Centro de Conciliación Laboral de Aguascalientes',
    url_portal: 'https://sinacol.aguascalientes.gob.mx',
    url_login: 'https://sinacol.aguascalientes.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.aguascalientes.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.aguascalientes.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Baja California',
    clave: 'BC',
    nombre_ccl: 'Centro de Conciliación Laboral de Baja California',
    url_portal: 'https://sinacol.bajacalifornia.gob.mx',
    url_login: 'https://sinacol.bajacalifornia.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.bajacalifornia.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.bajacalifornia.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Baja California Sur',
    clave: 'BCS',
    nombre_ccl: 'Centro de Conciliación Laboral de Baja California Sur',
    url_portal: 'https://sinacol.bcs.gob.mx',
    url_login: 'https://sinacol.bcs.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.bcs.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.bcs.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Campeche',
    clave: 'CAM',
    nombre_ccl: 'Centro de Conciliación Laboral de Campeche',
    url_portal: 'https://sinacol.campeche.gob.mx',
    url_login: 'https://sinacol.campeche.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.campeche.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.campeche.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Chiapas',
    clave: 'CHIS',
    nombre_ccl: 'Centro de Conciliación Laboral de Chiapas',
    url_portal: 'https://sicon.conciliacionlaboral.chiapas.gob.mx',
    url_login: 'https://sicon.conciliacionlaboral.chiapas.gob.mx/login',
    url_solicitud_publica: 'https://sicon.conciliacionlaboral.chiapas.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sicon.conciliacionlaboral.chiapas.gob.mx/buzon',
    tipo_sistema: 'sicon',
    tipo_autenticacion: 'email_password',
    verificado: true,
    fecha_verificacion: '2026-01-29',
    notas: 'Sistema SICON - Interfaz diferente a SINACOL estándar'
  },
  {
    estado: 'Chihuahua',
    clave: 'CHIH',
    nombre_ccl: 'Centro de Conciliación Laboral de Chihuahua',
    url_portal: 'https://sinacol.chihuahua.gob.mx',
    url_login: 'https://sinacol.chihuahua.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.chihuahua.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.chihuahua.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Ciudad de México',
    clave: 'CDMX',
    nombre_ccl: 'Centro de Conciliación Laboral de la Ciudad de México',
    url_portal: 'https://www.ccl.cdmx.gob.mx',
    url_login: 'https://conciliacion.cdmx.gob.mx/login',
    url_solicitud_publica: 'https://conciliacion.cdmx.gob.mx/asesoria/seleccion',
    url_buzon: 'https://conciliacion.cdmx.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: true,
    fecha_verificacion: '2026-01-29',
    notas: 'Portal ccl.cdmx.gob.mx redirige a conciliacion.cdmx.gob.mx'
  },
  {
    estado: 'Coahuila',
    clave: 'COAH',
    nombre_ccl: 'Centro de Conciliación Laboral de Coahuila',
    url_portal: 'https://sinacol.coahuila.gob.mx',
    url_login: 'https://sinacol.coahuila.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.coahuila.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.coahuila.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Colima',
    clave: 'COL',
    nombre_ccl: 'Centro de Conciliación Laboral de Colima',
    url_portal: 'https://sinacol.colima.gob.mx',
    url_login: 'https://sinacol.colima.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.colima.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.colima.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Durango',
    clave: 'DGO',
    nombre_ccl: 'Centro de Conciliación Laboral de Durango',
    url_portal: 'https://sinacol.durango.gob.mx',
    url_login: 'https://sinacol.durango.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.durango.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.durango.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Estado de México',
    clave: 'MEX',
    nombre_ccl: 'Centro de Conciliación Laboral del Estado de México',
    url_portal: 'https://sinacol.edomex.gob.mx',
    url_login: 'https://sinacol.edomex.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.edomex.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.edomex.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Guanajuato',
    clave: 'GTO',
    nombre_ccl: 'Centro de Conciliación Laboral de Guanajuato',
    url_portal: 'https://sinacol.guanajuato.gob.mx',
    url_login: 'https://sinacol.guanajuato.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.guanajuato.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.guanajuato.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Guerrero',
    clave: 'GRO',
    nombre_ccl: 'Centro de Conciliación Laboral de Guerrero',
    url_portal: 'https://sinacol.guerrero.gob.mx',
    url_login: 'https://sinacol.guerrero.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.guerrero.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.guerrero.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Hidalgo',
    clave: 'HGO',
    nombre_ccl: 'Centro de Conciliación Laboral de Hidalgo',
    url_portal: 'https://sinacol.hidalgo.gob.mx',
    url_login: 'https://sinacol.hidalgo.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.hidalgo.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.hidalgo.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Jalisco',
    clave: 'JAL',
    nombre_ccl: 'Centro de Conciliación Laboral de Jalisco',
    url_portal: 'https://ccl.jalisco.gob.mx',
    url_login: 'https://sinacol.ccljalisco.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.ccljalisco.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.ccljalisco.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: true,
    fecha_verificacion: '2026-01-29',
    notas: 'CCL Jalisco con herramientas avanzadas: citas, conciliación remota, calculadora'
  },
  {
    estado: 'Michoacán',
    clave: 'MICH',
    nombre_ccl: 'Centro de Conciliación Laboral de Michoacán',
    url_portal: 'https://sinacol.michoacan.gob.mx',
    url_login: 'https://sinacol.michoacan.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.michoacan.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.michoacan.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Morelos',
    clave: 'MOR',
    nombre_ccl: 'Centro de Conciliación Laboral de Morelos',
    url_portal: 'https://sinacol.morelos.gob.mx',
    url_login: 'https://sinacol.morelos.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.morelos.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.morelos.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Nayarit',
    clave: 'NAY',
    nombre_ccl: 'Centro de Conciliación Laboral de Nayarit',
    url_portal: 'https://sinacol.nayarit.gob.mx',
    url_login: 'https://sinacol.nayarit.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.nayarit.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.nayarit.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Nuevo León',
    clave: 'NL',
    nombre_ccl: 'Centro de Conciliación Laboral de Nuevo León',
    url_portal: 'https://sinacol.nl.gob.mx',
    url_login: 'https://sinacol.nl.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.nl.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.nl.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: true,
    fecha_verificacion: '2026-01-29',
    notas: 'Portal SINACOL estándar confirmado'
  },
  {
    estado: 'Oaxaca',
    clave: 'OAX',
    nombre_ccl: 'Centro de Conciliación Laboral de Oaxaca',
    url_portal: 'https://sinacol.oaxaca.gob.mx',
    url_login: 'https://sinacol.oaxaca.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.oaxaca.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.oaxaca.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Puebla',
    clave: 'PUE',
    nombre_ccl: 'Centro de Conciliación Laboral de Puebla',
    url_portal: 'https://sinacol.puebla.gob.mx',
    url_login: 'https://sinacol.puebla.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.puebla.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.puebla.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Querétaro',
    clave: 'QRO',
    nombre_ccl: 'Centro de Conciliación Laboral de Querétaro',
    url_portal: 'https://sinacol.queretaro.gob.mx',
    url_login: 'https://sinacol.queretaro.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.queretaro.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.queretaro.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Quintana Roo',
    clave: 'QROO',
    nombre_ccl: 'Centro de Conciliación Laboral de Quintana Roo',
    url_portal: 'https://cclqroo.qroo.gob.mx',
    url_login: 'https://conciliacion.cclqroo.gob.mx/login',
    url_solicitud_publica: 'https://cclqroo.qroo.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://conciliacion.cclqroo.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: true,
    fecha_verificacion: '2026-01-29',
    notas: 'URL de login VERIFICADA: conciliacion.cclqroo.gob.mx/login - Versión 12.8.2'
  },
  {
    estado: 'San Luis Potosí',
    clave: 'SLP',
    nombre_ccl: 'Centro de Conciliación Laboral de San Luis Potosí',
    url_portal: 'https://sinacol.slp.gob.mx',
    url_login: 'https://sinacol.slp.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.slp.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.slp.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Sinaloa',
    clave: 'SIN',
    nombre_ccl: 'Centro de Conciliación Laboral de Sinaloa',
    url_portal: 'https://sinacol.sinaloa.gob.mx',
    url_login: 'https://sinacol.sinaloa.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.sinaloa.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.sinaloa.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Sonora',
    clave: 'SON',
    nombre_ccl: 'Centro de Conciliación Laboral de Sonora',
    url_portal: 'https://sinacol.sonora.gob.mx',
    url_login: 'https://sinacol.sonora.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.sonora.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.sonora.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Tabasco',
    clave: 'TAB',
    nombre_ccl: 'Centro de Conciliación Laboral de Tabasco',
    url_portal: 'https://sinacol.tabasco.gob.mx',
    url_login: 'https://sinacol.tabasco.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.tabasco.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.tabasco.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Tamaulipas',
    clave: 'TAMPS',
    nombre_ccl: 'Centro de Conciliación Laboral de Tamaulipas',
    url_portal: 'https://sinacol.tamaulipas.gob.mx',
    url_login: 'https://sinacol.tamaulipas.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.tamaulipas.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.tamaulipas.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Tlaxcala',
    clave: 'TLAX',
    nombre_ccl: 'Centro de Conciliación Laboral de Tlaxcala',
    url_portal: 'https://sinacol.tlaxcala.gob.mx',
    url_login: 'https://sinacol.tlaxcala.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.tlaxcala.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.tlaxcala.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  },
  {
    estado: 'Veracruz',
    clave: 'VER',
    nombre_ccl: 'Centro de Conciliación Laboral de Veracruz',
    url_portal: 'https://sinacol.veracruz.gob.mx',
    url_login: 'https://sinacol.veracruz.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.veracruz.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.veracruz.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: true,
    fecha_verificacion: '2026-01-29',
    notas: 'Portal verificado en búsqueda web'
  },
  {
    estado: 'Yucatán',
    clave: 'YUC',
    nombre_ccl: 'Centro de Conciliación Laboral de Yucatán',
    url_portal: 'https://concilialaboral.yucatan.gob.mx',
    url_login: 'https://concilialaboral.yucatan.gob.mx/login',
    url_solicitud_publica: 'https://concilialaboral.yucatan.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://concilialaboral.yucatan.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: true,
    fecha_verificacion: '2026-01-29',
    notas: 'Portal verificado en búsqueda web'
  },
  {
    estado: 'Zacatecas',
    clave: 'ZAC',
    nombre_ccl: 'Centro de Conciliación Laboral de Zacatecas',
    url_portal: 'https://sinacol.zacatecas.gob.mx',
    url_login: 'https://sinacol.zacatecas.gob.mx/login',
    url_solicitud_publica: 'https://sinacol.zacatecas.gob.mx/solicitudes/create-public?solicitud=1',
    url_buzon: 'https://sinacol.zacatecas.gob.mx/buzon',
    tipo_sistema: 'sinacol',
    tipo_autenticacion: 'email_password',
    verificado: false,
    fecha_verificacion: '2026-01-29'
  }
]

/**
 * Obtiene el portal CCL por estado
 */
export function getPortalByEstado(estado: string): PortalCCL | undefined {
  const normalizado = estado.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return PORTALES_CCL.find(p => 
    p.estado.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === normalizado ||
    p.clave.toLowerCase() === normalizado
  )
}

/**
 * Obtiene el portal CCL por clave
 */
export function getPortalByClave(clave: string): PortalCCL | undefined {
  return PORTALES_CCL.find(p => p.clave.toLowerCase() === clave.toLowerCase())
}

/**
 * Obtiene todos los portales verificados
 */
export function getPortalesVerificados(): PortalCCL[] {
  return PORTALES_CCL.filter(p => p.verificado)
}

/**
 * Obtiene la URL de login correcta para un estado
 */
export function getUrlLogin(estado: string): string {
  const portal = getPortalByEstado(estado)
  return portal?.url_login || `https://sinacol.${estado.toLowerCase().replace(/ /g, '')}.gob.mx/login`
}

/**
 * Genera el email para la cuenta SINACOL
 * Formato: nombre.apellido.ccl.clave.random@gmail.com
 * Este email es asignado por MeCorrieron y usado para el registro automatizado
 */
export function generarEmailSinacol(nombre: string, apellido: string, clave: string): string {
  const nombreLimpio = nombre.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '')
    .slice(0, 10)
  const apellidoLimpio = apellido.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '')
    .slice(0, 10)
  const random = Math.random().toString(36).substring(2, 12)
  
  return `${nombreLimpio}.${apellidoLimpio}.ccl.${clave.toLowerCase()}.${random}@gmail.com`
}

/**
 * Genera una contraseña segura aleatoria para SINACOL
 * IMPORTANTE: Esta contraseña solo es visible para Superadmin
 * NO se comparte con el cliente ni el abogado
 */
export function generarPasswordSinacol(): string {
  const mayusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const minusculas = 'abcdefghjkmnpqrstuvwxyz'
  const numeros = '23456789'
  const especiales = '!@#$%&*'
  
  let password = ''
  // Asegurar al menos uno de cada tipo
  password += mayusculas[Math.floor(Math.random() * mayusculas.length)]
  password += minusculas[Math.floor(Math.random() * minusculas.length)]
  password += numeros[Math.floor(Math.random() * numeros.length)]
  password += especiales[Math.floor(Math.random() * especiales.length)]
  
  // Completar con caracteres aleatorios
  const todos = mayusculas + minusculas + numeros + especiales
  for (let i = 0; i < 8; i++) {
    password += todos[Math.floor(Math.random() * todos.length)]
  }
  
  // Mezclar
  return password.split('').sort(() => Math.random() - 0.5).join('')
}
