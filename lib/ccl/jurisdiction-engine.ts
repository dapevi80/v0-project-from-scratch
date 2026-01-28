// Motor de Jurisdiccion CCL - Determina competencia federal/local y CCL correspondiente
import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { ESTADOS_MEXICO } from './constants'

export interface JurisdiccionInput {
  estadoCentroTrabajo: string
  municipioCentroTrabajo?: string
  direccionCentroTrabajo: string
  coordenadas?: { lat: number; lng: number }
  industriaPatronClave?: string // Si es null, se asume local
}

export interface JurisdiccionResult {
  competencia: 'federal' | 'local'
  industriaFederal?: {
    clave: string
    nombre: string
    descripcion: string
  }
  centroConciliacion: {
    id: string
    nombre: string
    direccion: string
    municipio: string
    codigoPostal: string
    telefono: string
    portalUrl: string
    sistema: string
    horario: string
    coordenadas?: { lat: number; lng: number }
  }
  estado: string
  claveEstado: string
}

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

// Normaliza el nombre del estado
function normalizarEstado(estado: string): string {
  const normalized = estado
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
  
  // Buscar coincidencia exacta o parcial
  for (const [nombre, clave] of Object.entries(ESTADOS_MEXICO)) {
    const nombreNorm = nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (nombreNorm.toLowerCase() === normalized.toLowerCase()) {
      return nombre
    }
  }
  
  return estado
}

// Determina jurisdiccion basado en el centro de trabajo
export async function determinarJurisdiccion(
  input: JurisdiccionInput
): Promise<{ error: string | null; data: JurisdiccionResult | null }> {
  const supabase = await createClient()
  
  const estadoNormalizado = normalizarEstado(input.estadoCentroTrabajo)
  const claveEstado = ESTADOS_MEXICO[estadoNormalizado]
  
  if (!claveEstado) {
    return { error: `Estado no reconocido: ${input.estadoCentroTrabajo}`, data: null }
  }
  
  // Determinar competencia
  let competencia: 'federal' | 'local' = 'local'
  let industriaFederal = null
  
  if (input.industriaPatronClave && input.industriaPatronClave !== 'ninguna') {
    // Verificar que la industria existe
    const { data: industria } = await supabase
      .from('industrias_federales')
      .select('*')
      .eq('clave', input.industriaPatronClave)
      .eq('activo', true)
      .limit(1)
    
    if (industria && industria.length > 0) {
      competencia = 'federal'
      industriaFederal = {
        clave: industria[0].clave,
        nombre: industria[0].nombre,
        descripcion: industria[0].descripcion
      }
    }
  }
  
  // Obtener CCL correspondiente
  const { data: ccls } = await supabase
    .from('centros_conciliacion')
    .select('*')
    .eq('clave_estado', competencia === 'federal' ? 'FED' : claveEstado)
    .eq('tipo', competencia)
    .eq('activo', true)
    .limit(1)
  
  if (!ccls || ccls.length === 0) {
    return { error: `No se encontro CCL para ${estadoNormalizado}`, data: null }
  }
  
  const ccl = ccls[0]
  
  return {
    error: null,
    data: {
      competencia,
      industriaFederal: industriaFederal || undefined,
      centroConciliacion: {
        id: ccl.id,
        nombre: ccl.nombre,
        direccion: ccl.direccion,
        municipio: ccl.municipio || '',
        codigoPostal: ccl.codigo_postal || '',
        telefono: ccl.telefono || '',
        portalUrl: ccl.portal_url || '',
        sistema: ccl.sistema,
        horario: ccl.horario || '',
        coordenadas: ccl.coordenadas
      },
      estado: estadoNormalizado,
      claveEstado
    }
  }
}

// Obtener todas las industrias federales para el selector
export async function obtenerIndustriasFederales() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('industrias_federales')
    .select('clave, nombre, descripcion, ejemplos')
    .eq('activo', true)
    .order('nombre')
  
  if (error) {
    return { error: error.message, data: null }
  }
  
  return { error: null, data }
}

// Obtener todos los CCL para mostrar en mapa o lista
export async function obtenerCentrosConciliacion(tipo?: 'local' | 'federal') {
  const supabase = await createClient()
  
  let query = supabase
    .from('centros_conciliacion')
    .select('*')
    .eq('activo', true)
    .order('estado')
  
  if (tipo) {
    query = query.eq('tipo', tipo)
  }
  
  const { data, error } = await query
  
  if (error) {
    return { error: error.message, data: null }
  }
  
  return { error: null, data }
}

// Calcular siguiente dia habil
export async function calcularSiguienteDiaHabil(
  fechaInicio: Date = new Date(),
  diasHabilesAdelante: number = 1
): Promise<Date> {
  const supabase = await createClient()
  
  // Obtener dias inhabiles del ano actual y siguiente
  const anioActual = fechaInicio.getFullYear()
  const { data: diasInhabiles } = await supabase
    .from('dias_inhabiles')
    .select('fecha')
    .gte('anio', anioActual)
    .lte('anio', anioActual + 1)
  
  const fechasInhabiles = new Set(
    (diasInhabiles || []).map(d => d.fecha)
  )
  
  let fecha = new Date(fechaInicio)
  let diasContados = 0
  
  while (diasContados < diasHabilesAdelante) {
    fecha.setDate(fecha.getDate() + 1)
    
    const diaSemana = fecha.getDay()
    const fechaStr = fecha.toISOString().split('T')[0]
    
    // Si es dia habil (no fin de semana, no inhabil)
    if (diaSemana !== 0 && diaSemana !== 6 && !fechasInhabiles.has(fechaStr)) {
      diasContados++
    }
  }
  
  return fecha
}
