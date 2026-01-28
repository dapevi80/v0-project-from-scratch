'use client'

import React from "react"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Share2,
  UserCircle,
  Shield,
  Settings,
  Camera,
  BadgeCheck,
  Briefcase
} from 'lucide-react'
import Link from 'next/link'
import { generateRandomCode } from '@/lib/types'

interface UserProfileCardProps {
  userId?: string
  email?: string
  fullName?: string | null
  isGuest?: boolean
  role?: string
  codigoUsuario?: string | null // Codigo unico de la base de datos
  isVerified?: boolean // Si el perfil esta verificado
  casosActivos?: number // Numero de casos activos
  onToggleAnonymous?: (isAnonymous: boolean) => void
}

// Genera o recupera datos del perfil desde localStorage
function getOrCreateGuestProfile() {
  if (typeof window === 'undefined') return { displayName: 'invitado', referralCode: '00000000', isAnonymous: true, avatarUrl: null }
  
  const stored = localStorage.getItem('guest_profile')
  if (stored) {
    return JSON.parse(stored)
  }
  
  const code = generateRandomCode(8)
  const profile = {
    displayName: `invitado${code}`,
    referralCode: code,
    isAnonymous: true,
    fullName: null,
    avatarUrl: null
  }
  localStorage.setItem('guest_profile', JSON.stringify(profile))
  return profile
}

