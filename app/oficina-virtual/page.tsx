'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Briefcase, 
  UserCheck,
  FileCheck,
  DollarSign, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Users,
  ShoppingBag,
  Scale,
  Bell,
  MessageSquare,
  Shield,
  CheckCircle2,
  ArrowLeft,
  ClipboardList,
  Radar,
  FileText,
  Users2,
  FolderKanban
} from 'lucide-react'
import { getOficinaDashboard, getPendingVerifications, getCasosPendientes } from './actions'

export default function OficinaVirtualPage() {
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState<Awaited<ReturnType<typeof getOficinaDashboard>>['data']>(null)
  const [verificaciones, setVerificaciones] = useState<unknown[]>([])
  const [casosPendientes, setCasosPendientes] = useState<unknown[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    
    const [dashResult, verifResult, casosResult] = await Promise.all([
      getOficinaDashboard(),
      getPendingVerifications(),
      getCasosPendientes()
    ])
    
    if (dashResult.error) {
      setError(dashResult.error)
    } else {
      setDashboard(dashResult.data)
    }
    
    if (!verifResult.error && verifResult.data) {
      setVerificaciones(verifResult.data)
    }
    
    if (!casosResult.error && casosResult.data) {
      setCasosPendientes(casosResult.data)
    }
    
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-md mx-auto mt-20">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Acceso Denegado</h2>
            <p className="text-muted-foreground mb-4">{error || 'No tienes acceso a la oficina virtual'}</p>
            <Button asChild>
              <Link href="/acceso">Iniciar Sesion</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { profile, stats } = dashboard
  const isLawyer = profile.role === 'lawyer'
  const isAdmin = ['admin', 'superadmin'].includes(profile.role)
  const canVerify = ['lawyer', 'admin', 'superadmin', 'webagent'].includes(profile.role)
  const showLawyerTools = ['lawyer', 'admin', 'superadmin', 'guestlawyer'].includes(profile.role)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="p-2 hover:bg-muted rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Oficina Virtual</h1>
                <p className="text-xs text-muted-foreground capitalize">
                  {profile.role === 'superadmin' ? 'Super Administrador' : 
                   profile.role === 'admin' ? 'Administrador' :
                   profile.role === 'lawyer' ? 'Abogado' : 'Agente Web'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {profile.verification_status === 'verified' ? (
                <Badge className="bg-green-100 text-green-700 gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verificado
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="w-3 h-3" />
                  Pendiente
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {showLawyerTools && (
          <section className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Oficina virtual para abogados</p>
              <h2 className="text-base font-semibold">Herramientas</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-slate-200 hover:border-slate-300 transition-colors">
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Radar className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Radar de clientes</p>
                    <p className="text-xs text-muted-foreground">Casos nuevos con filtro por estado</p>
                  </div>
                  <Button asChild size="sm" className="mt-2">
                    <Link href="/oficina-virtual/radar-clientes">Abrir</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-slate-200 hover:border-slate-300 transition-colors">
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <FolderKanban className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Mis casos</p>
                    <p className="text-xs text-muted-foreground">Nuevos, radar y activos</p>
                  </div>
                  <Button asChild size="sm" className="mt-2" variant="outline">
                    <Link href="/oficina-virtual/mis-casos">Abrir</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-slate-200 hover:border-slate-300 transition-colors">
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Generador IA de solicitudes</p>
                    <p className="text-xs text-muted-foreground">IA o flujo manual por caso</p>
                  </div>
                  <Button asChild size="sm" className="mt-2" variant="outline">
                    <Link href="/oficina-virtual/solicitudes-ia">Abrir</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-slate-200 hover:border-slate-300 transition-colors">
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                    <Users2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Mi equipo y red</p>
                    <p className="text-xs text-muted-foreground">Clientes, referidos y equipo</p>
                  </div>
                  <Button asChild size="sm" className="mt-2" variant="outline">
                    <Link href="/oficina-virtual/mi-equipo">Abrir</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        )}
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200 cursor-pointer hover:border-amber-400 transition-colors"
                onClick={() => setActiveTab('verificaciones')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-amber-600 font-medium">Verificaciones</span>
              </div>
              <p className="text-2xl font-bold text-amber-900">{stats.verificacionesPendientes}</p>
              <p className="text-xs text-amber-600">Pendientes</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => setActiveTab('casos')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-blue-600 font-medium">Casos</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{stats.casosPendientes}</p>
              <p className="text-xs text-blue-600">Por asignar</p>
            </CardContent>
          </Card>
          
          {isLawyer && (
            <>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                    <span className="text-xs text-purple-600 font-medium">Mis Casos</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{stats.misCasos}</p>
                  <p className="text-xs text-purple-600">Activos</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-orange-600" />
                    <span className="text-xs text-orange-600 font-medium">Mensajes</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-900">{stats.mensajesSinLeer}</p>
                  <p className="text-xs text-orange-600">Sin leer</p>
                </CardContent>
              </Card>
            </>
          )}
          
          {isAdmin && (
            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">Total Activos</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{stats.totalCasosActivos}</p>
                <p className="text-xs text-green-600">En el sistema</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button 
            variant="outline" 
            className={`h-auto py-4 flex-col gap-2 bg-transparent relative ${activeTab === 'verificaciones' ? 'border-primary bg-primary/5' : ''}`}
            onClick={() => setActiveTab('verificaciones')}
          >
            <UserCheck className="w-5 h-5 text-primary" />
            <span className="text-sm">Verificar Usuarios</span>
            {stats.verificacionesPendientes > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 text-xs px-1.5">
                {stats.verificacionesPendientes}
              </Badge>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className={`h-auto py-4 flex-col gap-2 bg-transparent relative ${activeTab === 'casos' ? 'border-primary bg-primary/5' : ''}`}
            onClick={() => setActiveTab('casos')}
          >
            <FileCheck className="w-5 h-5 text-primary" />
            <span className="text-sm">Verificar Casos</span>
            {stats.casosPendientes > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 text-xs px-1.5">
                {stats.casosPendientes}
              </Badge>
            )}
          </Button>
          
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent border-blue-200 hover:border-blue-400 hover:bg-blue-50">
            <Link href="/oficina-virtual/ccl">
              <Scale className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-700">AutoCCL</span>
              <span className="text-xs text-blue-500">Solicitudes</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent">
            <Link href="/oficina-virtual/marketplace">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <span className="text-sm">Marketplace</span>
            </Link>
          </Button>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="verificaciones" className="relative">
              Usuarios
              {stats.verificacionesPendientes > 0 && (
                <span className="ml-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                  {stats.verificacionesPendientes}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="casos" className="relative">
              Casos
              {stats.casosPendientes > 0 && (
                <span className="ml-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                  {stats.casosPendientes}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Bienvenido a tu Oficina Virtual
                </CardTitle>
                <CardDescription>
                  Gestiona verificaciones de usuarios, asigna casos y administra tu trabajo legal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  {stats.verificacionesPendientes > 0 && (
                    <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <UserCheck className="w-5 h-5 text-amber-600" />
                        <div>
                          <p className="font-medium text-amber-900">{stats.verificacionesPendientes} usuarios esperan verificacion</p>
                          <p className="text-xs text-amber-700">Revisa documentos de identidad</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => setActiveTab('verificaciones')}>
                        Revisar
                      </Button>
                    </div>
                  )}
                  
                  {stats.casosPendientes > 0 && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileCheck className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-900">{stats.casosPendientes} casos por asignar</p>
                          <p className="text-xs text-blue-700">Verifica y asigna a abogados</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => setActiveTab('casos')}>
                        Ver casos
                      </Button>
                    </div>
                  )}
                  
                  {stats.mensajesSinLeer > 0 && (
                    <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="font-medium text-orange-900">{stats.mensajesSinLeer} mensajes sin leer</p>
                          <p className="text-xs text-orange-700">De tus casos asignados</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild className="bg-transparent">
                        <Link href="/casos">Ver mensajes</Link>
                      </Button>
                    </div>
                  )}
                  
                  {stats.verificacionesPendientes === 0 && stats.casosPendientes === 0 && stats.mensajesSinLeer === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                      <p className="font-medium">Todo al dia</p>
                      <p className="text-sm">No hay tareas pendientes</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Verificaciones Tab */}
          <TabsContent value="verificaciones" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-600" />
                  Verificacion de Usuarios
                </CardTitle>
                <CardDescription>
                  Usuarios que han subido su INE y datos de contacto esperando verificacion
                </CardDescription>
              </CardHeader>
              <CardContent>
                {verificaciones.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay verificaciones pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {verificaciones.map((user: Record<string, unknown>) => (
                      <Link 
                        key={user.id as string} 
                        href={`/oficina-virtual/verificar-usuario/${user.id}`}
                      >
                        <div className="flex items-center justify-between p-4 border-2 border-orange-300 bg-orange-50/50 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center ring-2 ring-orange-300">
                              <UserCheck className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-medium text-orange-900">{user.full_name as string || 'Sin nombre'}</p>
                              <p className="text-sm text-orange-700">{user.email as string}</p>
                              <p className="text-xs text-orange-600">
                                Tel: {user.phone as string || 'No registrado'}
                              </p>
                              {user.caso_creado && (
                                <p className="text-xs text-orange-800 font-medium mt-1">
                                  Caso creado - Esperando verificacion
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className="bg-orange-500 text-white hover:bg-orange-600">
                              Por Verificar
                            </Badge>
                            {user.verification_status === 'pending' && (
                              <span className="text-xs text-orange-600 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Pendiente
                              </span>
                            )}
                            <ChevronRight className="w-5 h-5 text-orange-400" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Casos Tab */}
          <TabsContent value="casos" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                  Casos Pendientes de Asignacion
                </CardTitle>
                <CardDescription>
                  Verifica los datos del caso y asignalo a un abogado
                </CardDescription>
              </CardHeader>
              <CardContent>
                {casosPendientes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay casos pendientes de asignacion</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {casosPendientes.map((caso: Record<string, unknown>) => {
                      const trabajador = caso.trabajador as Record<string, unknown> | null
                      const calculo = caso.calculo as Record<string, unknown> | null
                      
                      return (
                        <Link 
                          key={caso.id as string} 
                          href={`/oficina-virtual/asignar-caso/${caso.id}`}
                        >
                          <div className="p-4 border rounded-lg hover:border-primary hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-sm text-muted-foreground">
                                    {caso.folio as string}
                                  </span>
                                  <Badge className={
                                    caso.categoria === 'nuevo' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : 'bg-yellow-100 text-yellow-700'
                                  }>
                                    {caso.categoria === 'nuevo' ? 'Nuevo' : 'Por preaprobar'}
                                  </Badge>
                                  {!trabajador?.identificacion_verificada && (
                                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                                      Usuario no verificado
                                    </Badge>
                                  )}
                                </div>
                                
                                <h3 className="font-semibold text-base truncate">
                                  {caso.empresa_nombre as string}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {caso.ciudad as string}, {caso.estado as string}
                                </p>
                                
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Monto: </span>
                                    <span className="font-semibold text-green-600">
                                      ${((caso.monto_estimado as number) || 0).toLocaleString()}
                                    </span>
                                  </div>
                                  {calculo && (
                                    <div>
                                      <span className="text-muted-foreground">Antiguedad: </span>
                                      <span className="font-medium">
                                        {(calculo.antiguedad_anios as number) || 0}a {(calculo.antiguedad_meses as number) || 0}m
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                {trabajador && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Trabajador: {trabajador.full_name as string || trabajador.email as string}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex flex-col items-end gap-2">
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                <Button size="sm" className="mt-2">
                                  {isLawyer ? 'Tomar caso' : 'Asignar'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
