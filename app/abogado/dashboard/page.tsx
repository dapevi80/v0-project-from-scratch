'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Scale, 
  FileText, 
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Building2,
  Calculator,
  Search,
  HelpCircle,
  Lock,
  Star,
  Users // Added Users import
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useInactivityLogout } from '@/hooks/use-inactivity-logout'
import { type UserRole } from '@/lib/types'
import confetti from 'canvas-confetti'

interface LawyerData {
  profile: {
    id: string
    full_name: string
    email: string
    phone: string | null
    role: string
    verification_status: string
  }
  lawyerProfile: {
    display_name: string | null
    verification_status: string
    is_available: boolean
    verified_at: string | null
  } | null
  stats: {
    casosActivos: number
    casosCompletados: number
    ingresosMes: number
  }
  verificationProgress: {
    datosBasicos: boolean
    cedulaSubida: boolean
    identificacionSubida: boolean
    comprobanteSubido: boolean
    walletCreada: boolean
    vcardActivo: boolean
    verificacion2fa: boolean
  }
  isVerified: boolean
  showCelebration: boolean
}

export default function AbogadoDashboardPage() {
const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<LawyerData | null>(null)
  const [showVerifiedEffect, setShowVerifiedEffect] = useState(false)
  
  // Auto-logout por inactividad para usuarios verificados
  useInactivityLogout({ 
    userRole: (data?.profile?.role as UserRole) || null,
    enabled: !loading && !!data
  })
  
  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (showVerifiedEffect) {
      // Celebracion con confetti
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

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      frame()
    }
  }, [showVerifiedEffect])

  async function loadData() {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.replace('/acceso')
      return
    }

    // Obtener perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, verification_status')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'lawyer' && profile.role !== 'guestlawyer')) {
      router.replace('/dashboard')
      return
    }

    // Obtener perfil de abogado
    const { data: lawyerProfile } = await supabase
      .from('lawyer_profiles')
      .select('display_name, verification_status, is_available, verified_at')
      .eq('user_id', user.id)
      .maybeSingle()

    // Verificar si es recien verificado (para mostrar celebracion)
    const isVerified = lawyerProfile?.verification_status === 'verified' || 
                       lawyerProfile?.verification_status === 'approved'
    
    // Verificar si ya mostro celebracion
    const { data: celebrationCheck } = await supabase
      .from('profiles')
      .select('celebration_shown')
      .eq('id', user.id)
      .single()

    const showCelebration = isVerified && !celebrationCheck?.celebration_shown

    if (showCelebration) {
      setShowVerifiedEffect(true)
      // Marcar celebracion como mostrada
      await supabase
        .from('profiles')
        .update({ celebration_shown: true })
        .eq('id', user.id)
    }

    // Estadisticas basicas
    const { count: casosActivos } = await supabase
      .from('casos')
      .select('*', { count: 'exact', head: true })
      .eq('abogado_id', user.id)
      .in('status', ['assigned', 'in_progress', 'negotiation'])

    const { count: casosCompletados } = await supabase
      .from('casos')
      .select('*', { count: 'exact', head: true })
      .eq('abogado_id', user.id)
      .eq('status', 'completed')

    // Progreso de verificacion
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
      walletCreada: false, // TODO: verificar wallet
      vcardActivo: false, // TODO: verificar vcard
      verificacion2fa: false // TODO: verificar 2fa
    }

    setData({
      profile,
      lawyerProfile,
      stats: {
        casosActivos: casosActivos || 0,
        casosCompletados: casosCompletados || 0,
        ingresosMes: 0
      },
      verificationProgress,
      isVerified,
      showCelebration
    })

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!data) return null

  const completedSteps = Object.values(data.verificationProgress).filter(Boolean).length
  const totalSteps = Object.keys(data.verificationProgress).length
  const progressPercent = Math.round((completedSteps / totalSteps) * 100)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header minimalista */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Scale className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-800 text-sm">
                {data.profile.full_name?.split(' ')[0] || 'Abogado'}
              </h1>
              <div className="flex items-center gap-1.5">
                {data.isVerified ? (
                  <Badge className="bg-green-100 text-green-700 text-xs px-1.5 py-0">
                    <CheckCircle2 className="w-3 h-3 mr-0.5" />
                    Verificado
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0">
                    <Clock className="w-3 h-3 mr-0.5" />
                    Pendiente
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/perfil">Mi perfil</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Celebracion de verificacion */}
        {showVerifiedEffect && (
          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">Felicidades!</h3>
                  <p className="text-sm text-green-600">
                    Tu cuenta ha sido verificada. Ahora tienes acceso a todas las herramientas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progreso de verificacion (solo si no esta verificado) */}
        {!data.isVerified && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-slate-700">Completa tu perfil</h3>
                <span className="text-sm text-slate-500">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`flex items-center gap-1.5 ${data.verificationProgress.datosBasicos ? 'text-green-600' : 'text-slate-400'}`}>
                  {data.verificationProgress.datosBasicos ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  Datos basicos
                </div>
                <div className={`flex items-center gap-1.5 ${data.verificationProgress.cedulaSubida ? 'text-green-600' : 'text-slate-400'}`}>
                  {data.verificationProgress.cedulaSubida ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  Cedula profesional
                </div>
                <div className={`flex items-center gap-1.5 ${data.verificationProgress.identificacionSubida ? 'text-green-600' : 'text-slate-400'}`}>
                  {data.verificationProgress.identificacionSubida ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  INE/Pasaporte
                </div>
                <div className={`flex items-center gap-1.5 ${data.verificationProgress.comprobanteSubido ? 'text-green-600' : 'text-slate-400'}`}>
                  {data.verificationProgress.comprobanteSubido ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  Comprobante domicilio
                </div>
                <div className={`flex items-center gap-1.5 ${data.verificationProgress.walletCreada ? 'text-green-600' : 'text-slate-400'}`}>
                  {data.verificationProgress.walletCreada ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  Wallet cripto
                </div>
                <div className={`flex items-center gap-1.5 ${data.verificationProgress.vcardActivo ? 'text-green-600' : 'text-slate-400'}`}>
                  {data.verificationProgress.vcardActivo ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  vCard activa
                </div>
              </div>
              <Button asChild className="w-full mt-4" size="sm">
                <Link href="/abogado/verificacion">
                  Completar verificacion
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Estadisticas rapidas */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-slate-800">{data.stats.casosActivos}</p>
              <p className="text-xs text-slate-500">Casos activos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-slate-800">{data.stats.casosCompletados}</p>
              <p className="text-xs text-slate-500">Completados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                ${data.stats.ingresosMes.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Herramientas Gratuitas */}
        <section>
          <h2 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wide">
            Herramientas Gratuitas
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <Link href="/calculadora">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-2">
                    <Calculator className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-slate-700">Calculadora</span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/buscador-normas">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-2">
                    <Search className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-slate-700">Normas</span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/ayuda-urgente">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center mb-2">
                    <HelpCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-xs font-medium text-slate-700">Ayuda</span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Herramientas para Abogados */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">
              Herramientas para Abogados
            </h2>
            {!data.isVerified && (
              <Badge variant="outline" className="text-xs">
                <Lock className="w-3 h-3 mr-1" />
                Requiere verificacion
              </Badge>
            )}
          </div>
          
          <div className="space-y-3">
            {/* Leads / Casos Disponibles */}
            <Card className={!data.isVerified ? 'opacity-60' : 'hover:shadow-md transition-shadow'}>
              <CardContent className="p-4">
                {data.isVerified ? (
                  <Link href="/abogado/leads" className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-800">Leads Disponibles</h3>
                        <Badge className="bg-amber-100 text-amber-700 text-xs">Nuevo</Badge>
                      </div>
                      <p className="text-xs text-slate-500">Casos listos para asignar</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </Link>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-500">Leads Disponibles</h3>
                      <p className="text-xs text-slate-400">Casos listos para asignar</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Oficina Virtual */}
            <Card className={!data.isVerified ? 'opacity-60' : 'hover:shadow-md transition-shadow'}>
              <CardContent className="p-4">
                {data.isVerified ? (
                  <Link href="/oficina-virtual" className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-800">Oficina Virtual</h3>
                      <p className="text-xs text-slate-500">Gestiona tus casos y clientes</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </Link>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-500">Oficina Virtual</h3>
                      <p className="text-xs text-slate-400">Gestiona tus casos y clientes</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generador de Solicitudes CCL */}
            <Card className={!data.isVerified ? 'opacity-60' : 'hover:shadow-md transition-shadow'}>
              <CardContent className="p-4">
                {data.isVerified ? (
                  <Link href="/oficina-virtual/ccl" className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-800">AutoCCL</h3>
                        <Badge className="bg-green-100 text-green-700 text-xs">IA</Badge>
                      </div>
                      <p className="text-xs text-slate-500">Genera solicitudes de conciliacion automaticamente</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </Link>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-500">AutoCCL</h3>
                        <Badge variant="outline" className="text-xs">IA</Badge>
                      </div>
                      <p className="text-xs text-slate-400">Genera solicitudes de conciliacion automaticamente</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Wallet y Pagos */}
            <Card className={!data.isVerified ? 'opacity-60' : 'hover:shadow-md transition-shadow'}>
              <CardContent className="p-4">
                {data.isVerified ? (
                  <Link href="/abogado/wallet" className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-800">Mi Wallet</h3>
                      <p className="text-xs text-slate-500">Ingresos, pagos y cedula digital</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </Link>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-500">Mi Wallet</h3>
                      <p className="text-xs text-slate-400">Ingresos, pagos y cedula digital</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Rating (solo si verificado) */}
        {data.isVerified && (
          <Card className="bg-gradient-to-r from-slate-800 to-slate-900">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">5.0 de calificacion</p>
                <p className="text-slate-400 text-xs">Basado en {data.stats.casosCompletados} casos</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
