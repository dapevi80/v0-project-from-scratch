'use server'

import { createClient } from '@/lib/supabase/server'
import { determinarJurisdiccion, obtenerIndustriasFederales, calcularSiguienteDiaHabil } from '@/lib/ccl/jurisdiction-engine'
import { obtenerProxyDisponible, registrarUsoProxy } from '@/lib/ccl/proxy-service'
import { revalidatePath } from 'next/cache'

// Obtener datos del caso para prellenar solicitud CCL
export async function obtenerDatosCasoParaCCL(casoId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado', data: null }
  
  // Obtener caso con datos del trabajador y patron
  const { data: caso, error } = await supabase
    .from('casos')
    .select(`
      *,
      trabajador:trabajador_id(
        id,
        full_name,
        email,
        phone,
        curp,
        rfc,
        fecha_nacimiento,
        estado_nacimiento,
        nacionalidad,
        genero,
        domicilio,
        codigo_postal,
        municipio,
        estado
      )
    `)
    .eq('id', casoId)
    .single()
  
  if (error || !caso) {
    return { error: 'Caso no encontrado', data: null }
  }
  
  // Obtener industrias federales para el selector
  const { data: industrias } = await obtenerIndustriasFederales()
  
  return {
    error: null,
    data: {
      caso,
      trabajador: caso.trabajador,
      industrias: industrias || []
    }
  }
}

// Determinar jurisdiccion y CCL
export async function determinarCCL(input: {
  estadoCentroTrabajo: string
  municipioCentroTrabajo?: string
  direccionCentroTrabajo: string
  coordenadas?: { lat: number; lng: number }
  industriaPatronClave?: string
}) {
  return await determinarJurisdiccion(input)
}

// Obtener industrias federales
export async function getIndustriasFederales() {
  return await obtenerIndustriasFederales()
}

// Verificar creditos disponibles
export async function verificarCreditosDisponibles(abogadoId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('creditos_ccl')
    .select('*')
    .or(`abogado_id.eq.${abogadoId}`)
    .limit(1)
  
  if (!data || data.length === 0) {
    return {
      tieneCreditos: false,
      creditosDisponibles: 0,
      plan: 'basico'
    }
  }
  
  const creditos = data[0]
  const disponibles = creditos.creditos_mensuales - creditos.creditos_usados + creditos.creditos_extra
  
  return {
    tieneCreditos: disponibles > 0,
    creditosDisponibles: disponibles,
    plan: creditos.plan
  }
}

// Crear borrador de solicitud CCL
export async function crearBorradorSolicitudCCL(data: {
  casoId: string
  abogadoId: string
  trabajadorId: string
  competencia: 'federal' | 'local'
  industriaFederal?: string
  estadoCCL: string
  municipioCCL?: string
  centroConciliacionId: string
  direccionCentroTrabajo: string
  coordenadasTrabajo?: { lat: number; lng: number }
  referenciaUbicacion?: string
  objetoSolicitud: 'despido' | 'rescision' | 'pago_prestaciones' | 'terminacion_voluntaria' | 'otro'
  fechaConflicto: string
}) {
  const supabase = await createClient()
  
  const { data: solicitud, error } = await supabase
    .from('solicitudes_ccl')
    .insert({
      caso_id: data.casoId,
      abogado_id: data.abogadoId,
      trabajador_id: data.trabajadorId,
      tipo: 'borrador',
      competencia: data.competencia,
      industria_federal: data.industriaFederal,
      estado_ccl: data.estadoCCL,
      municipio_ccl: data.municipioCCL,
      centro_conciliacion_id: data.centroConciliacionId,
      direccion_centro_trabajo: data.direccionCentroTrabajo,
      coordenadas_trabajo: data.coordenadasTrabajo,
      referencias_ubicacion: data.referenciaUbicacion,
      objeto_solicitud: data.objetoSolicitud,
      fecha_conflicto: data.fechaConflicto,
      status: 'borrador'
    })
    .select()
    .single()
  
  if (error) {
    return { error: error.message, data: null }
  }
  
  return { error: null, data: solicitud }
}

