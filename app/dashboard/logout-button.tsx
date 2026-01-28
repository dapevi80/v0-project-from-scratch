'use client'

import { useAuth } from '@/lib/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { LogOut } from 'lucide-react'

interface LogoutButtonProps {
  forgetDevice?: boolean
}

export function LogoutButton({ forgetDevice = false }: LogoutButtonProps) {
  const { logout, clearCache } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    
    // Limpiar cache adicional si se pide olvidar dispositivo
    if (forgetDevice && typeof window !== 'undefined') {
      localStorage.removeItem('mc_guest_credentials')
    }
    
    // Usar el logout del provider que limpia todo
    await logout()
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
