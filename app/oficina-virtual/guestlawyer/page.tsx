'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  User,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calculator,
  FileText,
  Scale,
  Lock,
  ChevronRight,
  CreditCard,
  Wallet,
  TrendingUp,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Download,
  Share2,
  QrCode,
  Key,
  FileSignature
} from 'lucide-react'
import { getGuestLawyerDashboard } from './actions'
import { CedulaDigitalModal } from '@/components/abogado/cedula-digital-modal'
import { EfirmaConfig } from '@/components/abogado/efirma-config'

export default function GuestLawyerDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Awaited<ReturnType<typeof getGuestLawyerDashboard>>['data']>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCedula, setShowCedula] = useState(false)

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
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <Card className="max-w-md mx-auto mt-20">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
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
    { key: 'perfil', label: 'Perfil completo', done: verificationProgress.perfilCompleto },
    { key: 'cedula', label: 'Cedula profesional', done: verificationProgress.cedulaSubida },
    { key: 'id', label: 'Identificacion oficial', done: verificationProgress.idSubida },
    { key: 'review', label: 'Revision admin', done: verificationProgress.enRevision },
    { key: 'verified', label: 'Verificado', done: verificationProgress.verificado },
  ]

  const completedSteps = verificationSteps.filter(s => s.done).length
  const progressPercent = (completedSteps / verificationSteps.length) * 100

  const getStatusBadge = () => {
    if (verificationProgress.verificado) {
      return <Badge className="bg-green-100 text-green-700">Verificado</Badge>
    }
    if (verificationProgress.enRevision) {
      return <Badge className="bg-blue-100 text-blue-700">En revision</Badge>
    }
    return <Badge className="bg-amber-100 text-amber-700">Pendiente</Badge>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header minimalista */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors"
                onClick={() => setShowCedula(true)}
              >
                {lawyerProfile?.photo_url ? (
                  <img src={lawyerProfile.photo_url || "/placeholder.svg"} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-slate-600" />
                )}
              </div>
              <div>
                <h1 className="font-semibold text-slate-900">{profile.full_name}</h1>
                <p className="text-xs text-slate-500">
                  {lawyerProfile?.cedula_profesional || 'Cedula pendiente'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        {/* Estado de verificacion */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-slate-700">Estado de Verificacion</CardTitle>
              <span className="text-sm text-slate-500">{completedSteps}/{verificationSteps.length}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progressPercent} className="h-2" />
            
            <div className="grid grid-cols-5 gap-2">
              {verificationSteps.map((step, i) => (
                <div key={step.key} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.done 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {step.done ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-medium">{i + 1}</span>
                    )}
                  </div>
                  <span className="text-xs text-center text-slate-500 leading-tight">{step.label}</span>
                </div>
              ))}
            </div>

            {!verificationProgress.verificado && (
              <Button asChild size="sm" className="w-full">
                <Link href="/oficina-virtual/verificacion">
                  Completar verificacion
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Stats minimalistas */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">${stats.ingresosMes.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Ingresos mes</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.casosActivos}</p>
              <p className="text-xs text-slate-500">Casos activos</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.casosCompletados}</p>
              <p className="text-xs text-slate-500">Completados</p>
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
              <Card className="border-slate-200 hover:border-slate-400 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Calculator className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Calculadora</span>
                  <span className="text-xs text-slate-400">Liquidaciones</span>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/legal">
              <Card className="border-slate-200 hover:border-slate-400 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Documentos</span>
                  <span className="text-xs text-slate-400">Legales</span>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/como-funciona">
              <Card className="border-slate-200 hover:border-slate-400 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Guia LFT</span>
                  <span className="text-xs text-slate-400">Ley Federal</span>
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
            {getStatusBadge()}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* AutoCCL */}
            <Card className={`border-slate-200 ${!verificationProgress.verificado ? 'opacity-60' : 'hover:border-blue-400'} transition-colors`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-blue-600" />
                  </div>
                  {!verificationProgress.verificado && (
                    <Lock className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <h3 className="font-medium text-slate-700 mb-1">AutoCCL</h3>
                <p className="text-xs text-slate-400 mb-3">Solicitudes automaticas al CCL</p>
                {verificationProgress.verificado ? (
                  <Button asChild size="sm" className="w-full">
                    <Link href="/oficina-virtual/ccl">Abrir</Link>
                  </Button>
                ) : (
                  <Button size="sm" disabled className="w-full">
                    Requiere verificacion
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Marketplace */}
            <Card className={`border-slate-200 ${!verificationProgress.verificado ? 'opacity-60' : 'hover:border-amber-400'} transition-colors`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-amber-600" />
                  </div>
                  {!verificationProgress.verificado && (
                    <Lock className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <h3 className="font-medium text-slate-700 mb-1">Marketplace</h3>
                <p className="text-xs text-slate-400 mb-3">Casos de trabajadores</p>
                {verificationProgress.verificado ? (
                  <Button asChild size="sm" variant="outline" className="w-full bg-transparent">
                    <Link href="/oficina-virtual/marketplace">Ver casos</Link>
                  </Button>
                ) : (
                  <Button size="sm" disabled className="w-full">
                    Requiere verificacion
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Oficina Virtual */}
            <Card className={`border-slate-200 ${!verificationProgress.verificado ? 'opacity-60' : 'hover:border-purple-400'} transition-colors`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  {!verificationProgress.verificado && (
                    <Lock className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <h3 className="font-medium text-slate-700 mb-1">Mis Casos</h3>
                <p className="text-xs text-slate-400 mb-3">Gestion de casos activos</p>
                {verificationProgress.verificado ? (
                  <Button asChild size="sm" variant="outline" className="w-full bg-transparent">
                    <Link href="/oficina-virtual">Gestionar</Link>
                  </Button>
                ) : (
                  <Button size="sm" disabled className="w-full">
                    Requiere verificacion
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Wallet / Cedula Digital */}
            <Card className="border-slate-200 hover:border-green-400 transition-colors cursor-pointer" onClick={() => setShowCedula(true)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-green-600" />
                  </div>
                  <Badge variant="outline" className="text-xs">Nuevo</Badge>
                </div>
                <h3 className="font-medium text-slate-700 mb-1">Cedula Digital</h3>
                <p className="text-xs text-slate-400 mb-3">Tu identificacion profesional</p>
                <Button size="sm" variant="outline" className="w-full bg-transparent">
                  Ver cedula
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Firma Electronica */}
        <section>
          <h2 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wide">
            Firma Electronica
          </h2>
          <EfirmaConfig 
            userId={profile.id}
            hasEfirma={data.efirmaStatus?.configured || false}
            efirmaStatus={data.efirmaStatus?.status}
            onUpdate={loadData}
          />
        </section>
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
