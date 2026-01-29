'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type UserRole = 'guest' | 'worker' | 'lawyer' | 'admin' | 'superadmin' | 'agent'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  codigo_usuario: string | null
  avatar_url: string | null
  phone: string | null
  verification_status: string | null
  created_at: string
}

export interface LawyerProfile {
  id: string
  user_id: string
  cedula_profesional: string
  universidad: string | null
  especialidad: string | null
  anos_experiencia: number
  bio: string | null
  foto_url: string | null
  status: 'draft' | 'submitted' | 'verified' | 'rejected'
  is_active: boolean
  rating_avg: number
  total_cases: number
  won_cases: number
  commission_rate: number
}

// Obtener usuario actual con perfil completo
export async function getCurrentUser(): Promise<{ user: UserProfile | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { user: null, error: 'No autenticado' }
  }
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (profileError || !profile) {
    return { user: null, error: 'Perfil no encontrado' }
  }
  
  return { 
    user: {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role as UserRole,
      codigo_usuario: profile.codigo_usuario,
      avatar_url: profile.avatar_url,
      phone: profile.phone,
      is_verified: profile.verification_status === 'verified',
      created_at: profile.created_at
    }, 
    error: null 
  }
}

// Obtener perfil de abogado
export async function getLawyerProfile(userId?: string): Promise<{ lawyer: LawyerProfile | null; error: string | null }> {
  const supabase = await createClient()
  
  let targetUserId = userId
  
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { lawyer: null, error: 'No autenticado' }
    targetUserId = user.id
  }
  
  const { data, error } = await supabase
    .from('lawyer_profiles')
    .select('*')
    .eq('user_id', targetUserId)
    .single()
  
  if (error) {
    return { lawyer: null, error: error.message }
  }
  
  return { lawyer: data as LawyerProfile, error: null }
}

// Verificar si el usuario tiene un rol específico
export async function hasRole(allowedRoles: UserRole[]): Promise<boolean> {
  const { user, error } = await getCurrentUser()
  
  if (error || !user) return false
  
  return allowedRoles.includes(user.role)
}

// Middleware para proteger rutas por rol
export async function requireRole(allowedRoles: UserRole[], redirectTo: string = '/acceso') {
  const { user, error } = await getCurrentUser()
  
  if (error || !user || !allowedRoles.includes(user.role)) {
    redirect(redirectTo)
  }
  
  return user
}

// Verificar si es abogado verificado
export async function isVerifiedLawyer(): Promise<boolean> {
  const { user } = await getCurrentUser()
  if (!user || user.role !== 'lawyer') return false
  
  const { lawyer } = await getLawyerProfile(user.id)
  return lawyer?.status === 'verified' && lawyer?.is_active === true
}

// Verificar si es admin o superadmin
export async function isAdmin(): Promise<boolean> {
  const { user } = await getCurrentUser()
  return user?.role === 'admin' || user?.role === 'superadmin'
}

// Verificar si es superadmin
export async function isSuperAdmin(): Promise<boolean> {
  const { user } = await getCurrentUser()
  return user?.role === 'superadmin'
}

// Obtener permisos basados en rol (funcion sincrona, no exportada como Server Action)
function getRolePermissionsSync(role: UserRole) {
  const permissions = {
    guest: {
      canCalculate: true,
      canUploadDocuments: true,
      canCreateCase: false,
      canViewMarketplace: false,
      canMakeOffers: false,
      canAccessAdmin: false,
      canManageUsers: false,
      canVerifyLawyers: false,
      canProcessPayouts: false
    },
    worker: {
      canCalculate: true,
      canUploadDocuments: true,
      canCreateCase: true,
      canViewMarketplace: false,
      canMakeOffers: false,
      canAccessAdmin: false,
      canManageUsers: false,
      canVerifyLawyers: false,
      canProcessPayouts: false
    },
    lawyer: {
      canCalculate: true,
      canUploadDocuments: true,
      canCreateCase: false,
      canViewMarketplace: true,
      canMakeOffers: true,
      canAccessAdmin: false,
      canManageUsers: false,
      canVerifyLawyers: false,
      canProcessPayouts: false
    },
    agent: {
      canCalculate: true,
      canUploadDocuments: true,
      canCreateCase: true,
      canViewMarketplace: false,
      canMakeOffers: false,
      canAccessAdmin: false,
      canManageUsers: false,
      canVerifyLawyers: false,
      canProcessPayouts: false
    },
    admin: {
      canCalculate: true,
      canUploadDocuments: true,
      canCreateCase: true,
      canViewMarketplace: true,
      canMakeOffers: false,
      canAccessAdmin: true,
      canManageUsers: true,
      canVerifyLawyers: true,
      canProcessPayouts: false
    },
    superadmin: {
      canCalculate: true,
      canUploadDocuments: true,
      canCreateCase: true,
      canViewMarketplace: true,
      canMakeOffers: false,
      canAccessAdmin: true,
      canManageUsers: true,
      canVerifyLawyers: true,
      canProcessPayouts: true
    }
  }
  
  return permissions[role] || permissions.guest
}

// Wrapper async para Server Action
export async function getRolePermissions(role: UserRole) {
  return getRolePermissionsSync(role)
}
