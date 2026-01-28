'use client'

import React from "react"

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight,
  Briefcase,
  Bell,
  Scale,
  FileText,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface CaseEvent {
  id: string
  case_id: string
  title: string
  description: string | null
  event_type: 'audiencia' | 'cita' | 'recordatorio' | 'deadline' | 'otro'
  starts_at: string
  ends_at: string | null
  location: string | null
  caso?: {
    folio: string
    empresa_nombre: string
    status: string
  }
}

const eventTypeConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  audiencia: { label: 'Audiencia', color: 'bg-red-500', icon: Scale },
  cita: { label: 'Cita', color: 'bg-blue-500', icon: Calendar },
  recordatorio: { label: 'Recordatorio', color: 'bg-yellow-500', icon: Bell },
  deadline: { label: 'Fecha limite', color: 'bg-orange-500', icon: AlertTriangle },
  otro: { label: 'Otro', color: 'bg-gray-500', icon: FileText }
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function AgendaPage() {
  const [events, setEvents] = useState<CaseEvent[]>([])
  const [cases, setCases] = useState<{ id: string; folio: string; empresa_nombre: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [filterCase, setFilterCase] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Obtener casos del usuario
    const { data: casosData } = await supabase
      .from('casos')
      .select('id, folio, empresa_nombre, status')
      .eq('worker_id', user.id)
      .order('updated_at', { ascending: false })

    if (casosData) {
      setCases(casosData)
      
      // Obtener eventos de todos los casos
      const caseIds = casosData.map(c => c.id)
      if (caseIds.length > 0) {
        const { data: eventsData } = await supabase
          .from('case_events')
          .select('*')
          .in('case_id', caseIds)
          .gte('starts_at', new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString())
          .order('starts_at', { ascending: true })

        if (eventsData) {
          // Agregar info del caso a cada evento
          const eventsWithCase = eventsData.map(event => ({
            ...event,
            caso: casosData.find(c => c.id === event.case_id)
          }))
          setEvents(eventsWithCase)
        }
      }
    }
    
    setLoading(false)
  }

  // Filtrar eventos
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (filterCase !== 'all' && event.case_id !== filterCase) return false
      if (filterType !== 'all' && event.event_type !== filterType) return false
      return true
    })
  }, [events, filterCase, filterType])

  // Eventos del dia seleccionado
  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return []
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.starts_at)
      return eventDate.toDateString() === selectedDate.toDateString()
    })
  }, [filteredEvents, selectedDate])

  // Proximos eventos (ordenados cronologicamente)
  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return filteredEvents
      .filter(event => new Date(event.starts_at) >= now)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  }, [filteredEvents])

  // Generar calendario
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay()
    
    const days: (Date | null)[] = []
    
    // Padding inicial
    for (let i = 0; i < startPadding; i++) {
      days.push(null)
    }
    
    // Dias del mes
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d))
    }
    
    return days
  }, [currentDate])

  // Eventos por dia para el calendario
  const eventsByDay = useMemo(() => {
    const map: Record<string, CaseEvent[]> = {}
    filteredEvents.forEach(event => {
      const dateKey = new Date(event.starts_at).toDateString()
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(event)
    })
    return map
  }, [filteredEvents])

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const getDaysUntil = (dateStr: string) => {
    const now = new Date()
    const eventDate = new Date(dateStr)
    const diffTime = eventDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Hoy'
    if (diffDays === 1) return 'Manana'
    if (diffDays < 0) return 'Pasado'
    return `En ${diffDays} dias`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="bg-transparent">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Agenda y Alertas</h1>
              <p className="text-sm text-muted-foreground">{upcomingEvents.length} eventos proximos</p>
            </div>
          </div>
          <Button onClick={goToToday} variant="outline" size="sm" className="bg-transparent">
            Hoy
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-4">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          <Select value={filterCase} onValueChange={setFilterCase}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por caso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los casos</SelectItem>
              {cases.map(caso => (
                <SelectItem key={caso.id} value={caso.id}>{caso.folio}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {Object.entries(eventTypeConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="calendario" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendario">Calendario</TabsTrigger>
            <TabsTrigger value="alertas">Alertas por Caso</TabsTrigger>
          </TabsList>

          {/* Tab Calendario */}
          <TabsContent value="calendario" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" onClick={prevMonth} className="bg-transparent">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <CardTitle className="text-lg">
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={nextMonth} className="bg-transparent">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Dias de la semana */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Dias del mes */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, idx) => {
                    if (!day) {
                      return <div key={`empty-${idx}`} className="aspect-square" />
                    }
                    
                    const dateKey = day.toDateString()
                    const dayEvents = eventsByDay[dateKey] || []
                    const isToday = day.toDateString() === new Date().toDateString()
                    const isSelected = selectedDate?.toDateString() === dateKey
                    
                    return (
                      <button
                        key={dateKey}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          aspect-square p-1 rounded-lg text-sm relative transition-all
                          ${isToday ? 'bg-primary text-primary-foreground font-bold' : ''}
                          ${isSelected && !isToday ? 'bg-primary/20 ring-2 ring-primary' : ''}
                          ${!isToday && !isSelected ? 'hover:bg-muted' : ''}
                        `}
                      >
                        <span>{day.getDate()}</span>
                        {dayEvents.length > 0 && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {dayEvents.slice(0, 3).map((event, i) => (
                              <div 
                                key={i} 
                                className={`w-1.5 h-1.5 rounded-full ${eventTypeConfig[event.event_type]?.color || 'bg-gray-500'}`}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Eventos del dia seleccionado */}
            {selectedDate && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {selectedDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </CardTitle>
                  <CardDescription>
                    {selectedDayEvents.length === 0 
                      ? 'Sin eventos programados' 
                      : `${selectedDayEvents.length} evento(s)`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedDayEvents.map(event => {
                    const config = eventTypeConfig[event.event_type]
                    const Icon = config?.icon || FileText
                    return (
                      <div key={event.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                        <div className={`w-10 h-10 rounded-full ${config?.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{event.title}</p>
                          {event.caso && (
                            <Link href={`/caso/${event.case_id}`} className="text-xs text-primary hover:underline">
                              {event.caso.folio} - {event.caso.empresa_nombre}
                            </Link>
                          )}
                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(event.starts_at)}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}

            {/* Proximos eventos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Proximos eventos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay eventos proximos
                  </p>
                ) : (
                  upcomingEvents.slice(0, 5).map(event => {
                    const config = eventTypeConfig[event.event_type]
                    const Icon = config?.icon || FileText
                    const daysUntil = getDaysUntil(event.starts_at)
                    const isUrgent = daysUntil === 'Hoy' || daysUntil === 'Manana'
                    
                    return (
                      <div 
                        key={event.id} 
                        className={`flex gap-3 p-3 rounded-lg border ${isUrgent ? 'border-orange-300 bg-orange-50' : 'bg-muted/30'}`}
                      >
                        <div className={`w-10 h-10 rounded-full ${config?.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm">{event.title}</p>
                            <Badge variant={isUrgent ? 'destructive' : 'secondary'} className="text-xs flex-shrink-0">
                              {daysUntil}
                            </Badge>
                          </div>
                          {event.caso && (
                            <Link href={`/caso/${event.case_id}`} className="text-xs text-primary hover:underline">
                              {event.caso.folio}
                            </Link>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(event.starts_at)} - {formatTime(event.starts_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Alertas por Caso */}
          <TabsContent value="alertas" className="space-y-4">
            {cases.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tienes casos activos</p>
                  <Button asChild className="mt-4">
                    <Link href="/calculadora">Calcular mi liquidacion</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              cases.map(caso => {
                const casoEvents = filteredEvents
                  .filter(e => e.case_id === caso.id)
                  .filter(e => new Date(e.starts_at) >= new Date())
                  .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
                
                return (
                  <Card key={caso.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{caso.folio}</CardTitle>
                          <CardDescription>{caso.empresa_nombre}</CardDescription>
                        </div>
                        <Link href={`/caso/${caso.id}`}>
                          <Button variant="outline" size="sm" className="bg-transparent">
                            Ver caso
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {casoEvents.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">
                          Sin eventos proximos
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {casoEvents.map(event => {
                            const config = eventTypeConfig[event.event_type]
                            const Icon = config?.icon || FileText
                            const daysUntil = getDaysUntil(event.starts_at)
                            const isUrgent = daysUntil === 'Hoy' || daysUntil === 'Manana'
                            
                            return (
                              <div 
                                key={event.id}
                                className={`flex items-center gap-3 p-2 rounded-lg ${isUrgent ? 'bg-orange-50 border border-orange-200' : 'bg-muted/30'}`}
                              >
                                <div className={`w-8 h-8 rounded-full ${config?.color} flex items-center justify-center`}>
                                  <Icon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{event.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(event.starts_at)} - {formatTime(event.starts_at)}
                                  </p>
                                </div>
                                <Badge variant={isUrgent ? 'destructive' : 'outline'} className="text-xs">
                                  {daysUntil}
                                </Badge>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