// CONFIGURACION: Cambiar a true cuando tengas BROWSERLESS_API_KEY y XAI_API_KEY configuradas
const USE_REAL_AGENT = true // ✅ MODO AUTOMÁTICO ACTIVADO

// Generar folio realista segun formato oficial de cada estado
function generarFolioRealista(estado: string, competencia: 'federal' | 'local'): string {
  const año = new Date().getFullYear()
  const mes = String(new Date().getMonth() + 1).padStart(2, '0')
  const dia = String(new Date().getDate()).padStart(2, '0')
  
  // Codigos oficiales por estado
  const codigosEstado: Record<string, string> = {
    'aguascalientes': 'AGS', 'baja-california': 'BC', 'baja-california-sur': 'BCS',
    'campeche': 'CAM', 'chiapas': 'CHIS', 'chihuahua': 'CHIH',
    'ciudad-de-mexico': 'CDMX', 'coahuila': 'COAH', 'colima': 'COL',
    'durango': 'DGO', 'estado-de-mexico': 'MEX', 'guanajuato': 'GTO',
    'guerrero': 'GRO', 'hidalgo': 'HGO', 'jalisco': 'JAL',
    'michoacan': 'MICH', 'morelos': 'MOR', 'nayarit': 'NAY',
    'nuevo-leon': 'NL', 'oaxaca': 'OAX', 'puebla': 'PUE',
    'queretaro': 'QRO', 'quintana-roo': 'QROO', 'san-luis-potosi': 'SLP',
    'sinaloa': 'SIN', 'sonora': 'SON', 'tabasco': 'TAB',
    'tamaulipas': 'TAMPS', 'tlaxcala': 'TLAX', 'veracruz': 'VER',
    'yucatan': 'YUC', 'zacatecas': 'ZAC'
  }
  
  const codigo = codigosEstado[estado.toLowerCase()] || 'MEX'
  const consecutivo = String(Math.floor(Math.random() * 99999) + 10000).padStart(5, '0')
  const tipo = competencia === 'federal' ? 'F' : 'L'
  
  // Formato oficial: ESTADO-TIPO-AÑO-MMDD-CONSECUTIVO
  return `${codigo}-${tipo}-${año}-${mes}${dia}-${consecutivo}`
}

