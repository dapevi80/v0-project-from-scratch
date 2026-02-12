'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  MapPin,
  Building2,
  Search,
  Navigation,
  CheckCircle2,
  SkipForward,
  ShieldCheck,
} from 'lucide-react'
import { ESTADOS_LISTA } from '@/lib/ccl/constants'
import { getMarketplaceCases, makeOffer } from '../actions'

interface RadarCase {
  id: string
  empresa_nombre?: string | null
  ciudad?: string | null
  estado?: string | null
  monto_estimado?: number | null
  status?: string | null
  calculos_liquidacion?: {
    antiguedad_anios?: number | null
  } | null
}

export default function RadarClientesPage() {
  const [loading, setLoading] = useState(true)
  const [queue, setQueue] = useState<RadarCase[]>([])
  const [selectedEstado, setSelectedEstado] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCase, setSelectedCase] = useState<RadarCase | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [offerData, setOfferData] = useState({
    proposed_fee_percent: 30,
    message: '',
    estimated_duration_days: 90,
  })

  useEffect(() => {
    loadCases('')
  }, [])

  async function loadCases(estado: string) {
    setLoading(true)
    const result = await getMarketplaceCases(estado ? { estado } : undefined)
    if (result.data) {
      const parsed = result.data as RadarCase[]
      setQueue(parsed)
    } else {
      setQueue([])
    }
    setLoading(false)
  }

  const filteredQueue = useMemo(() => {
    if (!searchTerm) return queue
    const term = searchTerm.toLowerCase()
    return queue.filter((item) =>
      (item.empresa_nombre || '').toLowerCase().includes(term) ||
      (item.ciudad || '').toLowerCase().includes(term)
    )
  }, [queue, searchTerm])

  const currentCase = filteredQueue[0]

  function handleNext() {
    if (filteredQueue.length <= 1) return
    setQueue((prev) => {
      if (prev.length <= 1) return prev
      const [first, ...rest] = prev
      return [...rest, first]
    })
  }

  async function handleSubmitOffer() {
    if (!selectedCase) return
    setSubmitting(true)
    const result = await makeOffer(selectedCase.id, offerData)

    if (result.error) {
      alert(result.error)
    } else {
      setSelectedCase(null)
      setOfferData({ proposed_fee_percent: 30, message: '', estimated_duration_days: 90 })
      setQueue((prev) => prev.filter((item) => item.id !== selectedCase.id))
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="bg-transparent">
              <Link href="/oficina-virtual">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-bold text-lg">Radar de clientes</h1>
              <p className="text-xs text-muted-foreground">Explora casos disponibles y filtra por estado</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 grid gap-6 lg:grid-cols-[320px,1fr]">
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Navigation className="w-4 h-4 text-primary" />
                Filtro por estado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Estado seleccionado</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={selectedEstado === '' ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedEstado('')
                      loadCases('')
                    }}
                  >
                    Todos
                  </Button>
                  {ESTADOS_LISTA.map((estado) => (
                    <Button
                      key={estado}
                      size="sm"
                      variant={selectedEstado === estado ? 'default' : 'outline'}
                      onClick={() => {
                        setSelectedEstado(estado)
                        loadCases(estado)
                      }}
                    >
                      {estado}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                Buscar en radar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Empresa o ciudad"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Como funciona</p>
              <p>Revisa cada caso disponible y decide si quieres tomarlo o enviarlo al final de la fila.</p>
              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Solo ves datos públicos hasta tomar el caso.</span>
              </div>
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-10 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <p className="text-sm text-muted-foreground mt-4">Cargando casos...</p>
              </CardContent>
            </Card>
          ) : !currentCase ? (
            <Card>
              <CardContent className="p-10 text-center">
                <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold">No hay casos disponibles</p>
                <p className="text-sm text-muted-foreground">Ajusta el filtro o vuelve mas tarde.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <CardHeader className="bg-white border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{currentCase.empresa_nombre || 'Empresa sin nombre'}</CardTitle>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {currentCase.ciudad || 'Ciudad no registrada'}
                      {currentCase.estado ? `, ${currentCase.estado}` : ''}
                    </p>
                  </div>
                  <Badge variant="secondary">Nuevo</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="bg-slate-50 border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">Monto estimado</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {typeof currentCase.monto_estimado === 'number'
                        ? `$${currentCase.monto_estimado.toLocaleString()}`
                        : 'Sin monto estimado'}
                    </p>
                  </div>
                  <div className="bg-slate-50 border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">Antiguedad reportada</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {currentCase.calculos_liquidacion?.antiguedad_anios != null
                        ? `${currentCase.calculos_liquidacion.antiguedad_anios} años`
                        : 'Sin datos'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button variant="outline" className="flex-1" onClick={handleNext} disabled={filteredQueue.length <= 1}>
                    <SkipForward className="w-4 h-4 mr-2" />
                    Siguiente
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        className="flex-1"
                        onClick={() => setSelectedCase(currentCase)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Tomar caso
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirmar toma de caso</DialogTitle>
                        <DialogDescription>
                          Completa el mensaje para enviar tu propuesta al trabajador.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label>Honorarios (%)</Label>
                          <Input
                            type="number"
                            min={10}
                            max={50}
                            value={offerData.proposed_fee_percent}
                            onChange={(e) =>
                              setOfferData((prev) => ({
                                ...prev,
                                proposed_fee_percent: Number.parseInt(e.target.value, 10) || 30,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Tiempo estimado (dias)</Label>
                          <Input
                            type="number"
                            min={30}
                            max={365}
                            value={offerData.estimated_duration_days}
                            onChange={(e) =>
                              setOfferData((prev) => ({
                                ...prev,
                                estimated_duration_days: Number.parseInt(e.target.value, 10) || 90,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Mensaje al trabajador</Label>
                          <Textarea
                            placeholder="Presentate y explica como ayudarias en el caso."
                            value={offerData.message}
                            onChange={(e) =>
                              setOfferData((prev) => ({
                                ...prev,
                                message: e.target.value,
                              }))
                            }
                            rows={4}
                          />
                        </div>
                        <Button
                          className="w-full"
                          onClick={handleSubmitOffer}
                          disabled={submitting || !offerData.message}
                        >
                          {submitting ? 'Enviando...' : 'Enviar propuesta'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="w-3 h-3" />
                  <span>Casos disponibles: {filteredQueue.length}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  )
}
