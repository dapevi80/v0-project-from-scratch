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
  referralCode?: string | null
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
  referralCode,
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
    if (referralCode || codigoUsuario) {
      setCodigo(referralCode || codigoUsuario || '--------')
    } else {
      const guestProfile = getOrCreateGuestProfile()
      setCodigo(guestProfile.referralCode)
    }
  }, [codigoUsuario, referralCode])

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

  // Determinar avatar segun modo publico/privado y rol
  const getAvatarSrc = () => {
    // Si el perfil es privado, mostrar avatar anonimo con antifaz
    if (!isPublic) return '/avatars/anonymous-user.jpg'
    const isLawyerRole = role === 'lawyer' || role === 'admin' || role === 'guestlawyer'
    const isDefaultUserAvatar = avatarUrl?.includes('default-user-avatar')
    // Si tiene avatar personalizado, usarlo
    if (avatarUrl && !(isLawyerRole && isDefaultUserAvatar)) return avatarUrl
    // Avatar por defecto segun rol
    if (role === 'superadmin') return '/avatars/superadmin-avatar.jpg'
    // Avatar de abogado profesional para roles de abogado
    if (isLawyerRole) {
      return '/avatars/lawyer-default.jpg'
    }
    return '/avatars/default-user-avatar.jpg'
  }

  // Colores de borde del avatar segun rol
  const getAvatarBorderClass = () => {
    switch (role) {
      case 'superadmin': return 'ring-2 ring-green-400 ring-offset-2 ring-offset-slate-900'
      case 'admin': return 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900'
      case 'lawyer': return 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900'
      case 'guestlawyer': return 'ring-2 ring-blue-300 ring-offset-2 ring-offset-slate-900' // Abogado guest - azul claro
      case 'worker': return 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900'
      default: return 'ring-2 ring-slate-500 ring-offset-2 ring-offset-slate-900'
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header con gradiente y avatar */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-10">
            <span className="absolute top-3 right-6 text-2xl">✨</span>
            <span className="absolute bottom-4 right-16 text-xl">🧠</span>
            <span className="absolute bottom-6 left-10 text-2xl">⚖️</span>
            <span className="absolute top-8 left-1/2 text-xl">📌</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Avatar con imagen - Muestra anonimo si es privado */}
            <div className={`relative w-16 h-16 rounded-full overflow-hidden ${getAvatarBorderClass()} ${!isPublic ? 'ring-slate-500 ring-offset-slate-900' : ''}`}>
              <Image
                src={getAvatarSrc() || "/placeholder.svg"}
                alt={isPublic ? "Avatar" : "Modo Anonimo"}
                fill
                className="object-cover"
                priority
              />
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Nombre visible solo si es publico */}
              <h3 className="text-white font-semibold truncate text-lg">
                {isPublic ? displayName : 'Usuario Anonimo'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className={`text-xs ${!isPublic ? 'bg-slate-600 text-slate-400 border-slate-500' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                  {!isPublic ? 'Incognito' : roleLabel}
                </Badge>
              </div>
            </div>
          </div>

          {/* CODIGO DE REFERIDO - Grande y visible para compartir */}
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-emerald-600/20 to-green-600/20 border border-emerald-500/30 min-h-[86px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-400 font-medium uppercase tracking-wide">Tu Código de Referido</p>
                <p className={`text-2xl font-bold font-mono tracking-wider mt-1 ${isPublic ? 'text-white' : 'text-slate-500'}`}>
                  {isPublic ? codigo : '••••••••'}
                </p>
              </div>
              <Button
                onClick={handleCopyCode}
                variant="outline"
                size="sm"
                disabled={!isPublic}
                className="bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 hover:text-white disabled:opacity-40 disabled:hover:text-emerald-400"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {isPublic ? 'Comparte este código y gana recompensas.' : 'El código se oculta en modo incógnito.'}
            </p>
          </div>

          {/* Switch de modo publico/privado */}
          <div className="mt-3 flex items-center justify-between p-2 rounded-lg bg-slate-700/50 min-h-[46px]">
            <div className="flex items-start gap-2">
              {isPublic ? (
                <Eye className="w-4 h-4 text-green-400" />
              ) : (
                <EyeOff className="w-4 h-4 text-amber-400" />
              )}
              <div>
                <p className="text-xs text-slate-300">
                  {isPublic ? 'Perfil público' : 'Modo incógnito (navegación anónima)'}
                </p>
                <p className="text-[10px] text-slate-400">
                  Define cómo aparecerás al comentar en el Buró de Empresas (próximamente).
                </p>
              </div>
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
