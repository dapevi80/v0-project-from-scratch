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
  
  // Obtener proxy para el estado
  const { error: proxyError, proxy } = await obtenerProxyDisponible(solicitud.estado_ccl)
  if (proxyError || !proxy) {
    return { error: proxyError || 'No hay proxies disponibles', data: null }
  }
  
  // Actualizar estado a generando
  await supabase
    .from('solicitudes_ccl')
    .update({ 
      status: 'generando',
      tipo: 'automatico',
      proxy_ip_usado: proxy.proxyUrl,
      proxy_region: proxy.region
    })
    .eq('id', solicitudId)
  
  try {
    // TODO: Aqui iria la logica de Playwright para llenar el formulario
    // Por ahora simulamos el proceso
    
    // Calcular cita para siguiente dia habil
    const citaRatificacion = await calcularSiguienteDiaHabil(new Date(), 1)
    
    // Simular folio generado
    const folio = `${solicitud.estado_ccl.substring(0, 3).toUpperCase()}-2026-${Date.now().toString().slice(-6)}`
    
    // Actualizar solicitud con datos de exito
    const { data: solicitudActualizada, error: updateError } = await supabase
      .from('solicitudes_ccl')
      .update({
        status: 'completado',
        folio_ccl: folio,
        cita_ratificacion: citaRatificacion.toISOString(),
        credito_usado: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', solicitudId)
      .select()
      .single()
    
    if (updateError) throw updateError
    
    // Descontar credito
    await supabase.rpc('descontar_credito_ccl', { abogado_id: user.id })
    
    // Registrar uso de proxy
    await registrarUsoProxy(proxy.proxyId)
    
    revalidatePath('/oficina-virtual/ccl')
    
    return { 
      error: null, 
      data: {
        solicitud: solicitudActualizada,
        folio,
        citaRatificacion: citaRatificacion.toISOString()
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
    
    return { error: 'Error al generar solicitud automatica', data: null }
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
