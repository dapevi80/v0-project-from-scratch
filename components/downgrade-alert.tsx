'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, ShieldX, Upload, X, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface DowngradeAlertProps {
  userId?: string
  onDismiss?: () => void
}

export function DowngradeAlert({ userId, onDismiss }: DowngradeAlertProps) {
  const [downgradeInfo, setDowngradeInfo] = useState<{
    wasDowngraded: boolean
    previousRole?: string
    downgradeReason?: string
    downgradeAt?: string
  } | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const checkDowngrade = async () => {
      if (!userId) return
      
      const supabase = createClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('verification_status, downgrade_reason, downgrade_at, previous_role')
        .eq('id', userId)
        .single()
      
      if (profile?.verification_status === 'documents_missing') {
        setDowngradeInfo({
          wasDowngraded: true,
          previousRole: profile.previous_role,
          downgradeReason: profile.downgrade_reason,
          downgradeAt: profile.downgrade_at
        })
      }
    }
    
    checkDowngrade()
  }, [userId])

  if (!downgradeInfo?.wasDowngraded || dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  const getRoleName = (role?: string) => {
    const names: Record<string, string> = {
      worker: 'Trabajador Verificado',
      lawyer: 'Abogado',
      admin: 'Administrador',
      guestworker: 'Trabajador Invitado',
      guestlawyer: 'Abogado Invitado'
    }
    return names[role || ''] || role
  }

  return (
    <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg animate-in slide-in-from-top-2 duration-300">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <ShieldX className="w-5 h-5 text-amber-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Verificacion Requerida
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  Tu cuenta fue degradada de <span className="font-medium">{getRoleName(downgradeInfo.previousRole)}</span> porque 
                  algunos documentos de verificacion ya no estan disponibles.
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-amber-600 hover:text-amber-800 hover:bg-amber-100 flex-shrink-0"
                onClick={handleDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="mt-3 p-3 rounded-lg bg-white/60 border border-amber-200">
              <p className="text-xs text-amber-800 mb-2">
                Para recuperar tu cuenta verificada necesitas:
              </p>
              <ul className="text-xs text-amber-700 space-y-1">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Volver a escanear tu INE (frente y reverso)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Esperar aprobacion de un abogado o administrador
                </li>
              </ul>
            </div>
            
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" className="gap-1.5 bg-amber-600 hover:bg-amber-700">
                <Link href="/boveda">
                  <Upload className="w-3.5 h-3.5" />
                  Subir documentos
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 bg-transparent">
                <Link href="/perfil">
                  Ver mi perfil
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
