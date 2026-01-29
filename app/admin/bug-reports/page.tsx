'use client'

import { useState, useEffect } from 'react'
import { 
  Bug, CheckCircle, Clock, AlertTriangle, XCircle, 
  Gift, ExternalLink, MessageSquare, Filter, RefreshCw,
  ChevronDown, ChevronUp, Eye, Award, Inbox
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { 
  obtenerTodosReportes, 
  actualizarReporte,
  type BugReport 
} from '@/app/bug-report/actions'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-500', icon: Clock },
  en_revision: { label: 'En revision', color: 'bg-blue-500', icon: Eye },
  resuelto: { label: 'Resuelto', color: 'bg-green-500', icon: CheckCircle },
  rechazado: { label: 'Rechazado', color: 'bg-red-500', icon: XCircle },
}

const PRIORIDAD_CONFIG = {
  baja: { label: 'Baja', color: 'text-gray-600 bg-gray-100' },
  media: { label: 'Media', color: 'text-yellow-700 bg-yellow-100' },
  alta: { label: 'Alta', color: 'text-orange-700 bg-orange-100' },
  critica: { label: 'Critica', color: 'text-red-700 bg-red-100' },
}

const CATEGORIA_CONFIG = {
  ui: { label: 'Interfaz', color: 'bg-purple-100 text-purple-700' },
  funcionalidad: { label: 'Funcionalidad', color: 'bg-blue-100 text-blue-700' },
  rendimiento: { label: 'Rendimiento', color: 'bg-orange-100 text-orange-700' },
  otro: { label: 'Otro', color: 'bg-gray-100 text-gray-700' },
}

