'use client'

import React from "react"
import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  User,
  Shield,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { generateRandomCode } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

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
  isProfilePublic?: boolean
  avatarUrl?: string | null
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

// Funcion para actualizar el modo publico del perfil
async function updateProfilePublicMode(userId: string, isPublic: boolean) {
  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ is_profile_public: isPublic })
    .eq('id', userId)
  
  if (error) {
    console.error('Error updating profile public mode:', error)
    return false
  }
  return true
}

export function UserProfileCard({
  userId,
  fullName: propFullName,
  role = 'guest',
  codigoUsuario,
  isVerified = false,
  verificationStatus = 'none',
  casosActivos = 0,
  isProfilePublic = true,
  avatarUrl
}: UserProfileCardProps) {
  const [codigo, setCodigo] = useState(codigoUsuario || '--------')
  const [isPublic, setIsPublic] = useState(isProfilePublic)
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (codigoUsuario) {
      setCodigo(codigoUsuario)
    } else {
      const guestProfile = getOrCreateGuestProfile()
      setCodigo(guestProfile.referralCode)
    }
  }, [codigoUsuario])

  useEffect(() => {
    setIsPublic(isProfilePublic)
  }, [isProfilePublic])

  const handlePublicModeChange = (checked: boolean) => {
    if (!userId) return
    setIsPublic(checked)
    startTransition(async () => {
      const success = await updateProfilePublicMode(userId, checked)
      if (!success) {
        setIsPublic(!checked) // Revertir si fallo
      }
    })
  }

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(codigo)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
                    role === 'guestlawyer' ? 'Abogado Invitado' :
                    role === 'admin' ? 'Admin' : 
                    role === 'superadmin' ? 'SuperAdmin' : role

  // Determinar avatar segun rol
  const getAvatarSrc = () => {
    if (avatarUrl) return avatarUrl
    if (role === 'superadmin') return '/avatars/superadmin-avatar.jpg'
    return '/avatars/default-user-avatar.jpg'
  }

  // Colores de borde del avatar segun rol
  const getAvatarBorderClass = () => {
    switch (role) {
      case 'superadmin': return 'ring-2 ring-green-400 ring-offset-2 ring-offset-slate-900'
      case 'admin': return 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900'
      case 'lawyer': return 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900'
      case 'worker': return 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900'
      default: return 'ring-2 ring-slate-500 ring-offset-2 ring-offset-slate-900'
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header con gradiente y avatar */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 relative">
          <div className="flex items-center gap-4">
            {/* Avatar con imagen */}
            <div className={`relative w-14 h-14 rounded-full overflow-hidden ${getAvatarBorderClass()}`}>
              <Image
                src={getAvatarSrc() || "/placeholder.svg"}
                alt="Avatar"
                fill
                className="object-cover"
                priority
              />
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Nombre visible solo si es publico o es el propio usuario */}
              <h3 className="text-white font-semibold truncate text-lg">
                {isPublic ? displayName : 'Usuario Privado'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-slate-700 text-slate-300 border-slate-600 text-xs">
                  {roleLabel}
                </Badge>
                {/* Codigo de referido visible solo si es publico */}
                {isPublic && (
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 font-mono text-xs text-slate-400 hover:text-white transition-colors"
                    title="Copiar codigo de referido"
                  >
                    <span>{codigo}</span>
                    {copied ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Switch de modo publico/privado */}
          <div className="mt-3 flex items-center justify-between p-2 rounded-lg bg-slate-700/50">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Eye className="w-4 h-4 text-green-400" />
              ) : (
                <EyeOff className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-xs text-slate-300">
                Perfil {isPublic ? 'Publico' : 'Privado'}
              </span>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={handlePublicModeChange}
              disabled={isPending || !userId}
              className="data-[state=checked]:bg-green-500"
            />
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
