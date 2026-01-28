'use client'

import React from "react"

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// Cache keys
const PROFILE_CACHE_KEY = 'mc_profile_cache'
const PROFILE_CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: string
  codigo_usuario: string | null
  verification_status: string | null
  celebration_shown: boolean
  downgrade_reason: string | null
  previous_role: string | null
  upgrade_at: string | null
  upgrade_type: string | null
  avatar_url: string | null
  phone: string | null
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  isAuthenticated: boolean
  isGuest: boolean
  role: string
  refreshProfile: () => Promise<void>
  clearCache: () => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Cache en memoria para evitar re-fetches
let memoryCache: {
  profile: UserProfile | null
  timestamp: number
  userId: string | null
} = {
  profile: null,
  timestamp: 0,
  userId: null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Intentar cargar del cache local primero
  const loadFromCache = useCallback((userId: string): UserProfile | null => {
    // Primero memoria
    if (memoryCache.userId === userId && memoryCache.profile) {
      const age = Date.now() - memoryCache.timestamp
      if (age < PROFILE_CACHE_DURATION) {
        return memoryCache.profile
      }
    }
    
    // Luego localStorage
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(PROFILE_CACHE_KEY)
        if (cached) {
          const { profile: cachedProfile, timestamp, userId: cachedUserId } = JSON.parse(cached)
          const age = Date.now() - timestamp
          if (cachedUserId === userId && age < PROFILE_CACHE_DURATION) {
            // Actualizar memoria
            memoryCache = { profile: cachedProfile, timestamp, userId }
            return cachedProfile
          }
        }
      } catch {
        // Cache corrupto, ignorar
      }
    }
    
    return null
  }, [])

  // Guardar en cache
  const saveToCache = useCallback((userId: string, profileData: UserProfile) => {
    const timestamp = Date.now()
    
    // Memoria
    memoryCache = { profile: profileData, timestamp, userId }
    
    // localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
          profile: profileData,
          timestamp,
          userId
        }))
      } catch {
        // Storage lleno, ignorar
      }
    }
  }, [])

  // Limpiar cache
  const clearCache = useCallback(() => {
    memoryCache = { profile: null, timestamp: 0, userId: null }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PROFILE_CACHE_KEY)
      // Limpiar todo lo relacionado a auth
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('sb-') || key.startsWith('mc_')) {
          localStorage.removeItem(key)
        }
      })
    }
  }, [])

  // Cargar perfil desde DB
  const fetchProfile = useCallback(async (userId: string, forceRefresh = false): Promise<UserProfile | null> => {
    // Verificar cache primero (si no es refresh forzado)
    if (!forceRefresh) {
      const cached = loadFromCache(userId)
      if (cached) {
        return cached
      }
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, email, full_name, role, codigo_usuario, verification_status,
        celebration_shown, downgrade_reason, previous_role, upgrade_at,
        upgrade_type, avatar_url, phone
      `)
      .eq('id', userId)
      .single()

    if (error || !data) {
      return null
    }

    const profileData: UserProfile = {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      role: data.role || 'guest',
      codigo_usuario: data.codigo_usuario,
      verification_status: data.verification_status,
      celebration_shown: data.celebration_shown || false,
      downgrade_reason: data.downgrade_reason,
      previous_role: data.previous_role,
      upgrade_at: data.upgrade_at,
      upgrade_type: data.upgrade_type,
      avatar_url: data.avatar_url,
      phone: data.phone
    }

    // Guardar en cache
    saveToCache(userId, profileData)

    return profileData
  }, [loadFromCache, saveToCache])

  // Refresh manual del perfil
  const refreshProfile = useCallback(async () => {
    if (!user) return
    
    const freshProfile = await fetchProfile(user.id, true)
    if (freshProfile) {
      setProfile(freshProfile)
    }
  }, [user, fetchProfile])

  // Logout completo
  const logout = useCallback(async () => {
    setLoading(true)
    
    try {
      const supabase = createClient()
      await supabase.auth.signOut({ scope: 'global' })
    } catch {
      // Ignorar errores de signOut
    }
    
    // Limpiar todo el estado
    clearCache()
    setUser(null)
    setProfile(null)
    setLoading(false)
    
    // Redirigir
    window.location.href = '/acceso'
  }, [clearCache])

  // Inicializar auth
  useEffect(() => {
    if (initialized) return
    
    let isMounted = true
    const supabase = createClient()

    async function initAuth() {
      try {
        // Obtener sesion actual
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (!isMounted) return
        
        if (currentUser) {
          setUser(currentUser)
          
          // Cargar perfil (con cache)
          const profileData = await fetchProfile(currentUser.id)
          if (isMounted && profileData) {
            setProfile(profileData)
          }
        }
      } catch {
        // Error de conexion
      } finally {
        if (isMounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initAuth()

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          clearCache()
        } else if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          const profileData = await fetchProfile(session.user.id)
          if (isMounted && profileData) {
            setProfile(profileData)
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [initialized, fetchProfile, clearCache])

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    isGuest: !user,
    role: profile?.role || 'guest',
    refreshProfile,
    clearCache,
    logout
  }), [user, profile, loading, refreshProfile, clearCache, logout])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook para verificar acceso por rol
export function useRoleAccess(allowedRoles: string[]) {
  const { role, loading, isAuthenticated } = useAuth()
  
  return {
    hasAccess: allowedRoles.includes(role),
    loading,
    isAuthenticated,
    currentRole: role
  }
}