export default function BugReportsDashboard() {
  const [reportes, setReportes] = useState<BugReport[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    en_revision: 0,
    resueltos: 0,
    creditos_otorgados: 0
  })
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    status: 'todos',
    categoria: 'todas',
    prioridad: 'todas'
  })
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [respuesta, setRespuesta] = useState('')
  const [updating, setUpdating] = useState(false)

  const cargarReportes = async () => {
    setLoading(true)
    const result = await obtenerTodosReportes(filtros)
    if (result.success) {
      setReportes(result.reportes || [])
      if (result.stats) setStats(result.stats)
    }
    setLoading(false)
  }

  useEffect(() => {
    cargarReportes()
  }, [filtros])

  const handleUpdateStatus = async (reporteId: string, status: string) => {
    setUpdating(true)
    await actualizarReporte(reporteId, { 
      status: status as 'pendiente' | 'en_revision' | 'resuelto' | 'rechazado' 
    })
    await cargarReportes()
    setUpdating(false)
  }

  const handleOtorgarCredito = async (reporteId: string) => {
    setUpdating(true)
    await actualizarReporte(reporteId, { otorgar_credito: true })
    await cargarReportes()
    setUpdating(false)
  }

  const handleResponder = async () => {
    if (!selectedReport || !respuesta.trim()) return
    setUpdating(true)
    await actualizarReporte(selectedReport.id, { 
      respuesta_admin: respuesta,
      status: 'resuelto'
    })
    setSelectedReport(null)
    setRespuesta('')
    await cargarReportes()
    setUpdating(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bug className="h-6 w-6 text-amber-500" />
              Centro de Reportes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona los reportes de bugs de los usuarios
            </p>
          </div>
          <Button onClick={cargarReportes} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Actualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Inbox className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">En revision</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.en_revision}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Resueltos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resueltos}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Creditos dados</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.creditos_otorgados}</p>
                </div>
                <Award className="h-8 w-8 text-amber-500/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtros:</span>
              </div>
              <Select
                value={filtros.status}
                onValueChange={(v) => setFiltros(f => ({ ...f, status: v }))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                  <SelectItem value="en_revision">En revision</SelectItem>
                  <SelectItem value="resuelto">Resueltos</SelectItem>
                  <SelectItem value="rechazado">Rechazados</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filtros.categoria}
                onValueChange={(v) => setFiltros(f => ({ ...f, categoria: v }))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="ui">Interfaz</SelectItem>
                  <SelectItem value="funcionalidad">Funcionalidad</SelectItem>
                  <SelectItem value="rendimiento">Rendimiento</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filtros.prioridad}
                onValueChange={(v) => setFiltros(f => ({ ...f, prioridad: v }))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="critica">Critica</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de reportes */}
        <div className="space-y-3">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Cargando reportes...</p>
              </CardContent>
            </Card>
          ) : reportes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Inbox className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground mt-2">No hay reportes</p>
              </CardContent>
            </Card>
          ) : (
            reportes.map((reporte) => {
              const statusConfig = STATUS_CONFIG[reporte.status]
              const StatusIcon = statusConfig.icon
              const isExpanded = expandedId === reporte.id

              return (
                <Card key={reporte.id} className="overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : reporte.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                        statusConfig.color
                      )} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium text-foreground truncate">
                              {reporte.titulo}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {reporte.user_email || 'Usuario desconocido'} - {' '}
                              {new Date(reporte.created_at).toLocaleDateString('es-MX', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className={CATEGORIA_CONFIG[reporte.categoria].color}>
                              {CATEGORIA_CONFIG[reporte.categoria].label}
                            </Badge>
                            <Badge variant="outline" className={PRIORIDAD_CONFIG[reporte.prioridad].color}>
                              {PRIORIDAD_CONFIG[reporte.prioridad].label}
                            </Badge>
                            {reporte.credito_otorgado && (
                              <Badge className="bg-amber-100 text-amber-700">
                                <Gift className="h-3 w-3 mr-1" />
                                +1
                              </Badge>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t bg-muted/30 p-4 space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Descripcion</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {reporte.descripcion}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ExternalLink className="h-3 w-3" />
                        <code className="bg-muted px-2 py-0.5 rounded">{reporte.pagina_url}</code>
                      </div>

                      {reporte.screenshot_url && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Screenshot</p>
                          <img 
                            src={reporte.screenshot_url || "/placeholder.svg"} 
                            alt="Screenshot del bug"
                            className="rounded-lg border max-w-md"
                          />
                        </div>
                      )}

                      {reporte.respuesta_admin && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs font-medium text-blue-700 mb-1">Respuesta del admin</p>
                          <p className="text-sm text-blue-900">{reporte.respuesta_admin}</p>
                        </div>
                      )}

                      {/* Acciones */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Select
                          value={reporte.status}
                          onValueChange={(v) => handleUpdateStatus(reporte.id, v)}
                          disabled={updating}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendiente">Pendiente</SelectItem>
                            <SelectItem value="en_revision">En revision</SelectItem>
                            <SelectItem value="resuelto">Resuelto</SelectItem>
                            <SelectItem value="rechazado">Rechazado</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          value={reporte.prioridad}
                          onValueChange={(v) => actualizarReporte(reporte.id, { 
                            prioridad: v as 'baja' | 'media' | 'alta' | 'critica'
                          }).then(() => cargarReportes())}
                          disabled={updating}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baja">Baja</SelectItem>
                            <SelectItem value="media">Media</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="critica">Critica</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(reporte)
                            setRespuesta(reporte.respuesta_admin || '')
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Responder
                        </Button>

                        {!reporte.credito_otorgado && (
                          <Button
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600"
                            onClick={() => handleOtorgarCredito(reporte.id)}
                            disabled={updating}
                          >
                            <Gift className="h-4 w-4 mr-1" />
                            Dar credito
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* Dialog responder */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder al reporte</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-3">
              <p className="font-medium text-sm">{selectedReport?.titulo}</p>
              <p className="text-xs text-muted-foreground mt-1">{selectedReport?.descripcion}</p>
            </div>
            <Textarea
              placeholder="Escribe tu respuesta..."
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReport(null)}>
              Cancelar
            </Button>
            <Button onClick={handleResponder} disabled={updating || !respuesta.trim()}>
              {updating ? 'Enviando...' : 'Enviar y resolver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
