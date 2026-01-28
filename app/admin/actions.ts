'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Verificar que el usuario es admin
async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'No autenticado', isAdmin: false }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
    return { error: 'Sin permisos de administrador', isAdmin: false }
  }
  
  return { error: null, isAdmin: true, isSuperAdmin: profile.role === 'superadmin' }
}

// Dashboard stats
export async function getAdminDashboard() {
  const { error, isAdmin } = await verifyAdmin()
  if (error) return { error, data: null }
  
  const supabase = await createClient()
  
  // Contar cotizaciones por estado
  const { data: cotizacionesStats } = await supabase
    .from('cotizaciones')
    .select('status')
  
  const cotizacionesByStatus = cotizacionesStats?.reduce((acc: Record<string, number>, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1
    return acc
  }, {}) || {}
  
  // Contar casos por estado
  const { data: casesStats } = await supabase
    .from('cases')
    .select('status')
  
  const casesByStatus = casesStats?.reduce((acc: Record<string, number>, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1
    return acc
  }, {}) || {}
  
  // Contar abogados por estado de verificación
  const { data: lawyersStats } = await supabase
    .from('lawyer_profiles')
    .select('verification_status')
  
  const lawyersByStatus = lawyersStats?.reduce((acc: Record<string, number>, l) => {
    acc[l.verification_status || 'pending'] = (acc[l.verification_status || 'pending'] || 0) + 1
    return acc
  }, {}) || {}
  
  // Contar usuarios por rol
  const { data: usersStats } = await supabase
    .from('profiles')
    .select('role')
  
  const usersByRole = usersStats?.reduce((acc: Record<string, number>, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1
    return acc
  }, {}) || {}
  
  return {
    error: null,
    data: {
      cotizaciones: {
        total: cotizacionesStats?.length || 0,
        byStatus: cotizacionesByStatus
      },
      cases: {
        total: casesStats?.length || 0,
        byStatus: casesByStatus
      },
      lawyers: {
        total: lawyersStats?.length || 0,
        byStatus: lawyersByStatus
      },
      users: {
        total: usersStats?.length || 0,
        byRole: usersByRole
      }
    }
  }
}

// Cola de casos nuevos
export async function getCasesQueue() {
  const { error, isAdmin } = await verifyAdmin()
  if (error) return { error, data: null }
  
  const supabase = await createClient()
  
  const { data, error: queryError } = await supabase
    .from('cases')
    .select('*')
    .in('status', ['nuevo', 'asignado', 'en_proceso'])
    .order('created_at', { ascending: true })
  
  if (queryError) return { error: queryError.message, data: null }
  
  return { error: null, data }
}

// Abogados pendientes de verificación
export async function getPendingLawyers() {
  const { error, isAdmin } = await verifyAdmin()
  if (error) return { error, data: null }
  
  const supabase = await createClient()
  
  const { data, error: queryError } = await supabase
    .from('lawyer_profiles')
    .select('*')
    .in('verification_status', ['pending'])
    .order('created_at', { ascending: true })
  
  if (queryError) return { error: queryError.message, data: null }
  
  return { error: null, data }
}

// Verificar/Rechazar abogado
export async function updateLawyerVerification(lawyerId: string, status: 'verified' | 'rejected', notes?: string) {
  const { error, isAdmin } = await verifyAdmin()
  if (error) return { error }
  
  const supabase = await createClient()
  
  const { error: updateError } = await supabase
    .from('lawyer_profiles')
    .update({
      verification_status: status,
      verified_at: status === 'verified' ? new Date().toISOString() : null
    })
    .eq('user_id', lawyerId)
  
  if (updateError) return { error: updateError.message }
  
  // Actualizar documentos
  await supabase
    .from('lawyer_documents')
    .update({ status: status === 'verified' ? 'approved' : 'rejected' })
    .eq('lawyer_id', lawyerId)
  
  revalidatePath('/admin/abogados')
  return { error: null }
}

