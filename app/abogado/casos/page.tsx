'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  Search, 
  Briefcase, 
  Building2, 
  MapPin,
  Calendar,
  Clock,
  MessageSquare,
  Bell,
  AlertTriangle,
  ChevronRight,
  Scale,
  User,
  Phone,
  DollarSign,
  TrendingUp,
  Filter
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    conciliacion: 0,
    juicio: 0,
    montoTotal: 0
  })

  useEffect(() => {
    loadCasos()
  }, [])

  async function loadCasos() {
    setLoading(true)
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // Obtener casos asignados al abogado
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

    // Obtener trabajadores
    const workerIds = [...new Set(data?.map(c => c.worker_id).filter(Boolean) || [])]
    let workersMap: Record<string, { id: string; full_name: string; phone: string; email: string }> = {}
    
    if (workerIds.length > 0) {
      const { data: workers } = await supabase
        .from('profiles')
        .select('id, full_name, phone, email')
        .in('id', workerIds)
      
      workersMap = Object.fromEntries(workers?.map(w => [w.id, w]) || [])
    }

    // Procesar casos
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

    // Calcular estadisticas
    const total = casosProcessed.length
    const activos = casosProcessed.filter(c => !['resolved', 'closed'].includes(c.status)).length
    const conciliacion = casosProcessed.filter(c => c.categoria === 'conciliacion').length
    const juicio = casosProcessed.filter(c => c.categoria === 'juicio').length
    const montoTotal = casosProcessed.reduce((sum, c) => sum + (Number(c.monto_estimado) || 0), 0)

    setStats({ total, activos, conciliacion, juicio, montoTotal })
    setLoading(false)
  }

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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="p-2 hover:bg-muted rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Scale className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Mis Casos Asignados</h1>
                <p className="text-xs text-muted-foreground">
                  Gestiona tus casos legales activos
                </p>
              </div>
            </div>
            <Link href="/oficina-virtual">
              <Button variant="outline" size="sm" className="bg-transparent">
                <Briefcase className="w-4 h-4 mr-2" />
                Oficina Virtual
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
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
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No tienes casos asignados</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Los casos te seran asignados cuando esten verificados
              </p>
              <Link href="/oficina-virtual">
                <Button>
                  Ir a Oficina Virtual
                </Button>
              </Link>
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
                            
                            {caso.unread_messages > 0 && (
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

                          {/* Montos */}
                          <div className="flex items-center gap-4 text-sm">
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
      </main>
    </div>
  )
}
