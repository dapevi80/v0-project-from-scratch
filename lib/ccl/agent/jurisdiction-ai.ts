'use server'

import { generateText, generateObject } from 'ai'
import { z } from 'zod'
import type { JurisdictionDecision, CasoData } from './agent-types'

/**
 * Motor de decisión de jurisdicción con IA
 * Determina si un caso es de competencia federal o local,
 * y selecciona el CCL correcto basado en la ubicación
 */

const AI_MODEL = 'xai/grok-2-latest'

// Industrias de competencia federal según la Ley Federal del Trabajo
const INDUSTRIAS_FEDERALES = [
  'textil',
  'eléctrica', 'electricidad', 'energia electrica',
  'cinematográfica', 'cine', 'cinematografia',
  'hulera', 'hule', 'caucho',
  'azucarera', 'azucar', 'ingenio',
  'minera', 'mineria', 'minas',
  'metalúrgica', 'metalurgia', 'siderúrgica', 'siderurgia',
  'hidrocarburos', 'petroleo', 'petroquimica', 'gas',
  'petroquímica',
  'cementera', 'cemento',
  'calera', 'cal',
  'automotriz', 'automóviles', 'vehiculos',
  'química', 'quimica', 'farmacéutica', 'farmaceutica',
  'celulosa', 'papel',
  'aceites', 'grasas vegetales',
  'productora de alimentos', 'empacadora',
  'ferrocarriles', 'ferrocarril', 'tren', 'trenes',
  'madera', 'aserraderos',
  'vidriera', 'vidrio',
  'tabacalera', 'tabaco', 'cigarros',
  'banca', 'bancaria', 'banco', 'bancos', 'financiera',
  'credito', 'ahorro',
  'aeronáutica', 'aeronautica', 'aviación', 'aviacion', 'aeropuerto', 'aerolinea',
  'naval', 'maritima', 'puerto', 'portuaria',
  'telecomunicaciones', 'telefonía', 'telefonia', 'internet', 'comunicaciones'
]

// Empresas conocidas de jurisdicción federal
const EMPRESAS_FEDERALES = [
  'pemex', 'petroleos mexicanos',
  'cfe', 'comision federal de electricidad',
  'telmex', 'telefonos de mexico',
  'telcel', 'america movil',
  'bbva', 'bancomer', 'banamex', 'citibanamex', 'santander', 'hsbc', 'banorte', 'scotiabank',
  'aeromexico', 'volaris', 'viva aerobus', 'interjet',
  'ferromex', 'kansas city southern',
  'coca cola', 'pepsi', 'bimbo', 'grupo modelo', 'cerveceria',
  'televisa', 'tv azteca',
  'walmart', 'soriana', 'chedraui', 'oxxo'
]

/**
 * Schema para la respuesta de jurisdicción
 */
const JurisdictionSchema = z.object({
  esFederal: z.boolean().describe('Si el caso es de competencia federal'),
  razon: z.string().describe('Explicación breve de la decisión'),
  industriaDetectada: z.string().optional().describe('Industria federal detectada si aplica'),
  confianza: z.number().min(0).max(1).describe('Nivel de confianza en la decisión (0-1)')
})

/**
 * Determina si un caso es de competencia federal o local
 */
