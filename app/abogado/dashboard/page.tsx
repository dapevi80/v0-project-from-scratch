'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { useInactivityLogout } from '@/hooks/use-inactivity-logout'
import { type UserRole } from '@/lib/types'
import confetti from 'canvas-confetti'
import { AyudaUrgenteButton } from '@/components/ayuda-urgente-button'
import { CryptoWallet } from '@/components/wallet/crypto-wallet'
import { DowngradeAlert } from '@/components/downgrade-alert'
import { UpgradeAlert } from '@/components/upgrade-alert'
import { AccountLimitsBanner } from '@/components/account-limits-banner'
import { LawyerCelebration } from '@/components/lawyer-celebration'

interface LawyerData {
  profile: {
    id: string
    full_name: string
    email: string
    phone: string | null
    role: string
    verification_status: string
    celebration_shown: boolean
    downgrade_reason?: string
    upgrade_at?: string
  }
  lawyerProfile: {
    display_name: string | null
    verification_status: string
    is_available: boolean
    verified_at: string | null
    cedula_profesional: string | null
    photo_url: string | null
  } | null
  stats: {
    casosActivos: number
    casosCompletados: number
    calculosActivos: number
    ingresosMes: number
    creditosCCL: number
  }
  verificationProgress: {
    datosBasicos: boolean
    cedulaSubida: boolean
    identificacionSubida: boolean
    comprobanteSubido: boolean
    enRevision: boolean
    verificado: boolean
  }
  isVerified: boolean
  isGuestLawyer: boolean
  limites: {
    maxCasos: number
    maxCalculos: number
  }
}

