'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface GuestAbogadoFormData {
  nombre: string
  apellidos: string
  email: string
  telefono: string
  password: string
  cedula: string
  universidad?: string
  estado: string
  codigoPostal: string
  codigoReferido?: string
  tipoRegistro: 'abogado' | 'despacho'
}

// Registrar cuenta guestabogado (cuenta real con acceso limitado)
export async function registrarGuestAbogado(datos: GuestAbogadoFormData) {
  const supabase = await createClient()
  
  // Verificar si ya existe usuario con este email
  const { data: existingUsers } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', datos.email.toLowerCase())
    .limit(1)
  
  if (existingUsers && existingUsers.length > 0) {
    return { error: 'Ya existe una cuenta con este correo electronico' }
  }
  
  // Verificar codigo de referido si se proporciono
  let despachoReferido = null
  if (datos.codigoReferido) {
    const { data: despachos } = await supabase
      .from('despachos')
      .select('id, nombre')
      .eq('codigo_referido', datos.codigoReferido)
      .eq('status', 'active')
      .limit(1)
    
    if (despachos && despachos.length > 0) {
      despachoReferido = despachos[0]
    }
  }
  
  // Crear usuario en auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: datos.email.toLowerCase(),
    password: datos.password,
    options: {
      data: {
        full_name: `${datos.nombre} ${datos.apellidos}`,
        role: 'guestlawyer'
      }
    }
  })
  
  if (authError || !authData.user) {
    console.error('Error creando usuario:', authError)
    return { error: authError?.message || 'Error al crear la cuenta' }
  }
  
  // Crear perfil con rol guestlawyer - solo campos basicos
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: datos.email.toLowerCase(),
      full_name: `${datos.nombre} ${datos.apellidos}`,
      phone: datos.telefono,
      role: 'guestlawyer',
      verification_status: 'pending'
    })
  
  if (profileError) {
    console.error('Error creando perfil:', profileError?.message)
  }
  
  // Crear perfil de abogado (pendiente de verificacion) - solo campos basicos
  const { error: lawyerError } = await supabase
    .from('lawyer_profiles')
    .insert({
      id: authData.user.id,
      display_name: `${datos.nombre} ${datos.apellidos}`,
      verification_status: 'pending',
      is_available: false,
      codigo_postal: datos.codigoPostal
    })
  
  if (lawyerError) {
    console.error('Error creando perfil de abogado:', lawyerError?.message)
  }
  
  // Crear solicitud para seguimiento admin
  const { error: solicitudError } = await supabase
    .from('solicitudes_abogados')
    .insert({
      tipo: datos.tipoRegistro,
      nombre: datos.nombre,
      apellidos: datos.apellidos,
      email: datos.email.toLowerCase(),
      telefono: datos.telefono,
      cedula: datos.cedula,
      universidad: datos.universidad || null,
      estado: datos.estado,
      ciudad: datos.estado,
      codigo_postal: datos.codigoPostal,
      status: 'pending',
      cedula_verificada: false
    })
  
  if (solicitudError) {
    console.error('Error creando solicitud:', solicitudError?.message)
  }
  
  // Registrar en arbol de referidos si tiene codigo
  if (datos.codigoReferido) {
    await supabase
      .rpc('registrar_referido', { 
        p_nuevo_user_id: authData.user.id, 
        p_codigo_referido: datos.codigoReferido 
      })
  }
  
  revalidatePath('/admin/solicitudes-abogados')
  return { error: null, success: true, userId: authData.user.id }
}

interface AbogadoFormData {
  nombre: string
  apellidos: string
  email: string
  telefono: string
  cedula: string
  universidad?: string
  especialidad?: string
  experiencia?: string
  direccion?: string
  ciudad: string
  estado: string
  acerca?: string
}

interface DespachoFormData {
  nombre: string
  razonSocial?: string
  rfc?: string
  email: string
  telefono: string
  direccion?: string
  ciudad: string
  estado: string
  modeloNegocio: string
  descripcion?: string
  responsable: string
  cedulaResponsable: string
}

