'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/auth-provider'
import confetti from 'canvas-confetti'
import { AyudaUrgenteButton } from '@/components/ayuda-urgente-button'
import { CryptoWallet } from '@/components/wallet/crypto-wallet'
import { DashboardSkeleton } from '@/components/ui/dashboard-skeleton'
import { LogoutButton } from '@/app/dashboard/logout-button'
import { AlertCircle, Award } from 'lucide-react'

export default function AbogadoDashboardPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading, role } = useAuth()
  const [pageLoading, setPageLoading] = useState(true)
  const [stats, setStats] = useState({ casos: 0, completados: 0, calculos: 0 })
  const [lawyerProfile, setLawyerProfile] = useState<{ display_name?: string; verification_status?: string; cedula_profesional?: string; photo_url?: string } | null>(null)
  const [verificationProgress, setVerificationProgress] = useState(0)

  // Redirigir si no es abogado
  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.replace('/acceso')
      return
    }
    
    if (role !== 'lawyer' && role !== 'guestlawyer' && role !== 'admin' && role !== 'superadmin') {
      router.replace('/dashboard')
      return
    }
    
    // Usuario valido, cargar datos
    loadData()
  }, [authLoading, user, role, router])

  async function loadData() {
    if (!user) return
    
    const supabase = createClient()
    
    try {
      // Cargar en paralelo
      const [lawyerRes, casosRes, completadosRes, calculosRes] = await Promise.all([
        supabase.from('lawyer_profiles').select('display_name, verification_status, cedula_profesional, photo_url').eq('user_id', user.id).maybeSingle(),
        supabase.from('casos').select('*', { count: 'exact', head: true }).eq('abogado_id', user.id).in('status', ['assigned', 'in_progress']),
        supabase.from('casos').select('*', { count: 'exact', head: true }).eq('abogado_id', user.id).eq('status', 'completed'),
        supabase.from('calculos_liquidacion').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      ])
      
      if (lawyerRes.data) setLawyerProfile(lawyerRes.data)
      setStats({
        casos: casosRes.count || 0,
        completados: completadosRes.count || 0,
        calculos: calculosRes.count || 0
      })
      
      // Calcular progreso de verificacion
      let progress = 0
      if (lawyerRes.data?.cedula_profesional) progress += 50
      if (lawyerRes.data?.verification_status === 'verified') progress = 100
      else if (lawyerRes.data?.verification_status === 'pending') progress = 75
      setVerificationProgress(progress)
      
      // Celebracion si es abogado verificado que no ha visto
      if (profile?.role === 'lawyer' && !profile?.celebration_shown) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
        supabase.from('profiles').update({ celebration_shown: true }).eq('id', user.id)
      }
    } catch (e) {
      console.log('[v0] Error loading lawyer data:', e)
    } finally {
      setPageLoading(false)
    }
  }

  if (authLoading || pageLoading) {
    return <DashboardSkeleton />
  }

  const isVerified = role === 'lawyer' || role === 'admin' || role === 'superadmin'
  const isGuestLawyer = role === 'guestlawyer'
  const displayName = lawyerProfile?.display_name || profile?.full_name || 'Abogado'

  // Herramientas con emojis
  const freeTools = [
    { name: 'Calculadora', href: '/calculadora', emoji: '🧮', description: 'Calcula liquidaciones', available: true },
    { name: 'Boveda', href: '/boveda', emoji: '🔐', description: 'Guarda documentos', available: true },
    { name: 'Guia LFT', href: '/guia-lft', emoji: '📖', description: 'Ley Federal del Trabajo', available: true }
  ]

  const lawyerTools = [
    { name: 'Mis Casos', href: '/abogado/casos', emoji: '⚖️', description: 'Gestiona y toma casos', available: true, highlight: true },
    { name: 'AutoCCL', href: '/oficina-virtual/ccl', emoji: '📝', description: 'Genera solicitudes CCL', available: isVerified, badge: isGuestLawyer ? 'Verificate' : undefined },
    { name: 'Marketplace', href: '/oficina-virtual/casos', emoji: '🛒', description: 'Casos disponibles', available: isVerified, badge: isGuestLawyer ? 'Verificate' : undefined },
    { name: 'Leads', href: '/oficina-virtual/leads', emoji: '👥', description: 'Clientes potenciales', available: isVerified, badge: isGuestLawyer ? 'Verificate' : undefined }
  ]

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">!m!</span>
            </div>
            <span className="font-semibold hidden sm:inline">mecorrieron.mx</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <AyudaUrgenteButton variant="outline" size="sm" className="hidden sm:flex" />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6 max-w-5xl">
        {/* Perfil */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold truncate">{displayName}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant={isVerified ? 'default' : 'secondary'} className="text-xs">
                    {isVerified ? 'Abogado Verificado' : 'En Verificacion'}
                  </Badge>
                  {lawyerProfile?.cedula_profesional && (
                    <span className="text-xs text-muted-foreground">
                      Cedula: {lawyerProfile.cedula_profesional}
                    </span>
                  )}
                </div>
              </div>
              {isVerified && <Award className="w-8 h-8 text-yellow-500" />}
            </div>
          </CardContent>
        </Card>

        {/* Limites para guestlawyer */}
        {isGuestLawyer && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-amber-800">Cuenta en verificacion</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Tienes limite de 1 caso y 3 calculos. Verifica tu cuenta para acceso ilimitado.
                  </p>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-amber-700 mb-1">
                      <span>Progreso de verificacion</span>
                      <span>{verificationProgress}%</span>
                    </div>
                    <Progress value={verificationProgress} className="h-2" />
                  </div>
                  <Button size="sm" className="mt-3" asChild>
                    <Link href="/oficina-virtual/guestlawyer">Completar verificacion</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estadisticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <span className="text-2xl">⚖️</span>
              <p className="text-2xl font-bold mt-1 text-blue-700">{stats.casos}</p>
              <p className="text-xs text-blue-600">Casos Activos</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4 text-center">
              <span className="text-2xl">✅</span>
              <p className="text-2xl font-bold mt-1 text-green-700">{stats.completados}</p>
              <p className="text-xs text-green-600">Completados</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <span className="text-2xl">🧮</span>
              <p className="text-2xl font-bold mt-1 text-purple-700">{stats.calculos}</p>
              <p className="text-xs text-purple-600">Calculos</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
            <CardContent className="p-4 text-center">
              <span className="text-2xl">🪙</span>
              <p className="text-2xl font-bold mt-1 text-amber-700">{isVerified ? '250' : '0'}</p>
              <p className="text-xs text-amber-600">Creditos</p>
            </CardContent>
          </Card>
        </div>

        {/* Herramientas Gratuitas */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold">Herramientas Gratuitas</h2>
            <Badge variant="secondary" className="text-xs">Sin costo</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {freeTools.map((tool) => (
              <Link key={tool.name} href={tool.href}>
                <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
                  <CardContent className="p-4 sm:p-5 flex flex-col items-center text-center gap-2">
                    <span className="text-3xl sm:text-4xl">{tool.emoji}</span>
                    <p className="font-semibold text-foreground text-sm sm:text-base">{tool.name}</p>
                    <p className="text-xs text-muted-foreground">{tool.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Herramientas de Abogado */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold">Herramientas para Abogados</h2>
            {isVerified ? (
              <Badge className="bg-blue-600 text-white text-xs">PRO</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Verifica tu cuenta</Badge>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lawyerTools.map((tool) => (
              <Link key={tool.name} href={tool.available ? tool.href : '#'} className={!tool.available ? 'pointer-events-none' : ''}>
                <Card className={`transition-all h-full ${
                  tool.available 
                    ? tool.highlight 
                      ? 'hover:shadow-lg cursor-pointer border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 hover:border-emerald-400' 
                      : 'hover:shadow-md cursor-pointer hover:border-blue-400'
                    : 'opacity-50 bg-muted/30 border-dashed'
                }`}>
                  <CardContent className="p-4 sm:p-5 flex flex-col items-center text-center gap-2">
                    <span className={`text-3xl sm:text-4xl ${!tool.available ? 'grayscale' : ''}`}>{tool.emoji}</span>
                    <div className="flex items-center gap-1.5">
                      <p className={`font-semibold text-sm sm:text-base ${tool.available ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {tool.name}
                      </p>
                      {tool.badge && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{tool.badge}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{tool.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Admin Tools */}
        {(role === 'admin' || role === 'superadmin') && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-semibold">Administracion</h2>
              <Badge className="bg-red-600 text-white text-xs">ADMIN</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/admin/solicitudes-abogados">
                <Card className="hover:shadow-md transition-all cursor-pointer hover:border-indigo-400 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
                  <CardContent className="p-4 sm:p-5 flex flex-col items-center text-center gap-2">
                    <span className="text-3xl">🛡️</span>
                    <p className="font-semibold">Verificar Abogados</p>
                    <p className="text-xs text-muted-foreground">Aprobar solicitudes</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/admin">
                <Card className="hover:shadow-md transition-all cursor-pointer hover:border-indigo-400 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
                  <CardContent className="p-4 sm:p-5 flex flex-col items-center text-center gap-2">
                    <span className="text-3xl">📊</span>
                    <p className="font-semibold">Panel Admin</p>
                    <p className="text-xs text-muted-foreground">Gestionar plataforma</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        )}

        {/* Wallet */}
        <CryptoWallet />
      </main>
    </div>
  )
}
