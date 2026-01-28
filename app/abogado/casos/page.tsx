'use client'

import React from "react"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  Sparkles,
  Coins,
  EyeOff,
  CheckCircle2,
  Zap,
  Gift,
  RefreshCw,
  Clock,
  ShieldCheck
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
}

interface LeadDisponible {
  id: string
  folio: string
  empresa_nombre: string
  tipo_despido: string
  monto_estimado: number
  antiguedad_anos: number
  salario_diario: number
  ciudad: string
  estado: string
  fecha_creacion: string
  dias_para_prescripcion: number
  trabajador_nombre: string
  trabajador_verificado: boolean
  user_id: string
}

interface CreditosInfo {
  creditos_disponibles: number
  creditos_usados: number
  casos_tomados_mes: number
}

const COSTO_LEAD = 10

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
  const [leadDisponible, setLeadDisponible] = useState<LeadDisponible | null>(null)
  const [creditos, setCreditos] = useState<CreditosInfo | null>(null)
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [showCCLModal, setShowCCLModal] = useState(false)
  const [selectedCasoForCCL, setSelectedCasoForCCL] = useState<CasoAbogado | null>(null)
  const [tomandoCaso, setTomandoCaso] = useState(false)
  const [buscandoLead, setBuscandoLead] = useState(false)
  const [leadOculto, setLeadOculto] = useState(false)
  const [userEstado, setUserEstado] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    conciliacion: 0,
    juicio: 0,
    montoTotal: 0
  })

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    
    setUserId(user.id)

    // Obtener estado del abogado
    const { data: profile } = await supabase
      .from('profiles')
      .select('estado')
      .eq('id', user.id)
      .single()
    
    const estado = profile?.estado || null
    setUserEstado(estado)

    // Cargar en paralelo
    await Promise.all([
      loadCasos(user.id),
      loadCreditos(user.id),
      estado ? loadLeadDisponible(user.id, estado) : Promise.resolve()
    ])
    
    setLoading(false)
  }

  async function loadCasos(lawyerId: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('casos')
      .select(`
        *,
        case_messages(id, read_by_lawyer_at)
      `)
      .eq('lawyer_id', lawyerId)
      .neq('status', 'closed')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error loading casos:', error)
      return
    }

    // Obtener trabajadores
    const workerIds = [...new Set(data?.map(c => c.worker_id).filter(Boolean) || [])]
    let workersMap: Record<string, any> = {}
    
    if (workerIds.length > 0) {
      const { data: workers } = await supabase
        .from('profiles')
        .select('id, full_name, phone, email')
        .in('id', workerIds)
      
      workersMap = Object.fromEntries(workers?.map(w => [w.id, w]) || [])
    }

    const casosProcessed = data?.map(caso => ({
      ...caso,
      trabajador: workersMap[caso.worker_id] || null,
      unread_messages: caso.case_messages?.filter((m: any) => !m.read_by_lawyer_at).length || 0
    })) || []

    setCasos(casosProcessed)

    // Estadisticas
    const total = casosProcessed.length
    const activos = casosProcessed.filter(c => !['resolved', 'closed'].includes(c.status)).length
    const conciliacion = casosProcessed.filter(c => c.categoria === 'conciliacion').length
    const juicio = casosProcessed.filter(c => c.categoria === 'juicio').length
    const montoTotal = casosProcessed.reduce((sum, c) => sum + (Number(c.monto_estimado) || 0), 0)

    setStats({ total, activos, conciliacion, juicio, montoTotal })
  }

  async function loadCreditos(lawyerId: string) {
    const supabase = createClient()
    
    let { data: creditosData } = await supabase
      .from('creditos_leads')
      .select('*')
      .eq('lawyer_id', lawyerId)
      .single()

    // Crear registro con 250 creditos si no existe
    if (!creditosData) {
      const { data: newCreditos } = await supabase
        .from('creditos_leads')
        .insert({
          lawyer_id: lawyerId,
          creditos_disponibles: 250,
          creditos_usados: 0,
          casos_tomados_mes: 0
        })
        .select()
        .single()
      
      creditosData = newCreditos
    }

    if (creditosData) {
      setCreditos({
        creditos_disponibles: creditosData.creditos_disponibles,
        creditos_usados: creditosData.creditos_usados,
        casos_tomados_mes: creditosData.casos_tomados_mes
      })
    }
  }

  async function loadLeadDisponible(lawyerId: string, estado: string) {
    setBuscandoLead(true)
    const supabase = createClient()
    
    // Buscar calculo disponible en el mismo estado sin abogado asignado
    const { data: calculos } = await supabase
      .from('calculos_liquidacion')
      .select(`
        id, folio, employer_name, termination_type, total_severance,
        years_worked, daily_salary, city, state, created_at, end_date, user_id,
        profiles:user_id(full_name, identificacion_verificada)
      `)
      .is('lawyer_id', null)
      .eq('state', estado)
      .order('created_at', { ascending: false })
      .limit(1)

    if (calculos && calculos.length > 0) {
      const c = calculos[0] as any
      const endDate = c.end_date ? new Date(c.end_date) : new Date()
      const prescripcion = new Date(endDate)
      prescripcion.setDate(prescripcion.getDate() + 60)
      const diasRestantes = Math.max(0, Math.ceil((prescripcion.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      
      setLeadDisponible({
        id: c.id,
        folio: c.folio || `MC-${c.id.slice(0, 8).toUpperCase()}`,
        empresa_nombre: c.employer_name || 'Empresa no especificada',
        tipo_despido: c.termination_type || 'despido_injustificado',
        monto_estimado: c.total_severance || 0,
        antiguedad_anos: c.years_worked || 0,
        salario_diario: c.daily_salary || 0,
        ciudad: c.city || '',
        estado: c.state || estado,
        fecha_creacion: c.created_at,
        dias_para_prescripcion: diasRestantes,
        trabajador_nombre: c.profiles?.full_name || 'Trabajador',
        trabajador_verificado: c.profiles?.identificacion_verificada || false,
        user_id: c.user_id
      })
    } else {
      setLeadDisponible(null)
    }
    
    setBuscandoLead(false)
  }

  async function handleTomarCaso() {
    if (!leadDisponible || !creditos || creditos.creditos_disponibles < COSTO_LEAD || !userId) return
    
    setTomandoCaso(true)
    const supabase = createClient()

    try {
      // 1. Crear caso a partir del calculo
      const { data: newCaso, error: casoError } = await supabase
        .from('casos')
        .insert({
          folio: leadDisponible.folio,
          worker_id: leadDisponible.user_id,
          lawyer_id: userId,
          empresa_nombre: leadDisponible.empresa_nombre,
          tipo_caso: leadDisponible.tipo_despido,
          status: 'assigned',
          categoria: 'conciliacion',
          monto_estimado: leadDisponible.monto_estimado,
          ciudad: leadDisponible.ciudad,
          estado: leadDisponible.estado
        })
        .select()
        .single()

      if (casoError) throw casoError

      // 2. Marcar el calculo como tomado
      await supabase
        .from('calculos_liquidacion')
        .update({ lawyer_id: userId })
        .eq('id', leadDisponible.id)

      // 3. Descontar creditos
      await supabase
        .from('creditos_leads')
        .update({
          creditos_disponibles: creditos.creditos_disponibles - COSTO_LEAD,
          creditos_usados: creditos.creditos_usados + COSTO_LEAD,
          casos_tomados_mes: creditos.casos_tomados_mes + 1
        })
        .eq('lawyer_id', userId)

      // 4. Registrar transaccion
      await supabase
        .from('creditos_leads_transacciones')
        .insert({
          lawyer_id: userId,
          tipo: 'uso',
          cantidad: COSTO_LEAD,
          concepto: `Caso tomado: ${leadDisponible.folio}`,
          caso_id: newCaso?.id
        })

      // Recargar todo
      await loadAll()
      
    } catch (error) {
      console.error('Error tomando caso:', error)
      alert('Error al tomar el caso. Intenta de nuevo.')
    } finally {
      setTomandoCaso(false)
    }
  }

  function handlePasarCaso() {
    setLeadOculto(true)
    setTimeout(async () => {
      if (userId && userEstado) {
        await loadLeadDisponible(userId, userEstado)
      }
      setLeadOculto(false)
    }, 1500)
  }

  function handleBuscarOtro() {
    if (userId && userEstado) {
      loadLeadDisponible(userId, userEstado)
    }
  }

  const handleGenerarCCL = (caso: CasoAbogado, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedCasoForCCL(caso)
    setShowCCLModal(true)
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
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/abogado/dashboard" className="p-2 hover:bg-muted rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Scale className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Mis Casos</h1>
                <p className="text-xs text-muted-foreground">Toma y gestiona casos</p>
              </div>
            </div>
            
            {/* Creditos Badge */}
            {creditos && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-full">
                <Coins className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-amber-700">{creditos.creditos_disponibles}</span>
                <span className="text-xs text-amber-600 hidden sm:inline">creditos</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        
        {/* SECCION: Lead Disponible */}
        <Card className="border-2 border-dashed border-emerald-300 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Caso Disponible
                    {userEstado && (
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs font-normal">
                        <MapPin className="w-3 h-3 mr-1" />
                        {userEstado}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Toma un nuevo caso por {COSTO_LEAD} creditos</CardDescription>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBuscarOtro}
                disabled={buscandoLead}
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${buscandoLead ? 'animate-spin' : ''}`} />
                Buscar otro
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {buscandoLead ? (
              <div className="py-10 text-center">
                <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-3" />
                <p className="text-muted-foreground">Buscando casos disponibles...</p>
              </div>
            ) : leadDisponible && !leadOculto ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Info del Lead */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Header del caso */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline" className="bg-white font-mono">{leadDisponible.folio}</Badge>
                        {leadDisponible.trabajador_verificado && (
                          <Badge className="bg-blue-100 text-blue-700">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Verificado
                          </Badge>
                        )}
                        {leadDisponible.dias_para_prescripcion <= 15 && (
                          <Badge variant="destructive" className="animate-pulse">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Urgente - {leadDisponible.dias_para_prescripcion}d
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-xl text-slate-800">{leadDisponible.empresa_nombre}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4" />
                        {leadDisponible.ciudad}, {leadDisponible.estado}
                      </p>
                    </div>
                  </div>
                  
                  {/* Detalles en grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white/80 rounded-xl p-3 text-center border border-emerald-100">
                      <p className="text-xs text-muted-foreground mb-1">Tipo de caso</p>
                      <p className="font-semibold text-sm capitalize">{leadDisponible.tipo_despido?.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="bg-white/80 rounded-xl p-3 text-center border border-emerald-100">
                      <p className="text-xs text-muted-foreground mb-1">Antiguedad</p>
                      <p className="font-semibold text-sm">{leadDisponible.antiguedad_anos} anos</p>
                    </div>
                    <div className="bg-white/80 rounded-xl p-3 text-center border border-emerald-100">
                      <p className="text-xs text-muted-foreground mb-1">Salario diario</p>
                      <p className="font-semibold text-sm">{formatCurrency(leadDisponible.salario_diario)}</p>
                    </div>
                    <div className="bg-white/80 rounded-xl p-3 text-center border border-emerald-100">
                      <p className="text-xs text-muted-foreground mb-1">Prescripcion</p>
                      <p className={`font-semibold text-sm ${leadDisponible.dias_para_prescripcion <= 15 ? 'text-red-600' : 'text-slate-800'}`}>
                        <Clock className="w-3 h-3 inline mr-1" />
                        {leadDisponible.dias_para_prescripcion} dias
                      </p>
                    </div>
                  </div>
                  
                  {/* Trabajador */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white/60 rounded-lg px-3 py-2">
                    <User className="w-4 h-4" />
                    <span>Trabajador: <strong className="text-slate-700">{leadDisponible.trabajador_nombre}</strong></span>
                  </div>
                </div>
                
                {/* Panel de Accion */}
                <div className="flex flex-col items-center justify-center bg-white/70 rounded-2xl p-5 border-2 border-emerald-200 shadow-sm">
                  <p className="text-xs text-muted-foreground mb-1">Monto Estimado</p>
                  <p className="text-3xl font-bold text-emerald-600 mb-4">{formatCurrency(leadDisponible.monto_estimado)}</p>
                  
                  <div className="w-full space-y-2">
                    <Button 
                      className="w-full h-12 text-base bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg"
                      onClick={handleTomarCaso}
                      disabled={tomandoCaso || !creditos || creditos.creditos_disponibles < COSTO_LEAD}
                    >
                      {tomandoCaso ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          Tomando caso...
                        </>
                      ) : (
                        <>
                          <Coins className="w-5 h-5 mr-2" />
                          Tomar Caso ({COSTO_LEAD} creditos)
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full text-slate-500 hover:text-slate-700"
                      onClick={handlePasarCaso}
                      disabled={tomandoCaso}
                    >
                      <EyeOff className="w-4 h-4 mr-2" />
                      Pasar / Ver otro caso
                    </Button>
                  </div>
                  
                  {creditos && creditos.creditos_disponibles < COSTO_LEAD && (
                    <div className="mt-3 text-center">
                      <p className="text-xs text-red-500 mb-2">No tienes suficientes creditos</p>
                      <Link href="/abogado/creditos">
                        <Button size="sm" variant="outline" className="text-xs bg-transparent">
                          Recargar creditos
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ) : leadOculto ? (
              <div className="py-10 text-center">
                <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-3" />
                <p className="text-muted-foreground">Buscando otro caso...</p>
              </div>
            ) : (
              <div className="py-10 text-center">
                <Gift className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium text-lg">No hay casos disponibles</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {userEstado ? `No hay casos nuevos en ${userEstado}` : 'Configura tu estado en tu perfil'}
                </p>
                <p className="text-xs text-muted-foreground mt-3">Vuelve pronto, llegan nuevos casos cada dia</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Barra de Creditos */}
        {creditos && (
          <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-amber-800">Mis Creditos para Leads</span>
                </div>
                <Link href="/abogado/creditos">
                  <Button variant="outline" size="sm" className="bg-white text-amber-700 border-amber-300 hover:bg-amber-50">
                    Recargar
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Progress 
                    value={(creditos.creditos_disponibles / 250) * 100} 
                    className="h-3 bg-amber-100"
                  />
                </div>
                <div className="text-right min-w-[80px]">
                  <span className="font-bold text-lg text-amber-700">{creditos.creditos_disponibles}</span>
                  <span className="text-amber-600/70 text-sm"> / 250</span>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-amber-600/80">
                <span>Casos tomados este mes: {creditos.casos_tomados_mes}</span>
                <span>Creditos usados: {creditos.creditos_usados}</span>
              </div>
            </CardContent>
          </Card>
        )}

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
              { value: 'assigned', label: 'Asignados' },
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

        {/* Titulo seccion casos asignados */}
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-slate-600" />
          <h2 className="font-semibold text-slate-700">Mis Casos Asignados ({casosFiltrados.length})</h2>
        </div>

        {/* Lista de casos */}
        {casosFiltrados.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No tienes casos asignados</h3>
              <p className="text-sm text-muted-foreground">
                Toma tu primer caso de la seccion superior
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {casosFiltrados.map(caso => {
              const diasPrescripcion = calcularDiasPrescripcion(caso.fecha_limite_prescripcion)
              const prescripcionUrgente = diasPrescripcion !== null && diasPrescripcion <= 15

              return (
                <Link key={caso.id} href={`/caso/${caso.id}`}>
                  <Card className={`hover:border-primary transition-all cursor-pointer border-l-4 ${prescripcionUrgente ? 'border-l-red-500 bg-red-50/30' : 'border-l-emerald-500'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Badges */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className={caso.categoria === 'conciliacion' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}>
                              {caso.categoria === 'conciliacion' ? 'Conciliacion' : 'Juicio'}
                            </Badge>
                            
                            {caso.unread_messages > 0 && (
                              <Badge variant="destructive" className="gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {caso.unread_messages}
                              </Badge>
                            )}
                            
                            {prescripcionUrgente && (
                              <Badge variant="destructive" className="gap-1 animate-pulse">
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

                          {/* Trabajador */}
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

                          {/* Montos y boton CCL */}
                          <div className="flex items-center justify-between gap-4 text-sm">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(caso.monto_estimado)}
                                </span>
                              </span>
                              {caso.oferta_empresa && (
                                <span className="flex items-center gap-1 text-blue-600">
                                  <TrendingUp className="w-4 h-4" />
                                  Oferta: {formatCurrency(caso.oferta_empresa)}
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

                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </main>
      
      {/* Modal CCL */}
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
          loadCasos(userId || '')
        }}
      />
    </div>
  )
}
