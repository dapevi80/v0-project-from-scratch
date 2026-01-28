/**
 * Parser de datos de INE/IFE mexicana
 * Extrae CURP, nombre, fecha de nacimiento, domicilio y otros datos del texto OCR
 */

export interface INEData {
  // Datos personales
  nombre?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  nombreCompleto?: string
  
  // Identificación
  curp?: string
  claveElector?: string
  numeroINE?: string  // Número de credencial (OCR vertical)
  seccion?: string
  vigencia?: string
  anioRegistro?: string
  emision?: string
  
  // Fecha de nacimiento
  fechaNacimiento?: string  // YYYY-MM-DD
  fechaNacimientoTexto?: string  // Como aparece en la INE
  
  // Domicilio (reverso de INE antigua o INE con domicilio)
  domicilio?: {
    calle?: string
    numeroExterior?: string
    numeroInterior?: string
    colonia?: string
    codigoPostal?: string
    municipio?: string
    estado?: string
    domicilioCompleto?: string
  }
  
  // Sexo
  sexo?: 'H' | 'M'
  
  // Estado de nacimiento
  estadoNacimiento?: string
  
  // Confianza de la extracción
  confianza: number
  errores: string[]
  lado: 'frente' | 'reverso' | 'desconocido'
}

// Estados de México para validación
const ESTADOS_MEXICO: Record<string, string> = {
  'AS': 'Aguascalientes', 'BC': 'Baja California', 'BS': 'Baja California Sur',
  'CC': 'Campeche', 'CL': 'Coahuila', 'CM': 'Colima', 'CS': 'Chiapas',
  'CH': 'Chihuahua', 'DF': 'Ciudad de México', 'DG': 'Durango',
  'GT': 'Guanajuato', 'GR': 'Guerrero', 'HG': 'Hidalgo', 'JC': 'Jalisco',
  'MC': 'México', 'MN': 'Michoacán', 'MS': 'Morelos', 'NT': 'Nayarit',
  'NL': 'Nuevo León', 'OC': 'Oaxaca', 'PL': 'Puebla', 'QT': 'Querétaro',
  'QR': 'Quintana Roo', 'SP': 'San Luis Potosí', 'SL': 'Sinaloa',
  'SR': 'Sonora', 'TC': 'Tabasco', 'TS': 'Tamaulipas', 'TL': 'Tlaxcala',
  'VZ': 'Veracruz', 'YN': 'Yucatán', 'ZS': 'Zacatecas', 'NE': 'Nacido en el Extranjero'
}

// Validar CURP mexicana
export function validarCURP(curp: string): boolean {
  if (!curp || curp.length !== 18) return false
  
  const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/
  return curpRegex.test(curp.toUpperCase())
}

// Extraer fecha de nacimiento del CURP
export function fechaNacimientoDeCURP(curp: string): string | null {
  if (!curp || curp.length < 10) return null
  
  const year = curp.substring(4, 6)
  const month = curp.substring(6, 8)
  const day = curp.substring(8, 10)
  
  // Determinar siglo (asumimos que 00-30 es 2000s, 31-99 es 1900s)
  const yearNum = parseInt(year, 10)
  const fullYear = yearNum <= 30 ? `20${year}` : `19${year}`
  
  // Validar que sea fecha válida
  const fecha = new Date(`${fullYear}-${month}-${day}`)
  if (isNaN(fecha.getTime())) return null
  
  return `${fullYear}-${month}-${day}`
}

// Extraer sexo del CURP
export function sexoDeCURP(curp: string): 'H' | 'M' | null {
  if (!curp || curp.length < 11) return null
  const sexo = curp.charAt(10).toUpperCase()
  return sexo === 'H' || sexo === 'M' ? sexo : null
}

// Extraer estado de nacimiento del CURP
export function estadoNacimientoDeCURP(curp: string): string | null {
  if (!curp || curp.length < 13) return null
  const codigo = curp.substring(11, 13).toUpperCase()
  return ESTADOS_MEXICO[codigo] || null
}

