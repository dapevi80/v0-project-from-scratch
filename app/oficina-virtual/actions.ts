'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Obtener perfil de abogado con estadísticas
export async function getLawyerDashboard() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  // Obtener perfil de abogado
  const { data: lawyer, error: lawyerError } = await supabase
    .from('lawyer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  if (lawyerError) {
    return { error: 'Perfil de abogado no encontrado', data: null }
  }
  
  // Obtener casos asignados
  const { data: cases } = await supabase
    .from('casos')
    .select('*, case_messages(id, read_by_lawyer_at)')
    .eq('lawyer_id', user.id)
    .order('updated_at', { ascending: false })
  
  // Obtener ofertas pendientes
  const { data: offers } = await supabase
    .from('case_offers')
    .select('*, casos(folio, empresa_nombre, monto_estimado)')
    .eq('lawyer_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  
  // Obtener balance de wallet
  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  // Calcular estadísticas
  const activeCases = cases?.filter(c => ['assigned', 'in_conciliation', 'in_trial'].includes(c.status)).length || 0
  const wonCases = cases?.filter(c => c.status === 'won').length || 0
  const totalEarnings = cases?.reduce((sum, c) => sum + (c.lawyer_fee_paid || 0), 0) || 0
  const unreadMessages = cases?.reduce((sum, c) => {
    return sum + (c.case_messages?.filter((m: { read_by_lawyer_at: string | null }) => !m.read_by_lawyer_at).length || 0)
  }, 0) || 0
  
  return {
    error: null,
    data: {
      lawyer,
      cases: cases || [],
      offers: offers || [],
      wallet,
      stats: {
        activeCases,
        wonCases,
        totalEarnings,
        unreadMessages,
        pendingOffers: offers?.length || 0
      }
    }
  }
}

