'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { 
  evaluarUpgradeAbogado, 
  evaluarDowngradeAbogado,
  type LawyerUpgradeType,
  type LawyerDowngradeType,
  type VerificationCriteria,
  LAWYER_DOWNGRADE_HIERARCHY
} from '@/lib/lawyer-verification-utils'

// ===========================================
// APROBAR ABOGADO (Upgrade: guestlawyer -> lawyer)
// ===========================================

export async function aprobarAbogado(
  userId: string,
  notas?: string
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', success: false }
  
  // Verificar que sea superadmin
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!adminProfile || adminProfile.role !== 'superadmin') {
    return { error: 'Solo superadmin puede aprobar abogados', success: false }
  }
  
  // Obtener datos actuales del abogado
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, verification_status')
    .eq('id', userId)
    .single()
  
  if (!profile) return { error: 'Usuario no encontrado', success: false }
  
  const previousRole = profile.role
  const wasDowngraded = profile.verification_status === 'documents_missing'
  const upgradeType: LawyerUpgradeType = wasDowngraded ? 'reactivation' : 'verification_approved'
  
  // Actualizar perfil principal
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      role: 'lawyer',
      verification_status: 'verified',
      // Datos de upgrade
      upgrade_reason: wasDowngraded 
        ? 'Cuenta de abogado reactivada despues de re-verificacion' 
        : 'Verificacion de abogado completada exitosamente',
      upgrade_at: new Date().toISOString(),
      upgraded_by: user.id,
      upgrade_type: upgradeType,
      previous_role: previousRole,
      celebration_shown: false, // Mostrar celebracion
      // Limpiar datos de downgrade
      downgrade_reason: null,
      downgrade_at: null
    })
    .eq('id', userId)
  
  if (profileError) return { error: profileError.message, success: false }
  
  // Actualizar lawyer_profile
  const { error: lawyerError } = await supabase
    .from('lawyer_profiles')
    .update({
      verification_status: 'verified',
      verified_at: new Date().toISOString(),
      verified_by: user.id,
      is_available: true,
      notas_verificacion: notas
    })
    .eq('user_id', userId)
  
  if (lawyerError) {
    console.error('Error actualizando lawyer_profile:', lawyerError)
  }
  
  revalidatePath('/admin/solicitudes-abogados')
  revalidatePath('/dashboard')
  revalidatePath('/oficina-virtual/guestlawyer')
  
  return { 
    success: true, 
    previousRole,
    newRole: 'lawyer',
    upgradeType,
    userName: profile.full_name
  }
}

// ===========================================
// RECHAZAR ABOGADO (Mantiene rol o downgrade)
// ===========================================

export async function rechazarAbogado(
  userId: string,
  motivo: string,
  forzarDowngrade: boolean = false
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', success: false }
  
  // Verificar que sea admin o superadmin
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!adminProfile || !['admin', 'superadmin'].includes(adminProfile.role)) {
    return { error: 'Sin permisos para esta accion', success: false }
  }
  
  // Obtener datos actuales
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', userId)
    .single()
  
  if (!profile) return { error: 'Usuario no encontrado', success: false }
  
  const previousRole = profile.role
  const newRole = forzarDowngrade 
    ? LAWYER_DOWNGRADE_HIERARCHY[profile.role as keyof typeof LAWYER_DOWNGRADE_HIERARCHY] || 'guest'
    : profile.role
  
  // Actualizar perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      role: newRole,
      verification_status: 'rejected',
      downgrade_reason: motivo,
      downgrade_at: new Date().toISOString(),
      previous_role: previousRole
    })
    .eq('id', userId)
  
  if (profileError) return { error: profileError.message, success: false }
  
  // Actualizar lawyer_profile
  await supabase
    .from('lawyer_profiles')
    .update({
      verification_status: 'rejected',
      notas_rechazo: motivo,
      is_available: false
    })
    .eq('user_id', userId)
  
  revalidatePath('/admin/solicitudes-abogados')
  
  return { 
    success: true, 
    previousRole,
    newRole,
    wasDowngraded: forzarDowngrade
  }
}

// ===========================================
// DOWNGRADE ABOGADO (Por documentos faltantes)
// ===========================================

export async function downgradeAbogado(
  userId: string,
  tipoDowngrade: LawyerDowngradeType,
  motivo?: string
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', success: false }
  
  // Obtener datos actuales
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', userId)
    .single()
  
  if (!profile) return { error: 'Usuario no encontrado', success: false }
  
  const { necesitaDowngrade, nuevoRol, razon } = evaluarDowngradeAbogado(
    profile.role,
    {},
    tipoDowngrade
  )
  
  if (!necesitaDowngrade) {
    return { error: 'El usuario no requiere downgrade', success: false }
  }
  
  // Actualizar perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      role: nuevoRol,
      verification_status: 'documents_missing',
      downgrade_reason: motivo || razon,
      downgrade_at: new Date().toISOString(),
      previous_role: profile.role,
      celebration_shown: false // Para mostrar alerta de downgrade
    })
    .eq('id', userId)
  
  if (profileError) return { error: profileError.message, success: false }
  
  // Actualizar lawyer_profile
  await supabase
    .from('lawyer_profiles')
    .update({
      verification_status: 'downgraded',
      is_available: false,
      downgrade_reason: motivo || razon
    })
    .eq('user_id', userId)
  
  revalidatePath('/dashboard')
  revalidatePath('/oficina-virtual/guestlawyer')
  
  return { 
    success: true, 
    previousRole: profile.role,
    newRole: nuevoRol,
    tipoDowngrade,
    razon: motivo || razon
  }
}