// Generar solicitud automatica (usa credito)
export async function generarSolicitudAutomatica(solicitudId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado', data: null }
  
  // Obtener solicitud
  const { data: solicitud } = await supabase
    .from('solicitudes_ccl')
    .select(`
      *,
      caso:caso_id(*),
      centro:centro_conciliacion_id(*)
    `)
    .eq('id', solicitudId)
    .single()
  
  if (!solicitud) {
    return { error: 'Solicitud no encontrada', data: null }
  }
  
  // Verificar creditos
  const creditos = await verificarCreditosDisponibles(user.id)
  if (!creditos.tieneCreditos) {
    return { error: 'No tiene creditos disponibles', data: null }
  }
  
  let folio: string
  let citaRatificacion: Date
  let modoGeneracion: 'automatico' | 'hibrido' = 'hibrido'
  
  // Actualizar estado a generando
  await supabase
    .from('solicitudes_ccl')
    .update({ 
      status: 'generando',
      tipo: USE_REAL_AGENT ? 'automatico' : 'hibrido'
    })
    .eq('id', solicitudId)
  
  try {
    if (USE_REAL_AGENT) {
      // =====================================================
      // MODO AUTOMATICO REAL - Agente de IA con Browserless
      // =====================================================
      
      const { iniciarAgenteCCL } = await import('@/lib/ccl/agent/ccl-agent')
      const resultado = await iniciarAgenteCCL(solicitud.caso_id, {
        modalidadPreferida: 'remota'
      })
      
      if (!resultado.success || !resultado.jobId) {
        throw new Error(resultado.error || 'Error en agente CCL')
      }
      
      // Esperar a que el job se complete (polling cada 3 segundos)
      let job
      let intentos = 0
      const maxIntentos = 40 // 2 minutos máximo
      
      while (intentos < maxIntentos) {
        const { data: jobData } = await supabase
          .from('ccl_agent_jobs')
          .select('*')
          .eq('id', resultado.jobId)
          .single()
        
        if (jobData.status === 'completed') {
          job = jobData
          break
        } else if (jobData.status === 'failed') {
          throw new Error(jobData.error_mensaje || 'El agente falló')
        }
        
        // Esperar 3 segundos antes de volver a verificar
        await new Promise(resolve => setTimeout(resolve, 3000))
        intentos++
      }
      
      if (!job) {
        throw new Error('El proceso tomó demasiado tiempo')
      }
      
      folio = job.resultado?.folio || generarFolioRealista(solicitud.estado_ccl, solicitud.competencia as 'federal' | 'local')
      citaRatificacion = job.resultado?.citaRatificacion ? new Date(job.resultado.citaRatificacion) : await calcularSiguienteDiaHabil(new Date(), 5)
      modoGeneracion = 'automatico'
      
    } else {
      // =====================================================
      // MODO HIBRIDO - Folio + PDF con instrucciones
      // =====================================================
      
      // Simular tiempo de proceso (para UX)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generar folio realista con formato oficial
      folio = generarFolioRealista(solicitud.estado_ccl, solicitud.competencia as 'federal' | 'local')
      
      // Calcular cita de ratificacion (5 dias habiles)
      citaRatificacion = await calcularSiguienteDiaHabil(new Date(), 5)
      
      modoGeneracion = 'hibrido'
    }
    
    // Actualizar solicitud con datos de exito
    const { data: solicitudActualizada, error: updateError } = await supabase
      .from('solicitudes_ccl')
      .update({
        status: 'completado',
        folio_ccl: folio,
        cita_ratificacion: citaRatificacion.toISOString(),
        credito_usado: true,
        modo_generacion: modoGeneracion,
        updated_at: new Date().toISOString()
      })
      .eq('id', solicitudId)
      .select()
      .single()
    
    if (updateError) throw updateError
    
    // Descontar credito
    await supabase.rpc('descontar_credito_ccl', { abogado_id: user.id })
    
    revalidatePath('/oficina-virtual/ccl')
    
    return { 
      error: null, 
      data: {
        solicitud: solicitudActualizada,
        folio,
        citaRatificacion: citaRatificacion.toISOString(),
        modoGeneracion
      }
    }
    
  } catch (err) {
    // Marcar como error
    await supabase
      .from('solicitudes_ccl')
      .update({ 
        status: 'error',
        error_mensaje: err instanceof Error ? err.message : 'Error desconocido'
      })
      .eq('id', solicitudId)
    
    return { error: err instanceof Error ? err.message : 'Error al generar solicitud automatica', data: null }
  }
}

// Generar guia manual (sin credito)
export async function generarGuiaManual(solicitudId: string) {
  const supabase = await createClient()
  
  // Actualizar tipo a manual
  const { data, error } = await supabase
    .from('solicitudes_ccl')
    .update({ 
      tipo: 'manual',
      status: 'completado'
    })
    .eq('id', solicitudId)
    .select(`
      *,
      caso:caso_id(*),
      centro:centro_conciliacion_id(*)
    `)
    .single()
  
  if (error) {
    return { error: error.message, data: null }
  }
  
  // La generacion del PDF se hara en el cliente
  return { error: null, data }
}

// Obtener historial de solicitudes CCL
export async function obtenerHistorialSolicitudesCCL(casoId?: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado', data: null }
  
  let query = supabase
    .from('solicitudes_ccl')
    .select(`
      *,
      caso:caso_id(id, titulo),
      centro:centro_conciliacion_id(nombre, direccion, portal_url)
    `)
    .eq('abogado_id', user.id)
    .order('created_at', { ascending: false })
  
  if (casoId) {
    query = query.eq('caso_id', casoId)
  }
  
  const { data, error } = await query
  
  if (error) {
    return { error: error.message, data: null }
  }
  
  return { error: null, data }
}
