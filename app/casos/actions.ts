'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CalculoLiquidacion, Caso } from './helpers'

// Obtener calculos completos del usuario que pueden convertirse en casos
export async function obtenerCalculosParaCasos() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  // Obtener calculos completos (con datos de empresa y despido) que estan listos para caso
  const { data: calculos, error: calculosError } = await supabase
    .from('calculos_liquidacion')
    .select('*')
    .eq('user_id', user.id)
    .eq('listo_para_caso', true)
    .order('created_at', { ascending: false })
  
  if (calculosError) {
    console.error('Error obteniendo calculos:', calculosError)
    return { error: calculosError.message, data: null }
  }
  
  // Obtener IDs de calculos que ya tienen caso
  const { data: casosExistentes } = await supabase
    .from('casos')
    .select('calculo_id')
    .eq('worker_id', user.id)
    .not('calculo_id', 'is', null)
  
  const calculosConCaso = new Set(casosExistentes?.map(c => c.calculo_id) || [])
  
  // Filtrar calculos sin caso
  const calculosSinCaso = calculos?.filter(c => !calculosConCaso.has(c.id)) || []
  
  return { error: null, data: calculosSinCaso as CalculoLiquidacion[], todos: calculos as CalculoLiquidacion[] }
}

// Obtener mis casos (basados en calculos)
export async function obtenerMisCasos(filtros?: { 
  status?: string
  busqueda?: string
  categoria?: string
  incluirArchivados?: boolean 
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  let query = supabase
    .from('casos')
    .select(`
      *,
      calculo:calculos_liquidacion(*),
      case_messages(id, read_by_worker_at, created_at),
      case_events(id, title, starts_at, event_type)
    `)
    .eq('worker_id', user.id)
    .order('updated_at', { ascending: false })
  
  // Por defecto no incluir archivados, a menos que se solicite
  if (!filtros?.incluirArchivados) {
    query = query.eq('archivado', false)
  }
  
  if (filtros?.status && filtros.status !== 'all') {
    query = query.eq('status', filtros.status)
  }
  
  if (filtros?.categoria && filtros.categoria !== 'todos') {
    query = query.eq('categoria', filtros.categoria)
  }
  
  if (filtros?.busqueda) {
    query = query.or(`empresa_nombre.ilike.%${filtros.busqueda}%,folio.ilike.%${filtros.busqueda}%`)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error obteniendo casos:', error)
    return { error: error.message, data: null }
  }
  
  // Obtener datos de abogados por separado
  const lawyerIds = [...new Set(data?.map(c => c.lawyer_id).filter(Boolean) || [])]
  let abogadosMap: Record<string, { id: string; full_name: string; email: string }> = {}
  
  if (lawyerIds.length > 0) {
    const { data: abogados } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', lawyerIds)
    
    abogadosMap = Object.fromEntries(abogados?.map(a => [a.id, a]) || [])
  }
  
  // Procesar datos para agregar campos computados
  const casosConExtras = data?.map(caso => {
    const unreadMessages = caso.case_messages?.filter((m: { read_by_worker_at: string | null }) => !m.read_by_worker_at).length || 0
    const futureEvents = caso.case_events
      ?.filter((e: { starts_at: string }) => new Date(e.starts_at) >= new Date())
      .sort((a: { starts_at: string }, b: { starts_at: string }) => 
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      )
    const nextEvent = futureEvents?.[0] || null
    
    return {
      ...caso,
      abogado: caso.lawyer_id ? abogadosMap[caso.lawyer_id] || null : null,
      unread_messages: unreadMessages,
      next_event: nextEvent ? {
        id: nextEvent.id,
        title: nextEvent.title,
        event_date: nextEvent.starts_at,
        event_type: nextEvent.event_type
      } : null,
      case_messages: undefined,
      case_events: undefined
    }
  })
  
  return { error: null, data: casosConExtras as Caso[] }
}

// Obtener estadisticas de casos por categoria
export async function obtenerEstadisticasCasos() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  const { data, error } = await supabase
    .from('casos')
    .select('status, categoria, monto_estimado, monto_final, oferta_empresa, archivado, es_referido')
    .eq('worker_id', user.id)
  
  if (error) {
    console.error('Error obteniendo estadisticas:', error)
    return { error: error.message, data: null }
  }
  
  // Estadisticas generales
  const total = data?.filter(c => !c.archivado).length || 0
  const activos = data?.filter(c => !c.archivado && !['resolved', 'closed'].includes(c.status)).length || 0
  const resueltos = data?.filter(c => c.categoria === 'concluido' || c.status === 'resolved').length || 0
  const montoTotalEstimado = data?.filter(c => !c.archivado).reduce((acc, c) => acc + (Number(c.monto_estimado) || 0), 0) || 0
  const montoTotalOfertas = data?.filter(c => !c.archivado).reduce((acc, c) => acc + (Number(c.oferta_empresa) || 0), 0) || 0
  
  // Conteo por categoria
  const porCategoria: Record<string, number> = {
    nuevo: data?.filter(c => c.categoria === 'nuevo' && !c.archivado).length || 0,
    por_preaprobar: data?.filter(c => c.categoria === 'por_preaprobar' && !c.archivado).length || 0,
    asignado: data?.filter(c => c.categoria === 'asignado' && !c.archivado).length || 0,
    conciliacion: data?.filter(c => c.categoria === 'conciliacion' && !c.archivado).length || 0,
    juicio: data?.filter(c => c.categoria === 'juicio' && !c.archivado).length || 0,
    concluido: data?.filter(c => c.categoria === 'concluido' && !c.archivado).length || 0,
    referido: data?.filter(c => c.es_referido && !c.archivado).length || 0,
    archivado: data?.filter(c => c.archivado).length || 0
  }
  
  return { 
    error: null, 
    data: { total, activos, resueltos, montoTotalEstimado, montoTotalOfertas, porCategoria } 
  }
}

