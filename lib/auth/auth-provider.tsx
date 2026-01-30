'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

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
  sexo?: string | null
  // Nuevos campos para sistema de bienvenida y perfil publico
  is_profile_public: boolean
  first_login_at: string | null
  login_count: number
  last_welcome_shown_at: string | null
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const initRef = useRef(false)

  const clearCache = useCallback(() => {
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('sb-') || key.startsWith('mc_')) {
          localStorage.removeItem(key)
        }
      })
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {}
    
    clearCache()
    setUser(null)
    setProfile(null)
    window.location.href = '/acceso'
  }, [clearCache])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, codigo_usuario, verification_status, celebration_shown, downgrade_reason, previous_role, upgrade_at, upgrade_type, avatar_url, phone, sexo, is_profile_public, first_login_at, login_count, last_welcome_shown_at')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile({
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
        phone: data.phone,
        sexo: data.sexo,
        is_profile_public: data.is_profile_public ?? true,
        first_login_at: data.first_login_at,
        login_count: data.login_count || 0,
        last_welcome_shown_at: data.last_welcome_shown_at
      })
    }
  }, [user])

  // Init auth - solo una vez
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const supabase = createClient()
    let mounted = true

    // Timeout para no bloquear la UI
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.log('[v0] Auth timeout - continuing without auth')
        setLoading(false)
      }
    }, 5000)

    async function init() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (!mounted) return
        
        if (currentUser) {
          setUser(currentUser)
          
          const { data } = await supabase
            .from('profiles')
            .select('id, email, full_name, role, codigo_usuario, verification_status, celebration_shown, downgrade_reason, previous_role, upgrade_at, upgrade_type, avatar_url, phone, sexo, is_profile_public, first_login_at, login_count, last_welcome_shown_at')
            .eq('id', currentUser.id)
            .single()

          if (mounted && data) {
            setProfile({
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
              phone: data.phone,
              sexo: data.sexo,
              is_profile_public: data.is_profile_public ?? true,
              first_login_at: data.first_login_at,
              login_count: data.login_count || 0,
              last_welcome_shown_at: data.last_welcome_shown_at
            })
          }
        }
      } catch (e) {
        console.log('[v0] Auth error:', e)
      } finally {
        clearTimeout(timeout)
        if (mounted) setLoading(false)
      }
    }

    init()

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
      } else if (session?.user) {
        setUser(session.user)
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

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
