'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { INACTIVITY_TIMEOUT, ROLES_WITH_AUTO_LOGOUT, type UserRole } from '@/lib/types'

interface UseInactivityLogoutOptions {
  userRole: UserRole | null
  enabled?: boolean
  timeout?: number
}

export function useInactivityLogout({ 
  userRole, 
  enabled = true,
  timeout = INACTIVITY_TIMEOUT 
}: UseInactivityLogoutOptions) {
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  
  // Solo aplica a roles verificados
  const shouldAutoLogout = enabled && userRole && ROLES_WITH_AUTO_LOGOUT.includes(userRole)
  
  const handleLogout = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    
    // Redirigir a acceso con mensaje de inactividad
    window.location.href = '/acceso?reason=inactivity'
  }, [])
  
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    if (shouldAutoLogout) {
      timeoutRef.current = setTimeout(() => {
        handleLogout()
      }, timeout)
    }
  }, [shouldAutoLogout, timeout, handleLogout])
  
  useEffect(() => {
    if (!shouldAutoLogout) return
    
    // Eventos que resetean el timer de inactividad
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    
    const handleActivity = () => {
      resetTimer()
    }
    
    // Agregar listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })
    
    // Iniciar timer
    resetTimer()
    
    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [shouldAutoLogout, resetTimer])
  
  return {
    resetTimer,
    isAutoLogoutEnabled: shouldAutoLogout
  }
}