export default function AbogadoDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<LawyerData | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationType, setCelebrationType] = useState<'verification_approved' | 'reactivation'>('verification_approved')
  
  useInactivityLogout({ 
    userRole: (data?.profile?.role as UserRole) || null,
    enabled: !loading && !!data
  })
  
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.replace('/acceso')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, verification_status, celebration_shown, downgrade_reason, upgrade_at, upgrade_type')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'lawyer' && profile.role !== 'guestlawyer' && profile.role !== 'admin' && profile.role !== 'superadmin')) {
      router.replace('/dashboard')
      return
    }

    const { data: lawyerProfile } = await supabase
      .from('lawyer_profiles')
      .select('display_name, verification_status, is_available, verified_at, cedula_profesional, photo_url')
      .eq('user_id', user.id)
      .maybeSingle()

    const isVerified = lawyerProfile?.verification_status === 'verified' || 
                       lawyerProfile?.verification_status === 'approved' ||
                       profile.role === 'lawyer' ||
                       profile.role === 'admin' ||
                       profile.role === 'superadmin'
    
    const isGuestLawyer = profile.role === 'guestlawyer'

    // Verificar celebracion pendiente
    if (isVerified && !profile.celebration_shown) {
      const wasReactivation = profile.upgrade_type === 'reactivation'
      setCelebrationType(wasReactivation ? 'reactivation' : 'verification_approved')
      setShowCelebration(true)
      
      // Confetti
      const duration = 3000
      const end = Date.now() + duration
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#3b82f6', '#10b981', '#f59e0b']
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#3b82f6', '#10b981', '#f59e0b']
        })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
      
      await supabase.from('profiles').update({ celebration_shown: true }).eq('id', user.id)
    }

    // Estadisticas
    const [casosActivosRes, casosCompletadosRes, calculosRes] = await Promise.all([
      supabase.from('casos').select('*', { count: 'exact', head: true }).eq('abogado_id', user.id).in('status', ['assigned', 'in_progress', 'negotiation']),
      supabase.from('casos').select('*', { count: 'exact', head: true }).eq('abogado_id', user.id).eq('status', 'completed'),
      supabase.from('calculos_liquidacion').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    ])

    // Documentos subidos
    const { data: docs } = await supabase
      .from('lawyer_documents')
      .select('document_type')
      .eq('lawyer_id', user.id)

    const docTypes = docs?.map(d => d.document_type) || []

    const verificationProgress = {
      datosBasicos: !!profile.full_name && !!profile.email && !!profile.phone,
      cedulaSubida: docTypes.includes('cedula'),
      identificacionSubida: docTypes.includes('ine') || docTypes.includes('passport'),
      comprobanteSubido: docTypes.includes('comprobante_domicilio'),
      enRevision: lawyerProfile?.verification_status === 'pending' || lawyerProfile?.verification_status === 'in_review',
      verificado: isVerified
    }

    // Limites segun rol
    const limites = isGuestLawyer 
      ? { maxCasos: 1, maxCalculos: 3 }
      : { maxCasos: -1, maxCalculos: -1 }

    setData({
      profile: {
        ...profile,
        celebration_shown: profile.celebration_shown || false
      },
      lawyerProfile,
      stats: {
        casosActivos: casosActivosRes.count || 0,
        casosCompletados: casosCompletadosRes.count || 0,
        calculosActivos: calculosRes.count || 0,
        ingresosMes: 0,
        creditosCCL: isGuestLawyer ? 0 : (profile.role === 'superadmin' ? -1 : 10)
      },
      verificationProgress,
      isVerified,
      isGuestLawyer,
      limites
    })

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mx-auto animate-pulse">
            <span className="text-destructive font-bold text-sm">!m!</span>
          </div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { profile, lawyerProfile, stats, verificationProgress, isVerified, isGuestLawyer, limites } = data

  const completedSteps = Object.values(verificationProgress).filter(Boolean).length
  const totalSteps = Object.keys(verificationProgress).length
  const progressPercent = Math.round((completedSteps / totalSteps) * 100)

  // Herramientas gratuitas
  const freeTools = [
    { 
      name: 'Calculadora', 
      href: '/calculadora', 
      description: 'Liquidaciones laborales',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-emerald-50 text-emerald-600'
    },
    { 
      name: 'Boveda', 
      href: '/boveda', 
      description: 'Documentos y evidencias',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      color: 'bg-blue-50 text-blue-600'
    },
    { 
      name: 'Guia LFT', 
      href: '/como-funciona', 
      description: 'Ley Federal del Trabajo',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'bg-purple-50 text-purple-600'
    }
  ]

  // Herramientas para abogados
  const lawyerTools = [
    { 
      name: 'Oficina Virtual', 
      href: '/oficina-virtual', 
      description: 'Centro de operaciones',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'from-indigo-500 to-purple-600',
      badge: 'Principal',
      locked: false
    },
    { 
      name: 'AutoCCL', 
      href: '/oficina-virtual/ccl', 
      description: 'Solicitudes con IA',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'from-green-500 to-emerald-600',
      badge: 'IA',
      badgeColor: 'bg-green-100 text-green-700',
      locked: !isVerified,
      credits: stats.creditosCCL
    },
    { 
      name: 'Mis Casos', 
      href: '/abogado/casos', 
      description: 'Gestion de casos activos',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
      color: 'from-amber-500 to-orange-600',
      locked: !isVerified
    },
    { 
      name: 'Leads', 
      href: '/abogado/leads', 
      description: 'Casos disponibles',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'from-cyan-500 to-blue-600',
      badge: 'Nuevo',
      badgeColor: 'bg-cyan-100 text-cyan-700',
      locked: !isVerified
    }
  ]

  // Herramientas PRO (admin/superadmin)
  const proTools = [
    { 
      name: 'Verificaciones', 
      href: '/admin/solicitudes-abogados', 
      description: 'Aprobar abogados',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      roles: ['admin', 'superadmin']
    },
    { 
      name: 'Panel Admin', 
      href: '/admin', 
      description: 'Vista global',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      roles: ['admin', 'superadmin']
    }
  ]

  const showProTools = profile.role === 'admin' || profile.role === 'superadmin'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-destructive font-bold text-sm">!m!</span>
            </div>
            <span className="text-base sm:text-lg font-semibold hidden xs:inline">mecorrieron.mx</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <AyudaUrgenteButton />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/perfil">Mi perfil</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Celebracion */}
      {showCelebration && (
        <LawyerCelebration
          userId={profile.id}
          upgradeType={celebrationType}
          userName={profile.full_name}
          onClose={() => setShowCelebration(false)}
        />
      )}

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Alertas */}
          {profile.verification_status === 'verified' && !profile.celebration_shown && profile.upgrade_at && (
            <UpgradeAlert userId={profile.id} />
          )}
          {profile.verification_status === 'documents_missing' && (
            <DowngradeAlert userId={profile.id} />
          )}

          {/* Perfil Card */}
          <Card className="border-slate-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {lawyerProfile?.photo_url ? (
                    <img src={lawyerProfile.photo_url || "/placeholder.svg"} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    profile.full_name?.charAt(0).toUpperCase() || 'A'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                      {lawyerProfile?.display_name || profile.full_name}
                    </h1>
                    {isVerified ? (
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Verificado
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 text-xs">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pendiente
                      </Badge>
                    )}
                    {isGuestLawyer && (
                      <Badge variant="outline" className="text-xs">Abogado Invitado</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {lawyerProfile?.cedula_profesional || 'Cedula pendiente'}
                  </p>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Limites de cuenta para guestlawyer */}
          {isGuestLawyer && (
            <AccountLimitsBanner
              role="guestlawyer"
              casosActuales={stats.casosActivos}
              calculosActuales={stats.calculosActivos}
              maxCasos={limites.maxCasos}
              maxCalculos={limites.maxCalculos}
              showUpgradeButton={true}
            />
          )}

          {/* Progreso de verificacion */}
          {!isVerified && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Completa tu verificacion</CardTitle>
                  <span className="text-sm text-muted-foreground">{progressPercent}%</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progressPercent} className="h-2" />
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { key: 'datosBasicos', label: 'Datos basicos' },
                    { key: 'cedulaSubida', label: 'Cedula profesional' },
                    { key: 'identificacionSubida', label: 'INE/Pasaporte' },
                    { key: 'comprobanteSubido', label: 'Comprobante domicilio' },
                    { key: 'enRevision', label: 'En revision' },
                    { key: 'verificado', label: 'Verificado' }
                  ].map(step => (
                    <div 
                      key={step.key} 
                      className={`flex items-center gap-1.5 ${
                        verificationProgress[step.key as keyof typeof verificationProgress] 
                          ? 'text-green-600' 
                          : 'text-muted-foreground'
                      }`}
                    >
                      {verificationProgress[step.key as keyof typeof verificationProgress] ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {step.label}
                    </div>
                  ))}
                </div>

                <Button asChild className="w-full" size="sm">
                  <Link href="/oficina-virtual/verificacion">
                    Completar verificacion
                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Estadisticas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.casosActivos}</p>
                <p className="text-xs text-muted-foreground">Casos activos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.casosCompletados}</p>
                <p className="text-xs text-muted-foreground">Completados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  ${stats.ingresosMes.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Este mes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                  {stats.creditosCCL === -1 ? '∞' : stats.creditosCCL}
                </p>
                <p className="text-xs text-muted-foreground">Creditos CCL</p>
              </CardContent>
            </Card>
          </div>

          {/* Herramientas Gratuitas */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold">Herramientas Gratuitas</h3>
              <Badge variant="secondary" className="text-xs">Sin costo</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {freeTools.map((tool) => (
                <Link key={tool.name} href={tool.href}>
                  <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
                    <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center gap-2">
                      <div className={`w-10 h-10 rounded-lg ${tool.color} flex items-center justify-center`}>
                        {tool.icon}
                      </div>
                      <p className="font-medium text-foreground text-xs sm:text-sm">{tool.name}</p>
                      <p className="text-xs text-muted-foreground hidden sm:block">{tool.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Herramientas para Abogados */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold">Herramientas para Abogados</h3>
              {isVerified ? (
                <Badge className="bg-blue-600 text-white text-xs">Activas</Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Requiere verificacion
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {lawyerTools.map((tool) => (
                <Card 
                  key={tool.name}
                  className={`${tool.locked ? 'opacity-50' : 'hover:shadow-lg'} transition-all h-full ${
                    !tool.locked ? 'cursor-pointer' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    {tool.locked ? (
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-muted-foreground text-sm">{tool.name}</h4>
                            {tool.badge && (
                              <Badge variant="outline" className="text-xs">{tool.badge}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                        </div>
                      </div>
                    ) : (
                      <Link href={tool.href} className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center text-white flex-shrink-0`}>
                          {tool.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-foreground text-sm">{tool.name}</h4>
                            {tool.badge && (
                              <Badge className={`text-xs ${tool.badgeColor || 'bg-blue-100 text-blue-700'}`}>
                                {tool.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                          {tool.credits !== undefined && (
                            <p className="text-xs text-blue-600 mt-1">
                              {tool.credits === -1 ? 'Creditos ilimitados' : `${tool.credits} creditos disponibles`}
                            </p>
                          )}
                        </div>
                        <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Herramientas PRO */}
          {showProTools && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">Herramientas PRO</h3>
                <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs">ADMIN</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {proTools
                  .filter(tool => tool.roles.includes(profile.role))
                  .map((tool) => (
                    <Link key={tool.name} href={tool.href}>
                      <Card className="hover:shadow-md transition-all cursor-pointer h-full border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                            {tool.icon}
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{tool.name}</p>
                            <p className="text-xs text-muted-foreground">{tool.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
              </div>
            </div>
          )}

          {/* Crypto Wallet */}
          <CryptoWallet 
            userId={profile.id}
            isVerified={isVerified}
          />

          {/* CTA para verificacion */}
          {!isVerified && (
            <Card className="border-blue-300 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Verifica tu cuenta para desbloquear todas las herramientas
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Como abogado verificado tendras acceso ilimitado a casos, calculos, creditos CCL y el marketplace de trabajadores.
                </p>
                <Button asChild size="lg">
                  <Link href="/oficina-virtual/verificacion">
                    Comenzar verificacion
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  )
}