// Limpiar texto OCR
function limpiarTexto(texto: string): string {
  return texto
    .replace(/[^\w\sáéíóúñÁÉÍÓÚÑ.,#-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Buscar patrón CURP en texto
function buscarCURP(texto: string): string | null {
  // Patrón CURP: 4 letras + 6 dígitos + H/M + 5 letras + 1 alfanumérico + 1 dígito
  const curpRegex = /[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d/gi
  const matches = texto.match(curpRegex)
  
  if (matches && matches.length > 0) {
    // Validar cada match
    for (const match of matches) {
      if (validarCURP(match)) {
        return match.toUpperCase()
      }
    }
    // Si ninguno pasa validación estricta, devolver el primero
    return matches[0].toUpperCase()
  }
  return null
}

// Buscar clave de elector
function buscarClaveElector(texto: string): string | null {
  // Clave de elector: 18 caracteres alfanuméricos
  const claveRegex = /[A-Z]{6}\d{8}[A-Z]\d{3}/gi
  const matches = texto.match(claveRegex)
  return matches?.[0]?.toUpperCase() || null
}

// Buscar número de INE (OCR vertical)
function buscarNumeroINE(texto: string): string | null {
  // Buscar patrón de número largo de INE
  const ineRegex = /\d{4}\s*\d{4}\s*\d{4}\s*\d{4}/g
  const matches = texto.match(ineRegex)
  if (matches) {
    return matches[0].replace(/\s/g, '')
  }
  
  // Alternativa: 13 dígitos consecutivos
  const altRegex = /\d{13}/g
  const altMatches = texto.match(altRegex)
  return altMatches?.[0] || null
}

// Buscar fecha en formato DD/MM/AAAA o similar
function buscarFecha(texto: string): string | null {
  // Formatos: DD/MM/AAAA, DD-MM-AAAA, DD.MM.AAAA
  const fechaRegex = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g
  const matches = [...texto.matchAll(fechaRegex)]
  
  for (const match of matches) {
    const dia = match[1].padStart(2, '0')
    const mes = match[2].padStart(2, '0')
    const anio = match[3]
    
    // Validar que sea fecha razonable
    const mesNum = parseInt(mes, 10)
    const diaNum = parseInt(dia, 10)
    const anioNum = parseInt(anio, 10)
    
    if (mesNum >= 1 && mesNum <= 12 && diaNum >= 1 && diaNum <= 31 && anioNum >= 1900 && anioNum <= 2100) {
      return `${anio}-${mes}-${dia}`
    }
  }
  
  return null
}

// Buscar nombres en el texto
function buscarNombres(texto: string, curp?: string): { nombre?: string, apellidoPaterno?: string, apellidoMaterno?: string } {
  const lineas = texto.split('\n').map(l => l.trim()).filter(l => l.length > 2)
  
  // Buscar línea que diga "NOMBRE" seguida del nombre
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i].toUpperCase()
    
    if (linea.includes('NOMBRE')) {
      // El nombre puede estar en la misma línea o en la siguiente
      let nombreLinea = linea.replace(/NOMBRE[S]?:?/gi, '').trim()
      
      if (!nombreLinea && i + 1 < lineas.length) {
        nombreLinea = lineas[i + 1].trim()
      }
      
      if (nombreLinea && nombreLinea.length > 2) {
        const partes = nombreLinea.split(/\s+/)
        if (partes.length >= 2) {
          return {
            nombre: partes.slice(2).join(' ') || partes[0],
            apellidoPaterno: partes[0],
            apellidoMaterno: partes[1] || undefined
          }
        }
      }
    }
  }
  
  // Intentar extraer del CURP si está disponible
  if (curp && curp.length >= 4) {
    // Las primeras 4 letras del CURP son: primera letra apellido paterno + primera vocal apellido paterno + primera letra apellido materno + primera letra nombre
    // Esto solo nos da pistas, no el nombre completo
  }
  
  return {}
}

// Buscar domicilio
function buscarDomicilio(texto: string): INEData['domicilio'] {
  const domicilio: INEData['domicilio'] = {}
  const lineas = texto.split('\n').map(l => l.trim()).filter(l => l.length > 2)
  
  // Buscar código postal
  const cpRegex = /\b(\d{5})\b/g
  const cpMatches = texto.match(cpRegex)
  if (cpMatches) {
    // El CP suele ser el que no es un año
    for (const cp of cpMatches) {
      const num = parseInt(cp, 10)
      if (num >= 1000 && num <= 99999 && num < 1900 || num > 2100) {
        domicilio.codigoPostal = cp
        break
      }
    }
  }
  
  // Buscar patrón "CALLE ... NUM ... COL ..."
  const calleRegex = /(?:CALLE|C\.|CLL?\.?)\s*(.+?)(?:NUM|NO?\.?|#)\s*(\d+[A-Z]?)/gi
  const calleMatch = calleRegex.exec(texto)
  if (calleMatch) {
    domicilio.calle = limpiarTexto(calleMatch[1])
    domicilio.numeroExterior = calleMatch[2]
  }
  
  // Buscar colonia
  const coloniaRegex = /(?:COL\.?|COLONIA)\s*([A-ZÁÉÍÓÚÑ\s]+?)(?:\s*C\.?P\.?|\s*\d{5}|\s*$)/gi
  const coloniaMatch = coloniaRegex.exec(texto)
  if (coloniaMatch) {
    domicilio.colonia = limpiarTexto(coloniaMatch[1])
  }
  
  // Buscar municipio/delegación
  const municipioRegex = /(?:MUNICIPIO|MUN\.?|DELEG\.?|DELEGACIÓN|ALCALDÍA)\s*([A-ZÁÉÍÓÚÑ\s]+?)(?:\s*ESTADO|\s*EDO\.?|\s*$)/gi
  const municipioMatch = municipioRegex.exec(texto)
  if (municipioMatch) {
    domicilio.municipio = limpiarTexto(municipioMatch[1])
  }
  
  // Buscar estado
  for (const [codigo, nombreEstado] of Object.entries(ESTADOS_MEXICO)) {
    if (texto.toUpperCase().includes(nombreEstado.toUpperCase())) {
      domicilio.estado = nombreEstado
      break
    }
  }
  
  // Si encontramos algún dato, construir domicilio completo
  if (Object.keys(domicilio).length > 0) {
    const partes = [
      domicilio.calle,
      domicilio.numeroExterior ? `#${domicilio.numeroExterior}` : null,
      domicilio.colonia ? `Col. ${domicilio.colonia}` : null,
      domicilio.codigoPostal ? `C.P. ${domicilio.codigoPostal}` : null,
      domicilio.municipio,
      domicilio.estado
    ].filter(Boolean)
    
    domicilio.domicilioCompleto = partes.join(', ')
  }
  
  return Object.keys(domicilio).length > 0 ? domicilio : undefined
}

// Determinar si es frente o reverso
function determinarLado(texto: string): 'frente' | 'reverso' | 'desconocido' {
  const textoUpper = texto.toUpperCase()
  
  // Indicadores de frente
  const indicadoresFrente = [
    'INSTITUTO NACIONAL ELECTORAL',
    'CREDENCIAL PARA VOTAR',
    'NOMBRE',
    'DOMICILIO',
    'FECHA DE NACIMIENTO',
    'SEXO',
    'INE',
    'IFE'
  ]
  
  // Indicadores de reverso
  const indicadoresReverso = [
    'CLAVE DE ELECTOR',
    'CURP',
    'AÑO DE REGISTRO',
    'EMISION',
    'VIGENCIA',
    'SECCION',
    'ESTADO',
    'MUNICIPIO'
  ]
  
  let puntosFrente = 0
  let puntosReverso = 0
  
  for (const ind of indicadoresFrente) {
    if (textoUpper.includes(ind)) puntosFrente++
  }
  
  for (const ind of indicadoresReverso) {
    if (textoUpper.includes(ind)) puntosReverso++
  }
  
  if (puntosFrente > puntosReverso) return 'frente'
  if (puntosReverso > puntosFrente) return 'reverso'
  return 'desconocido'
}

/**
 * Parsea texto OCR de una INE y extrae los datos estructurados
 */
export function parseINEFromOCR(textoOCR: string): INEData {
  const errores: string[] = []
  let confianza = 0
  
  // Determinar lado
  const lado = determinarLado(textoOCR)
  
  // Buscar CURP
  const curp = buscarCURP(textoOCR)
  if (curp) {
    confianza += 30
    if (!validarCURP(curp)) {
      errores.push('CURP encontrada pero formato inválido')
      confianza -= 10
    }
  } else {
    errores.push('No se encontró CURP')
  }
  
  // Buscar clave de elector
  const claveElector = buscarClaveElector(textoOCR)
  if (claveElector) confianza += 15
  
  // Buscar número INE
  const numeroINE = buscarNumeroINE(textoOCR)
  if (numeroINE) confianza += 10
  
  // Buscar fecha de nacimiento
  let fechaNacimiento = buscarFecha(textoOCR)
  let fechaNacimientoTexto = fechaNacimiento
  
  // Si no encontramos fecha pero tenemos CURP, extraerla del CURP
  if (!fechaNacimiento && curp) {
    fechaNacimiento = fechaNacimientoDeCURP(curp)
    if (fechaNacimiento) {
      fechaNacimientoTexto = fechaNacimiento
      confianza += 5
    }
  } else if (fechaNacimiento) {
    confianza += 15
  }
  
  // Extraer sexo del CURP
  const sexo = curp ? sexoDeCURP(curp) : null
  if (sexo) confianza += 5
  
  // Extraer estado de nacimiento del CURP
  const estadoNacimiento = curp ? estadoNacimientoDeCURP(curp) : null
  if (estadoNacimiento) confianza += 5
  
  // Buscar nombres
  const nombres = buscarNombres(textoOCR, curp || undefined)
  if (nombres.nombre || nombres.apellidoPaterno) confianza += 10
  
  // Buscar domicilio
  const domicilio = buscarDomicilio(textoOCR)
  if (domicilio && Object.keys(domicilio).length > 0) confianza += 10
  
  // Buscar vigencia
  const vigenciaRegex = /VIGENCIA[:\s]*(\d{4})/gi
  const vigenciaMatch = vigenciaRegex.exec(textoOCR)
  const vigencia = vigenciaMatch?.[1]
  
  // Buscar sección
  const seccionRegex = /SECCI[OÓ]N[:\s]*(\d{4})/gi
  const seccionMatch = seccionRegex.exec(textoOCR)
  const seccion = seccionMatch?.[1]
  
  // Construir nombre completo
  let nombreCompleto: string | undefined
  if (nombres.nombre || nombres.apellidoPaterno || nombres.apellidoMaterno) {
    nombreCompleto = [nombres.apellidoPaterno, nombres.apellidoMaterno, nombres.nombre]
      .filter(Boolean)
      .join(' ')
  }
  
  // Normalizar confianza a 0-100
  confianza = Math.min(100, Math.max(0, confianza))
  
  return {
    curp: curp || undefined,
    claveElector: claveElector || undefined,
    numeroINE: numeroINE || undefined,
    nombre: nombres.nombre,
    apellidoPaterno: nombres.apellidoPaterno,
    apellidoMaterno: nombres.apellidoMaterno,
    nombreCompleto,
    fechaNacimiento: fechaNacimiento || undefined,
    fechaNacimientoTexto: fechaNacimientoTexto || undefined,
    sexo: sexo || undefined,
    estadoNacimiento: estadoNacimiento || undefined,
    domicilio,
    vigencia,
    seccion,
    confianza,
    errores,
    lado
  }
}

/**
 * Combina datos de frente y reverso de INE
 */
export function combinarDatosINE(frente: INEData, reverso: INEData): INEData {
  return {
    // Preferir datos del frente para nombre
    nombre: frente.nombre || reverso.nombre,
    apellidoPaterno: frente.apellidoPaterno || reverso.apellidoPaterno,
    apellidoMaterno: frente.apellidoMaterno || reverso.apellidoMaterno,
    nombreCompleto: frente.nombreCompleto || reverso.nombreCompleto,
    
    // CURP y clave suelen estar en el reverso
    curp: reverso.curp || frente.curp,
    claveElector: reverso.claveElector || frente.claveElector,
    numeroINE: frente.numeroINE || reverso.numeroINE,
    
    // Datos de fechas
    fechaNacimiento: frente.fechaNacimiento || reverso.fechaNacimiento,
    fechaNacimientoTexto: frente.fechaNacimientoTexto || reverso.fechaNacimientoTexto,
    
    // Sexo y estado
    sexo: frente.sexo || reverso.sexo,
    estadoNacimiento: frente.estadoNacimiento || reverso.estadoNacimiento,
    
    // Domicilio puede estar en frente (INE antigua) o reverso
    domicilio: frente.domicilio || reverso.domicilio,
    
    // Otros datos del reverso
    vigencia: reverso.vigencia || frente.vigencia,
    seccion: reverso.seccion || frente.seccion,
    
    // Combinar confianza
    confianza: Math.round((frente.confianza + reverso.confianza) / 2),
    errores: [...frente.errores, ...reverso.errores],
    lado: 'frente' // Resultado combinado
  }
}

/**
 * Valida que los datos extraídos coincidan con los proporcionados por el usuario
 */
export function validarDatosConUsuario(
  datosINE: INEData,
  datosUsuario: {
    nombre?: string
    curp?: string
    fechaNacimiento?: string
  }
): { valido: boolean; coincidencias: string[]; discrepancias: string[] } {
  const coincidencias: string[] = []
  const discrepancias: string[] = []
  
  // Validar CURP
  if (datosINE.curp && datosUsuario.curp) {
    if (datosINE.curp.toUpperCase() === datosUsuario.curp.toUpperCase()) {
      coincidencias.push('CURP coincide')
    } else {
      discrepancias.push(`CURP no coincide: INE=${datosINE.curp}, Usuario=${datosUsuario.curp}`)
    }
  }
  
  // Validar nombre (comparación flexible)
  if (datosINE.nombreCompleto && datosUsuario.nombre) {
    const nombreINE = datosINE.nombreCompleto.toLowerCase().replace(/\s+/g, ' ')
    const nombreUsuario = datosUsuario.nombre.toLowerCase().replace(/\s+/g, ' ')
    
    // Verificar si alguna parte del nombre coincide
    const partesINE = nombreINE.split(' ')
    const partesUsuario = nombreUsuario.split(' ')
    const coincidenciasNombre = partesINE.filter(p => partesUsuario.some(pu => pu.includes(p) || p.includes(pu)))
    
    if (coincidenciasNombre.length >= 2) {
      coincidencias.push('Nombre coincide')
    } else if (coincidenciasNombre.length >= 1) {
      coincidencias.push('Nombre parcialmente coincide')
    } else {
      discrepancias.push('Nombre no coincide')
    }
  }
  
  // Validar fecha de nacimiento
  if (datosINE.fechaNacimiento && datosUsuario.fechaNacimiento) {
    if (datosINE.fechaNacimiento === datosUsuario.fechaNacimiento) {
      coincidencias.push('Fecha de nacimiento coincide')
    } else {
      discrepancias.push('Fecha de nacimiento no coincide')
    }
  }
  
  return {
    valido: discrepancias.length === 0 && coincidencias.length > 0,
    coincidencias,
    discrepancias
  }
}