// Obtener casos del marketplace disponibles
export async function getMarketplaceCases(filters?: {
  ciudad?: string
  estado?: string
  montoMin?: number
  montoMax?: number
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  let query = supabase
    .from('casos')
    .select(`
      *,
      profiles!casos_worker_id_fkey(full_name, avatar_url),
      calculos_liquidacion(total_conciliacion, total_juicio, antiguedad_anios)
    `)
    .eq('status', 'open')
    .is('lawyer_id', null)
    .order('created_at', { ascending: false })
  
  if (filters?.ciudad) {
    query = query.eq('ciudad', filters.ciudad)
  }
  if (filters?.estado) {
    query = query.eq('estado', filters.estado)
  }
  if (filters?.montoMin) {
    query = query.gte('monto_estimado', filters.montoMin)
  }
  if (filters?.montoMax) {
    query = query.lte('monto_estimado', filters.montoMax)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error getting marketplace cases:', error)
    return { error: error.message, data: null }
  }
  
  return { error: null, data }
}

// Hacer oferta en un caso
export async function makeOffer(casoId: string, datos: {
  proposed_fee_percent: number
  message: string
  estimated_duration_days?: number
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  // Verificar que es abogado verificado
  const { data: lawyer } = await supabase
    .from('lawyer_profiles')
    .select('status, is_active')
    .eq('user_id', user.id)
    .single()
  
  if (!lawyer || lawyer.status !== 'verified' || !lawyer.is_active) {
    return { error: 'Solo abogados verificados pueden hacer ofertas', data: null }
  }
  
  // Verificar que no haya oferta previa
  const { data: existingOffer } = await supabase
    .from('case_offers')
    .select('id')
    .eq('case_id', casoId)
    .eq('lawyer_id', user.id)
    .single()
  
  if (existingOffer) {
    return { error: 'Ya tienes una oferta en este caso', data: null }
  }
  
  const { data, error } = await supabase
    .from('case_offers')
    .insert({
      case_id: casoId,
      lawyer_id: user.id,
      proposed_fee_percent: datos.proposed_fee_percent,
      message: datos.message,
      estimated_duration_days: datos.estimated_duration_days,
      status: 'pending'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error making offer:', error)
    return { error: error.message, data: null }
  }
  
  revalidatePath('/oficina-virtual/marketplace')
  return { error: null, data }
}

// Retirar oferta
export async function withdrawOffer(offerId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  
  const { error } = await supabase
    .from('case_offers')
    .update({ status: 'withdrawn' })
    .eq('id', offerId)
    .eq('lawyer_id', user.id)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/oficina-virtual/marketplace')
  return { error: null }
}

// Obtener facturación del abogado
export async function getLawyerBilling() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  // Obtener configuración de facturación
  const { data: billing } = await supabase
    .from('lawyer_billing')
    .select('*')
    .eq('lawyer_id', user.id)
    .single()
  
  // Obtener historial de transacciones
  const { data: ledger } = await supabase
    .from('lawyer_ledger')
    .select('*')
    .eq('lawyer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
  
  // Calcular totales
  const totalEarned = ledger?.filter(l => l.type === 'earning').reduce((s, l) => s + l.amount, 0) || 0
  const totalWithdrawn = ledger?.filter(l => l.type === 'withdrawal').reduce((s, l) => s + l.amount, 0) || 0
  const pendingBalance = totalEarned - totalWithdrawn
  
  return {
    error: null,
    data: {
      billing,
      ledger: ledger || [],
      totals: {
        totalEarned,
        totalWithdrawn,
        pendingBalance
      }
    }
  }
}

// Actualizar datos de facturación
export async function updateBillingInfo(datos: {
  rfc?: string
  razon_social?: string
  direccion_fiscal?: string
  regimen_fiscal?: string
  banco?: string
  clabe?: string
  wallet_address?: string
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  
  const { error } = await supabase
    .from('lawyer_billing')
    .upsert({
      lawyer_id: user.id,
      ...datos,
      updated_at: new Date().toISOString()
    })
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/oficina-virtual/facturacion')
  return { error: null }
}

// Solicitar retiro
export async function requestWithdrawal(amount: number, method: 'bank' | 'crypto') {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  
  // Verificar balance disponible
  const { data: billing } = await getLawyerBilling()
  if (!billing || billing.totals.pendingBalance < amount) {
    return { error: 'Saldo insuficiente' }
  }
  
  // Crear registro de retiro pendiente
  const { error } = await supabase
    .from('lawyer_ledger')
    .insert({
      lawyer_id: user.id,
      type: 'withdrawal_request',
      amount: amount,
      description: `Solicitud de retiro via ${method}`,
      status: 'pending'
    })
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/oficina-virtual/facturacion')
  return { error: null }
}

// Obtener caso completo con datos del trabajador para formularios de conciliación
export async function getCaseFullDetails(casoId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  // Verificar rol de abogado/admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['lawyer', 'admin', 'superadmin'].includes(profile.role)) {
    return { error: 'No autorizado', data: null }
  }
  
  // Obtener caso con todos los datos relacionados
  const { data: caso, error } = await supabase
    .from('casos')
    .select(`
      *,
      worker:profiles!casos_worker_id_fkey(*),
      lawyer:profiles!casos_lawyer_id_fkey(id, full_name, email, phone),
      calculo:calculos_liquidacion(*),
      centro_conciliacion:centros_conciliacion(*),
      case_messages(*, sender:profiles!case_messages_sender_id_fkey(full_name, role)),
      case_events(*),
      case_documents(*)
    `)
    .eq('id', casoId)
    .single()
  
  if (error) {
    console.error('Error getting case details:', error)
    return { error: error.message, data: null }
  }
  
  return { error: null, data: caso }
}

// Obtener historial de respuestas del cuestionario desde el inicio
export async function getCaseHistory(casoId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  const { data, error } = await supabase
    .from('case_history')
    .select('*')
    .eq('case_id', casoId)
    .order('created_at', { ascending: true })
  
  if (error) {
    return { error: error.message, data: null }
  }
  
  return { error: null, data }
}

// Verificar identidad del trabajador (CURP, INE)
export async function verifyWorkerIdentity(workerId: string, datos: {
  curp: string
  tipo_identificacion: 'ine' | 'pasaporte' | 'cedula_profesional' | 'cartilla_militar'
  numero_identificacion: string
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  
  // Verificar que es abogado/admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['lawyer', 'admin', 'superadmin'].includes(profile.role)) {
    return { error: 'No autorizado' }
  }
  
  const { error } = await supabase
    .from('profiles')
    .update({
      curp: datos.curp.toUpperCase(),
      tipo_identificacion: datos.tipo_identificacion,
      numero_identificacion: datos.numero_identificacion,
      identificacion_verificada: true,
      identificacion_verificada_por: user.id,
      identificacion_verificada_at: new Date().toISOString()
    })
    .eq('id', workerId)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/oficina-virtual')
  return { error: null }
}

// Obtener centros de conciliación por estado
export async function getCentrosConciliacion(estado?: string) {
  const supabase = await createClient()
  
  let query = supabase
    .from('centros_conciliacion')
    .select('*')
    .eq('activo', true)
    .order('tipo', { ascending: false }) // Federal primero
    .order('estado')
  
  if (estado) {
    query = query.or(`estado.eq.${estado},tipo.eq.federal`)
  }
  
  const { data, error } = await query
  
  if (error) {
    return { error: error.message, data: null }
  }
  
  return { error: null, data }
}

// Sugerir jurisdicción basado en dirección del trabajo
export async function sugerirJurisdiccion(casoId: string) {
  const supabase = await createClient()
  
  const { data: caso } = await supabase
    .from('casos')
    .select('direccion_trabajo_estado, monto_estimado')
    .eq('id', casoId)
    .single()
  
  if (!caso) return { error: 'Caso no encontrado', data: null }
  
  // Regla: Si el monto es mayor a cierta cantidad o es empresa federal, va a CFCRL
  // Por defecto, va al centro estatal correspondiente
  const esFederal = (caso.monto_estimado || 0) > 500000 // Umbral ejemplo
  
  const { data: centros } = await supabase
    .from('centros_conciliacion')
    .select('*')
    .or(`estado.eq.${caso.direccion_trabajo_estado},tipo.eq.federal`)
    .eq('activo', true)
  
  const sugerido = esFederal 
    ? centros?.find(c => c.tipo === 'federal')
    : centros?.find(c => c.tipo === 'estatal' && c.estado === caso.direccion_trabajo_estado)
  
  return { 
    error: null, 
    data: {
      sugerido,
      alternativas: centros?.filter(c => c.id !== sugerido?.id) || [],
      razon: esFederal ? 'Monto alto - se sugiere jurisdicción federal' : 'Jurisdicción estatal por ubicación del trabajo'
    }
  }
}

// Actualizar datos de conciliación del caso
export async function updateCaseConciliationData(casoId: string, datos: {
  jurisdiccion?: 'federal' | 'estatal'
  centro_conciliacion_id?: string
  numero_expediente_conciliacion?: string
  fecha_solicitud_conciliacion?: string
  link_audiencia_virtual?: string
  plataforma_audiencia?: 'zoom' | 'teams' | 'google_meet' | 'webex' | 'otro'
  password_audiencia?: string
  direccion_trabajo_calle?: string
  direccion_trabajo_numero?: string
  direccion_trabajo_colonia?: string
  direccion_trabajo_cp?: string
  direccion_trabajo_municipio?: string
  direccion_trabajo_estado?: string
  puesto_trabajo?: string
  tipo_jornada?: 'diurna' | 'nocturna' | 'mixta'
  horario_trabajo?: string
  tipo_contrato?: 'indefinido' | 'temporal' | 'por_obra' | 'capacitacion'
  motivo_separacion?: string
  fecha_despido?: string
  hechos_despido?: string
  prestaciones_reclamadas?: string[]
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  
  const { error } = await supabase
    .from('casos')
    .update({
      ...datos,
      updated_at: new Date().toISOString()
    })
    .eq('id', casoId)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath(`/oficina-virtual/caso/${casoId}`)
  return { error: null }
}

// Actualizar oferta de la empresa (solo abogado)
export async function updateOfertaEmpresa(casoId: string, oferta: number) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  
  // Verificar que es el abogado del caso
  const { data: caso } = await supabase
    .from('casos')
    .select('lawyer_id')
    .eq('id', casoId)
    .single()
  
  if (!caso || caso.lawyer_id !== user.id) {
    return { error: 'Solo el abogado asignado puede actualizar la oferta' }
  }
  
  const { error } = await supabase
    .from('casos')
    .update({
      oferta_empresa: oferta,
      oferta_empresa_fecha: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', casoId)
  
  if (error) {
    return { error: error.message }
  }
  
  // Registrar en historial
  await supabase
    .from('case_history')
    .insert({
      case_id: casoId,
      action: 'oferta_actualizada',
      actor_id: user.id,
      details: { nueva_oferta: oferta }
    })
  
  revalidatePath(`/oficina-virtual/caso/${casoId}`)
  return { error: null }
}

// Guardar link de audiencia virtual
export async function saveAudienciaVirtual(casoId: string, datos: {
  link: string
  plataforma: 'zoom' | 'teams' | 'google_meet' | 'webex' | 'otro'
  password?: string
  fecha_audiencia: string
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  
  // Actualizar caso con link
  const { error: casoError } = await supabase
    .from('casos')
    .update({
      link_audiencia_virtual: datos.link,
      plataforma_audiencia: datos.plataforma,
      password_audiencia: datos.password,
      fecha_proxima_audiencia: datos.fecha_audiencia
    })
    .eq('id', casoId)
  
  if (casoError) {
    return { error: casoError.message }
  }
  
  // Crear evento de calendario
  await supabase
    .from('case_events')
    .insert({
      case_id: casoId,
      created_by: user.id,
      title: 'Audiencia Virtual de Conciliación',
      description: `Link: ${datos.link}\nPlataforma: ${datos.plataforma}${datos.password ? '\nContraseña: ' + datos.password : ''}`,
      event_type: 'audiencia',
      starts_at: datos.fecha_audiencia,
      location: datos.link
    })
  
  revalidatePath(`/oficina-virtual/caso/${casoId}`)
  return { error: null }
}

// ============================================
// PANEL DE VERIFICACION DE USUARIOS
// ============================================

// Obtener usuarios pendientes de verificación
export async function getPendingVerifications() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  // Verificar rol
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['lawyer', 'admin', 'superadmin', 'webagent'].includes(profile.role)) {
    return { error: 'No autorizado', data: null }
  }
  
// Obtener usuarios que tienen caso_creado=true O verification_status='pending'
  // Estos son usuarios guest que ya crearon su caso y esperan verificacion
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['guest', 'worker', 'guestworker'])
    .neq('verification_status', 'verified')
    .or('caso_creado.eq.true,verification_status.eq.pending')
    .order('created_at', { ascending: false })
  
  if (error) {
    // Fallback: obtener todos los usuarios no verificados
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['guest', 'worker', 'guestworker'])
      .neq('verification_status', 'verified')
      .order('created_at', { ascending: false })
    
    if (fallbackError) {
      return { error: fallbackError.message, data: null }
    }
    return { error: null, data: fallbackData || [] }
  }
  
  return { error: null, data: data || [] }
}

// Verificar usuario y convertirlo a trabajador verificado
export async function verifyUserAccount(userId: string, datos: {
  curp: string
  tipo_identificacion: 'ine' | 'pasaporte' | 'cedula_profesional' | 'cartilla_militar'
  numero_identificacion: string
  aprobado: boolean
  notas?: string
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  
  // Verificar rol del verificador
  const { data: verifier } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!verifier || !['lawyer', 'admin', 'superadmin', 'webagent'].includes(verifier.role)) {
    return { error: 'No autorizado para verificar usuarios' }
  }
  
  if (datos.aprobado) {
    // Aprobar verificación y actualizar rol a worker
    // Resetear celebration_shown para mostrar celebracion (especialmente importante para re-verificaciones)
    const { error } = await supabase
      .from('profiles')
      .update({
        role: 'worker',
        curp: datos.curp.toUpperCase(),
        tipo_identificacion: datos.tipo_identificacion,
        numero_identificacion: datos.numero_identificacion,
        identificacion_verificada: true,
        identificacion_verificada_por: user.id,
        identificacion_verificada_at: new Date().toISOString(),
        verification_status: 'verified',
        celebration_shown: false, // Resetear para mostrar celebracion
        downgrade_reason: null, // Limpiar razon de downgrade anterior
        downgrade_at: null,
        previous_role: null
      })
      .eq('id', userId)
    
    if (error) {
      return { error: error.message }
    }
    
    // Verificar si el usuario tiene un cálculo guardado y crear caso automáticamente
    const { data: calculoExistente } = await supabase
      .from('documentos_boveda')
      .select('id, nombre, metadata')
      .eq('user_id', userId)
      .eq('categoria', 'calculo_liquidacion')
      .eq('estado', 'activo')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (calculoExistente) {
      // Verificar si ya existe un caso para este usuario
      const { data: casoExistente } = await supabase
        .from('casos')
        .select('id')
        .eq('worker_id', userId)
        .in('status', ['open', 'assigned', 'in_progress'])
        .limit(1)
        .single()
      
      if (!casoExistente) {
        // Crear caso automáticamente desde el cálculo
        const meta = calculoExistente.metadata as { nombreEmpresa?: string; salarioMensual?: number; totalConciliacion?: number } | null
        const folio = `MC-${Date.now().toString(36).toUpperCase()}`
        
        await supabase
          .from('casos')
          .insert({
            folio,
            worker_id: userId,
            calculo_id: calculoExistente.id,
            nombre_empresa: meta?.nombreEmpresa || calculoExistente.nombre || 'Sin especificar',
            salario_mensual: meta?.salarioMensual || 0,
            monto_reclamacion: meta?.totalConciliacion || 0,
            status: 'open',
            urgency: 'normal',
            source: 'verificacion_automatica'
          })
      }
    }
  } else {
    // Rechazar verificación
    const { error } = await supabase
      .from('profiles')
      .update({
        verification_status: 'rejected',
        verification_notes: datos.notas
      })
      .eq('id', userId)
    
    if (error) {
      return { error: error.message }
    }
  }
  
  revalidatePath('/oficina-virtual/verificaciones')
  return { error: null }
}

// ============================================
// PANEL DE VERIFICACION Y ASIGNACION DE CASOS
// ============================================

// Obtener casos pendientes de verificación/asignación
export async function getCasosPendientes() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  // Verificar rol
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, referral_code')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['lawyer', 'admin', 'superadmin', 'webagent'].includes(profile.role)) {
    return { error: 'No autorizado', data: null }
  }
  
  // Query base de casos sin abogado asignado
  const { data, error } = await supabase
    .from('casos')
    .select(`
      *,
      calculo:calculos_liquidacion(*),
      trabajador:profiles!casos_worker_id_fkey(
        id, full_name, email, phone, curp, 
        identificacion_verificada, verification_status,
        calle, colonia, ciudad, estado, codigo_postal
      )
    `)
    .or('categoria.eq.nuevo,categoria.eq.por_preaprobar')
    .eq('archivado', false)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error getting pending cases:', error)
    return { error: error.message, data: null }
  }
  
  // Obtener trabajadores por separado si el join falla
  const workerIds = [...new Set(data?.map(c => c.worker_id).filter(Boolean) || [])]
  let workersMap: Record<string, unknown> = {}
  
  if (workerIds.length > 0) {
    const { data: workers } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, curp, identificacion_verificada, verification_status, calle, colonia, ciudad, estado, codigo_postal')
      .in('id', workerIds)
    
    workersMap = Object.fromEntries(workers?.map(w => [w.id, w]) || [])
  }
  
  const casosConTrabajador = data?.map(caso => ({
    ...caso,
    trabajador: caso.trabajador || workersMap[caso.worker_id] || null
  }))
  
  return { error: null, data: casosConTrabajador || [] }
}

