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
import { 
  Calculator, Folder, BookOpen, FileCheck, ShoppingBag, Briefcase, 
  Users, Shield, ChevronRight, CheckCircle2, AlertCircle, Clock,
  Award, Coins
} from 'lucide-react'

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

  // Herramientas
  const freeTools = [
    { name: 'Calculadora', href: '/calculadora', icon: Calculator, description: 'Calcula liquidaciones', available: true },
    { name: 'Boveda', href: '/boveda', icon: Folder, description: 'Guarda documentos', available: true },
    { name: 'Guia LFT', href: '/guia-lft', icon: BookOpen, description: 'Ley Federal del Trabajo', available: true }
  ]

  const lawyerTools = [
    { name: 'AutoCCL', href: '/oficina-virtual/ccl', icon: FileCheck, description: 'Genera solicitudes CCL', available: isVerified, badge: isGuestLawyer ? 'Verificate' : undefined },
    { name: 'Marketplace', href: '/oficina-virtual/casos', icon: ShoppingBag, description: 'Casos disponibles', available: isVerified, badge: isGuestLawyer ? 'Verificate' : undefined },
    { name: 'Mis Casos', href: '/abogado/casos', icon: Briefcase, description: 'Gestiona tus casos', available: true },
    { name: 'Leads', href: '/oficina-virtual/leads', icon: Users, description: 'Clientes potenciales', available: isVerified, badge: isGuestLawyer ? 'Verificate' : undefined }
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
          <Card>
            <CardContent className="p-4 text-center">
              <Briefcase className="w-6 h-6 mx-auto text-blue-500" />
              <p className="text-2xl font-bold mt-2">{stats.casos}</p>
              <p className="text-xs text-muted-foreground">Casos Activos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-6 h-6 mx-auto text-green-500" />
              <p className="text-2xl font-bold mt-2">{stats.completados}</p>
              <p className="text-xs text-muted-foreground">Completados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calculator className="w-6 h-6 mx-auto text-purple-500" />
              <p className="text-2xl font-bold mt-2">{stats.calculos}</p>
              <p className="text-xs text-muted-foreground">Calculos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Coins className="w-6 h-6 mx-auto text-yellow-500" />
              <p className="text-2xl font-bold mt-2">{isVerified ? '10' : '0'}</p>
              <p className="text-xs text-muted-foreground">Creditos CCL</p>
            </CardContent>
          </Card>
        </div>

        {/* Herramientas Gratuitas */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Herramientas Gratuitas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {freeTools.map((tool) => (
              <Link key={tool.name} href={tool.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <tool.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{tool.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Herramientas de Abogado */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Herramientas para Abogados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lawyerTools.map((tool) => (
              <Link key={tool.name} href={tool.available ? tool.href : '#'} className={!tool.available ? 'pointer-events-none' : ''}>
                <Card className={`transition-shadow h-full ${tool.available ? 'hover:shadow-md cursor-pointer' : 'opacity-60'}`}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tool.available ? 'bg-blue-500/10' : 'bg-muted'}`}>
                      <tool.icon className={`w-5 h-5 ${tool.available ? 'text-blue-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{tool.name}</p>
                        {tool.badge && (
                          <Badge variant="outline" className="text-xs">{tool.badge}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Admin Tools */}
        {(role === 'admin' || role === 'superadmin') && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Administracion</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/admin/solicitudes-abogados">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Verificar Abogados</p>
                      <p className="text-xs text-muted-foreground">Aprobar solicitudes</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
              <Link href="/admin">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Panel Admin</p>
                      <p className="text-xs text-muted-foreground">Gestionar plataforma</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