// Crear caso desde calculo
export async function crearCasoDesdeCalculo(calculoId: string, datos: {
  empresa_nombre: string
  empresa_rfc?: string
  ciudad?: string
  estado?: string
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  // Obtener el calculo
  const { data: calculo, error: calculoError } = await supabase
    .from('calculos_liquidacion')
    .select('*')
    .eq('id', calculoId)
    .eq('user_id', user.id)
    .single()
  
  if (calculoError || !calculo) {
    return { error: 'Calculo no encontrado', data: null }
  }
  
  // Generar folio unico
  const folio = `MC-${Date.now().toString(36).toUpperCase()}`
  
  const { data, error } = await supabase
    .from('casos')
    .insert({
      folio,
      worker_id: user.id,
      calculo_id: calculoId,
      status: 'pending_review',
      empresa_nombre: datos.empresa_nombre,
      empresa_rfc: datos.empresa_rfc,
      ciudad: datos.ciudad,
      estado: datos.estado,
      monto_estimado: calculo.total_conciliacion || calculo.total_juicio,
      prioridad: 'normal'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creando caso:', error)
    return { error: error.message, data: null }
  }
  
  revalidatePath('/casos')
  return { error: null, data }
}

// Obtener detalle de un caso
export async function obtenerCaso(casoId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  const { data, error } = await supabase
    .from('casos')
    .select(`
      *,
      calculo:calculos_liquidacion(*),
      abogado:profiles!casos_lawyer_id_fkey(id, full_name, email)
    `)
    .eq('id', casoId)
    .eq('worker_id', user.id)
    .single()
  
  if (error) {
    console.error('Error obteniendo caso:', error)
    return { error: error.message, data: null }
  }
  
  return { error: null, data: data as Caso }
}

// Obtener mensajes de un caso
export async function obtenerMensajes(casoId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  const { data, error } = await supabase
    .from('case_messages')
    .select(`
      *,
      sender:profiles!case_messages_sender_id_fkey(id, full_name, role)
    `)
    .eq('case_id', casoId)
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error obteniendo mensajes:', error)
    return { error: error.message, data: null }
  }
  
  return { error: null, data }
}

// Enviar mensaje
export async function enviarMensaje(casoId: string, body: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  const { data, error } = await supabase
    .from('case_messages')
    .insert({
      case_id: casoId,
      sender_id: user.id,
      sender_role: profile?.role || 'worker',
      body
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error enviando mensaje:', error)
    return { error: error.message, data: null }
  }
  
  revalidatePath(`/caso/${casoId}`)
  return { error: null, data }
}

// Marcar mensajes como leidos
export async function marcarMensajesLeidos(casoId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  const isWorker = profile?.role === 'worker' || profile?.role === 'guest'
  
  const { error } = await supabase
    .from('case_messages')
    .update(isWorker ? { read_by_worker_at: new Date().toISOString() } : { read_by_lawyer_at: new Date().toISOString() })
    .eq('case_id', casoId)
    .neq('sender_id', user.id)
  
  if (error) {
    console.error('Error marcando mensajes:', error)
    return { error: error.message }
  }
  
  return { error: null }
}

// Obtener eventos de un caso
export async function obtenerEventos(casoId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  const { data, error } = await supabase
    .from('case_events')
    .select('*')
    .eq('case_id', casoId)
    .order('starts_at', { ascending: true })
  
  if (error) {
    console.error('Error obteniendo eventos:', error)
    return { error: error.message, data: null }
  }
  
  return { error: null, data }
}

// Crear caso (sin calculo vinculado)
export async function crearCaso(datos: {
  empresa_nombre: string
  empresa_rfc?: string
  ciudad?: string
  estado?: string
  monto_estimado?: number
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  const folio = `MC-${Date.now().toString(36).toUpperCase()}`
  
  const { data, error } = await supabase
    .from('casos')
    .insert({
      folio,
      worker_id: user.id,
      status: 'draft',
      empresa_nombre: datos.empresa_nombre,
      empresa_rfc: datos.empresa_rfc,
      ciudad: datos.ciudad,
      estado: datos.estado,
      monto_estimado: datos.monto_estimado,
      prioridad: 'normal'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creando caso:', error)
    return { error: error.message, data: null }
  }
  
  revalidatePath('/casos')
  return { error: null, data }
}

// Obtener documentos de un caso
export async function obtenerDocumentosCaso(casoId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  const { data, error } = await supabase
    .from('case_documents')
    .select('*')
    .eq('case_id', casoId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error obteniendo documentos:', error)
    return { error: error.message, data: null }
  }
  
  return { error: null, data }
}

// Archivar/Desarchivar caso
export async function archivarCaso(casoId: string, archivar: boolean = true) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  
  const { error } = await supabase
    .from('casos')
    .update({
      archivado: archivar,
      archivado_at: archivar ? new Date().toISOString() : null,
      categoria: archivar ? 'archivado' : 'nuevo'
    })
    .eq('id', casoId)
    .eq('worker_id', user.id)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/casos')
  return { error: null }
}

// Crear caso automaticamente desde calculo completo
export async function crearCasoDesdeCalculoCompleto(calculoId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  // Obtener el calculo
  const { data: calculo, error: calculoError } = await supabase
    .from('calculos_liquidacion')
    .select('*')
    .eq('id', calculoId)
    .eq('user_id', user.id)
    .single()
  
  if (calculoError || !calculo) {
    return { error: 'Calculo no encontrado', data: null }
  }
  
  // Verificar que el calculo tiene datos completos
  if (!calculo.empresa_nombre || !calculo.fecha_despido) {
    return { error: 'El calculo no tiene datos completos', data: null }
  }
  
  // Verificar que no exista ya un caso para este calculo
  const { data: casoExistente } = await supabase
    .from('casos')
    .select('id')
    .eq('calculo_id', calculoId)
    .single()
  
  if (casoExistente) {
    return { error: 'Ya existe un caso para esta cotizacion', data: null }
  }
  
  // Generar folio consecutivo
  const { count } = await supabase
    .from('casos')
    .select('*', { count: 'exact', head: true })
  
  const numeroConsecutivo = (count || 0) + 1
  const folio = `MC-${new Date().getFullYear()}-${String(numeroConsecutivo).padStart(4, '0')}`
  
  // Calcular fecha limite de prescripcion (60 dias para despido, 30 para rescision)
  const fechaDespido = new Date(calculo.fecha_despido)
  const diasPrescripcion = calculo.motivo_separacion === 'rescision_trabajador' ? 30 : 60
  const fechaLimitePrescripcion = new Date(fechaDespido)
  fechaLimitePrescripcion.setDate(fechaLimitePrescripcion.getDate() + diasPrescripcion)
  
  // Crear el caso
  const { data: nuevoCaso, error } = await supabase
    .from('casos')
    .insert({
      folio,
      worker_id: user.id,
      calculo_id: calculoId,
      status: 'draft',
      categoria: 'nuevo',
      empresa_nombre: calculo.empresa_nombre,
      empresa_rfc: calculo.empresa_rfc,
      ciudad: calculo.ciudad,
      estado: calculo.estado,
      monto_estimado: calculo.total_conciliacion,
      prioridad: 'normal',
      tipo_caso: calculo.motivo_separacion === 'rescision_trabajador' ? 'rescision' : 'despido',
      dias_prescripcion: diasPrescripcion,
      fecha_limite_prescripcion: fechaLimitePrescripcion.toISOString().split('T')[0],
      fecha_despido: calculo.fecha_despido,
      direccion_trabajo_calle: calculo.direccion_trabajo,
      direccion_trabajo_estado: calculo.estado,
      direccion_trabajo_municipio: calculo.ciudad,
      puesto_trabajo: calculo.puesto,
      tipo_jornada: calculo.tipo_jornada,
      tipo_contrato: calculo.tipo_contrato,
      motivo_separacion: calculo.motivo_separacion,
      hechos_despido: calculo.hechos_despido
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creando caso:', error)
    return { error: error.message, data: null }
  }
  
  revalidatePath('/casos')
  return { error: null, data: nuevoCaso }
}

// ============================================
// FUNCIONES PARA ADMIN Y SUPERADMIN
// ============================================

// Obtener todos los casos (para admin/superadmin)
export async function obtenerTodosLosCasos(filtros?: { 
  status?: string
  busqueda?: string 
  lawyerId?: string
  incluirSinAbogado?: boolean
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  // Verificar rol
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
    return { error: 'No autorizado', data: null }
  }
  
  let query = supabase
    .from('casos')
    .select(`
      *,
      calculo:calculos_liquidacion(*),
      case_messages(id, read_by_worker_at, read_by_lawyer_at, created_at),
      case_events(id, title, starts_at, event_type)
    `)
    .order('updated_at', { ascending: false })
  
  // Admin solo ve casos asignados a abogados
  if (profile.role === 'admin') {
    query = query.not('lawyer_id', 'is', null)
  }
  
  // Superadmin ve todo, pero puede filtrar
  if (profile.role === 'superadmin' && !filtros?.incluirSinAbogado) {
    // Por defecto muestra todo
  }
  
  if (filtros?.status && filtros.status !== 'all') {
    query = query.eq('status', filtros.status)
  }
  
  if (filtros?.lawyerId) {
    query = query.eq('lawyer_id', filtros.lawyerId)
  }
  
  if (filtros?.busqueda) {
    query = query.or(`empresa_nombre.ilike.%${filtros.busqueda}%,folio.ilike.%${filtros.busqueda}%`)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error obteniendo todos los casos:', error)
    return { error: error.message, data: null }
  }
  
  // Obtener datos de abogados y trabajadores por separado
  const lawyerIds = [...new Set(data?.map(c => c.lawyer_id).filter(Boolean) || [])]
  const workerIds = [...new Set(data?.map(c => c.worker_id).filter(Boolean) || [])]
  
  let profilesMap: Record<string, { id: string; full_name: string; email: string; phone?: string; curp?: string; identificacion_verificada?: boolean }> = {}
  
  const allIds = [...lawyerIds, ...workerIds]
  if (allIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, curp, identificacion_verificada')
      .in('id', allIds)
    
    profilesMap = Object.fromEntries(profiles?.map(p => [p.id, p]) || [])
  }
  
  // Procesar datos
  const casosConExtras = data?.map(caso => {
    const unreadMessages = caso.case_messages?.length || 0
    const futureEvents = caso.case_events
      ?.filter((e: { starts_at: string }) => new Date(e.starts_at) >= new Date())
      .sort((a: { starts_at: string }, b: { starts_at: string }) => 
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      )
    const nextEvent = futureEvents?.[0] || null
    
    return {
      ...caso,
      abogado: caso.lawyer_id ? profilesMap[caso.lawyer_id] || null : null,
      trabajador: caso.worker_id ? profilesMap[caso.worker_id] || null : null,
      unread_messages: unreadMessages,
      next_event: nextEvent,
      case_messages: undefined,
      case_events: undefined
    }
  })
  
  return { error: null, data: casosConExtras }
}

// Obtener todas las cotizaciones/calculos (para superadmin)
export async function obtenerTodasLasCotizaciones(filtros?: {
  conCaso?: boolean
  sinCaso?: boolean
  busqueda?: string
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  // Solo superadmin puede ver todas las cotizaciones
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || profile.role !== 'superadmin') {
    return { error: 'No autorizado', data: null }
  }
  
  // Obtener todos los calculos
  const { data: calculos, error } = await supabase
    .from('calculos_liquidacion')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error obteniendo cotizaciones:', error)
    return { error: error.message, data: null }
  }
  
  // Obtener info de usuarios
  const userIds = [...new Set(calculos?.map(c => c.user_id).filter(Boolean) || [])]
  let usuariosMap: Record<string, { id: string; full_name: string; email: string; phone?: string; role: string }> = {}
  
  if (userIds.length > 0) {
    const { data: usuarios } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role')
      .in('id', userIds)
    
    usuariosMap = Object.fromEntries(usuarios?.map(u => [u.id, u]) || [])
  }
  
  // Obtener casos asociados
  const { data: casos } = await supabase
    .from('casos')
    .select('calculo_id, id, folio, status, lawyer_id')
  
  const casosPorCalculo = new Map(casos?.map(c => [c.calculo_id, c]) || [])
  
  // Combinar datos
  let resultado = calculos?.map(calc => ({
    ...calc,
    usuario: usuariosMap[calc.user_id] || null,
    caso: casosPorCalculo.get(calc.id) || null,
    tiene_caso: casosPorCalculo.has(calc.id)
  })) || []
  
  // Aplicar filtros
  if (filtros?.conCaso) {
    resultado = resultado.filter(c => c.tiene_caso)
  }
  if (filtros?.sinCaso) {
    resultado = resultado.filter(c => !c.tiene_caso)
  }
  
  return { error: null, data: resultado }
}

// Obtener estadisticas globales (para admin/superadmin)
export async function obtenerEstadisticasGlobales() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
    return { error: 'No autorizado', data: null }
  }
  
  // Estadisticas de casos
  const { data: casos } = await supabase
    .from('casos')
    .select('status, monto_estimado, monto_final, oferta_empresa, lawyer_id')
  
  // Estadisticas de cotizaciones
  const { data: cotizaciones } = await supabase
    .from('calculos_liquidacion')
    .select('id, total_conciliacion')
  
  // Estadisticas de abogados
  const { data: abogados } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'lawyer')
  
  const totalCasos = casos?.length || 0
  const casosAsignados = casos?.filter(c => c.lawyer_id).length || 0
  const casosSinAsignar = casos?.filter(c => !c.lawyer_id).length || 0
  const casosActivos = casos?.filter(c => !['resolved', 'closed', 'draft'].includes(c.status)).length || 0
  const casosResueltos = casos?.filter(c => c.status === 'resolved').length || 0
  const totalCotizaciones = cotizaciones?.length || 0
  const totalAbogados = abogados?.length || 0
  const montoTotalEstimado = casos?.reduce((acc, c) => acc + (Number(c.monto_estimado) || 0), 0) || 0
  const montoTotalOfertas = casos?.reduce((acc, c) => acc + (Number(c.oferta_empresa) || 0), 0) || 0
  
  return {
    error: null,
    data: {
      totalCasos,
      casosAsignados,
      casosSinAsignar,
      casosActivos,
      casosResueltos,
      totalCotizaciones,
      totalAbogados,
      montoTotalEstimado,
      montoTotalOfertas
    }
  }
}

