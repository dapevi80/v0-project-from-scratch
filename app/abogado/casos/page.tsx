'use client'

import React, { useState, useEffect, useCallback } from "react"
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  Search, 
  Briefcase, 
  Building2, 
  MapPin,
  Calendar,
  MessageSquare,
  AlertTriangle,
  ChevronRight,
  Scale,
  User,
  Phone,
  DollarSign,
  TrendingUp,
  FileText,
  Sparkles,
  Coins,
  EyeOff,
  CheckCircle2,
  Zap,
  Gift,
  Lock,
  RefreshCw,
  Clock
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { GenerarSolicitudModal } from '@/components/ccl/generar-solicitud-modal'

interface CasoAbogado {
  id: string
  folio: string
  empresa_nombre: string
  ciudad: string
  estado: string
  status: string
  categoria: string
  monto_estimado: number | null
  oferta_empresa: number | null
  fecha_proxima_audiencia: string | null
  fecha_limite_prescripcion: string | null
  tipo_caso: string
  created_at: string
  trabajador?: {
    id: string
    full_name: string
    phone: string
    email: string
  }
  unread_messages?: number
  next_event?: {
    title: string
    starts_at: string
  }
}

interface LeadDisponible {
  id: string
  folio: string
  empresa_nombre: string
  tipo_caso: string
  monto_estimado: number
  ciudad: string
  estado: string
  antiguedad_anos?: number
  fecha_despido?: string
  costo_creditos: number
}

interface CreditosInfo {
  saldo_actual: number
  total_gastado: number
  casos_tomados: number
}

