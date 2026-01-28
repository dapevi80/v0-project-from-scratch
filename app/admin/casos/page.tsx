'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, Search, Briefcase, Users, DollarSign, Clock, 
  AlertTriangle, CheckCircle, FileText, Filter, Building2,
  Calendar, MessageSquare, Eye, TrendingUp
} from 'lucide-react'
import { 
  obtenerTodosLosCasos, 
  obtenerTodasLasCotizaciones,
  obtenerEstadisticasGlobales,
  obtenerAbogados,
  statusLabels, 
  statusColors,
  prioridadLabels,
  prioridadColors,
  formatCurrency,
  formatDate,
  calcularDiasRestantes
} from '@/app/casos/actions'

export default function AdminCasosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('')
  const [casos, setCasos] = useState<any[]>([])
  const [cotizaciones, setCotizaciones] = useState<any[]>([])
  const [abogados, setAbogados] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [filtros, setFiltros] = useState({
    status: 'all',
    lawyerId: 'all',
    busqueda: ''
  })
  const [filtrosCotizaciones, setFiltrosCotizaciones] = useState({
    tipo: 'all' // all, con_caso, sin_caso
  })

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/acceso')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
        router.push('/dashboard')
        return
      }

      setUserRole(profile.role)

      // Cargar datos en paralelo
      const [casosRes, statsRes, abogadosRes] = await Promise.all([
        obtenerTodosLosCasos(),
        obtenerEstadisticasGlobales(),
        obtenerAbogados()
      ])

      if (casosRes.data) setCasos(casosRes.data)
      if (statsRes.data) setStats(statsRes.data)
      if (abogadosRes.data) setAbogados(abogadosRes.data)

      // Solo superadmin puede ver cotizaciones
      if (profile.role === 'superadmin') {
        const cotizacionesRes = await obtenerTodasLasCotizaciones()
        if (cotizacionesRes.data) setCotizaciones(cotizacionesRes.data)
      }

      setLoading(false)
    }

    loadData()
  }, [router])

  // Filtrar casos
  const casosFiltrados = casos.filter(caso => {
    if (filtros.status !== 'all' && caso.status !== filtros.status) return false
    if (filtros.lawyerId !== 'all' && caso.lawyer_id !== filtros.lawyerId) return false
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase()
      if (!caso.empresa_nombre?.toLowerCase().includes(busqueda) && 
          !caso.folio?.toLowerCase().includes(busqueda) &&
          !caso.trabajador?.full_name?.toLowerCase().includes(busqueda)) {
        return false
      }
    }
    return true
  })

  // Filtrar cotizaciones
  const cotizacionesFiltradas = cotizaciones.filter(cot => {
    if (filtrosCotizaciones.tipo === 'con_caso' && !cot.tiene_caso) return false
    if (filtrosCotizaciones.tipo === 'sin_caso' && cot.tiene_caso) return false
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Gestion de Casos</h1>
              <p className="text-sm text-muted-foreground">
                {userRole === 'superadmin' ? 'Vista completa de todos los casos y cotizaciones' : 'Casos asignados a abogados'}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            {userRole === 'superadmin' ? 'Super Admin' : 'Admin'}
          </Badge>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Total Casos</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.totalCasos}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-muted-foreground">Asignados</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.casosAsignados}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-xs text-muted-foreground">Sin Asignar</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.casosSinAsignar}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-muted-foreground">Activos</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.casosActivos}</p>
              </CardContent>
            </Card>
            {userRole === 'superadmin' && (
              <>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <span className="text-xs text-muted-foreground">Cotizaciones</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{stats.totalCotizaciones}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-600" />
                      <span className="text-xs text-muted-foreground">Abogados</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{stats.totalAbogados}</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Montos */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700">Monto Total Estimado</p>
                    <p className="text-2xl font-bold text-green-800">{formatCurrency(stats.montoTotalEstimado)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">Total Ofertas Empresas</p>
                    <p className="text-2xl font-bold text-blue-800">{formatCurrency(stats.montoTotalOfertas)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs para Casos y Cotizaciones */}
        <Tabs defaultValue="casos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="casos" className="gap-2">
              <Briefcase className="h-4 w-4" /> Casos ({casosFiltrados.length})
            </TabsTrigger>
            {userRole === 'superadmin' && (
              <TabsTrigger value="cotizaciones" className="gap-2">
                <FileText className="h-4 w-4" /> Cotizaciones ({cotizacionesFiltradas.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab Casos */}
          <TabsContent value="casos" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por folio, empresa o trabajador..."
                      className="pl-9"
                      value={filtros.busqueda}
                      onChange={(e) => setFiltros(f => ({ ...f, busqueda: e.target.value }))}
                    />
                  </div>
                  <Select value={filtros.status} onValueChange={(v) => setFiltros(f => ({ ...f, status: v }))}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los status</SelectItem>
                      {Object.entries(statusLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filtros.lawyerId} onValueChange={(v) => setFiltros(f => ({ ...f, lawyerId: v }))}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Abogado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los abogados</SelectItem>
                      {abogados.map((ab) => (
                        <SelectItem key={ab.id} value={ab.id}>{ab.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Casos */}
            <div className="space-y-3">
              {casosFiltrados.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No hay casos que coincidan con los filtros</p>
                  </CardContent>
                </Card>
              ) : (
                casosFiltrados.map((caso) => {
                  const diasAudiencia = calcularDiasRestantes(caso.fecha_proxima_audiencia)
                  const tieneAlerta = diasAudiencia !== null && diasAudiencia <= 7
                  
                  return (
                    <Card key={caso.id} className={`hover:shadow-md transition-all ${tieneAlerta ? 'border-l-4 border-l-orange-500' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          {/* Info Principal */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm text-muted-foreground">{caso.folio}</span>
                              <Badge className={statusColors[caso.status] || 'bg-gray-100'}>
                                {statusLabels[caso.status] || caso.status}
                              </Badge>
                              {caso.prioridad && caso.prioridad !== 'normal' && (
                                <Badge className={prioridadColors[caso.prioridad]}>
                                  {prioridadLabels[caso.prioridad]}
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold truncate">{caso.empresa_nombre}</h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {caso.trabajador?.full_name || 'Sin nombre'}
                              </span>
                              {caso.abogado && (
                                <span className="flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  {caso.abogado.full_name}
                                </span>
                              )}
                              {!caso.abogado && (
                                <span className="flex items-center gap-1 text-orange-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  Sin abogado
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Montos */}
                          <div className="flex gap-6 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">Estimado</p>
                              <p className="font-semibold">{formatCurrency(caso.monto_estimado)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Oferta</p>
                              <p className={`font-semibold ${caso.oferta_empresa ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {caso.oferta_empresa ? formatCurrency(caso.oferta_empresa) : '-'}
                              </p>
                            </div>
                          </div>

                          {/* Alertas */}
                          <div className="flex items-center gap-3">
                            {caso.next_event && (
                              <div className="flex items-center gap-1 text-xs">
                                <Calendar className={`h-4 w-4 ${tieneAlerta ? 'text-orange-500' : 'text-muted-foreground'}`} />
                                <span className={tieneAlerta ? 'text-orange-600 font-medium' : ''}>
                                  {diasAudiencia === 0 ? 'Hoy' : diasAudiencia === 1 ? 'Manana' : `${diasAudiencia}d`}
                                </span>
                              </div>
                            )}
                            {caso.unread_messages > 0 && (
                              <div className="flex items-center gap-1 text-xs">
                                <MessageSquare className="h-4 w-4 text-blue-500" />
                                <span className="text-blue-600">{caso.unread_messages}</span>
                              </div>
                            )}
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/oficina-virtual/caso/${caso.id}`}>
                                <Eye className="h-4 w-4 mr-1" /> Ver
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>

          {/* Tab Cotizaciones (solo superadmin) */}
          {userRole === 'superadmin' && (
            <TabsContent value="cotizaciones" className="space-y-4">
              {/* Filtros Cotizaciones */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Select value={filtrosCotizaciones.tipo} onValueChange={(v) => setFiltrosCotizaciones({ tipo: v })}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filtrar por..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las cotizaciones</SelectItem>
                        <SelectItem value="con_caso">Con caso creado</SelectItem>
                        <SelectItem value="sin_caso">Sin caso (solo cotizacion)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Cotizaciones */}
              <div className="space-y-3">
                {cotizacionesFiltradas.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No hay cotizaciones</p>
                    </CardContent>
                  </Card>
                ) : (
                  cotizacionesFiltradas.map((cot) => (
                    <Card key={cot.id} className="hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {cot.tiene_caso ? (
                                <Badge className="bg-green-100 text-green-700">Con caso</Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-700">Solo cotizacion</Badge>
                              )}
                              {cot.caso && (
                                <span className="text-xs font-mono text-muted-foreground">{cot.caso.folio}</span>
                              )}
                            </div>
                            <p className="font-medium">{cot.usuario?.full_name || 'Usuario sin nombre'}</p>
                            <p className="text-sm text-muted-foreground">{cot.usuario?.email}</p>
                          </div>
                          <div className="flex gap-6 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">Conciliacion</p>
                              <p className="font-semibold text-green-600">{formatCurrency(cot.total_conciliacion)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Juicio</p>
                              <p className="font-semibold text-blue-600">{formatCurrency(cot.total_juicio)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Antiguedad</p>
                              <p className="font-semibold">{cot.antiguedad_anios || 0}a {cot.antiguedad_meses || 0}m</p>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(cot.created_at)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