// ===========================================
// VERIFICAR DOCUMENTOS DE ABOGADO
// ===========================================

export async function verificarDocumentosAbogado(userId?: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { needsDowngrade: false, error: 'No autenticado' }
  
  const targetUserId = userId || user.id
  
  // Obtener perfil y lawyer_profile
  const [profileResult, lawyerResult] = await Promise.all([
    supabase.from('profiles').select('role, verification_status').eq('id', targetUserId).single(),
    supabase.from('lawyer_profiles').select('ine_url, cedula_url, curp').eq('user_id', targetUserId).single()
  ])
  
  const profile = profileResult.data
  const lawyerProfile = lawyerResult.data
  
  if (!profile || !lawyerProfile) {
    return { needsDowngrade: false }
  }
  
  // Solo verificar para abogados verificados
  if (profile.role !== 'lawyer' && profile.role !== 'admin') {
    return { needsDowngrade: false }
  }
  
  // Verificar que los documentos existan
  const documentosFaltantes: string[] = []
  
  if (lawyerProfile.ine_url) {
    // Verificar si el archivo existe en storage
    const { data: ineExists } = await supabase.storage
      .from('boveda')
      .list(lawyerProfile.ine_url.split('/').slice(0, -1).join('/'))
    
    if (!ineExists || ineExists.length === 0) {
      documentosFaltantes.push('INE')
    }
  } else {
    documentosFaltantes.push('INE')
  }
  
  if (lawyerProfile.cedula_url) {
    const { data: cedulaExists } = await supabase.storage
      .from('boveda')
      .list(lawyerProfile.cedula_url.split('/').slice(0, -1).join('/'))
    
    if (!cedulaExists || cedulaExists.length === 0) {
      documentosFaltantes.push('Cedula Profesional')
    }
  } else {
    documentosFaltantes.push('Cedula Profesional')
  }
  
  // Si faltan documentos, hacer downgrade
  if (documentosFaltantes.length > 0) {
    const result = await downgradeAbogado(
      targetUserId,
      'documents_missing',
      `Documentos faltantes: ${documentosFaltantes.join(', ')}`
    )
    
    return {
      needsDowngrade: true,
      documentosFaltantes,
      ...result
    }
  }
  
  return { needsDowngrade: false }
}

// ===========================================
// OBTENER ESTADO DE VERIFICACION ABOGADO
// ===========================================

export async function obtenerEstadoVerificacionAbogado(userId?: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  const targetUserId = userId || user.id
  
  const [profileResult, lawyerResult] = await Promise.all([
    supabase.from('profiles').select(`
      role, 
      verification_status, 
      full_name,
      previous_role,
      upgrade_reason,
      upgrade_at,
      upgraded_by,
      upgrade_type,
      downgrade_reason,
      downgrade_at,
      celebration_shown
    `).eq('id', targetUserId).single(),
    supabase.from('lawyer_profiles').select(`
      verification_status,
      documentos_completos,
      ine_url,
      cedula_url,
      titulo_url,
      curp,
      rfc,
      firm_name,
      cedula_profesional
    `).eq('user_id', targetUserId).single()
  ])
  
  if (!profileResult.data) return { error: 'Perfil no encontrado', data: null }
  
  const profile = profileResult.data
  const lawyerProfile = lawyerResult.data
  
  // Evaluar criterios
  const criterios: Partial<VerificationCriteria> = {
    perfilCompleto: !!profile.full_name,
    nombreCompleto: !!profile.full_name,
    ineSubida: !!lawyerProfile?.ine_url,
    cedulaSubida: !!lawyerProfile?.cedula_url,
    curpValido: !!lawyerProfile?.curp && lawyerProfile.curp.length === 18,
    tituloSubido: !!lawyerProfile?.titulo_url,
    rfcValido: !!lawyerProfile?.rfc,
    esDespacho: !!lawyerProfile?.firm_name,
    documentosEnRevision: lawyerProfile?.verification_status === 'pending' && lawyerProfile?.documentos_completos,
    verificadoPorSuperadmin: profile.verification_status === 'verified'
  }
  
  const evaluacion = evaluarUpgradeAbogado(profile.role, criterios as VerificationCriteria)
  
  return {
    error: null,
    data: {
      // Estado actual
      role: profile.role,
      verificationStatus: profile.verification_status,
      fullName: profile.full_name,
      
      // Datos de lawyer
      cedulaProfesional: lawyerProfile?.cedula_profesional,
      firmName: lawyerProfile?.firm_name,
      documentosCompletos: lawyerProfile?.documentos_completos,
      
      // Evaluacion de upgrade
      puedeUpgrade: evaluacion.puedeUpgrade,
      siguienteRol: evaluacion.nuevoRol,
      requisitosRestantes: evaluacion.requisitosRestantes,
      
      // Historial
      wasUpgraded: !!profile.upgrade_at,
      wasDowngraded: profile.verification_status === 'documents_missing',
      lastUpgrade: profile.upgrade_at ? {
        reason: profile.upgrade_reason,
        at: profile.upgrade_at,
        by: profile.upgraded_by,
        type: profile.upgrade_type
      } : null,
      lastDowngrade: profile.downgrade_at ? {
        reason: profile.downgrade_reason,
        at: profile.downgrade_at
      } : null,
      
      // Celebracion
      celebrationPending: !profile.celebration_shown && (
        profile.verification_status === 'verified' || 
        !!profile.upgrade_at
      )
    }
  }
}
