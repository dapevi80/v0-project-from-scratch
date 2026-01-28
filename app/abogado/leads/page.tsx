'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, Search, Filter, Users, Clock, CheckCircle2, 
  MapPin, Building2, Calendar, DollarSign, Phone, Mail,
  ChevronRight, AlertCircle, User, Briefcase
} from 'lucide-react'
import Link from 'next/link'

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

export default function LeadsDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [stats, setStats] = useState({
    total: 0,
    nuevos: 0,
    contactados: 0,
    calificados: 0
  })

  useEffect(() => {
    loadLeads()
  }, [])

  useEffect(() => {
    filterLeads()
  }, [search, statusFilter, leads])

  async function loadLeads() {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.replace('/acceso')
      return
    }

    // Verificar que es abogado
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'lawyer' && profile.role !== 'admin' && profile.role !== 'superadmin')) {
      router.replace('/dashboard')
      return
    }

    // Obtener leads/cotizaciones disponibles
    const { data: cotizaciones } = await supabase
      .from('cotizaciones')
      .select('*')
      .order('created_at', { ascending: false })

    if (cotizaciones) {
      setLeads(cotizaciones)
      setStats({
        total: cotizaciones.length,
        nuevos: cotizaciones.filter(l => l.status === 'nueva').length,
        contactados: cotizaciones.filter(l => l.status === 'contactada').length,
        calificados: cotizaciones.filter(l => l.status === 'en_proceso' || l.status === 'completada').length
      })
    }

    setLoading(false)
  }

  function filterLeads() {
    let filtered = [...leads]

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(l => 
        l.nombre_trabajador.toLowerCase().includes(searchLower) ||
        (l.empresa_nombre && l.empresa_nombre.toLowerCase().includes(searchLower)) ||
        (l.estado && l.estado.toLowerCase().includes(searchLower))
      )
    }

    if (statusFilter !== 'all') {
      const statusMap: Record<string, string> = {
        'pending': 'nueva',
        'contacted': 'contactada',
        'qualified': 'en_proceso'
      }
      filtered = filtered.filter(l => l.status === statusMap[statusFilter])
    }

    setFilteredLeads(filtered)
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'nueva':
        return <Badge className="bg-amber-100 text-amber-700">Nuevo</Badge>
      case 'contactada':
        return <Badge className="bg-blue-100 text-blue-700">Contactado</Badge>
      case 'en_proceso':
        return <Badge className="bg-green-100 text-green-700">En Proceso</Badge>
      case 'completada':
        return <Badge className="bg-purple-100 text-purple-700">Completada</Badge>
      case 'descartada':
        return <Badge className="bg-red-100 text-red-700">Descartada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/abogado/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-semibold text-lg">Leads Disponibles</h1>
              <p className="text-xs text-slate-500">Casos listos para asignar</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
              <div className="text-xs text-slate-500">Total Leads</div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-700">{stats.nuevos}</div>
              <div className="text-xs text-amber-600">Nuevos</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{stats.contactados}</div>
              <div className="text-xs text-blue-600">Contactados</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{stats.calificados}</div>
              <div className="text-xs text-green-600">Calificados</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre, empresa o estado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'pending', 'contacted', 'qualified'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={statusFilter === status ? '' : 'bg-white'}
              >
                {status === 'all' ? 'Todos' : 
                 status === 'pending' ? 'Nuevos' :
                 status === 'contacted' ? 'Contactados' : 'Calificados'}
              </Button>
            ))}
          </div>
        </div>

        {/* Leads List */}
        <div className="space-y-3">
          {filteredLeads.length === 0 ? (
            <Card className="bg-white">
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-medium text-slate-600">No hay leads disponibles</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {search || statusFilter !== 'all' 
                    ? 'Intenta con otros filtros' 
                    : 'Los nuevos leads apareceran aqui'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredLeads.map((lead) => (
              <Card key={lead.id} className="bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-800">{lead.nombre_trabajador}</h3>
                            {getStatusBadge(lead.status)}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5" />
                              {lead.empresa_nombre || 'Sin empresa'}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {lead.estado || 'Sin estado'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(lead.indemnizacion_estimada)}
                          </div>
                          <div className="text-xs text-slate-400">Indemnizacion est.</div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-slate-400 text-xs">Puesto</div>
                          <div className="text-slate-700">{lead.puesto || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs">Salario</div>
                          <div className="text-slate-700">{lead.salario_mensual ? formatCurrency(lead.salario_mensual) + '/mes' : 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs">Antiguedad</div>
                          <div className="text-slate-700">
                            {lead.antiguedad_meses ? `${Math.floor(lead.antiguedad_meses / 12)} años ${lead.antiguedad_meses % 12} meses` : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs">Motivo</div>
                          <div className="text-slate-700 truncate">{lead.motivo_separacion || 'Sin especificar'}</div>
                        </div>
                      </div>

                      {/* Contact & Actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          {lead.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" />
                              {lead.telefono}
                            </span>
                          )}
                          {lead.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5" />
                              {lead.email}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(lead.created_at)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="bg-transparent">
                            Ver Detalles
                          </Button>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            Tomar Caso
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
