'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/lib/types'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  fullName: string | null
  codigoUsuario: string | null
  isVerified: boolean
  lawyerProfile?: {
    id: string
    cedula_profesional: string
    verification_status: 'pending' | 'verified' | 'rejected'
    especialidad: string | null
    rating: number
    casos_completados: number
  } | null
}

// Obtener usuario autenticado con perfil completo
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (!profile) return null
  
  // Si es abogado, obtener perfil de abogado
  let lawyerProfile = null
  if (profile.role === 'lawyer') {
    const { data: lawyer } = await supabase
      .from('lawyer_profiles')
      .select('id, cedula_profesional, verification_status, especialidad, rating, casos_completados')
      .eq('user_id', user.id)
      .single()
    lawyerProfile = lawyer
  }
  
  return {
    id: user.id,
    email: user.email || '',
    role: profile.role as UserRole,
    fullName: profile.full_name,
    codigoUsuario: profile.codigo_usuario,
    isVerified: profile.role !== 'guest',
    lawyerProfile
  }
}

// Verificar si usuario tiene rol requerido
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthUser> {
  const user = await getAuthUser()
  
  if (!user) {
    redirect('/acceso')
  }
  
  if (!allowedRoles.includes(user.role)) {
    redirect('/dashboard?error=unauthorized')
  }
  
  return user
}

// Verificar si es abogado verificado
export async function requireVerifiedLawyer(): Promise<AuthUser> {
  const user = await requireRole(['lawyer'])
  
  if (!user.lawyerProfile || user.lawyerProfile.verification_status !== 'verified') {
    redirect('/oficina-virtual/verificacion?error=not_verified')
  }
  
  return user
}

// Verificar si es admin o superadmin
export async function requireAdmin(): Promise<AuthUser> {
  return requireRole(['admin', 'superadmin'])
}

// Verificar si es trabajador verificado
export async function requireVerifiedWorker(): Promise<AuthUser> {
  const user = await requireRole(['worker', 'lawyer', 'admin', 'superadmin'])
  return user
}

// Helper para obtener solo el rol del usuario actual
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  return profile?.role as UserRole || null
}

// Verificar permisos para un caso especifico
export async function canAccessCase(caseId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  // Admin y superadmin pueden ver todos los casos
  if (profile?.role === 'admin' || profile?.role === 'superadmin') {
    return true
  }
  
  // Verificar si es el trabajador del caso
  const { data: caso } = await supabase
    .from('casos')
    .select('worker_id, lawyer_id')
    .eq('id', caseId)
    .single()
  
  if (!caso) return false
  
  // Worker puede ver su propio caso
  if (caso.worker_id === user.id) return true
  
  // Abogado asignado puede ver el caso
  if (caso.lawyer_id === user.id) return true
  
  return false
}

// Verificar si abogado puede hacer oferta en un caso
export async function canOfferOnCase(caseId: string): Promise<boolean> {
  const user = await getAuthUser()
  if (!user || user.role !== 'lawyer') return false
  if (!user.lawyerProfile || user.lawyerProfile.verification_status !== 'verified') return false
  
  const supabase = await createClient()
  
  // Verificar que el caso este en marketplace
  const { data: caso } = await supabase
    .from('casos')
    .select('status, lawyer_id')
    .eq('id', caseId)
    .single()
  
  if (!caso) return false
  if (caso.status !== 'open') return false
  if (caso.lawyer_id) return false // Ya tiene abogado asignado
  
  return true
}
