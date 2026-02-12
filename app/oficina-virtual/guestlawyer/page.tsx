'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getGuestLawyerDashboard } from './actions'
import { AyudaUrgenteButton } from '@/components/ayuda-urgente-button'
import { CryptoWallet } from '@/components/wallet/crypto-wallet'
import { CedulaDigitalModal } from '@/components/abogado/cedula-digital-modal'
import { EfirmaConfig } from '@/components/abogado/efirma-config'
import { LawyerCelebration } from '@/components/lawyer-celebration'
import { DowngradeAlert } from '@/components/downgrade-alert'
import { AccountLimitsBanner } from '@/components/account-limits-banner'
import { FileText, FolderKanban, Radar, Users2 } from 'lucide-react'

export default function GuestLawyerDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Awaited<ReturnType<typeof getGuestLawyerDashboard>>['data']>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCedula, setShowCedula] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationType, setCelebrationType] = useState<'verification_approved' | 'reactivation'>('verification_approved')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const result = await getGuestLawyerDashboard()
    if (result.error) {
      setError(result.error)
    } else {
      setData(result.data)
      
      if (result.data?.celebrationPending && result.data?.verificationProgress?.verificado) {
        setCelebrationType(result.data?.wasReactivation ? 'reactivation' : 'verification_approved')
        setShowCelebration(true)
      }
    }
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

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-md mx-auto mt-20">
          <CardContent className="p-6 text-center">
            <svg className="w-12 h-12 text-destructive mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-lg font-semibold mb-2">Error de acceso</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button asChild>
              <Link href="/acceso">Iniciar Sesion</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { profile, lawyerProfile, verificationProgress, stats } = data

  const verificationSteps = [
    { key: 'perfilCompleto', label: 'Perfil', done: verificationProgress.perfilCompleto },
    { key: 'cedulaSubida', label: 'Cedula', done: verificationProgress.cedulaSubida },
    { key: 'idSubida', label: 'INE', done: verificationProgress.idSubida },
    { key: 'enRevision', label: 'Revision', done: verificationProgress.enRevision },
    { key: 'verificado', label: 'Verificado', done: verificationProgress.verificado },
  ]

  const completedSteps = verificationSteps.filter(s => s.done).length
  const progressPercent = (completedSteps / verificationSteps.length) * 100

  // Herramientas gratuitas
  const freeTools = [
    { 
      name: 'Calculadora', 
      href: '/calculadora', 
      description: 'Liquidaciones',
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
      description: 'Documentos',
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
      description: 'Ley Federal',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'bg-purple-50 text-purple-600'
    },
    { 
      name: 'Biblioteca Legal', 
      href: '/biblioteca-legal', 
      description: 'Guia simplificada',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'bg-amber-50 text-amber-600'
    }
  ]

  // Herramientas para abogados
  const lawyerTools = [
    { 
      name: 'Radar de clientes', 
      description: 'Casos nuevos con filtro por estado',
      icon: <Radar className="w-6 h-6" />,
      href: '/oficina-virtual/radar-clientes'
    },
    { 
      name: 'Mis casos', 
      description: 'Nuevos, radar y activos',
      icon: <FolderKanban className="w-6 h-6" />,
      href: '/oficina-virtual/mis-casos'
    },
    { 
      name: 'Generador IA de solicitudes', 
      description: 'IA o flujo manual por caso',
      icon: <FileText className="w-6 h-6" />,
      href: '/oficina-virtual/solicitudes-ia'
    },
    { 
      name: 'Mi equipo y red', 
      description: 'Clientes, referidos y equipo',
      icon: <Users2 className="w-6 h-6" />,
      href: '/oficina-virtual/mi-equipo'
    }
  ]

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

          {/* Perfil Card */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-4">
                <div 
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setShowCedula(true)}
                >
                  {lawyerProfile?.photo_url ? (
                    <img src={lawyerProfile.photo_url || "/placeholder.svg"} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    profile.full_name?.charAt(0).toUpperCase() || 'A'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                      {profile.full_name}
                    </h1>
                    <Badge className="bg-amber-100 text-amber-700 text-xs">
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      En verificacion
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {lawyerProfile?.cedula_profesional || 'Cedula pendiente de verificacion'}
                  </p>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Limites de cuenta */}
          <AccountLimitsBanner
            role="guestlawyer"
            casosActuales={stats.casosActivos}
            calculosActuales={stats.calculosActivos || 0}
            maxCasos={data.limites?.maxCasos || 1}
            maxCalculos={data.limites?.maxCalculos || 3}
            showUpgradeButton={false}
          />

          {/* Alerta de downgrade */}
          {data.wasDowngraded && (
            <DowngradeAlert userId={profile.id} />
          )}

          {/* Progreso de verificacion */}
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Verificacion de Abogado
                </CardTitle>
                <span className="text-sm text-muted-foreground">{completedSteps}/{verificationSteps.length}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progressPercent} className="h-2" />
              
              <div className="grid grid-cols-5 gap-1 sm:gap-2">
                {verificationSteps.map((step, i) => (
                  <div key={step.key} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                      step.done 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-white text-muted-foreground border'
                    }`}>
                      {step.done ? (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-xs font-medium">{i + 1}</span>
                      )}
                    </div>
                    <span className="text-xs text-center text-muted-foreground leading-tight">{step.label}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white/80 rounded-lg p-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Siguiente paso:</strong>{' '}
                  {!verificationProgress.perfilCompleto && 'Completa tu perfil con tus datos personales.'}
                  {verificationProgress.perfilCompleto && !verificationProgress.cedulaSubida && 'Sube una foto de tu cedula profesional.'}
                  {verificationProgress.cedulaSubida && !verificationProgress.idSubida && 'Sube tu identificacion oficial (INE/Pasaporte).'}
                  {verificationProgress.idSubida && !verificationProgress.enRevision && 'Envia tu solicitud para revision.'}
                  {verificationProgress.enRevision && !verificationProgress.verificado && 'Tu solicitud esta siendo revisada por un administrador.'}
                  {verificationProgress.verificado && 'Tu cuenta esta verificada.'}
                </p>
              </div>

              <Button asChild className="w-full bg-amber-600 hover:bg-amber-700">
                <Link href="/oficina-virtual/verificacion">
                  {verificationProgress.enRevision ? 'Ver estado de solicitud' : 'Continuar verificacion'}
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.casosActivos}</p>
                <p className="text-xs text-muted-foreground">Casos activos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.calculosActivos || 0}</p>
                <p className="text-xs text-muted-foreground">Calculos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-xl sm:text-2xl font-bold text-muted-foreground">0</p>
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
            </div>
            <div className="grid grid-cols-2 gap-3">
              {lawyerTools.map((tool) => (
                <Link key={tool.name} href={tool.href}>
                  <Card className="hover:shadow-md cursor-pointer transition-all h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                          {tool.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-foreground">{tool.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Firma Electronica */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Firma Electronica</h3>
            <EfirmaConfig 
              userId={profile.id}
              hasEfirma={data.efirmaStatus?.configured || false}
              efirmaStatus={data.efirmaStatus?.status}
              onUpdate={loadData}
            />
          </div>

          {/* Crypto Wallet */}
          <CryptoWallet 
            userId={profile.id}
            isVerified={false}
          />

          {/* CTA Verificacion */}
          <Card className="border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Desbloquea todo el potencial de mecorrieron.mx
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Como abogado verificado tendras acceso a casos ilimitados, creditos CCL para generar solicitudes con IA, y el marketplace de trabajadores.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button asChild className="bg-amber-600 hover:bg-amber-700">
                  <Link href="/oficina-virtual/verificacion">
                    Verificar mi cuenta
                  </Link>
                </Button>
                <Button variant="outline" asChild className="bg-transparent">
                  <Link href="/como-funciona">
                    Ver beneficios
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>

      {/* Modal Cedula Digital */}
      {showCedula && (
        <CedulaDigitalModal
          profile={profile}
          lawyerProfile={lawyerProfile}
          onClose={() => setShowCedula(false)}
        />
      )}
    </div>
  )
}