// Asignar abogado a caso
export async function assignLawyerToCase(caseId: string, lawyerId: string) {
  const { error, isAdmin } = await verifyAdmin()
  if (error) return { error }
  
  const supabase = await createClient()
  
  const { error: updateError } = await supabase
    .from('cases')
    .update({
      lawyer_id: lawyerId,
      status: 'assigned',
      assigned_at: new Date().toISOString()
    })
    .eq('id', caseId)
  
  if (updateError) return { error: updateError.message }
  
  revalidatePath('/admin/casos')
  return { error: null }
}

// Obtener payouts pendientes (tabla crypto_payouts pendiente de crear)
export async function getPendingPayouts() {
  const { error, isSuperAdmin } = await verifyAdmin()
  if (error) return { error, data: null }
  if (!isSuperAdmin) return { error: 'Solo superadmin puede ver payouts', data: null }
  
  // Tabla crypto_payouts no existe aun
  return { error: null, data: [] }
}

// Procesar payout (tabla crypto_payouts pendiente de crear)
export async function processPayout(_payoutId: string, _txHash: string) {
  const { error, isSuperAdmin } = await verifyAdmin()
  if (error) return { error }
  if (!isSuperAdmin) return { error: 'Solo superadmin puede procesar payouts' }
  
  // Tabla crypto_payouts no existe aun
  return { error: 'Funcionalidad no disponible aun' }
}

// Obtener todos los achievements (tabla achievements pendiente de crear)
export async function getAchievements() {
  const { error, isAdmin } = await verifyAdmin()
  if (error || !isAdmin) return { error: error || 'Sin permisos', data: null }
  
  // Tabla achievements no existe aun
  return { error: null, data: [] }
}

// Crear achievement (tabla achievements pendiente de crear)
export async function createAchievement(_datos: {
  code: string
  name: string
  description: string
  icon: string
  category: string
  reward_usdt: number
  criteria: Record<string, unknown>
  order_index: number
}) {
  const { error, isAdmin } = await verifyAdmin()
  if (error || !isAdmin) return { error: error || 'Sin permisos' }
  
  // Tabla achievements no existe aun
  return { error: 'Funcionalidad no disponible aun' }
}

// Obtener lista de usuarios
export async function getUsers(filters?: { role?: string; search?: string }) {
  const { error, isAdmin } = await verifyAdmin()
  if (error) return { error, data: null }
  
  const supabase = await createClient()
  
  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (filters?.role) {
    query = query.eq('role', filters.role)
  }
  
  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
  }
  
  const { data, error: queryError } = await query.limit(100)
  
  if (queryError) return { error: queryError.message, data: null }
  
  return { error: null, data }
}

// Actualizar rol de usuario
export async function updateUserRole(userId: string, newRole: string) {
  const { error, isSuperAdmin } = await verifyAdmin()
  if (error) return { error }
  if (!isSuperAdmin) return { error: 'Solo superadmin puede cambiar roles' }
  
  const supabase = await createClient()
  
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
  
  if (updateError) return { error: updateError.message }
  
  revalidatePath('/admin/usuarios')
  return { error: null }
}

// ==================== GESTIÓN DE DESPACHOS ====================

// Obtener todos los despachos
export async function getDespachos(filters?: { status?: string; modelo?: string }) {
  const { error, isAdmin } = await verifyAdmin()
  if (error) return { error, data: null }
  
  const supabase = await createClient()
  
  let query = supabase
    .from('despachos')
    .select(`
      *,
      despacho_abogados(
        id,
        role,
        is_active,
        lawyer_profiles(
          user_id,
          display_name,
          status
        )
      )
    `)
    .order('created_at', { ascending: false })
  
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.modelo) {
    query = query.eq('modelo_negocio', filters.modelo)
  }
  
  const { data, error: queryError } = await query
  
  if (queryError) return { error: queryError.message, data: null }
  
  return { error: null, data }
}