export async function determinarJurisdiccion(caso: CasoData): Promise<JurisdictionDecision> {
  // Primero hacer verificación rápida con palabras clave
  const checkRapido = verificacionRapidaJurisdiccion(caso)
  if (checkRapido.confianza > 0.9) {
    return checkRapido
  }

  // Si no es claro, usar IA para análisis más profundo
  try {
    const { object } = await generateObject({
      model: AI_MODEL,
      schema: JurisdictionSchema,
      prompt: `Analiza este caso laboral y determina si es de competencia FEDERAL o LOCAL.

DATOS DEL CASO:
- Empresa/Patrón: ${caso.empleadorNombre}
- Giro/Industria: ${caso.giroEmpresa || 'No especificado'}
- Puesto del trabajador: ${caso.puestoTrabajo || 'No especificado'}
- Descripción: ${caso.descripcionHechos || 'No especificada'}
- Ubicación: ${caso.empleadorEstado}, ${caso.empleadorCiudad || ''}

CRITERIOS PARA JURISDICCIÓN FEDERAL (Art. 527 LFT):
1. Industrias: textil, eléctrica, cinematográfica, hulera, azucarera, minera, metalúrgica, hidrocarburos, petroquímica, cementera, calera, automotriz, química, celulosa y papel, aceites, alimentos empacados, ferrocarriles, madera básicos, vidriera, tabacalera, banca y crédito.
2. Empresas administradas por el Gobierno Federal
3. Empresas que operan en zonas federales
4. Empresas con contratos o concesiones federales
5. Empresas que trabajan en 2 o más estados

Si la empresa NO está claramente en estas categorías, es competencia LOCAL.

Responde con tu análisis.`
    })

    return {
      esFederal: object.esFederal,
      razon: object.razon,
      industriaDetectada: object.industriaDetectada,
      confianza: object.confianza,
      cclRecomendado: object.esFederal ? 'CFCRL (Federal)' : `CCL ${caso.empleadorEstado}`
    }
  } catch (error) {
    console.error('Error en análisis de jurisdicción con IA:', error)
    // Fallback a verificación por palabras clave
    return verificacionRapidaJurisdiccion(caso)
  }
}

/**
 * Verificación rápida usando palabras clave
 */
function verificacionRapidaJurisdiccion(caso: CasoData): JurisdictionDecision {
  const textoCompleto = `
    ${caso.empleadorNombre} 
    ${caso.giroEmpresa || ''} 
    ${caso.puestoTrabajo || ''} 
    ${caso.descripcionHechos || ''}
  `.toLowerCase()

  // Verificar empresas federales conocidas
  for (const empresa of EMPRESAS_FEDERALES) {
    if (textoCompleto.includes(empresa.toLowerCase())) {
      return {
        esFederal: true,
        razon: `Empresa "${empresa}" identificada como de competencia federal`,
        industriaDetectada: empresa,
        confianza: 0.95,
        cclRecomendado: 'CFCRL (Federal)'
      }
    }
  }

  // Verificar industrias federales
  for (const industria of INDUSTRIAS_FEDERALES) {
    if (textoCompleto.includes(industria.toLowerCase())) {
      return {
        esFederal: true,
        razon: `Industria "${industria}" es de competencia federal según Art. 527 LFT`,
        industriaDetectada: industria,
        confianza: 0.85,
        cclRecomendado: 'CFCRL (Federal)'
      }
    }
  }

  // Por defecto, competencia local
  return {
    esFederal: false,
    razon: 'No se detectó industria o empresa de competencia federal. El caso es de competencia local.',
    confianza: 0.7,
    cclRecomendado: `CCL ${caso.empleadorEstado}`
  }
}

/**
 * Schema para geocodificación
 */
const GeocodingSchema = z.object({
  encontrada: z.boolean(),
  direccionNormalizada: z.string().optional(),
  estado: z.string().optional(),
  ciudad: z.string().optional(),
  codigoPostal: z.string().optional(),
  latitud: z.number().optional(),
  longitud: z.number().optional(),
  cclCercano: z.string().optional(),
  direccionCCL: z.string().optional()
})

/**
 * Geocodifica y normaliza una dirección para determinar el CCL correcto
 */
export async function geocodificarDireccion(direccion: string, estado?: string): Promise<{
  encontrada: boolean
  direccionNormalizada?: string
  estado?: string
  ciudad?: string
  cclCercano?: string
}> {
  if (!direccion || direccion.trim().length < 5) {
    return { encontrada: false }
  }

  try {
    const { object } = await generateObject({
      model: AI_MODEL,
      schema: GeocodingSchema,
      prompt: `Analiza y normaliza esta dirección mexicana para determinar el estado y CCL correspondiente.

DIRECCIÓN A ANALIZAR:
"${direccion}"
${estado ? `Estado proporcionado: ${estado}` : ''}

Tu tarea:
1. Identifica el estado de México donde se ubica esta dirección
2. Identifica la ciudad/municipio
3. Normaliza la dirección (formato estándar)
4. Indica el CCL (Centro de Conciliación Laboral) que le corresponde

IMPORTANTE:
- Los CCL son estatales, cada estado tiene su propio CCL
- Si no puedes determinar el estado con certeza, indica encontrada: false
- La dirección puede estar incompleta o mal escrita

Responde con tu análisis.`
    })

    if (!object.encontrada || !object.estado) {
      return { encontrada: false }
    }

    return {
      encontrada: true,
      direccionNormalizada: object.direccionNormalizada,
      estado: object.estado,
      ciudad: object.ciudad,
      cclCercano: object.cclCercano || `CCL ${object.estado}`
    }
  } catch (error) {
    console.error('Error geocodificando dirección:', error)
    return { encontrada: false }
  }
}