// Obtener lista de abogados disponibles para asignación
export async function getAbogadosDisponibles() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  // Verificar rol (solo admin y superadmin pueden ver la lista completa)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
    // Si es lawyer, solo puede verse a sí mismo
    if (profile?.role === 'lawyer') {
      const { data: self } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', user.id)
        .single()
      return { error: null, data: self ? [self] : [] }
    }
    return { error: 'No autorizado', data: null }
  }
  
  // Obtener todos los abogados activos
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone')
    .eq('role', 'lawyer')
    .order('full_name')
  
  if (error) {
    return { error: error.message, data: null }
  }
  
  return { error: null, data: data || [] }
}

// Asignar caso a abogado
export async function asignarCaso(casoId: string, lawyerId: string, datos?: {
  tipo_caso?: 'despido' | 'rescision'
  notas?: string
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  
  // Verificar rol y permisos
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile) return { error: 'Perfil no encontrado' }
  
  // Lawyer solo puede asignarse a sí mismo
  if (profile.role === 'lawyer' && lawyerId !== user.id) {
    return { error: 'Solo puedes asignarte casos a ti mismo' }
  }
  
  // Webagent no puede asignar
  if (profile.role === 'webagent') {
    return { error: 'No tienes permisos para asignar casos' }
  }
  
  // Admin y superadmin pueden asignar a cualquier abogado
  if (!['lawyer', 'admin', 'superadmin'].includes(profile.role)) {
    return { error: 'No autorizado' }
  }
  
  // Calcular fecha de prescripción según tipo de caso
  const diasPrescripcion = datos?.tipo_caso === 'rescision' ? 30 : 60
  
  // Obtener fecha de despido del caso
  const { data: caso } = await supabase
    .from('casos')
    .select('fecha_despido')
    .eq('id', casoId)
    .single()
  
  let fechaLimitePrescripcion = null
  if (caso?.fecha_despido) {
    const fechaDespido = new Date(caso.fecha_despido)
    fechaLimitePrescripcion = new Date(fechaDespido)
    fechaLimitePrescripcion.setDate(fechaLimitePrescripcion.getDate() + diasPrescripcion)
  }
  
  // Actualizar caso
  const { error } = await supabase
    .from('casos')
    .update({
      lawyer_id: lawyerId,
      status: 'assigned',
      categoria: 'asignado',
      tipo_caso: datos?.tipo_caso || 'despido',
      dias_prescripcion: diasPrescripcion,
      fecha_limite_prescripcion: fechaLimitePrescripcion?.toISOString().split('T')[0],
      notas_abogado: datos?.notas,
      prequalified_by: user.id,
      prequalified_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', casoId)
  
  if (error) {
    return { error: error.message }
  }
  
  // Registrar en historial
  await supabase
    .from('case_history')
    .insert({
      case_id: casoId,
      action: 'caso_asignado',
      actor_id: user.id,
      details: { lawyer_id: lawyerId, tipo_caso: datos?.tipo_caso }
    })
  
  revalidatePath('/oficina-virtual')
  revalidatePath('/oficina-virtual/casos')
  return { error: null }
}

// Reasignar caso a otro abogado (solo admin/superadmin)
export async function reasignarCaso(casoId: string, nuevoLawyerId: string, motivo: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  
  // Solo admin y superadmin pueden reasignar
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
    return { error: 'Solo administradores pueden reasignar casos' }
  }
  
  // Obtener abogado anterior
  const { data: caso } = await supabase
    .from('casos')
    .select('lawyer_id')
    .eq('id', casoId)
    .single()
  
  const abogadoAnterior = caso?.lawyer_id
  
  // Reasignar
  const { error } = await supabase
    .from('casos')
    .update({
      lawyer_id: nuevoLawyerId,
      updated_at: new Date().toISOString()
    })
    .eq('id', casoId)
  
  if (error) {
    return { error: error.message }
  }
  
  // Registrar en historial
  await supabase
    .from('case_history')
    .insert({
      case_id: casoId,
      action: 'caso_reasignado',
      actor_id: user.id,
      details: { 
        abogado_anterior: abogadoAnterior,
        abogado_nuevo: nuevoLawyerId,
        motivo 
      }
    })
  
  revalidatePath('/oficina-virtual')
  return { error: null }
}

// Obtener dashboard completo para la oficina virtual
export async function getOficinaDashboard() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  // Obtener perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['lawyer', 'guestlawyer', 'admin', 'superadmin', 'webagent'].includes(profile.role)) {
    return { error: 'No autorizado', data: null }
  }
  
  const isGuestLawyer = profile.role === 'guestlawyer'
  
  // Contar verificaciones pendientes
  const { count: verificacionesPendientes } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .in('role', ['guest', 'worker'])
    .eq('identificacion_verificada', false)
  
  // Contar casos pendientes de asignación
  const { count: casosPendientes } = await supabase
    .from('casos')
    .select('*', { count: 'exact', head: true })
    .or('categoria.eq.nuevo,categoria.eq.por_preaprobar')
    .eq('archivado', false)
  
  // Casos asignados al usuario (si es abogado)
  let misoCasos = 0
  let mensajesSinLeer = 0
  if (profile.role === 'lawyer') {
    const { count } = await supabase
      .from('casos')
      .select('*', { count: 'exact', head: true })
      .eq('lawyer_id', user.id)
      .neq('status', 'closed')
    misoCasos = count || 0
    
    // Contar mensajes sin leer
    const { data: casosConMensajes } = await supabase
      .from('casos')
      .select('case_messages(id, read_by_lawyer_at)')
      .eq('lawyer_id', user.id)
    
    mensajesSinLeer = casosConMensajes?.reduce((sum, c) => {
      return sum + ((c.case_messages as Array<{read_by_lawyer_at: string | null}>)?.filter(m => !m.read_by_lawyer_at).length || 0)
    }, 0) || 0
  }
  
  // Para admin/superadmin, contar todos los casos activos
  let totalCasosActivos = 0
  if (['admin', 'superadmin'].includes(profile.role)) {
    const { count } = await supabase
      .from('casos')
      .select('*', { count: 'exact', head: true })
      .not('status', 'in', '("closed","resolved")')
    totalCasosActivos = count || 0
  }
  
  return {
    error: null,
    data: {
      profile,
      isGuestLawyer,
      stats: {
        verificacionesPendientes: verificacionesPendientes || 0,
        casosPendientes: casosPendientes || 0,
        misCasos: misoCasos,
        mensajesSinLeer,
        totalCasosActivos
      }
    }
  }
}

// Subir documento de verificación
export async function uploadVerificationDocument(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  
  const file = formData.get('file') as File
  const docType = formData.get('doc_type') as string
  
  if (!file || !docType) {
    return { error: 'Archivo y tipo requeridos' }
  }
  
  // Subir archivo
  const fileName = `lawyer-docs/${user.id}/${docType}-${Date.now()}.${file.name.split('.').pop()}`
  const { error: uploadError } = await supabase.storage
    .from('documentos')
    .upload(fileName, file)
  
  if (uploadError) {
    return { error: uploadError.message }
  }
  
  // Obtener URL pública
  const { data: urlData } = supabase.storage
    .from('documentos')
    .getPublicUrl(fileName)
  
  // Registrar documento
  const { error: dbError } = await supabase
    .from('lawyer_documents')
    .insert({
      lawyer_id: user.id,
      doc_type: docType,
      file_url: urlData.publicUrl,
      status: 'pending'
    })
  
  if (dbError) {
    return { error: dbError.message }
  }
  
  revalidatePath('/oficina-virtual/verificacion')
  return { error: null }
}
