'use client'

import React from "react"
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User,
  Shield,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'
import { generateRandomCode } from '@/lib/types'

interface UserProfileCardProps {
  userId?: string
  email?: string
  fullName?: string | null
  isGuest?: boolean
  role?: string
  codigoUsuario?: string | null
  isVerified?: boolean
  verificationStatus?: string // 'none' | 'pending' | 'verified'
  casosActivos?: number
}

// Genera o recupera datos del perfil desde localStorage
function getOrCreateGuestProfile() {
  if (typeof window === 'undefined') return { displayName: 'invitado', referralCode: '00000000' }
  
  const stored = localStorage.getItem('guest_profile')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // Si hay error parseando, crear nuevo
    }
  }
  
  const code = generateRandomCode(8)
  const profile = {
    displayName: `invitado${code}`,
    referralCode: code,
    isAnonymous: true
  }
  localStorage.setItem('guest_profile', JSON.stringify(profile))
  return profile
}

export function UserProfileCard({
  fullName: propFullName,
  role = 'guest',
  codigoUsuario,
  isVerified = false,
  verificationStatus = 'none',
  casosActivos = 0
}: UserProfileCardProps) {
  const [codigo, setCodigo] = useState(codigoUsuario || '--------')

  useEffect(() => {
    if (codigoUsuario) {
      setCodigo(codigoUsuario)
    } else {
      const guestProfile = getOrCreateGuestProfile()
      setCodigo(guestProfile.referralCode)
    }
  }, [codigoUsuario])

  // Determinar estado de verificacion
  const getVerificationDisplay = () => {
    if (isVerified || verificationStatus === 'verified' || role === 'worker') {
      return { 
        icon: CheckCircle, 
        color: 'text-green-500', 
        bg: 'bg-green-50', 
        border: 'border-green-200',
        label: 'Verificado',
        sublabel: 'Cuenta activa'
      }
    }
    if (verificationStatus === 'pending') {
      return { 
        icon: AlertTriangle, 
        color: 'text-amber-500', 
        bg: 'bg-amber-50', 
        border: 'border-amber-200',
        label: 'Pendiente',
        sublabel: 'En revision'
      }
    }
    return { 
      icon: XCircle, 
      color: 'text-gray-400', 
      bg: 'bg-gray-50', 
      border: 'border-gray-200',
      label: 'Sin verificar',
      sublabel: 'Completa tu perfil'
    }
  }

  const verification = getVerificationDisplay()
  const VerificationIcon = verification.icon

  const displayName = propFullName || `Usuario ${codigo.slice(0, 4)}`
  const roleLabel = role === 'guest' ? 'Invitado' : 
                    role === 'worker' ? 'Trabajador' : 
                    role === 'lawyer' ? 'Abogado' : 
                    role === 'admin' ? 'Admin' : 
                    role === 'superadmin' ? 'SuperAdmin' : role

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header compacto con gradiente */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4">
          <div className="flex items-center gap-3">
            {/* Avatar circular con inicial */}
            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600 text-white font-bold text-lg">
              {propFullName ? propFullName.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold truncate">{displayName}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="bg-slate-700 text-slate-300 border-slate-600 text-xs">
                  {roleLabel}
                </Badge>
                <span className="font-mono text-xs text-slate-400">{codigo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Estado de verificacion prominente */}
        <Link href="/perfil">
          <div className={`p-3 flex items-center gap-3 ${verification.bg} ${verification.border} border-t-0 cursor-pointer hover:opacity-90 transition-opacity`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white border ${verification.border}`}>
              <VerificationIcon className={`w-5 h-5 ${verification.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{verification.label}</p>
              <p className="text-xs text-gray-600">{verification.sublabel}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>

        {/* Boton ir a perfil */}
        <div className="p-3 pt-0">
          <Button asChild variant="outline" className="w-full bg-transparent" size="sm">
            <Link href="/perfil" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {verification.label === 'Sin verificar' ? 'Verificar cuenta' : 'Ver perfil completo'}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