const statusConfig: Record<string, { label: string; color: string }> = {
  assigned: { label: 'Asignado', color: 'bg-purple-100 text-purple-700' },
  in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-700' },
  conciliation: { label: 'Conciliacion', color: 'bg-orange-100 text-orange-700' },
  litigation: { label: 'En Juicio', color: 'bg-red-100 text-red-700' },
  resolved: { label: 'Resuelto', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Cerrado', color: 'bg-gray-100 text-gray-700' }
}

function formatCurrency(amount: number | null) {
  if (!amount) return '$0'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

function calcularDiasPrescripcion(fechaLimite: string | null): number | null {
  if (!fechaLimite) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const limite = new Date(fechaLimite)
  limite.setHours(0, 0, 0, 0)
  const diff = limite.getTime() - hoy.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function AbogadoCasosPage() {
  const [loading, setLoading] = useState(true)
  const [casos, setCasos] = useState<CasoAbogado[]>([])
  const [activeTab, setActiveTab] = useState('mis-casos')
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [showCCLModal, setShowCCLModal] = useState(false)
  const [selectedCasoForCCL, setSelectedCasoForCCL] = useState<CasoAbogado | null>(null)
  
  // Estado para leads
  const [leadDisponible, setLeadDisponible] = useState<LeadDisponible | null>(null)
  const [creditos, setCreditos] = useState<CreditosInfo>({ saldo_actual: 250, total_gastado: 0, casos_tomados: 0 })
  const [loadingLead, setLoadingLead] = useState(false)
  const [tomandoCaso, setTomandoCaso] = useState(false)
  
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    conciliacion: 0,
    juicio: 0,
    montoTotal: 0
  })
  
  const handleGenerarCCL = (caso: CasoAbogado, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedCasoForCCL(caso)
    setShowCCLModal(true)
  }

  const loadCasos = useCallback(async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('casos')
      .select(`
        *,
        case_messages(id, read_by_lawyer_at, created_at),
        case_events(id, title, starts_at, event_type)
      `)
      .eq('lawyer_id', user.id)
      .neq('status', 'closed')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error loading casos:', error)
      setLoading(false)
      return
    }

    const workerIds = [...new Set(data?.map(c => c.worker_id).filter(Boolean) || [])]
    let workersMap: Record<string, { id: string; full_name: string; phone: string; email: string }> = {}
    
    if (workerIds.length > 0) {
      const { data: workers } = await supabase
        .from('profiles')
        .select('id, full_name, phone, email')
        .in('id', workerIds)
      
      workersMap = Object.fromEntries(workers?.map(w => [w.id, w]) || [])
    }

    const casosProcessed = data?.map(caso => {
      const unreadMessages = caso.case_messages?.filter((m: { read_by_lawyer_at: string | null }) => !m.read_by_lawyer_at).length || 0
      const futureEvents = caso.case_events
        ?.filter((e: { starts_at: string }) => new Date(e.starts_at) >= new Date())
        .sort((a: { starts_at: string }, b: { starts_at: string }) => 
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
        )
      
      return {
        ...caso,
        trabajador: workersMap[caso.worker_id] || null,
        unread_messages: unreadMessages,
        next_event: futureEvents?.[0] || null
      }
    }) || []

    setCasos(casosProcessed)

    const total = casosProcessed.length
    const activos = casosProcessed.filter(c => !['resolved', 'closed'].includes(c.status)).length
    const conciliacion = casosProcessed.filter(c => c.categoria === 'conciliacion').length
    const juicio = casosProcessed.filter(c => c.categoria === 'juicio').length
    const montoTotal = casosProcessed.reduce((sum, c) => sum + (Number(c.monto_estimado) || 0), 0)

    setStats({ total, activos, conciliacion, juicio, montoTotal })
    setLoading(false)
  }, [])

  const loadCreditos = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('creditos_leads')
      .select('saldo_actual, total_gastado, casos_tomados')
      .eq('lawyer_id', user.id)
      .single()

    if (data) {
      setCreditos(data)
    }
  }, [])

  const loadLeadDisponible = useCallback(async () => {
    setLoadingLead(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoadingLead(false)
      return
    }

    // Obtener estado del abogado
    const { data: profile } = await supabase
      .from('profiles')
      .select('estado')
      .eq('id', user.id)
      .single()

    if (!profile?.estado) {
      setLoadingLead(false)
      return
    }

    // Buscar caso disponible en el estado del abogado
    const { data: lead } = await supabase
      .from('casos')
      .select(`
        id, folio, empresa_nombre, tipo_caso, monto_estimado,
        ciudad, estado, creditos_cobrados
      `)
      .eq('disponible_para_leads', true)
      .eq('estado_lead', 'disponible')
      .eq('estado', profile.estado)
      .is('lawyer_id', null)
      .limit(1)
      .single()

    if (lead) {
      // Obtener datos adicionales del calculo
      const { data: calculo } = await supabase
        .from('calculos_liquidacion')
        .select('antiguedad_anos, fecha_despido')
        .eq('caso_id', lead.id)
        .single()

      setLeadDisponible({
        ...lead,
        antiguedad_anos: calculo?.antiguedad_anos || 0,
        fecha_despido: calculo?.fecha_despido || '',
        costo_creditos: lead.creditos_cobrados || 10
      } as LeadDisponible)
    } else {
      setLeadDisponible(null)
    }
    setLoadingLead(false)
  }, [])

  const handleTomarCaso = async () => {
    if (!leadDisponible || tomandoCaso) return
    
    const costoCaso = leadDisponible.costo_creditos || 10
    if (creditos.saldo_actual < costoCaso) {
      alert('No tienes suficientes creditos. Recarga tu cuenta para tomar mas casos.')
      return
    }

    setTomandoCaso(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setTomandoCaso(false)
      return
    }

    try {
      const { data, error } = await supabase.rpc('tomar_caso_lead', {
        p_caso_id: leadDisponible.id,
        p_lawyer_id: user.id
      })

      if (error) throw error

      if (data?.success) {
        await Promise.all([loadCasos(), loadCreditos(), loadLeadDisponible()])
        setActiveTab('mis-casos')
      } else {
        alert(data?.message || 'No se pudo tomar el caso')
      }
    } catch (error) {
      console.error('Error tomando caso:', error)
      alert('Error al tomar el caso. Intenta de nuevo.')
    } finally {
      setTomandoCaso(false)
    }
  }

  const handlePasarCaso = () => {
    loadLeadDisponible()
  }

  useEffect(() => {
    loadCasos()
    loadCreditos()
    loadLeadDisponible()
  }, [loadCasos, loadCreditos, loadLeadDisponible])

  const casosFiltrados = casos.filter(caso => {
    const matchFiltro = filtro === 'todos' || caso.categoria === filtro || caso.status === filtro
    const matchBusqueda = !busqueda || 
      caso.empresa_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      caso.folio?.toLowerCase().includes(busqueda.toLowerCase()) ||
      caso.trabajador?.full_name?.toLowerCase().includes(busqueda.toLowerCase())
    return matchFiltro && matchBusqueda
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/abogado/dashboard" className="p-2 hover:bg-muted rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Mis Casos</h1>
                <p className="text-xs text-muted-foreground">Gestiona y toma nuevos casos</p>
              </div>
            </div>
            
            {/* Creditos Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-full">
              <Coins className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-amber-700">{creditos.saldo_actual}</span>
              <span className="text-xs text-amber-600 hidden sm:inline">creditos</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-indigo-900">{stats.total}</p>
              <p className="text-xs text-indigo-600">Total Casos</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-900">{stats.activos}</p>
              <p className="text-xs text-blue-600">Activos</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-900">{stats.conciliacion}</p>
              <p className="text-xs text-orange-600">Conciliacion</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-900">{stats.juicio}</p>
              <p className="text-xs text-red-600">En Juicio</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 col-span-2 md:col-span-1">
            <CardContent className="p-4 text-center">
              <p className="text-lg font-bold text-green-900">{formatCurrency(stats.montoTotal)}</p>
              <p className="text-xs text-green-600">Monto Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Mis Casos / Tomar Caso */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="mis-casos" className="gap-2 text-sm">
              <Briefcase className="w-4 h-4" />
              Mis Casos ({casos.length})
            </TabsTrigger>
            <TabsTrigger value="tomar-caso" className="gap-2 text-sm relative">
              <Zap className="w-4 h-4" />
              Tomar Caso
              {leadDisponible && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab: Mis Casos */}
          <TabsContent value="mis-casos" className="mt-4 space-y-4">
            {/* Filtros y busqueda */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por empresa, folio o trabajador..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                  { value: 'todos', label: 'Todos' },
                  { value: 'asignado', label: 'Asignados' },
                  { value: 'conciliacion', label: 'Conciliacion' },
                  { value: 'juicio', label: 'Juicio' }
                ].map(f => (
                  <Button
                    key={f.value}
                    variant={filtro === f.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiltro(f.value)}
                    className={filtro !== f.value ? 'bg-transparent' : ''}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Lista de casos */}
            {casosFiltrados.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">No tienes casos asignados</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ve a "Tomar Caso" para ver casos disponibles en tu estado
                  </p>
                  <Button onClick={() => setActiveTab('tomar-caso')}>
                    <Zap className="w-4 h-4 mr-2" />
                    Ver Casos Disponibles
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {casosFiltrados.map(caso => {
                  const diasPrescripcion = calcularDiasPrescripcion(caso.fecha_limite_prescripcion)
                  const prescripcionUrgente = diasPrescripcion !== null && diasPrescripcion <= 15
                  const status = statusConfig[caso.status] || { label: caso.status, color: 'bg-gray-100 text-gray-700' }

                  return (
                    <Link key={caso.id} href={`/caso/${caso.id}`}>
                      <Card className={`hover:border-primary transition-colors cursor-pointer ${prescripcionUrgente ? 'border-red-300 bg-red-50/30' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Status y alertas */}
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge className={status.color}>{status.label}</Badge>
                                
                                {caso.unread_messages && caso.unread_messages > 0 && (
                                  <Badge variant="destructive" className="gap-1">
                                    <MessageSquare className="w-3 h-3" />
                                    {caso.unread_messages}
                                  </Badge>
                                )}
                                
                                {caso.next_event && (
                                  <Badge className="bg-cyan-100 text-cyan-700 gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(caso.next_event.starts_at)}
                                  </Badge>
                                )}
                                
                                {prescripcionUrgente && (
                                  <Badge variant="destructive" className="gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    {diasPrescripcion}d
                                  </Badge>
                                )}
                              </div>

                              {/* Empresa */}
                              <div className="flex items-center gap-2 mb-1">
                                <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <h3 className="font-semibold truncate">{caso.empresa_nombre}</h3>
                              </div>
                              
                              {/* Folio y ubicacion */}
                              <p className="text-sm text-muted-foreground mb-2">
                                <span className="font-mono">{caso.folio}</span>
                                {caso.ciudad && (
                                  <span className="ml-2">
                                    <MapPin className="w-3 h-3 inline mr-1" />
                                    {caso.ciudad}, {caso.estado}
                                  </span>
                                )}
                              </p>

                              {/* Info del trabajador */}
                              {caso.trabajador && (
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {caso.trabajador.full_name}
                                  </span>
                                  {caso.trabajador.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      {caso.trabajador.phone}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Montos y acciones */}
                              <div className="flex items-center justify-between gap-4 text-sm">
                                <div className="flex items-center gap-4">
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                    <span className="font-semibold text-green-600">
                                      {formatCurrency(caso.monto_estimado)}
                                    </span>
                                  </span>
                                  {caso.oferta_empresa && (
                                    <span className="flex items-center gap-1">
                                      <TrendingUp className="w-4 h-4 text-blue-600" />
                                      <span className="text-blue-600">
                                        Oferta: {formatCurrency(caso.oferta_empresa)}
                                      </span>
                                    </span>
                                  )}
                                </div>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-xs bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-200 hover:from-emerald-100 hover:to-cyan-100 text-emerald-700"
                                  onClick={(e) => handleGenerarCCL(caso, e)}
                                >
                                  <Sparkles className="w-3 h-3" />
                                  Solicitud CCL
                                </Button>
                              </div>
                            </div>

                            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Tab: Tomar Caso */}
          <TabsContent value="tomar-caso" className="mt-4 space-y-4">
            {/* Info de creditos */}
            <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                      <Coins className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-800">Tus Creditos</p>
                      <p className="text-sm text-amber-600">Cada caso cuesta 10 creditos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-amber-700">{creditos.saldo_actual}</p>
                    <p className="text-xs text-amber-600">{creditos.casos_tomados} casos tomados</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-amber-600 mb-1">
                    <span>Saldo usado</span>
                    <span>{creditos.total_gastado} de {creditos.saldo_actual + creditos.total_gastado}</span>
                  </div>
                  <Progress value={creditos.total_gastado > 0 ? (creditos.total_gastado / (creditos.saldo_actual + creditos.total_gastado)) * 100 : 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Lead disponible */}
            {loadingLead ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <RefreshCw className="w-8 h-8 mx-auto text-slate-400 animate-spin mb-3" />
                  <p className="text-slate-500">Buscando casos disponibles en tu estado...</p>
                </CardContent>
              </Card>
            ) : leadDisponible ? (
              <Card className="border-2 border-emerald-300 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <Gift className="w-5 h-5" />
                      <span className="font-medium">Caso Disponible en tu Estado</span>
                    </div>
                    <Badge className="bg-white/20 text-white border-0">
                      <Coins className="w-3 h-3 mr-1" />
                      {leadDisponible.costo_creditos} creditos
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Info del caso */}
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <Building2 className="w-7 h-7 text-slate-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-800">{leadDisponible.empresa_nombre}</h3>
                        <p className="text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-4 h-4" />
                          {leadDisponible.ciudad}, {leadDisponible.estado}
                        </p>
                      </div>
                    </div>

                    {/* Detalles del caso */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-white border">
                        <p className="text-xs text-slate-500 mb-1">Tipo de Caso</p>
                        <p className="font-medium text-slate-700">{leadDisponible.tipo_caso || 'Despido Injustificado'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white border">
                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Antiguedad
                        </p>
                        <p className="font-medium text-slate-700">{leadDisponible.antiguedad_anos || '?'} años</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                        <p className="text-xs text-green-600 mb-1">Monto Estimado</p>
                        <p className="font-bold text-green-700 text-lg">{formatCurrency(leadDisponible.monto_estimado)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white border">
                        <p className="text-xs text-slate-500 mb-1">Fecha Despido</p>
                        <p className="font-medium text-slate-700">
                          {leadDisponible.fecha_despido ? formatDate(leadDisponible.fecha_despido) : 'Reciente'}
                        </p>
                      </div>
                    </div>

                    {/* Info oculta */}
                    <div className="p-4 rounded-lg bg-slate-100 border border-slate-200">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Lock className="w-4 h-4" />
                        <span className="text-sm">Datos de contacto del trabajador disponibles al tomar el caso</span>
                      </div>
                    </div>

                    {/* Botones de accion */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={handlePasarCaso}
                        disabled={loadingLead}
                      >
                        <EyeOff className="w-4 h-4 mr-2" />
                        Pasar
                      </Button>
                      <Button
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                        onClick={handleTomarCaso}
                        disabled={tomandoCaso || creditos.saldo_actual < (leadDisponible.costo_creditos || 10)}
                      >
                        {tomandoCaso ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        Tomar Caso ({leadDisponible.costo_creditos} creditos)
                      </Button>
                    </div>

                    {creditos.saldo_actual < (leadDisponible.costo_creditos || 10) && (
                      <p className="text-center text-sm text-red-500">
                        No tienes suficientes creditos. Recarga tu cuenta.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-slate-700 mb-2">No hay casos disponibles</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    En este momento no hay casos disponibles en tu estado.
                    <br />Vuelve a intentar mas tarde.
                  </p>
                  <Button variant="outline" onClick={loadLeadDisponible} className="bg-transparent">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Buscar de Nuevo
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Info de como funciona */}
            <Card className="bg-slate-50">
              <CardContent className="p-4">
                <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Como funciona
                </h4>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                    <span>Te mostramos un caso disponible en tu estado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                    <span>Revisa la informacion del caso y decide si te interesa</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                    <span>Toma el caso (10 creditos) o pasa para ver otro</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                    <span>Al tomar el caso, obtendras los datos de contacto del trabajador</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Modal para generar solicitud CCL */}
      <GenerarSolicitudModal
        isOpen={showCCLModal}
        onClose={() => {
          setShowCCLModal(false)
          setSelectedCasoForCCL(null)
        }}
        caso={selectedCasoForCCL ? {
          id: selectedCasoForCCL.id,
          worker_id: selectedCasoForCCL.trabajador?.id || '',
          employer_name: selectedCasoForCCL.empresa_nombre,
          employer_address: `${selectedCasoForCCL.ciudad}, ${selectedCasoForCCL.estado}`,
          salary_daily: selectedCasoForCCL.monto_estimado ? selectedCasoForCCL.monto_estimado / 90 : undefined,
          end_date: selectedCasoForCCL.fecha_limite_prescripcion ? 
            new Date(new Date(selectedCasoForCCL.fecha_limite_prescripcion).getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
          termination_type: selectedCasoForCCL.tipo_caso,
          worker: selectedCasoForCCL.trabajador ? {
            full_name: selectedCasoForCCL.trabajador.full_name,
            email: selectedCasoForCCL.trabajador.email,
            phone: selectedCasoForCCL.trabajador.phone,
            estado: selectedCasoForCCL.estado
          } : undefined
        } : null}
        onSuccess={() => {
          loadCasos()
        }}
      />
    </div>
  )
}
