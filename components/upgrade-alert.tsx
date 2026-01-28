'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  CheckCircle2, 
  Star, 
  Sparkles,
  ArrowRight,
  X,
  Shield,
  Briefcase,
  Scale
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface UpgradeAlertProps {
  userId?: string
}

const ROLE_LABELS: Record<string, string> = {
  guest: 'Invitado',
  guestworker: 'Trabajador (pendiente)',
  guestlawyer: 'Abogado (pendiente)',
  worker: 'Trabajador Verificado',
  lawyer: 'Abogado',
  admin: 'Administrador',
  superadmin: 'Super Administrador'
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  worker: <Shield className="w-5 h-5" />,
  lawyer: <Scale className="w-5 h-5" />,
  admin: <Briefcase className="w-5 h-5" />,
  superadmin: <Star className="w-5 h-5" />
}

const UPGRADE_TYPE_MESSAGES: Record<string, string> = {
  verification_complete: 'Tu identidad ha sido verificada exitosamente',
  lawyer_approved: 'Tu cuenta de abogado ha sido aprobada',
  admin_promotion: 'Has sido promovido a Administrador',
  superadmin_promotion: 'Has sido promovido a Super Administrador',
  reactivation: 'Tu cuenta ha sido reactivada'
}

export function UpgradeAlert({ userId }: UpgradeAlertProps) {
  const [upgradeInfo, setUpgradeInfo] = useState<{
    previousRole: string
    currentRole: string
    upgradeType: string
    upgradeReason: string
    upgradeAt: string
  } | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUpgradeInfo() {
      if (!userId) {
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, previous_role, upgrade_type, upgrade_reason, upgrade_at, celebration_shown')
        .eq('id', userId)
        .single()

      if (profile && profile.upgrade_at && !profile.celebration_shown) {
        // Solo mostrar si el upgrade fue reciente (ultimas 24 horas)
        const upgradeDate = new Date(profile.upgrade_at)
        const now = new Date()
        const hoursSinceUpgrade = (now.getTime() - upgradeDate.getTime()) / (1000 * 60 * 60)
        
        if (hoursSinceUpgrade < 24) {
          setUpgradeInfo({
            previousRole: profile.previous_role || 'guest',
            currentRole: profile.role,
            upgradeType: profile.upgrade_type || 'verification_complete',
            upgradeReason: profile.upgrade_reason || '',
            upgradeAt: profile.upgrade_at
          })
        }
      }
      
      setLoading(false)
    }

    loadUpgradeInfo()
  }, [userId])

  const handleDismiss = async () => {
    setDismissed(true)
    
    // Marcar como visto en la base de datos
    if (userId) {
      const supabase = createClient()
      await supabase
        .from('profiles')
        .update({ celebration_shown: true })
        .eq('id', userId)
    }
  }

  if (loading || dismissed || !upgradeInfo) return null

  return (
    <Card className="border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-lg relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/30 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-200/30 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <CardContent className="p-4 sm:p-6 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 text-emerald-600 hover:bg-emerald-100"
          onClick={handleDismiss}
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-emerald-800 text-lg">Cuenta Mejorada</h3>
              <Badge className="bg-emerald-500 text-white border-0">
                <TrendingUp className="w-3 h-3 mr-1" />
                Upgrade
              </Badge>
            </div>
            
            <p className="text-emerald-700 text-sm mb-3">
              {UPGRADE_TYPE_MESSAGES[upgradeInfo.upgradeType] || upgradeInfo.upgradeReason}
            </p>

            {/* Role transition */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Badge variant="outline" className="bg-white/50 text-slate-600 border-slate-300">
                {ROLE_LABELS[upgradeInfo.previousRole] || upgradeInfo.previousRole}
              </Badge>
              <ArrowRight className="w-4 h-4 text-emerald-500" />
              <Badge className="bg-emerald-600 text-white border-0 gap-1">
                {ROLE_ICONS[upgradeInfo.currentRole]}
                {ROLE_LABELS[upgradeInfo.currentRole] || upgradeInfo.currentRole}
              </Badge>
            </div>

            {/* Benefits based on new role */}
            <div className="bg-white/60 rounded-lg p-3 mb-4">
              <p className="text-xs font-medium text-emerald-800 mb-2">Ahora tienes acceso a:</p>
              <div className="flex flex-wrap gap-2">
                {upgradeInfo.currentRole === 'worker' && (
                  <>
                    <Badge variant="outline" className="text-xs bg-white">Crear casos</Badge>
                    <Badge variant="outline" className="text-xs bg-white">Iniciar conciliacion</Badge>
                    <Badge variant="outline" className="text-xs bg-white">Asesoria legal</Badge>
                  </>
                )}
                {upgradeInfo.currentRole === 'lawyer' && (
                  <>
                    <Badge variant="outline" className="text-xs bg-white">Oficina Virtual</Badge>
                    <Badge variant="outline" className="text-xs bg-white">Gestionar clientes</Badge>
                    <Badge variant="outline" className="text-xs bg-white">Casos ilimitados</Badge>
                  </>
                )}
                {(upgradeInfo.currentRole === 'admin' || upgradeInfo.currentRole === 'superadmin') && (
                  <>
                    <Badge variant="outline" className="text-xs bg-white">Panel Admin</Badge>
                    <Badge variant="outline" className="text-xs bg-white">Verificar usuarios</Badge>
                    <Badge variant="outline" className="text-xs bg-white">Gestionar sistema</Badge>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                onClick={handleDismiss}
              >
                <CheckCircle2 className="w-4 h-4" />
                Entendido
              </Button>
              {upgradeInfo.currentRole === 'worker' && (
                <Button asChild size="sm" variant="outline" className="bg-transparent border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                  <Link href="/casos">
                    Ver mis casos
                  </Link>
                </Button>
              )}
              {upgradeInfo.currentRole === 'lawyer' && (
                <Button asChild size="sm" variant="outline" className="bg-transparent border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                  <Link href="/oficina-virtual">
                    Ir a Oficina Virtual
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