// Obtener lista de abogados (para filtros)
export async function obtenerAbogados() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'lawyer')
    .order('full_name')
  
  if (error) {
    return { error: error.message, data: null }
  }
  
  return { error: null, data }
}

// Crear caso desde verificacion de usuario guest con fechas de prescripcion automaticas
export async function crearCasoDesdeVerificacion(userId: string, calculoId: string) {
  const supabase = await createClient()
  
  // Obtener datos del calculo
  const { data: calculo, error: calculoError } = await supabase
    .from('documentos_boveda')
    .select('id, nombre, metadata')
    .eq('id', calculoId)
    .single()
  
  if (calculoError || !calculo) {
    return { error: 'No se encontro el calculo' }
  }
  
  const meta = calculo.metadata as { 
    nombreEmpresa?: string
    salarioMensual?: number
    totalConciliacion?: number
    fechaSalida?: string
  } | null
  
  // Generar folio unico
  const folio = `MC-${Date.now().toString(36).toUpperCase()}`
  
  // Verificar si ya existe un caso para este usuario
  const { data: casoExistente } = await supabase
    .from('casos')
    .select('id')
    .eq('worker_id', userId)
    .in('status', ['open', 'assigned', 'in_progress', 'pending_review'])
    .limit(1)
    .maybeSingle()
  
  if (casoExistente) {
    return { error: null, casoId: casoExistente.id, yaExistia: true }
  }
  
  // Crear el caso
  const { data: nuevoCaso, error: casoError } = await supabase
    .from('casos')
    .insert({
      folio,
      worker_id: userId,
      calculo_id: calculoId,
      nombre_empresa: meta?.nombreEmpresa || calculo.nombre || 'Sin especificar',
      salario_mensual: meta?.salarioMensual || 0,
      monto_reclamacion: meta?.totalConciliacion || 0,
      status: 'pending_review', // Pendiente de revision/verificacion
      urgency: 'normal',
      source: 'guest_verification'
    })
    .select()
    .single()
  
  if (casoError || !nuevoCaso) {
    return { error: casoError?.message || 'Error al crear el caso' }
  }
  
  // Calcular fechas de prescripcion basadas en fecha de salida o fecha actual
  const fechaBase = meta?.fechaSalida ? new Date(meta.fechaSalida) : new Date()
  
  // Fecha de prescripcion para rescision: 30 dias (Art. 517 fraccion I LFT)
  const fechaRescision = new Date(fechaBase)
  fechaRescision.setDate(fechaRescision.getDate() + 30)
  
  // Fecha de prescripcion para despido: 60 dias (Art. 518 LFT)
  const fechaDespido = new Date(fechaBase)
  fechaDespido.setDate(fechaDespido.getDate() + 60)
  
  // Crear alertas de prescripcion en la agenda del usuario
  const alertas = [
    {
      user_id: userId,
      caso_id: nuevoCaso.id,
      tipo: 'prescripcion_rescision',
      titulo: 'PRESCRIPCION - Rescision Laboral',
      descripcion: 'Art. 517 fraccion I LFT: Las acciones de los trabajadores para separarse del trabajo prescriben en 30 dias contados a partir de la fecha en que se tenga conocimiento de la causa de separacion.',
      fecha_evento: fechaRescision.toISOString().split('T')[0],
      hora_evento: '09:00',
      prioridad: 'urgente',
      recordatorio_dias: 5,
      activa: true
    },
    {
      user_id: userId,
      caso_id: nuevoCaso.id,
      tipo: 'prescripcion_despido',
      titulo: 'PRESCRIPCION - Despido Injustificado',
      descripcion: 'Art. 518 LFT: Prescriben en dos meses las acciones de los trabajadores que sean separados del trabajo. El plazo corre a partir del dia siguiente a la fecha de separacion.',
      fecha_evento: fechaDespido.toISOString().split('T')[0],
      hora_evento: '09:00',
      prioridad: 'urgente',
      recordatorio_dias: 7,
      activa: true
    }
  ]
  
  // Insertar alertas en la tabla de eventos/alertas
  await supabase
    .from('caso_eventos')
    .insert(alertas.map(alerta => ({
      caso_id: nuevoCaso.id,
      tipo: alerta.tipo,
      titulo: alerta.titulo,
      descripcion: alerta.descripcion,
      fecha_evento: alerta.fecha_evento,
      created_by: userId,
      metadata: {
        articulo_lft: alerta.tipo === 'prescripcion_rescision' ? 'Art. 517 fraccion I' : 'Art. 518',
        prioridad: alerta.prioridad,
        recordatorio_dias: alerta.recordatorio_dias
      }
    })))
  
  revalidatePath('/dashboard')
  revalidatePath('/casos')
  
  return { error: null, casoId: nuevoCaso.id, folio }
}

