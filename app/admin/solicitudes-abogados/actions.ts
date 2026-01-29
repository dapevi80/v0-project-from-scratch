'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Verificar que es superadmin
async function verifySuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'No autorizado', isSuperAdmin: false }
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || profile.role !== 'superadmin') {
    return { error: 'Solo superadmin puede aprobar solicitudes', isSuperAdmin: false }
  }
  
  return { error: null, isSuperAdmin: true, userId: user.id }
}

// Aprobar solicitud de abogado
export async function aprobarSolicitudAbogado(solicitudId: string) {
  const { error: authError, isSuperAdmin, userId } = await verifySuperAdmin()
  if (authError) return { error: authError }
  
  const supabase = await createClient()
  
  // Obtener datos de la solicitud
  const { data: solicitud, error: fetchError } = await supabase
    .from('solicitudes_abogados')
    .select('*')
    .eq('id', solicitudId)
    .single()
  
  if (fetchError || !solicitud) {
    return { error: 'Solicitud no encontrada' }
  }
  
  if (solicitud.status !== 'pending') {
    return { error: 'Esta solicitud ya fue procesada' }
  }
  
  // Generar contraseña temporal
  const tempPassword = `Abogado${Math.random().toString(36).slice(-8)}!`
  
  // Crear usuario en Auth
  const { data: authData, error: createUserError } = await supabase.auth.admin.createUser({
    email: solicitud.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: solicitud.nombre_completo,
      role: 'lawyer'
    }
  })
  
  if (createUserError) {
    // Si el usuario ya existe, intentar obtenerlo
    // Por ahora retornar el error
    return { error: `Error creando usuario: ${createUserError.message}` }
  }
  
  const newUserId = authData.user.id
  
  // Crear perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: newUserId,
      email: solicitud.email,
      full_name: solicitud.nombre_completo,
      phone: solicitud.telefono,
      role: 'lawyer',
      verification_status: 'verified',
      created_at: new Date().toISOString()
    })
  
  if (profileError) {
    return { error: `Error creando perfil: ${profileError.message}` }
  }
  
  // Crear perfil de abogado
  const { data: lawyerProfile, error: lawyerError } = await supabase
    .from('lawyer_profiles')
    .insert({
      user_id: newUserId,
      cedula_profesional: solicitud.cedula_profesional,
      universidad: solicitud.universidad,
      anos_experiencia: solicitud.anos_experiencia,
      especialidades: solicitud.especialidades,
      estados_operacion: solicitud.estados_operacion,
      verification_status: 'verified',
      verified_by: userId,
      verified_at: new Date().toISOString(),
      cedula_url: solicitud.cedula_url,
      disponible: true
    })
    .select()
    .single()
  
  if (lawyerError) {
    return { error: `Error creando perfil de abogado: ${lawyerError.message}` }
  }
  
  // Si es despacho, crear el despacho y asociar al abogado
  if (solicitud.tipo === 'despacho' && solicitud.nombre_despacho) {
    const { data: despacho, error: despachoError } = await supabase
      .from('despachos')
      .insert({
        nombre: solicitud.nombre_despacho,
        rfc: solicitud.rfc_despacho,
        direccion: solicitud.direccion_despacho,
        sitio_web: solicitud.sitio_web,
        status: 'active',
        modelo_negocio: 'B2C'
      })
      .select()
      .single()
    
    if (!despachoError && despacho) {
      // Asociar abogado como owner del despacho
      await supabase
        .from('despacho_abogados')
        .insert({
          despacho_id: despacho.id,
          lawyer_id: lawyerProfile.id,
          role: 'owner',
          is_active: true
        })
    }
  }
  
  // Actualizar solicitud como aprobada
  await supabase
    .from('solicitudes_abogados')
    .update({
      status: 'approved',
      revisado_por: userId,
      revisado_at: new Date().toISOString()
    })
    .eq('id', solicitudId)
  
  // TODO: Enviar email con credenciales
  // Por ahora solo logueamos
  console.log(`[SOLICITUD APROBADA] Email: ${solicitud.email}, Password temporal: ${tempPassword}`)
  
  revalidatePath('/admin/solicitudes-abogados')
  
  return { 
    error: null, 
    data: {
      email: solicitud.email,
      tempPassword // En produccion esto se enviaria por email, no se retornaria
    }
  }
}

// Rechazar solicitud
export async function rechazarSolicitudAbogado(solicitudId: string, notas: string) {
  const { error: authError, isSuperAdmin, userId } = await verifySuperAdmin()
  if (authError) return { error: authError }
  
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('solicitudes_abogados')
    .update({
      status: 'rejected',
      notas_revision: notas,
      revisado_por: userId,
      revisado_at: new Date().toISOString()
    })
    .eq('id', solicitudId)
  
  if (error) {
    return { error: error.message }
  }
  
  // TODO: Enviar email notificando el rechazo
  
  revalidatePath('/admin/solicitudes-abogados')
  
  return { error: null }
}
