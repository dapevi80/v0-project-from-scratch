'use client'

import { useRouter } from "next/navigation"
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LogoutButton } from './logout-button'
import { UserProfileCard } from '@/components/user/user-profile-card'
import { AyudaUrgenteButton } from '@/components/ayuda-urgente-button'
import { Lock } from 'lucide-react'
import { CryptoWallet } from '@/components/wallet/crypto-wallet'
import { VerificacionCelebration } from '@/components/verificacion-celebration'
import { DowngradeAlert } from '@/components/downgrade-alert'
import { UpgradeAlert } from '@/components/upgrade-alert'
import { DashboardSkeleton } from '@/components/ui/dashboard-skeleton'

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, loading, isGuest, role, refreshProfile } = useAuth()
  const [casosActivos, setCasosActivos] = useState(0)
  const [showVerifiedEffect, setShowVerifiedEffect] = useState(false)
  const [casosLoaded, setCasosLoaded] = useState(false)

  // Redirigir segun rol
  useEffect(() => {
    if (loading || !profile) return
    
    const userRole = profile.role
    
    // Abogados van al dashboard de abogado
    if (userRole === 'guestlawyer' || userRole === 'lawyer') {
      router.replace('/abogado/dashboard')
      return
    }
    
    // Admin y superadmin van a panel de admin
    if (userRole === 'admin' || userRole === 'superadmin') {
      router.replace('/admin')
      return
    }
    
    // Verificar celebracion pendiente
    if (profile.verification_status === 'verified' && profile.role === 'worker' && !profile.celebration_shown) {
      setShowVerifiedEffect(true)
      // Actualizar sin bloquear
      const supabase = createClient()
      supabase.from('profiles').update({ celebration_shown: true }).eq('id', profile.id)
    }
  }, [loading, profile, router])

  // Cargar casos activos (solo una vez)
  useEffect(() => {
    if (!user || casosLoaded) return
    
    const supabase = createClient()
    supabase
      .from('calculos_liquidacion')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => {
        if (count) setCasosActivos(count)
        setCasosLoaded(true)
      })
  }, [user, casosLoaded])

  // Mostrar skeleton mientras carga
  if (loading) {
    return <DashboardSkeleton />
  }

  // Herramientas gratuitas disponibles para todos
  const freeTools = [
    { name: 'Calculadora', href: '/calculadora', description: 'Calcula tu liquidación', icon: '🧮', available: true },
    { name: 'Buró de Empresas', href: '/buro', description: 'Conoce a tu empleador', icon: '🏢', available: false, badge: 'Próximamente' },
    { name: 'Bóveda de Evidencias', href: '/boveda', description: 'Guarda tus pruebas', icon: '🔐', available: true }
  ]

  // Herramientas exclusivas para trabajadores verificados
  const isVerifiedWorker = role === 'worker' || role === 'lawyer' || role === 'admin' || role === 'superadmin' || role === 'webagent'
  const workerTools = [
    { name: 'Mis casos', href: '/casos', description: 'Seguimiento de tus casos', icon: '📋', available: isVerifiedWorker },
    { name: 'Agenda y alertas', href: '/agenda', description: 'Citas y recordatorios', icon: '📅', available: isVerifiedWorker },
    { name: 'Logros', href: '/logros', description: 'Gana USDT por logros', icon: '🏆', available: isVerifiedWorker }
  ]

  // Herramientas Plus para abogados y superiores
  const isProfessional = role === 'lawyer' || role === 'admin' || role === 'superadmin' || role === 'webagent'
  const plusTools = [
    { 
      name: 'Oficina Virtual', 
      href: '/oficina-virtual', 
      description: 'Verificar usuarios y asignar casos', 
      icon: '🏛️',
      badge: 'Principal',
      color: 'from-indigo-50 to-purple-50 border-indigo-200 hover:border-indigo-400'
    },
    { 
      name: 'Casos Asignados', 
      href: '/abogado/casos', 
      description: 'Gestiona tus casos activos', 
      icon: '⚖️',
      color: 'from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-400'
    },
    { 
      name: 'Panel Admin', 
      href: '/admin/casos', 
      description: 'Vista global de casos',
      icon: '📊',
      roles: ['admin', 'superadmin'],
      color: 'from-amber-50 to-orange-50 border-amber-200 hover:border-amber-400'
    },
    { 
      name: 'Referidos', 
      href: '/referidos', 
      description: 'Red de referidos y comisiones', 
      icon: '🤝',
      color: 'from-cyan-50 to-blue-50 border-cyan-200 hover:border-cyan-400'
    }
  ]

  

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-destructive font-bold text-sm">!m!</span>
            </div>
            <span className="text-base sm:text-lg font-semibold hidden xs:inline">mecorrieron.mx</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <AyudaUrgenteButton />
            {isGuest ? (
              <Button asChild size="sm" className="text-xs sm:text-sm px-2 sm:px-4">
                <Link href="/acceso">Acceder</Link>
              </Button>
            ) : (
              <LogoutButton />
            )}
          </div>
        </div>
      </header>

      {/* Celebración completa de verificación */}
      {showVerifiedEffect && (
        <VerificacionCelebration
          userName={profile?.full_name || user?.email?.split('@')[0] || 'Usuario'}
          userAvatar={null}
          onComplete={() => setShowVerifiedEffect(false)}
        />
      )}

      {/* Main content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Alerta de upgrade si aplica (mostrar celebracion de upgrade reciente) */}
          {profile?.verification_status === 'verified' && !profile?.celebration_shown && profile?.upgrade_at && (
            <UpgradeAlert userId={user?.id} />
          )}

          {/* Alerta de downgrade si aplica */}
          {profile?.verification_status === 'documents_missing' && (
            <DowngradeAlert userId={user?.id} />
          )}

          {/* Perfil de usuario */}
          <UserProfileCard
            userId={user?.id}
            email={user?.email}
            isGuest={isGuest}
            codigoUsuario={profile?.codigo_usuario}
            fullName={profile?.full_name}
            role={role}
            isVerified={profile?.verification_status === 'verified' || role === 'worker' || role === 'lawyer'}
            verificationStatus={profile?.verification_status || 'none'}
            casosActivos={casosActivos}
          />

          {/* Herramientas Gratuitas */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold">Herramientas Gratuitas</h3>
              <Badge variant="secondary" className="text-xs">Sin costo</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {freeTools.map((tool) => (
                tool.available ? (
                  <Link key={tool.name} href={tool.href}>
                    <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
                      <CardContent className="p-4 sm:p-5 flex flex-col items-center text-center gap-2">
                        <span className="text-3xl sm:text-4xl">{tool.icon}</span>
                        <p className="font-semibold text-foreground text-sm sm:text-base">{tool.name}</p>
                        <p className="text-xs text-muted-foreground">{tool.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ) : (
                  <Card key={tool.name} className="opacity-60 h-full">
                    <CardContent className="p-4 sm:p-5 flex flex-col items-center text-center gap-2">
                      <span className="text-3xl sm:text-4xl">{tool.icon}</span>
                      <p className="font-semibold text-foreground text-sm sm:text-base">{tool.name}</p>
                      <p className="text-xs text-muted-foreground">{tool.description}</p>
                      {tool.badge && (
                        <Badge variant="outline" className="text-xs mt-1">{tool.badge}</Badge>
                      )}
                    </CardContent>
                  </Card>
                )
              ))}
            </div>
          </div>

          {/* Herramientas para Trabajadores Verificados */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold">Herramientas para Trabajadores</h3>
              {isVerifiedWorker ? (
                <Badge className="bg-green-600 text-white text-xs">Activas</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Verifica tu cuenta</Badge>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {workerTools.map((tool) => (
                tool.available ? (
                  <Link key={tool.name} href={tool.href}>
                    <Card className="hover:border-green-400 hover:shadow-md transition-all cursor-pointer h-full border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                      <CardContent className="p-4 sm:p-5 flex flex-col items-center text-center gap-2">
                        <span className="text-3xl sm:text-4xl">{tool.icon}</span>
                        <p className="font-semibold text-foreground text-sm sm:text-base">{tool.name}</p>
                        <p className="text-xs text-muted-foreground">{tool.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ) : (
                  <Card key={tool.name} className="opacity-50 h-full bg-muted/30 border-dashed relative">
                    <CardContent className="p-4 sm:p-5 flex flex-col items-center text-center gap-2">
                      <span className="text-3xl sm:text-4xl grayscale">{tool.icon}</span>
                      <p className="font-semibold text-muted-foreground text-sm sm:text-base">{tool.name}</p>
                      <p className="text-xs text-muted-foreground">{tool.description}</p>
                      <div className="absolute top-2 right-2">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                )
              ))}
            </div>
            {!isVerifiedWorker && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Verifica tu cuenta como trabajador para desbloquear estas herramientas
              </p>
            )}
          </div>

          {/* Herramientas Plus - Solo para profesionales */}
          {isProfessional && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">Herramientas Plus</h3>
                <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs">PRO</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {plusTools
                  .filter(tool => !tool.roles || tool.roles.includes(role))
                  .map((tool) => (
                    <Link key={tool.name} href={tool.href}>
                      <Card className={`hover:shadow-lg transition-all cursor-pointer h-full bg-gradient-to-br ${tool.color}`}>
                        <CardContent className="p-4 sm:p-5 flex flex-col items-center text-center gap-2">
                          <span className="text-3xl sm:text-4xl">{tool.icon}</span>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-foreground text-sm sm:text-base">{tool.name}</p>
                            {tool.badge && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{tool.badge}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{tool.description}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
              </div>
            </div>
          )}

          {/* Crypto Wallet Panel */}
          <CryptoWallet 
            userId={user?.id}
            isVerified={isVerifiedWorker}
          />

          {/* CTA para worker sin casos */}
          {role === 'worker' && casosActivos === 0 && (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-3">
                Aun no has iniciado un caso. Comienza calculando tu liquidacion.
              </p>
              <Button asChild>
                <Link href="/calculadora">Calcular mi liquidacion</Link>
              </Button>
            </div>
          )}

          {/* Acceso rapido a Oficina Virtual para profesionales */}
          {isProfessional && (
            <Card className="border-indigo-300 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
                      🏛️
                    </div>
                    <div>
                      <CardTitle className="text-indigo-900">Oficina Virtual</CardTitle>
                      <CardDescription className="text-indigo-700">
                        Centro de operaciones para {role === 'lawyer' ? 'abogados' : 'administradores'}
                      </CardDescription>
                    </div>
                  </div>
                  <Link href="/oficina-virtual">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      Entrar
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                  <div className="text-center p-3 rounded-lg bg-white/60">
                    <p className="text-2xl font-bold text-indigo-600">--</p>
                    <p className="text-xs text-muted-foreground">Verificaciones</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-white/60">
                    <p className="text-2xl font-bold text-purple-600">--</p>
                    <p className="text-xs text-muted-foreground">Casos nuevos</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-white/60">
                    <p className="text-2xl font-bold text-emerald-600">--</p>
                    <p className="text-xs text-muted-foreground">Mis casos</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-white/60">
                    <p className="text-2xl font-bold text-amber-600">--</p>
                    <p className="text-xs text-muted-foreground">Mensajes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
