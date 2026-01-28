'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, Search, MapPin, Building2, Calendar, Clock,
  ChevronRight, X, Heart, Lock, Coins, Eye, Filter,
  Briefcase, Users, Sparkles, ChevronDown, User
} from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Lead {
  id: string
  nombre_trabajador: string
  telefono: string | null
  email: string | null
  empresa_nombre: string
  puesto: string
  salario_mensual: number
  antiguedad_meses: number
  fecha_ingreso: string
  fecha_despido: string | null
  motivo_separacion: string
  estado: string
  status: string
  indemnizacion_estimada: number
  created_at: string
  user_id: string | null
}

interface MiCaso {
  id: string
  folio: string
  empresa_nombre: string
  tipo_caso: string
  monto_estimado: number
  status: string
  estado: string
  ciudad: string
  trabajador?: {
    full_name: string
    phone: string
  }
  created_at: string
}

const COSTO_DESBLOQUEO = 50 // pesos

export default function LeadsTinderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('explorar')
  
  // User data
  const [userRole, setUserRole] = useState<string>('')
  const [userEstado, setUserEstado] = useState<string>('')
  const [creditos, setCreditos] = useState(0)
  
  // Leads disponibles (modo Tinder)
  const [leads, setLeads] = useState<Lead[]>([])
  const [currentLeadIndex, setCurrentLeadIndex] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  
  // Mis casos asignados
  const [misCasos, setMisCasos] = useState<MiCaso[]>([])
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    cercaDeTi: 0,
    calificados: 0,
    sinCalificar: 0
  })

  // Modal desbloqueo
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [unlockingLead, setUnlockingLead] = useState<Lead | null>(null)
  const [unlocking, setUnlocking] = useState(false)

  const currentLead = leads[currentLeadIndex]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = useCallback(async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.replace('/acceso')
      return
    }

    // Obtener perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, estado')
      .eq('id', user.id)
      .single()

    if (!profile || !['lawyer', 'admin', 'superadmin'].includes(profile.role)) {
      router.replace('/dashboard')
      return
    }

    setUserRole(profile.role)
    setUserEstado(profile.estado || '')

    // Obtener creditos
    const { data: creditosData } = await supabase
      .from('creditos_leads')
      .select('saldo_actual')
      .eq('user_id', user.id)
      .single()

    setCreditos(creditosData?.saldo_actual || 0)

    // Obtener leads disponibles (cotizaciones sin caso asignado)
    const { data: cotizaciones } = await supabase
      .from('cotizaciones')
      .select('*')
      .in('status', ['nueva', 'contactada'])
      .order('created_at', { ascending: false })

    if (cotizaciones) {
      setLeads(cotizaciones)
      const cercaDeTi = cotizaciones.filter(l => l.estado === profile.estado).length
      setStats({
        total: cotizaciones.length,
        cercaDeTi,
        calificados: cotizaciones.filter(l => l.status === 'contactada').length,
        sinCalificar: cotizaciones.filter(l => l.status === 'nueva').length
      })
    }

    // Obtener mis casos asignados
    const { data: casos } = await supabase
      .from('casos')
      .select(`
        id, folio, empresa_nombre, tipo_caso, monto_estimado, status, estado, ciudad, created_at,
        profiles!casos_worker_id_fkey(full_name, phone)
      `)
      .eq('lawyer_id', user.id)
      .order('created_at', { ascending: false })

    if (casos) {
      setMisCasos(casos.map(c => ({
        ...c,
        trabajador: c.profiles ? {
          full_name: c.profiles.full_name,
          phone: c.profiles.phone
        } : undefined
      })))
    }

    setLoading(false)
  }, [router])

  function handleSwipeLeft() {
    setSwipeDirection('left')
    setTimeout(() => {
      setCurrentLeadIndex(prev => (prev + 1) % leads.length)
      setSwipeDirection(null)
    }, 300)
  }

  function handleSwipeRight(lead: Lead) {
    setUnlockingLead(lead)
    setShowUnlockModal(true)
  }

  async function handleUnlockLead() {
    if (!unlockingLead) return
    
    setUnlocking(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Verificar creditos
    if (creditos < COSTO_DESBLOQUEO && userRole !== 'superadmin') {
      alert('No tienes suficientes creditos. Necesitas ' + COSTO_DESBLOQUEO + ' pesos.')
      setUnlocking(false)
      return
    }

    // Descontar creditos (excepto superadmin en modo prueba)
    if (userRole !== 'superadmin') {
      const { error: creditoError } = await supabase
        .from('creditos_leads')
        .update({ 
          saldo_actual: creditos - COSTO_DESBLOQUEO,
          total_gastado: (await supabase.from('creditos_leads').select('total_gastado').eq('user_id', user.id).single()).data?.total_gastado + COSTO_DESBLOQUEO
        })
        .eq('user_id', user.id)

      if (creditoError) {
        console.error('Error descontando creditos:', creditoError)
        setUnlocking(false)
        return
      }
    }

    // Crear caso y asignar automaticamente
    const folio = `MC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
    
    const { data: newCaso, error: casoError } = await supabase
      .from('casos')
      .insert({
        folio,
        worker_id: unlockingLead.user_id,
        lawyer_id: user.id,
        empresa_nombre: unlockingLead.empresa_nombre,
        tipo_caso: unlockingLead.motivo_separacion || 'despido_injustificado',
        monto_estimado: unlockingLead.indemnizacion_estimada,
        status: 'active',
        estado: unlockingLead.estado,
        ciudad: unlockingLead.estado,
        cotizacion_id: unlockingLead.id
      })
      .select()
      .single()

    if (casoError) {
      console.error('Error creando caso:', casoError)
      setUnlocking(false)
      return
    }

    // Actualizar cotizacion
    await supabase
      .from('cotizaciones')
      .update({ status: 'asignada' })
      .eq('id', unlockingLead.id)

    // Registrar transaccion
    await supabase
      .from('creditos_leads_transacciones')
      .insert({
        user_id: user.id,
        tipo: 'desbloqueo_lead',
        monto: -COSTO_DESBLOQUEO,
        descripcion: `Desbloqueo de lead: ${unlockingLead.empresa_nombre}`,
        caso_id: newCaso?.id
      })

    // Actualizar estado local
    setCreditos(prev => prev - COSTO_DESBLOQUEO)
    setLeads(prev => prev.filter(l => l.id !== unlockingLead.id))
    setShowUnlockModal(false)
    setUnlockingLead(null)
    setUnlocking(false)
    
    // Recargar mis casos
    loadData()
    setActiveTab('miscasos')
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  function formatAntiguedad(meses: number) {
    const anos = Math.floor(meses / 12)
    const mesesRestantes = meses % 12
    if (anos === 0) return `${mesesRestantes} meses`
    if (mesesRestantes === 0) return `${anos} ${anos === 1 ? 'ano' : 'anos'}`
    return `${anos} ${anos === 1 ? 'ano' : 'anos'}, ${mesesRestantes} meses`
  }

  const misCasosFiltrados = misCasos.filter(caso => {
    if (filtroEstado !== 'todos' && caso.estado !== filtroEstado) return false
    if (filtroStatus !== 'todos' && caso.status !== filtroStatus) return false
    if (busqueda) {
      const search = busqueda.toLowerCase()
      return caso.empresa_nombre?.toLowerCase().includes(search) || 
             caso.folio?.toLowerCase().includes(search) ||
             caso.trabajador?.full_name?.toLowerCase().includes(search)
    }
    return true
  })

  const estadosUnicos = [...new Set(misCasos.map(c => c.estado).filter(Boolean))]

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/abogado/dashboard" className="p-2 hover:bg-muted rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-bold text-lg">Leads</h1>
                <p className="text-xs text-muted-foreground">Encuentra tu proximo caso</p>
              </div>
            </div>
            
            {/* Creditos */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-full">
              <Coins className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-amber-700">{creditos}</span>
              <span className="text-xs text-amber-600">MXN</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 opacity-80" />
                <span className="text-xs opacity-80">Cerca de ti</span>
              </div>
              <div className="text-2xl font-bold">{stats.cercaDeTi}</div>
              <div className="text-xs opacity-70">{userEstado || 'Tu estado'}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 opacity-80" />
                <span className="text-xs opacity-80">Disponibles</span>
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs opacity-70">{stats.calificados} calificados</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="explorar" className="gap-2">
              <Heart className="w-4 h-4" />
              Explorar
            </TabsTrigger>
            <TabsTrigger value="miscasos" className="gap-2">
              <Briefcase className="w-4 h-4" />
              Mis Casos ({misCasos.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab Explorar - Modo Tinder */}
          <TabsContent value="explorar" className="mt-0">
            {leads.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <h3 className="font-semibold text-slate-600">No hay leads disponibles</h3>
                  <p className="text-sm text-slate-400 mt-2">
                    Los nuevos casos apareceran aqui
                  </p>
                </CardContent>
              </Card>
            ) : currentLead ? (
              <div className="relative">
                {/* Card Principal - Estilo Tinder */}
                <Card 
                  className={`bg-white shadow-xl transition-all duration-300 ${
                    swipeDirection === 'left' ? '-translate-x-full opacity-0 rotate-[-20deg]' :
                    swipeDirection === 'right' ? 'translate-x-full opacity-0 rotate-[20deg]' : ''
                  }`}
                >
                  <CardContent className="p-0">
                    {/* Header con empresa */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className="bg-white/20 text-white mb-2">
                            {currentLead.status === 'contactada' ? 'Calificado' : 'Nuevo'}
                          </Badge>
                          <h2 className="text-xl font-bold">{currentLead.empresa_nombre || 'Empresa no especificada'}</h2>
                          <div className="flex items-center gap-2 mt-1 text-slate-300 text-sm">
                            <MapPin className="w-4 h-4" />
                            {currentLead.estado || 'Mexico'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-emerald-400">
                            {formatCurrency(currentLead.indemnizacion_estimada || 0)}
                          </div>
                          <div className="text-xs text-slate-400">Estimado</div>
                        </div>
                      </div>
                    </div>

                    {/* Detalles visibles */}
                    <div className="p-6 space-y-4">
                      {/* Antiguedad - Visible */}
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="text-xs text-blue-600 font-medium">Antiguedad</div>
                          <div className="font-semibold text-slate-800">
                            {formatAntiguedad(currentLead.antiguedad_meses || 0)}
                          </div>
                        </div>
                      </div>

                      {/* Motivo - Parcialmente visible */}
                      <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                        <Briefcase className="w-5 h-5 text-amber-600" />
                        <div>
                          <div className="text-xs text-amber-600 font-medium">Motivo</div>
                          <div className="font-semibold text-slate-800">
                            {currentLead.motivo_separacion || 'Despido'}
                          </div>
                        </div>
                      </div>

                      {/* Datos bloqueados */}
                      <div className="relative p-4 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
                        <div className="absolute inset-0 backdrop-blur-sm bg-white/60 rounded-lg flex flex-col items-center justify-center">
                          <Lock className="w-8 h-8 text-slate-400 mb-2" />
                          <span className="text-sm font-medium text-slate-500">Informacion bloqueada</span>
                          <span className="text-xs text-slate-400">Desbloquea por ${COSTO_DESBLOQUEO} MXN</span>
                        </div>
                        <div className="space-y-2 opacity-30 select-none">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>**** **** ****</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span>** ** ** ** **</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>**/**/****</span>
                          </div>
                        </div>
                      </div>

                      {/* Contador */}
                      <div className="text-center text-xs text-slate-400">
                        {currentLeadIndex + 1} de {leads.length} leads disponibles
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Botones de accion */}
                <div className="flex items-center justify-center gap-6 mt-6">
                  <button
                    onClick={handleSwipeLeft}
                    className="w-16 h-16 rounded-full bg-white shadow-lg border-2 border-slate-200 flex items-center justify-center hover:border-red-400 hover:bg-red-50 transition-all active:scale-95"
                  >
                    <X className="w-8 h-8 text-slate-400 hover:text-red-500" />
                  </button>
                  
                  <button
                    onClick={() => handleSwipeRight(currentLead)}
                    className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg flex items-center justify-center hover:from-emerald-600 hover:to-teal-600 transition-all active:scale-95"
                  >
                    <div className="text-center text-white">
                      <Eye className="w-7 h-7 mx-auto" />
                      <span className="text-[10px] font-medium">${COSTO_DESBLOQUEO}</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={handleSwipeLeft}
                    className="w-16 h-16 rounded-full bg-white shadow-lg border-2 border-slate-200 flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-all active:scale-95"
                  >
                    <ChevronRight className="w-8 h-8 text-slate-400 hover:text-blue-500" />
                  </button>
                </div>

                <p className="text-center text-xs text-slate-400 mt-4">
                  Desliza o presiona para pasar / Desbloquea para ver datos de contacto
                </p>
              </div>
            ) : null}
          </TabsContent>

          {/* Tab Mis Casos */}
          <TabsContent value="miscasos" className="mt-0 space-y-4">
            {/* Filtros */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar caso..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 bg-white">
                    <Filter className="w-4 h-4" />
                    Filtros
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-xs font-medium text-slate-500">Estado</div>
                  <DropdownMenuItem onClick={() => setFiltroEstado('todos')}>
                    Todos los estados
                  </DropdownMenuItem>
                  {estadosUnicos.map(estado => (
                    <DropdownMenuItem key={estado} onClick={() => setFiltroEstado(estado)}>
                      {estado}
                    </DropdownMenuItem>
                  ))}
                  <div className="border-t my-1" />
                  <div className="px-2 py-1.5 text-xs font-medium text-slate-500">Status</div>
                  <DropdownMenuItem onClick={() => setFiltroStatus('todos')}>Todos</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFiltroStatus('active')}>Activos</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFiltroStatus('conciliacion')}>Conciliacion</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFiltroStatus('juicio')}>Juicio</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Lista de casos */}
            {misCasosFiltrados.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="p-8 text-center">
                  <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <h3 className="font-medium text-slate-600">Sin casos asignados</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Desbloquea leads para ver tus casos aqui
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {misCasosFiltrados.map((caso) => (
                  <Link key={caso.id} href={`/caso/${caso.id}`}>
                    <Card className="bg-white hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {caso.folio}
                              </Badge>
                              <Badge className={
                                caso.status === 'active' ? 'bg-green-100 text-green-700' :
                                caso.status === 'conciliacion' ? 'bg-amber-100 text-amber-700' :
                                caso.status === 'juicio' ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-700'
                              }>
                                {caso.status === 'active' ? 'Activo' :
                                 caso.status === 'conciliacion' ? 'Conciliacion' :
                                 caso.status === 'juicio' ? 'Juicio' : caso.status}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-slate-800">{caso.empresa_nombre}</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />
                                {caso.trabajador?.full_name || 'Cliente'}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {caso.estado}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-emerald-600">
                              {formatCurrency(caso.monto_estimado || 0)}
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 ml-auto mt-1" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Modal de Desbloqueo */}
      {showUnlockModal && unlockingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm bg-white">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Desbloquear Lead</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Obtendras acceso completo a los datos de contacto y el caso se asignara automaticamente a ti.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600">Empresa</span>
                  <span className="font-semibold">{unlockingLead.empresa_nombre}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600">Estimado</span>
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(unlockingLead.indemnizacion_estimada)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-slate-600 font-medium">Costo</span>
                  <span className="font-bold text-lg">${COSTO_DESBLOQUEO} MXN</span>
                </div>
              </div>

              {userRole === 'superadmin' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-center">
                  <span className="text-sm text-green-700">Modo SuperAdmin: Sin costo</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    setShowUnlockModal(false)
                    setUnlockingLead(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  onClick={handleUnlockLead}
                  disabled={unlocking || (creditos < COSTO_DESBLOQUEO && userRole !== 'superadmin')}
                >
                  {unlocking ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Desbloquear
                    </>
                  )}
                </Button>
              </div>

              {creditos < COSTO_DESBLOQUEO && userRole !== 'superadmin' && (
                <p className="text-center text-xs text-red-500 mt-3">
                  Creditos insuficientes. Tienes ${creditos} MXN
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
