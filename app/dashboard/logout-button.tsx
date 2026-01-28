'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { LogOut } from 'lucide-react'

// Key para credenciales guest
const GUEST_CREDENTIALS_KEY = 'mc_guest_credentials'

interface LogoutButtonProps {
  forgetDevice?: boolean
}

export function LogoutButton({ forgetDevice = false }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      
      if (error) {
        console.error('Error al cerrar sesión:', error)
      }
      
      // Limpiar cualquier dato local de Supabase
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token')
        
        // Si forgetDevice es true, también borrar credenciales guest
        if (forgetDevice) {
          localStorage.removeItem(GUEST_CREDENTIALS_KEY)
        }
      }
      
      // Redirigir a la página de acceso
      window.location.href = '/acceso'
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      // Forzar redirección aunque falle
      window.location.href = '/acceso'
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleLogout} 
      disabled={isLoading}
      className="gap-2 text-xs sm:text-sm bg-transparent"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">{isLoading ? 'Cerrando...' : 'Cerrar sesión'}</span>
      <span className="sm:hidden">{isLoading ? '...' : 'Salir'}</span>
    </Button>
  )
}
