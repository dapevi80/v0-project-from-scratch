// CCL Account Service - Helper functions for CCL portal integration
// Database operations are handled via API routes at /api/ccl/create-account

// PORTALES CCL REALES - Investigados y verificados enero 2026
// Todos los estados usan SINACOL (Sistema Nacional de Conciliación Laboral)
// Algunos estados tienen portales propios además de SINACOL

export interface PortalCCLConfig {
  nombre: string
  url: string
  urlSinacol: string // URL del sistema SINACOL para solicitudes
  urlRegistro: string
  urlLogin: string
  urlBuzon: string
  tieneRegistroEnLinea: boolean
  tieneBuzonElectronico: boolean
  requiereCaptcha: boolean
  requiereRatificacionPresencial: boolean // Todos requieren ratificación presencial
  telefonoContacto?: string
  emailContacto?: string
  direccion?: string
  horario?: string
  notas?: string
}

export const PORTALES_CCL: Record<string, PortalCCLConfig> = {
  // ============ CENTRO FEDERAL ============
  'Federal': {
    nombre: 'Centro Federal de Conciliación y Registro Laboral (CFCRL)',
    url: 'https://www.gob.mx/cfcrl',
    urlSinacol: 'https://conciliacion.centrolaboral.gob.mx/asesoria/inicio',
    urlRegistro: 'https://conciliacion.centrolaboral.gob.mx/asesoria/inicio',
    urlLogin: 'https://conciliacion.centrolaboral.gob.mx/asesoria/inicio',
    urlBuzon: 'https://www.gob.mx/cfcrl/articulos/buzon-electronico',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: true,
    requiereRatificacionPresencial: true,
    emailContacto: 'gianni.ruedadeleon@centrolaboral.gob.mx',
    telefonoContacto: '55 8874 8600 ext 20016',
    direccion: 'Picacho Ajusco 714, Torres de Padierna, Tlalpan, CP 14209, CDMX',
    horario: 'Lunes a Viernes 9:00 - 18:00',
    notas: 'Competencia federal: industrias especificas (hidrocarburos, electricidad, ferrocarriles, banca, mineria, etc.) y empresas que operan en multiples estados. URL verificada enero 2026.'
  },

  // ============ ESTADOS CON PORTALES VERIFICADOS ============
  
  'Aguascalientes': {
    nombre: 'Centro de Conciliación Laboral de Aguascalientes',
    url: 'https://ccl.aguascalientes.gob.mx',
    urlSinacol: 'https://sinacol.aguascalientes.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.aguascalientes.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.aguascalientes.gob.mx',
    urlBuzon: 'https://sinacol.aguascalientes.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Baja California': {
    nombre: 'Centro de Conciliación Laboral de Baja California',
    url: 'https://www.bajacalifornia.gob.mx/cclbc',
    urlSinacol: 'https://sinacol.bajacalifornia.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.bajacalifornia.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.bajacalifornia.gob.mx',
    urlBuzon: 'https://sinacol.bajacalifornia.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Baja California Sur': {
    nombre: 'Centro de Conciliación Laboral de Baja California Sur',
    url: 'https://www.bcs.gob.mx/ccl',
    urlSinacol: 'https://sinacol.bcs.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.bcs.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.bcs.gob.mx',
    urlBuzon: 'https://sinacol.bcs.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Campeche': {
    nombre: 'Centro de Conciliación Laboral del Estado de Campeche',
    url: 'https://ccl.campeche.gob.mx',
    urlSinacol: 'https://sinacol.campeche.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.campeche.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.campeche.gob.mx',
    urlBuzon: 'https://sinacol.campeche.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Chiapas': {
    nombre: 'Centro de Conciliación Laboral de Chiapas',
    url: 'https://conciliacionlaboral.chiapas.gob.mx',
    urlSinacol: 'https://sicon.conciliacionlaboral.chiapas.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sicon.conciliacionlaboral.chiapas.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sicon.conciliacionlaboral.chiapas.gob.mx/solicitudes/create-public?solicitud=1',
    urlBuzon: 'https://conciliacionlaboral.chiapas.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true,
    notas: 'Chiapas usa sistema SICON (variante de SINACOL). URL verificada enero 2026.'
  },

  'Chihuahua': {
    nombre: 'Centro de Conciliación Laboral de Chihuahua',
    url: 'https://ccl.chihuahua.gob.mx',
    urlSinacol: 'https://sinacol.chihuahua.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.chihuahua.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.chihuahua.gob.mx',
    urlBuzon: 'https://sinacol.chihuahua.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Ciudad de Mexico': {
    nombre: 'Centro de Conciliación Laboral de la Ciudad de México',
    url: 'https://www.ccl.cdmx.gob.mx',
    urlSinacol: 'https://www.ccl.cdmx.gob.mx/registro',
    urlRegistro: 'https://www.ccl.cdmx.gob.mx/registro',
    urlLogin: 'https://www.ccl.cdmx.gob.mx',
    urlBuzon: 'https://www.ccl.cdmx.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: true,
    requiereRatificacionPresencial: true,
    notas: 'CDMX tiene portal propio. Pre-registro en linea, luego ratificación presencial.'
  },

  'Coahuila': {
    nombre: 'Centro de Conciliación Laboral del Estado de Coahuila',
    url: 'https://www.cclcoahuila.gob.mx',
    urlSinacol: 'https://sinacol.cclcoahuila.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.cclcoahuila.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.cclcoahuila.gob.mx',
    urlBuzon: 'https://sinacol.cclcoahuila.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Colima': {
    nombre: 'Centro de Conciliación Laboral del Estado de Colima',
    url: 'https://ccl.colima.gob.mx',
    urlSinacol: 'https://sinacol.colima.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.colima.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.colima.gob.mx',
    urlBuzon: 'https://sinacol.colima.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Durango': {
    nombre: 'Centro de Conciliación Laboral del Estado de Durango',
    url: 'https://conciliacionlaboral.durango.gob.mx',
    urlSinacol: 'https://sinacol.durango.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.durango.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.durango.gob.mx',
    urlBuzon: 'https://sinacol.durango.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Estado de Mexico': {
    nombre: 'Centro de Conciliación Laboral del Estado de México',
    url: 'https://cclaboral.edomex.gob.mx',
    urlSinacol: 'https://sinacol.edomex.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://strabajo.edomex.gob.mx/conciliacion-ante-centro-conciliacion',
    urlLogin: 'https://sinacol.edomex.gob.mx',
    urlBuzon: 'https://sinacol.edomex.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Guanajuato': {
    nombre: 'Centro de Conciliación Laboral del Estado de Guanajuato',
    url: 'https://ccl.guanajuato.gob.mx',
    urlSinacol: 'https://sinacol.guanajuato.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.guanajuato.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.guanajuato.gob.mx',
    urlBuzon: 'https://ccl.guanajuato.gob.mx/buzon-electronico',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Guerrero': {
    nombre: 'Centro de Conciliación Laboral del Estado de Guerrero',
    url: 'https://ccl.guerrero.gob.mx',
    urlSinacol: 'https://sinacol.guerrero.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.guerrero.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.guerrero.gob.mx',
    urlBuzon: 'https://sinacol.guerrero.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Hidalgo': {
    nombre: 'Centro de Conciliación Laboral del Estado de Hidalgo',
    url: 'https://ccl.hidalgo.gob.mx',
    urlSinacol: 'https://sinacol.hidalgo.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.hidalgo.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.hidalgo.gob.mx',
    urlBuzon: 'https://sinacol.hidalgo.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Jalisco': {
    nombre: 'Centro de Conciliación Laboral del Estado de Jalisco',
    url: 'https://ccl.jalisco.gob.mx',
    urlSinacol: 'https://sinacol.ccljalisco.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.ccljalisco.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.ccljalisco.gob.mx/solicitudes/create-public?solicitud=1',
    urlBuzon: 'https://sinacol.ccljalisco.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true,
    notas: 'URL verificada enero 2026. Portal propio de Jalisco con sistema de citas: citasccljalisco.gob.mx'
  },

  'Michoacan': {
    nombre: 'Centro de Conciliación Laboral del Estado de Michoacán',
    url: 'https://cclmichoacan.gob.mx',
    urlSinacol: 'https://sinacol.michoacan.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.michoacan.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.michoacan.gob.mx',
    urlBuzon: 'https://sinacol.michoacan.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Morelos': {
    nombre: 'Centro de Conciliación Laboral del Estado de Morelos',
    url: 'https://ccl.morelos.gob.mx',
    urlSinacol: 'https://sinacol.morelos.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.morelos.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.morelos.gob.mx',
    urlBuzon: 'https://sinacol.morelos.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Nayarit': {
    nombre: 'Centro de Conciliación Laboral del Estado de Nayarit',
    url: 'https://ccl.nayarit.gob.mx',
    urlSinacol: 'https://sinacol.nayarit.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.nayarit.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.nayarit.gob.mx',
    urlBuzon: 'https://sinacol.nayarit.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Nuevo Leon': {
    nombre: 'Centro de Conciliación Laboral del Estado de Nuevo León',
    url: 'https://www.centrodeconciliacionlaboralnl.mx',
    urlSinacol: 'https://sinacol.nl.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.nl.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.nl.gob.mx',
    urlBuzon: 'https://sinacol.nl.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true,
    emailContacto: 'transparencia@centrodeconciliacionlaboralnl.mx',
    notas: 'Uno de los portales SINACOL más completos y funcionales.'
  },

  'Oaxaca': {
    nombre: 'Centro de Conciliación Laboral del Estado de Oaxaca',
    url: 'https://ccl.oaxaca.gob.mx',
    urlSinacol: 'https://sinacol.oaxaca.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.oaxaca.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.oaxaca.gob.mx',
    urlBuzon: 'https://sinacol.oaxaca.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Puebla': {
    nombre: 'Centro de Conciliación Laboral del Estado de Puebla',
    url: 'https://ccl.puebla.gob.mx',
    urlSinacol: 'https://sinacol.puebla.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.puebla.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.puebla.gob.mx',
    urlBuzon: 'https://sinacol.puebla.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Queretaro': {
    nombre: 'Centro de Conciliación Laboral del Estado de Querétaro',
    url: 'https://ccl.queretaro.gob.mx',
    urlSinacol: 'https://sinacol.queretaro.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.queretaro.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.queretaro.gob.mx',
    urlBuzon: 'https://sinacol.queretaro.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Quintana Roo': {
    nombre: 'Centro de Conciliación Laboral del Estado de Quintana Roo',
    url: 'https://cclqroo.qroo.gob.mx',
    urlSinacol: 'https://cclqroo.qroo.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://cclqroo.qroo.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://cclqroo.qroo.gob.mx/solicitudes/create-public?solicitud=1',
    urlBuzon: 'https://cclqroo.qroo.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true,
    emailContacto: 'buzon_oficial@cclqroo.gob.mx',
    telefonoContacto: '9836883672',
    notas: 'URL verificada por usuario. Sedes en Chetumal, Cancún, Playa del Carmen y Cozumel. Horario 8:00-16:00 L-V.'
  },

  'San Luis Potosi': {
    nombre: 'Centro de Conciliación Laboral del Estado de San Luis Potosí',
    url: 'https://ccl.slp.gob.mx',
    urlSinacol: 'https://sinacol.slp.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.slp.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.slp.gob.mx',
    urlBuzon: 'https://sinacol.slp.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Sinaloa': {
    nombre: 'Centro de Conciliación Laboral del Estado de Sinaloa',
    url: 'https://cclsinaloa.gob.mx',
    urlSinacol: 'https://cclsinaloa.gob.mx/solicitudes/trabajador/',
    urlRegistro: 'https://cclsinaloa.gob.mx/solicitudes/trabajador/',
    urlLogin: 'https://cclsinaloa.gob.mx',
    urlBuzon: 'https://cclsinaloa.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true,
    telefonoContacto: '526671844576'
  },

  'Sonora': {
    nombre: 'Centro de Conciliación Laboral del Estado de Sonora',
    url: 'https://ccl.sonora.gob.mx',
    urlSinacol: 'https://sinacol.sonora.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.sonora.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.sonora.gob.mx',
    urlBuzon: 'https://sinacol.sonora.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Tabasco': {
    nombre: 'Centro de Conciliación Laboral del Estado de Tabasco',
    url: 'https://ccl.tabasco.gob.mx',
    urlSinacol: 'https://sinacol.tabasco.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.tabasco.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.tabasco.gob.mx',
    urlBuzon: 'https://sinacol.tabasco.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Tamaulipas': {
    nombre: 'Centro de Conciliación Laboral del Estado de Tamaulipas',
    url: 'https://ccl.tamaulipas.gob.mx',
    urlSinacol: 'https://sinacol.tamaulipas.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.tamaulipas.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.tamaulipas.gob.mx',
    urlBuzon: 'https://sinacol.tamaulipas.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Tlaxcala': {
    nombre: 'Centro de Conciliación Laboral del Estado de Tlaxcala',
    url: 'https://ccl.tlaxcala.gob.mx',
    urlSinacol: 'https://sinacol.tlaxcala.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.tlaxcala.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.tlaxcala.gob.mx',
    urlBuzon: 'https://sinacol.tlaxcala.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Veracruz': {
    nombre: 'Centro de Conciliación Laboral del Estado de Veracruz',
    url: 'https://ccl.veracruz.gob.mx',
    urlSinacol: 'https://sinacol.veracruz.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.veracruz.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.veracruz.gob.mx',
    urlBuzon: 'https://sinacol.veracruz.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Yucatan': {
    nombre: 'Centro de Conciliación Laboral del Estado de Yucatán',
    url: 'https://juntalocal.yucatan.gob.mx',
    urlSinacol: 'https://sinacol.yucatan.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.yucatan.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.yucatan.gob.mx',
    urlBuzon: 'https://sinacol.yucatan.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  },

  'Zacatecas': {
    nombre: 'Centro de Conciliación Laboral del Estado de Zacatecas',
    url: 'https://ccl.zacatecas.gob.mx',
    urlSinacol: 'https://sinacol.zacatecas.gob.mx/solicitudes/create-public?solicitud=1',
    urlRegistro: 'https://sinacol.zacatecas.gob.mx/solicitudes/create-public?solicitud=1',
    urlLogin: 'https://sinacol.zacatecas.gob.mx',
    urlBuzon: 'https://sinacol.zacatecas.gob.mx/buzon',
    tieneRegistroEnLinea: true,
    tieneBuzonElectronico: true,
    requiereCaptcha: false,
    requiereRatificacionPresencial: true
  }
}

// Obtener URL de SINACOL para un estado
export function obtenerUrlSinacol(estado: string): string {
  const portal = PORTALES_CCL[estado]
  if (portal) {
    return portal.urlSinacol
  }
  // Fallback: intentar construir URL estándar
  const estadoSlug = estado.toLowerCase().replace(/ /g, '').replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u')
  return `https://sinacol.${estadoSlug}.gob.mx/solicitudes/create-public?solicitud=1`
}

// Obtener información del portal CCL
export function obtenerPortalCCL(estado: string): PortalCCLConfig | null {
  return PORTALES_CCL[estado] || null
}

// Verificar si el estado tiene portal disponible
export function tienePortalCCL(estado: string): boolean {
  return !!PORTALES_CCL[estado]
}

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
    'Aguascalientes': 'AGU', 'Baja California': 'BCN', 'Baja California Sur': 'BCS',
    'Campeche': 'CAM', 'Chiapas': 'CHS', 'Chihuahua': 'CHH', 'Ciudad de Mexico': 'CMX',
    'Coahuila': 'COA', 'Colima': 'COL', 'Durango': 'DUR', 'Estado de Mexico': 'MEX',
    'Guanajuato': 'GTO', 'Guerrero': 'GRO', 'Hidalgo': 'HID', 'Jalisco': 'JAL',
    'Michoacan': 'MIC', 'Morelos': 'MOR', 'Nayarit': 'NAY', 'Nuevo Leon': 'NLE',
    'Oaxaca': 'OAX', 'Puebla': 'PUE', 'Queretaro': 'QRO', 'Quintana Roo': 'ROO',
    'San Luis Potosi': 'SLP', 'Sinaloa': 'SIN', 'Sonora': 'SON', 'Tabasco': 'TAB',
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
  url_login: string | null
  url_buzon: string | null
  curp_usado: string | null
  rfc_usado: string | null
  cuenta_creada: boolean
  cuenta_verificada: boolean
  buzon_activo: boolean
  status: 'pendiente' | 'pendiente_captcha' | 'activa' | 'error' | 'cancelada'
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

// IMPORTANTE: Flujo real de SINACOL
// 1. El trabajador hace pre-registro en linea con su CURP
// 2. El sistema agenda una cita para ratificación presencial
// 3. En la ratificación se presenta con identificación oficial
// 4. Se confirma la solicitud y se genera el folio oficial
// 5. Se notifica a la empresa citada
// 6. Se programa audiencia de conciliación (máx 45 días)
// 7. Resultado: convenio, constancia de no conciliación, o archivo

// NOTA: Mecorrieron.mx NO puede crear cuentas automáticamente
// Solo puede guiar al usuario al portal SINACOL correspondiente
// y ayudarle a preparar la información necesaria para el trámite
