'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft,
  Briefcase,
  MessageCircle,
  Calendar,
  FileText,
  Send,
  Building2,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Scale,
  Plus,
  Paperclip,
  User,
  Bot,
  CalendarPlus,
  MapPin,
  Bell,
  ChevronRight,
  ExternalLink,
  MoreVertical
} from 'lucide-react'
import { 
  obtenerCaso, 
  obtenerMensajes, 
  obtenerEventos, 
  obtenerDocumentosCaso,
  enviarMensaje,
  marcarMensajesLeidos,
  type Case, 
  type CaseMessage, 
  type CaseEvent,
  type CaseDocument,
  type CaseStatus
} from '@/app/casos/actions'
import { AyudaUrgenteButton } from '@/components/ayuda-urgente-button'

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Borrador', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  open: { label: 'Abierto', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  assigned: { label: 'Asignado', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  in_progress: { label: 'En Progreso', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  conciliation: { label: 'Conciliacion', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  litigation: { label: 'En Juicio', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  resolved: { label: 'Resuelto', color: 'text-green-700', bgColor: 'bg-green-100' },
  closed: { label: 'Cerrado', color: 'text-gray-500', bgColor: 'bg-gray-100' }
}

const eventTypeConfig: Record<string, { label: string; color: string; icon: typeof Scale }> = {
  audiencia: { label: 'Audiencia', color: 'bg-red-100 text-red-700', icon: Scale },
  cita: { label: 'Cita', color: 'bg-blue-100 text-blue-700', icon: Calendar },
  deadline: { label: 'Vencimiento', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  recordatorio: { label: 'Recordatorio', color: 'bg-purple-100 text-purple-700', icon: Bell },
  otro: { label: 'Otro', color: 'bg-gray-100 text-gray-700', icon: Calendar }
}

export default function CasoDetailPage() {
  const params = useParams()
  const casoId = params.id as string
  
  const [caso, setCaso] = useState<Case | null>(null)
  const [mensajes, setMensajes] = useState<CaseMessage[]>([])
  const [eventos, setEventos] = useState<CaseEvent[]>([])
  const [documentos, setDocumentos] = useState<CaseDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('resumen')
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    cargarDatos()
  }, [casoId])

  useEffect(() => {
    if (activeTab === 'chat') {
      marcarMensajesLeidos(casoId)
      scrollToBottom()
    }
  }, [activeTab, mensajes])

  const cargarDatos = async () => {
    setLoading(true)
    const [casoRes, mensajesRes, eventosRes, docsRes] = await Promise.all([
      obtenerCaso(casoId),
      obtenerMensajes(casoId),
      obtenerEventos(casoId),
      obtenerDocumentosCaso(casoId)
    ])
    
    if (casoRes.data) setCaso(casoRes.data)
    if (mensajesRes.data) setMensajes(mensajesRes.data)
    if (eventosRes.data) setEventos(eventosRes.data)
    if (docsRes.data) setDocumentos(docsRes.data)
    setLoading(false)
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleEnviarMensaje = async () => {
    if (!nuevoMensaje.trim() || enviando) return
    
    setEnviando(true)
    const res = await enviarMensaje(casoId, nuevoMensaje.trim())
    if (res.data) {
      setMensajes(prev => [...prev, res.data!])
      setNuevoMensaje('')
      scrollToBottom()
    }
    setEnviando(false)
  }

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto)
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatHora = (hora: string) => {
    return hora.slice(0, 5)
  }

  const formatMensajeFecha = (fecha: string) => {
    const date = new Date(fecha)
    const hoy = new Date()
    const ayer = new Date(hoy)
    ayer.setDate(ayer.getDate() - 1)
    
    if (date.toDateString() === hoy.toDateString()) {
      return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    } else if (date.toDateString() === ayer.toDateString()) {
      return `Ayer ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`
    }
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-50">
          <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-3">
            <div className="h-6 bg-muted rounded w-32 animate-pulse" />
          </div>
        </header>
        <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-6">
          <div className="space-y-4">
            <div className="h-32 bg-muted rounded animate-pulse" />
            <div className="h-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!caso) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Caso no encontrado</h2>
            <p className="text-muted-foreground text-sm mb-4">
              El caso que buscas no existe o no tienes acceso a el.
            </p>
            <Button asChild>
              <Link href="/casos">Ver mis casos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = statusConfig[caso.status] || { label: caso.status, color: 'text-gray-700', bgColor: 'bg-gray-100' }
  const proximosEventos = eventos.filter(e => new Date(e.starts_at) >= new Date())

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/casos" className="p-1.5 hover:bg-muted rounded-lg transition-colors flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="font-semibold text-sm sm:text-base truncate">{caso.folio}</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground truncate">{caso.empresa_nombre}</span>
                <Badge className={`text-xs ${status.bgColor} ${status.color} border-0`}>
                  {status.label}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="w-4 h-4" />
            </Button>
            <AyudaUrgenteButton />
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b bg-card">
          <div className="container max-w-4xl mx-auto px-3 sm:px-4">
            <TabsList className="h-12 w-full justify-start gap-0 bg-transparent p-0 rounded-none">
              <TabsTrigger 
                value="resumen" 
                className="h-12 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Resumen</span>
              </TabsTrigger>
              <TabsTrigger 
                value="chat" 
                className="h-12 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent relative"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Chat</span>
                {mensajes.filter(m => !m.read_by_worker_at && m.sender_role !== 'worker').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {mensajes.filter(m => !m.read_by_worker_at && m.sender_role !== 'worker').length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="calendario" 
                className="h-12 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent relative"
              >
                <Calendar className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Calendario</span>
                {proximosEventos.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                    {proximosEventos.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="documentos" 
                className="h-12 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <FileText className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Documentos</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Tab Contents */}
        <TabsContent value="resumen" className="flex-1 m-0">
          <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs">Monto reclamado</span>
                  </div>
                  <p className="text-lg font-bold">
                    {caso.monto_estimado ? formatMonto(caso.monto_estimado) : 'Por definir'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Fecha de despido</span>
                  </div>
                  <p className="text-lg font-bold">
                    {caso.fecha_despido ? formatFecha(caso.fecha_despido) : 'No especificada'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Descripcion */}
            {caso.descripcion && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Descripcion del caso</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{caso.descripcion}</p>
                </CardContent>
              </Card>
            )}

            {/* Proximos eventos */}
            {proximosEventos.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    Proximos eventos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {proximosEventos.slice(0, 3).map((evento) => {
                    const config = eventTypeConfig[evento.event_type] || eventTypeConfig.otro
                    const EventIcon = config.icon
                    return (
                      <div key={evento.id} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                        <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center`}>
                          <EventIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{evento.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFecha(evento.starts_at)}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-3 flex-col gap-1 bg-transparent" onClick={() => setActiveTab('chat')}>
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs">Enviar mensaje</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col gap-1 bg-transparent" onClick={() => setActiveTab('documentos')}>
                <Paperclip className="w-5 h-5" />
                <span className="text-xs">Agregar documento</span>
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="flex-1 m-0 flex flex-col">
          {/* Messages container */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
            <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-3">
              {mensajes.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No hay mensajes aun</p>
                  <p className="text-muted-foreground text-xs">Inicia la conversacion con tu abogado</p>
                </div>
              ) : (
                mensajes.map((mensaje) => {
                  const isUser = mensaje.sender_role === 'worker'
                  const isSystem = mensaje.sender_role === 'system'
                  
                  if (isSystem) {
                    return (
                      <div key={mensaje.id} className="flex justify-center">
                        <div className="bg-muted px-3 py-1.5 rounded-full">
                          <p className="text-xs text-muted-foreground">{mensaje.body}</p>
                        </div>
                      </div>
                    )
                  }
                  
                  return (
                    <div key={mensaje.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-end gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={`rounded-2xl px-4 py-2 ${
                          isUser 
                            ? 'bg-primary text-primary-foreground rounded-br-sm' 
                            : 'bg-muted rounded-bl-sm'
                        }`}>
                          <p className="text-sm">{mensaje.body}</p>
                          <p className={`text-xs mt-1 ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {formatMensajeFecha(mensaje.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={chatEndRef} />
            </div>
          </div>
          
          {/* Message input */}
          <div className="border-t bg-card p-3 sm:p-4">
            <div className="container max-w-4xl mx-auto">
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Textarea
                  placeholder="Escribe un mensaje..."
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleEnviarMensaje()
                    }
                  }}
                  className="min-h-[44px] max-h-32 resize-none"
                  rows={1}
                />
                <Button 
                  size="icon" 
                  className="h-10 w-10 flex-shrink-0"
                  onClick={handleEnviarMensaje}
                  disabled={!nuevoMensaje.trim() || enviando}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="calendario" className="flex-1 m-0">
          <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Eventos del caso</h2>
              <Button size="sm" className="gap-1.5">
                <CalendarPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Agregar</span>
              </Button>
            </div>

            {eventos.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No hay eventos programados</p>
                  <Button variant="outline" size="sm" className="mt-4 bg-transparent">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar primer evento
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {eventos.map((evento) => {
                  const config = eventTypeConfig[evento.event_type] || eventTypeConfig.otro
                  const EventIcon = config.icon
                  const isPast = new Date(evento.starts_at) < new Date()
                  
                  return (
                    <Card key={evento.id} className={`${isPast ? 'opacity-60' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center flex-shrink-0`}>
                            <EventIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-sm">{evento.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatFecha(evento.starts_at)}
                              {evento.ends_at && (
                                <span> a {formatFecha(evento.ends_at)}</span>
                              )}
                            </p>
                            {evento.location && (
                              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                {evento.location}
                              </div>
                            )}
                            {evento.description && (
                              <p className="text-xs text-muted-foreground mt-2">{evento.description}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documentos" className="flex-1 m-0">
          <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Documentos del caso</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild className="bg-transparent">
                  <Link href="/boveda">
                    <ExternalLink className="w-4 h-4 mr-1.5" />
                    Boveda
                  </Link>
                </Button>
                <Button size="sm" className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Agregar</span>
                </Button>
              </div>
            </div>

            {documentos.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm mb-1">No hay documentos adjuntos</p>
                  <p className="text-muted-foreground text-xs mb-4">
                    Vincula documentos desde tu Boveda de Evidencias
                  </p>
                  <Button variant="outline" size="sm" asChild className="bg-transparent">
                    <Link href="/boveda">
                      Ir a Boveda
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {documentos.map((doc) => (
                  <Card key={doc.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