// Actualizar ubicacion del lugar de trabajo en un caso
export async function actualizarUbicacionCaso(
  casoId: string | null,
  locationData: {
    lat: number
    lng: number
    address?: string
    streetViewUrl: string
    mapsUrl: string
    timestamp: string
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'No autenticado' }
  }
  
  // Si no hay casoId, buscar el caso activo del usuario
  let targetCasoId = casoId
  
  if (!targetCasoId) {
    const { data: casoActivo } = await supabase
      .from('casos')
      .select('id')
      .eq('worker_id', user.id)
      .in('status', ['open', 'assigned', 'in_progress', 'pending_review'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    targetCasoId = casoActivo?.id || null
  }
  
  if (!targetCasoId) {
    // Si no hay caso activo, guardar como documento en la boveda
    // para usarlo cuando se cree un caso
    return { error: null, guardadoEnPerfil: true, sinCaso: true }
  }
  
  // Actualizar el caso con la ubicacion - usar campos que existen en la tabla
  const { error } = await supabase
    .from('casos')
    .update({
      employer_address: locationData.address || `${locationData.lat}, ${locationData.lng}`,
      updated_at: new Date().toISOString()
    })
    .eq('id', targetCasoId)
    .eq('worker_id', user.id)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/casos')
  revalidatePath('/boveda')
  
  return { error: null, casoId: targetCasoId }
}