// Crear despacho
export async function createDespacho(datos: {
  nombre: string
  razon_social?: string
  rfc?: string
  modelo_negocio: 'B2B' | 'B2BL' | 'B2C'
  email?: string
  telefono?: string
  direccion?: string
}) {
  const { error, isAdmin } = await verifyAdmin()
  if (error) return { error }
  
  const supabase = await createClient()
  
  const { data, error: insertError } = await supabase
    .from('despachos')
    .insert({
      ...datos,
      status: 'active'
    })
    .select()
    .single()
  
  if (insertError) return { error: insertError.message }
  
  revalidatePath('/admin/despachos')
  return { error: null, data }
}

// Actualizar despacho
export async function updateDespacho(despachoId: string, datos: Partial<{
  nombre: string
  razon_social: string
  rfc: string
  modelo_negocio: string
  email: string
  telefono: string
  direccion: string
  status: string
  comision_porcentaje: number
}>) {
  const { error, isAdmin } = await verifyAdmin()
  if (error) return { error }
  
  const supabase = await createClient()
  
  const { error: updateError } = await supabase
    .from('despachos')
    .update(datos)
    .eq('id', despachoId)
  
  if (updateError) return { error: updateError.message }
  
  revalidatePath('/admin/despachos')
  return { error: null }
}

// Agregar abogado a despacho
export async function addLawyerToDespacho(despachoId: string, lawyerId: string, role: 'owner' | 'admin' | 'lawyer' = 'lawyer') {
  const { error, isAdmin } = await verifyAdmin()
  if (error) return { error }
  
  const supabase = await createClient()
  
  // Verificar que el abogado no esté ya en el despacho
  const { data: existing } = await supabase
    .from('despacho_abogados')
    .select('id')
    .eq('despacho_id', despachoId)
    .eq('lawyer_id', lawyerId)
    .single()
  
  if (existing) {
    return { error: 'El abogado ya pertenece a este despacho' }
  }
  
  const { error: insertError } = await supabase
    .from('despacho_abogados')
    .insert({
      despacho_id: despachoId,
      lawyer_id: lawyerId,
      role,
      is_active: true
    })
  
  if (insertError) return { error: insertError.message }
  
  revalidatePath('/admin/despachos')
  return { error: null }
}

// Remover abogado de despacho
export async function removeLawyerFromDespacho(despachoId: string, lawyerId: string) {
  const { error, isAdmin } = await verifyAdmin()
  if (error) return { error }
  
  const supabase = await createClient()
  
  const { error: deleteError } = await supabase
    .from('despacho_abogados')
    .delete()
    .eq('despacho_id', despachoId)
    .eq('lawyer_id', lawyerId)
  
  if (deleteError) return { error: deleteError.message }
  
  revalidatePath('/admin/despachos')
  return { error: null }
}

// Obtener estadísticas detalladas para dashboard admin
export async function getAdminStats() {
  const { error, isAdmin, isSuperAdmin } = await verifyAdmin()
  if (error) return { error, data: null }
  
  const supabase = await createClient()
  
  // Usuarios activos (últimas 24h)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  
  const [
    { count: totalUsers },
    { count: verifiedWorkers },
    { count: pendingVerification },
    { count: totalCotizaciones },
    { count: activeCases },
    { count: openCases },
    { count: totalDespachos }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'worker').eq('verification_status', 'verified'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    supabase.from('cotizaciones').select('*', { count: 'exact', head: true }),
    supabase.from('cases').select('*', { count: 'exact', head: true }).in('status', ['asignado', 'en_proceso']),
    supabase.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'nuevo'),
    supabase.from('despachos').select('*', { count: 'exact', head: true })
  ])
  
  return {
    error: null,
    data: {
      totalUsers: totalUsers || 0,
      verifiedWorkers: verifiedWorkers || 0,
      pendingVerification: pendingVerification || 0,
      totalCotizaciones: totalCotizaciones || 0,
      activeCases: activeCases || 0,
      openCases: openCases || 0,
      isSuperAdmin
    }
  }
}