/**
 * Sugiere el CCL más apropiado basado en todos los datos del caso
 */
export async function sugerirCCL(caso: CasoData): Promise<{
  cclRecomendado: string
  estado: string
  razon: string
  alternativas?: string[]
}> {
  // 1. Determinar jurisdicción (federal vs local)
  const jurisdiccion = await determinarJurisdiccion(caso)
  
  if (jurisdiccion.esFederal) {
    return {
      cclRecomendado: 'Centro Federal de Conciliación y Registro Laboral (CFCRL)',
      estado: 'Federal',
      razon: jurisdiccion.razon,
      alternativas: [`CCL ${caso.empleadorEstado} (si el caso no resulta federal)`]
    }
  }

  // 2. Para casos locales, determinar el estado correcto
  let estadoFinal = caso.empleadorEstado

  // Si tenemos dirección del empleador, verificar que el estado coincida
  if (caso.empleadorDomicilio) {
    const geo = await geocodificarDireccion(caso.empleadorDomicilio, caso.empleadorEstado)
    if (geo.encontrada && geo.estado) {
      estadoFinal = geo.estado
    }
  }

  return {
    cclRecomendado: `Centro de Conciliación Laboral de ${estadoFinal}`,
    estado: estadoFinal,
    razon: `El caso es de competencia local. Se presenta ante el CCL de ${estadoFinal} por ser el lugar donde se prestan/prestaron los servicios.`,
    alternativas: caso.trabajadorEstado && caso.trabajadorEstado !== estadoFinal 
      ? [`CCL ${caso.trabajadorEstado} (domicilio del trabajador)`]
      : undefined
  }
}

/**
 * Valida si los datos del caso son suficientes para presentar solicitud
 */
export async function validarDatosParaSolicitud(caso: CasoData): Promise<{
  valido: boolean
  errores: string[]
  advertencias: string[]
  camposFaltantes: string[]
}> {
  const errores: string[] = []
  const advertencias: string[] = []
  const camposFaltantes: string[] = []

  // Campos obligatorios del trabajador
  if (!caso.trabajadorNombre) {
    errores.push('Falta nombre del trabajador')
    camposFaltantes.push('trabajadorNombre')
  }
  if (!caso.trabajadorCurp) {
    advertencias.push('CURP del trabajador no proporcionada - puede ser requerida en algunos estados')
    camposFaltantes.push('trabajadorCurp')
  }

  // Campos obligatorios del empleador
  if (!caso.empleadorNombre) {
    errores.push('Falta nombre del empleador/empresa')
    camposFaltantes.push('empleadorNombre')
  }
  if (!caso.empleadorEstado) {
    errores.push('Falta estado donde se ubica el empleador')
    camposFaltantes.push('empleadorEstado')
  }

  // Campos de la relación laboral
  if (!caso.fechaTerminacion) {
    errores.push('Falta fecha de terminación de la relación laboral')
    camposFaltantes.push('fechaTerminacion')
  }

  // Verificar prescripción
  if (caso.fechaTerminacion) {
    const fechaTerm = new Date(caso.fechaTerminacion)
    const hoy = new Date()
    const diasTranscurridos = Math.floor((hoy.getTime() - fechaTerm.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diasTranscurridos > 60) {
      errores.push(`Han transcurrido ${diasTranscurridos} días desde la terminación. El plazo de prescripción (60 días) ha vencido.`)
    } else if (diasTranscurridos > 45) {
      advertencias.push(`Quedan solo ${60 - diasTranscurridos} días antes de que prescriba. ¡Urgente!`)
    }
  }

  // Tipo de persona del citado
  if (!caso.citadoTipoPersona) {
    advertencias.push('No se especificó si el demandado es persona física o moral')
    camposFaltantes.push('citadoTipoPersona')
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
    camposFaltantes
  }
}