// Registrar solicitud de abogado individual
export async function registrarAbogado(datos: AbogadoFormData) {
  const supabase = await createClient()
  
  // Verificar si ya existe una solicitud con este email o cedula
  const { data: existente } = await supabase
    .from('solicitudes_abogados')
    .select('id')
    .or(`email.eq.${datos.email},cedula.eq.${datos.cedula}`)
    .limit(1)
    .single()
  
  if (existente) {
    return { error: 'Ya existe una solicitud con este correo o cedula profesional' }
  }
  
  // Crear solicitud
  const { error } = await supabase
    .from('solicitudes_abogados')
    .insert({
      tipo: 'abogado',
      nombre: datos.nombre,
      apellidos: datos.apellidos,
      email: datos.email.toLowerCase(),
      telefono: datos.telefono,
      cedula: datos.cedula,
      universidad: datos.universidad || null,
      especialidad: datos.especialidad || 'laboral',
      experiencia_anos: datos.experiencia ? parseInt(datos.experiencia) : null,
      ciudad: datos.ciudad,
      estado: datos.estado,
      acerca: datos.acerca || null,
      status: 'pending', // pending, verified, rejected
      cedula_verificada: false,
      created_at: new Date().toISOString()
    })
  
  if (error) {
    console.error('Error registrando abogado:', error)
    return { error: 'Error al enviar la solicitud. Intenta de nuevo.' }
  }
  
  revalidatePath('/admin/verificaciones-abogados')
  return { error: null, success: true }
}

// Registrar solicitud de despacho
export async function registrarDespacho(datos: DespachoFormData) {
  const supabase = await createClient()
  
  // Verificar si ya existe una solicitud con este email o RFC
  const { data: existente } = await supabase
    .from('solicitudes_abogados')
    .select('id')
    .or(`email.eq.${datos.email}${datos.rfc ? `,rfc.eq.${datos.rfc}` : ''}`)
    .limit(1)
    .single()
  
  if (existente) {
    return { error: 'Ya existe una solicitud con este correo o RFC' }
  }
  
  // Crear solicitud
  const { error } = await supabase
    .from('solicitudes_abogados')
    .insert({
      tipo: 'despacho',
      nombre: datos.nombre,
      razon_social: datos.razonSocial || null,
      rfc: datos.rfc?.toUpperCase() || null,
      email: datos.email.toLowerCase(),
      telefono: datos.telefono,
      direccion: datos.direccion || null,
      ciudad: datos.ciudad,
      estado: datos.estado,
      modelo_negocio: datos.modeloNegocio,
      descripcion: datos.descripcion || null,
      responsable_nombre: datos.responsable,
      cedula: datos.cedulaResponsable,
      status: 'pending',
      cedula_verificada: false,
      created_at: new Date().toISOString()
    })
  
  if (error) {
    console.error('Error registrando despacho:', error)
    return { error: 'Error al enviar la solicitud. Intenta de nuevo.' }
  }
  
  revalidatePath('/admin/verificaciones-abogados')
  return { error: null, success: true }
}

// Para admin: obtener solicitudes pendientes
export async function getSolicitudesPendientes() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado', data: null }
  
  // Verificar rol admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
    return { error: 'No autorizado', data: null }
  }
  
  const { data, error } = await supabase
    .from('solicitudes_abogados')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    return { error: error.message, data: null }
  }
  
  return { error: null, data }
}

// Para admin: aprobar solicitud y crear cuenta
export async function aprobarSolicitud(solicitudId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }
  
  // Verificar rol admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
    return { error: 'No autorizado' }
  }
  
  // Obtener solicitud
  const { data: solicitud, error: fetchError } = await supabase
    .from('solicitudes_abogados')
    .select('*')
    .eq('id', solicitudId)
    .single()
  
  if (fetchError || !solicitud) {
    return { error: 'Solicitud no encontrada' }
  }
  
  // Actualizar status
  const { error: updateError } = await supabase
    .from('solicitudes_abogados')
    .update({
      status: 'verified',
      cedula_verificada: true,
      verificado_por: user.id,
      verificado_at: new Date().toISOString()
    })
    .eq('id', solicitudId)
  
  if (updateError) {
    return { error: updateError.message }
  }
  
  // Si es despacho, crear en tabla despachos
  if (solicitud.tipo === 'despacho') {
    await supabase
      .from('despachos')
      .insert({
        nombre: solicitud.nombre,
        razon_social: solicitud.razon_social,
        rfc: solicitud.rfc,
        email: solicitud.email,
        telefono: solicitud.telefono,
        direccion: solicitud.direccion,
        ciudad: solicitud.ciudad,
        estado: solicitud.estado,
        modelo_negocio: solicitud.modelo_negocio,
        descripcion: solicitud.descripcion,
        status: 'active'
      })
  }
  
  revalidatePath('/admin/verificaciones-abogados')
  return { error: null, success: true }
}

// Para admin: rechazar solicitud
export async function rechazarSolicitud(solicitudId: string, motivo: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }
  
  const { error } = await supabase
    .from('solicitudes_abogados')
    .update({
      status: 'rejected',
      motivo_rechazo: motivo,
      verificado_por: user.id,
      verificado_at: new Date().toISOString()
    })
    .eq('id', solicitudId)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/admin/verificaciones-abogados')
  return { error: null, success: true }
}
