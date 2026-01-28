'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Briefcase, 
  Search, 
  MessageCircle,
  Calendar,
  ChevronRight,
  Building2,
  Clock,
  Scale,
  ArrowLeft,
  User,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Bell,
  Archive,
  ArchiveRestore,
  Timer,
  Users,
  CheckCircle2,
  Gavel,
  FileCheck,
  FolderOpen,
  Loader2
} from 'lucide-react'
import { 
  obtenerMisCasos, 
  obtenerEstadisticasCasos,
  archivarCaso,
  categoriaLabels,
  categoriaColors,
  formatCurrency,
  formatDate,
  calcularDiasPrescripcion,
  calcularPorcentajeOferta,
  type Caso
} from './actions'
import { AyudaUrgenteButton } from '@/components/ayuda-urgente-button'

// Iconos por categoria
const categoriaIcons: Record<string, typeof Briefcase> = {
  nuevo: FolderOpen,
  por_preaprobar: FileCheck,
  asignado: User,
  conciliacion: Scale,
  juicio: Gavel,
  concluido: CheckCircle2,
  referido: Users,
  archivado: Archive
}

export default function CasosPage() {
  const [casos, setCasos] = useState<Caso[]>([])
  const [stats, setStats] = useState<{
    total: number
    activos: number
    resueltos: number
    montoTotalEstimado: number
    montoTotalOfertas: number
    porCategoria: Record<string, number>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState('todos')
  const [archivando, setArchivando] = useState<string | null>(null)

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    
    const [casosRes, statsRes] = await Promise.all([
      obtenerMisCasos({ 
        busqueda,
        incluirArchivados: categoriaActiva === 'archivado'
      }),
      obtenerEstadisticasCasos()
    ])
    
    if (casosRes.data) setCasos(casosRes.data)
    if (statsRes.data) setStats(statsRes.data)
    
    setLoading(false)
  }, [busqueda, categoriaActiva])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const handleArchivar = async (casoId: string, archivar: boolean) => {
    setArchivando(casoId)
    await archivarCaso(casoId, archivar)
    await cargarDatos()
    setArchivando(null)
  }

  // Filtrar casos por categoria
  const casosFiltrados = casos.filter(caso => {
    if (categoriaActiva === 'todos') return !caso.archivado
    if (categoriaActiva === 'archivado') return caso.archivado
    if (categoriaActiva === 'referido') return caso.es_referido && !caso.archivado
    return caso.categoria === categoriaActiva && !caso.archivado
  })

  // Contar casos por categoria
  const contarPorCategoria = (cat: string): number => {
    if (cat === 'todos') return casos.filter(c => !c.archivado).length
    if (cat === 'archivado') return casos.filter(c => c.archivado).length
    if (cat === 'referido') return casos.filter(c => c.es_referido && !c.archivado).length
    return casos.filter(c => c.categoria === cat && !c.archivado).length
  }

  // Categorias para filtros
  const categorias = [
    { key: 'todos', label: 'Todos', icon: Briefcase },
    { key: 'nuevo', label: 'Nuevos', icon: FolderOpen },
    { key: 'por_preaprobar', label: 'Por Preaprobar', icon: FileCheck },
    { key: 'asignado', label: 'Asignados', icon: User },
    { key: 'conciliacion', label: 'Conciliacion', icon: Scale },
    { key: 'juicio', label: 'En Juicio', icon: Gavel },
    { key: 'concluido', label: 'Concluidos', icon: CheckCircle2 },
    { key: 'referido', label: 'Referidos', icon: Users },
    { key: 'archivado', label: 'Archivados', icon: Archive }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/dashboard" className="p-1.5 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm sm:text-base">Mis Casos</span>
            </div>
          </div>
          <AyudaUrgenteButton />
        </div>
      </header>

      <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
              <CardContent className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-blue-700">{stats.total}</div>
                <div className="text-xs text-blue-600">Total Casos</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
              <CardContent className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-orange-700">{stats.activos}</div>
                <div className="text-xs text-orange-600">Activos</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
              <CardContent className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-green-700">{stats.resueltos}</div>
                <div className="text-xs text-green-600">Resueltos</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
              <CardContent className="p-3 sm:p-4">
                <div className="text-sm sm:text-lg font-bold text-purple-700 truncate">
                  {formatCurrency(stats.montoTotalEstimado)}
                </div>
                <div className="text-xs text-purple-600">Monto Total</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por empresa o folio..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
          {categorias.map((cat) => {
            const count = contarPorCategoria(cat.key)
            const CatIcon = cat.icon
            const isActive = categoriaActiva === cat.key
            
            return (
              <Button
                key={cat.key}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoriaActiva(cat.key)}
                className={`h-8 text-xs whitespace-nowrap gap-1.5 ${!isActive ? 'bg-transparent' : ''}`}
              >
                <CatIcon className="w-3.5 h-3.5" />
                {cat.label}
                {count > 0 && (
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20' : 'bg-muted'
                  }`}>
                    {count}
                  </span>
                )}
              </Button>
            )
          })}
        </div>

        {/* Cases List */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-5 bg-muted rounded w-3/4 mb-3" />
                  <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/4" />
                </CardContent>
              </Card>
            ))
          ) : casosFiltrados.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  {categoriaActiva === 'archivado' ? (
                    <Archive className="w-8 h-8 text-muted-foreground" />
                  ) : (
                    <Briefcase className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="font-semibold text-lg mb-2">
                  {categoriaActiva === 'archivado' 
                    ? 'No hay casos archivados' 
                    : `No hay casos en "${categoriaLabels[categoriaActiva] || 'esta categoria'}"`}
                </h3>
                <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">
                  {categoriaActiva === 'todos' 
                    ? 'Calcula tu liquidacion para iniciar un caso'
                    : 'Los casos apareceran aqui cuando cambien de estado'}
                </p>
                {categoriaActiva === 'todos' && (
                  <Button asChild>
                    <Link href="/calculadora">Ir a Calculadora</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            casosFiltrados.map((caso) => {
              const diasPrescripcion = calcularDiasPrescripcion(caso.fecha_limite_prescripcion)
              const porcentajeOferta = calcularPorcentajeOferta(caso.oferta_empresa, caso.monto_estimado)
              const prescripcionUrgente = diasPrescripcion !== null && diasPrescripcion <= 15
              const prescripcionCritica = diasPrescripcion !== null && diasPrescripcion <= 7
              const CatIcon = categoriaIcons[caso.categoria] || Briefcase
              
              return (
                <Card 
                  key={caso.id} 
                  className={`hover:shadow-md transition-all group ${
                    prescripcionCritica ? 'border-l-4 border-l-red-500' :
                    prescripcionUrgente ? 'border-l-4 border-l-amber-500' : ''
                  } ${caso.archivado ? 'opacity-75' : ''}`}
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge className={categoriaColors[caso.categoria] || 'bg-gray-100'}>
                            <CatIcon className="w-3 h-3 mr-1" />
                            {categoriaLabels[caso.categoria] || caso.categoria}
                          </Badge>
                          
                          {/* Alertas importantes */}
                          {caso.unread_messages && caso.unread_messages > 0 && (
                            <Badge variant="destructive" className="gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {caso.unread_messages}
                            </Badge>
                          )}
                          {caso.next_event && (
                            <Badge className="bg-blue-100 text-blue-700 gap-1">
                              <Bell className="w-3 h-3" />
                            </Badge>
                          )}
                          {caso.fecha_proxima_audiencia && (
                            <Badge className="bg-purple-100 text-purple-700 gap-1">
                              <Calendar className="w-3 h-3" />
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-base flex items-center gap-2 mt-2">
                          <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{caso.empresa_nombre}</span>
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Folio: <span className="font-mono">{caso.folio}</span>
                          {caso.ciudad && ` | ${caso.ciudad}, ${caso.estado}`}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {/* Boton Archivar/Desarchivar */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.preventDefault()
                            handleArchivar(caso.id, !caso.archivado)
                          }}
                          disabled={archivando === caso.id}
                        >
                          {archivando === caso.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : caso.archivado ? (
                            <ArchiveRestore className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Archive className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        
                        <Link href={`/caso/${caso.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-3 border-y border-dashed">
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Estimado
                        </p>
                        <p className="font-semibold text-sm text-primary">
                          {formatCurrency(caso.monto_estimado)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Oferta
                        </p>
                        <p className={`font-semibold text-sm ${caso.oferta_empresa ? 'text-orange-600' : 'text-muted-foreground'}`}>
                          {caso.oferta_empresa ? formatCurrency(caso.oferta_empresa) : 'Sin oferta'}
                        </p>
                        {porcentajeOferta && (
                          <p className="text-[10px] text-muted-foreground">
                            {porcentajeOferta}% del estimado
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Abogado
                        </p>
                        <p className="font-medium text-sm truncate">
                          {caso.abogado?.full_name || 'Por asignar'}
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          Prescripcion ({caso.tipo_caso === 'rescision' ? '30d' : '60d'})
                        </p>
                        <div className={`font-bold text-sm flex items-center gap-1 ${
                          prescripcionCritica ? 'text-red-600' :
                          prescripcionUrgente ? 'text-amber-600' :
                          diasPrescripcion !== null && diasPrescripcion <= 30 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {diasPrescripcion !== null ? (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              {diasPrescripcion > 0 ? `${diasPrescripcion} dias restantes` : 'Prescrito'}
                              {prescripcionCritica && <AlertTriangle className="w-3.5 h-3.5 ml-1" />}
                            </>
                          ) : (
                            <span className="text-muted-foreground font-normal">N/A</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Alerts Footer */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {caso.fecha_proxima_audiencia && (
                        <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                          <Calendar className="w-3 h-3" />
                          Audiencia: {formatDate(caso.fecha_proxima_audiencia)}
                        </div>
                      )}
                      {caso.oferta_empresa && caso.oferta_empresa_fecha && (
                        <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                          <AlertTriangle className="w-3 h-3" />
                          Nueva oferta
                        </div>
                      )}
                      {caso.notas_abogado && (
                        <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                          <Scale className="w-3 h-3" />
                          Nota del abogado
                        </div>
                      )}
                      {caso.es_referido && (
                        <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-cyan-100 text-cyan-700">
                          <Users className="w-3 h-3" />
                          Referido
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