export function UserProfileCard({
  userId,
  email,
  fullName: propFullName,
  isGuest = true,
  role = 'guest',
  codigoUsuario,
  isVerified = false,
  casosActivos = 0,
  onToggleAnonymous
}: UserProfileCardProps) {
  const [copied, setCopied] = useState(false)
  const [profile, setProfile] = useState({
    displayName: 'invitado',
    referralCode: '00000000',
    isAnonymous: true,
    fullName: propFullName || null,
    avatarUrl: null as string | null
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Si hay codigo de usuario desde la BD, usarlo
    if (codigoUsuario) {
      setProfile(prev => ({
        ...prev,
        displayName: codigoUsuario,
        referralCode: codigoUsuario,
        fullName: propFullName || prev.fullName
      }))
    } else {
      // Fallback a localStorage para usuarios sin codigo en BD
      const guestProfile = getOrCreateGuestProfile()
      setProfile(prev => ({
        ...guestProfile,
        fullName: propFullName || guestProfile.fullName
      }))
    }
  }, [propFullName, codigoUsuario])

  const localAnonymous = profile.isAnonymous
  const referralCode = profile.referralCode
  const displayName = profile.displayName
  const fullName = profile.fullName

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(profile.referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggleAnonymous = (checked: boolean) => {
    const newAnonymous = !checked // checked = publico, !checked = anonimo
    const updatedProfile = { ...profile, isAnonymous: newAnonymous }
    setProfile(updatedProfile)
    localStorage.setItem('guest_profile', JSON.stringify(updatedProfile))
    
    // Disparar evento para actualizar otros componentes (como WelcomeGreeting)
    window.dispatchEvent(new CustomEvent('profileChange', { detail: updatedProfile }))
  }

  const handleShareCode = async () => {
    const shareData = {
      title: 'mecorrieron.mx',
      text: `Usa mi codigo de referido: ${profile.referralCode}`,
      url: `https://mecorrieron.mx/registro?ref=${profile.referralCode}`
    }
    
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        handleCopyCode()
      }
    } else {
      handleCopyCode()
    }
  }

  const visibleName = localAnonymous ? profile.displayName : (profile.fullName || profile.displayName)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const avatarUrl = reader.result as string
        const updatedProfile = { ...profile, avatarUrl }
        setProfile(updatedProfile)
        localStorage.setItem('guest_profile', JSON.stringify(updatedProfile))
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header - Rojo en anónimo, Azul en público */}
        <div className={`p-6 flex flex-col items-center ${
          localAnonymous 
            ? 'bg-gradient-to-br from-red-800 to-red-900' 
            : 'bg-gradient-to-br from-slate-800 to-slate-900'
        }`}>
          {localAnonymous ? (
            /* Modo Anónimo: Solo icono incógnito y código */
            <>
              <div className="w-20 h-20 rounded-full bg-red-700/50 flex items-center justify-center border-4 border-red-600/50 shadow-lg">
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  className="w-12 h-12 text-red-300"
                  stroke="currentColor" 
                  strokeWidth="1.5"
                >
                  {/* Sombrero */}
                  <path d="M3 14h18M5 14c0-4 3-7 7-7s7 3 7 7" strokeLinecap="round"/>
                  {/* Gafas */}
                  <circle cx="8.5" cy="14" r="2.5" fill="currentColor"/>
                  <circle cx="15.5" cy="14" r="2.5" fill="currentColor"/>
                  <path d="M11 14h2" strokeLinecap="round"/>
                  {/* Nariz */}
                  <path d="M12 17v2" strokeLinecap="round"/>
                </svg>
              </div>
              
              {/* Texto Modo Anónimo */}
              <p className="mt-4 text-sm text-red-200">Modo anonimo</p>
              
              {/* Código de 8 dígitos */}
              <div className="mt-2 px-4 py-2 rounded-lg bg-red-700/40 border border-red-600/30">
                <span className="font-mono text-lg font-bold text-white tracking-wider">
                  {profile.referralCode}
                </span>
              </div>
              
              {/* Badge */}
              <Badge 
                variant="secondary" 
                className="mt-3 bg-red-700/50 text-red-200 border-red-600/50"
              >
                Usuario Invitado
              </Badge>
            </>
          ) : (
            /* Modo Público: Avatar con foto, nombre y badge */
            <>
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center border-4 border-slate-600 shadow-lg overflow-hidden">
                  {profile.avatarUrl ? (
                    <img 
                      src={profile.avatarUrl || "/placeholder.svg"} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-12 h-12 text-slate-400" />
                  )}
                </div>
                
                {/* Botón cambiar foto */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-slate-800 hover:bg-primary/90 transition-colors"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Nombre visible */}
              <h3 className="mt-4 text-lg font-semibold text-white">
                {profile.fullName || profile.displayName}
              </h3>
              
              {/* Badge de rol */}
              <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
                <Badge 
                  variant="secondary" 
                  className="bg-slate-700 text-slate-300 border-slate-600"
                >
                  {role === 'guest' ? 'Invitado' : role === 'worker' ? 'Trabajador' : role === 'lawyer' ? 'Abogado' : role === 'admin' ? 'Admin' : role === 'superadmin' ? 'SuperAdmin' : role === 'agent' ? 'Agente' : role}
                </Badge>
                
                {/* Insignia de verificado */}
                {isVerified && (
                  <Badge className="bg-green-600 text-white border-green-500 gap-1">
                    <BadgeCheck className="w-3 h-3" />
                    Verificado
                  </Badge>
                )}
                
                {/* Contador de casos activos */}
                {casosActivos > 0 && (
                  <Badge variant="outline" className="bg-blue-600/20 text-blue-300 border-blue-500 gap-1">
                    <Briefcase className="w-3 h-3" />
                    {casosActivos} caso{casosActivos > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </>
          )}
        </div>

        {/* Contenido */}
        <div className="p-4 space-y-4">
          {/* Toggle anonimo/publico */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Perfil anonimo</p>
                <p className="text-xs text-muted-foreground">
                  {localAnonymous ? 'Tu nombre real esta oculto' : 'Tu nombre es visible'}
                </p>
              </div>
            </div>
            <Switch 
              checked={!localAnonymous}
              onCheckedChange={handleToggleAnonymous}
            />
          </div>

          <Separator />

          {/* Codigo de referido */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tu codigo de referido
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 rounded-lg bg-primary/10 border border-primary/20 font-mono text-lg font-bold text-primary text-center tracking-wider">
                {profile.referralCode}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyCode}
                className="h-12 w-12 bg-transparent"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleShareCode}
                className="h-12 w-12 bg-transparent"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Comparte este codigo y gana beneficios
            </p>
          </div>

          {/* Enlace a perfil completo */}
          <Button asChild variant="outline" className="w-full bg-transparent">
            <Link href="/perfil" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Editar perfil completo
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
