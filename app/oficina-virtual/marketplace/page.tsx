'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Search,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  Send,
  Filter,
  Briefcase
} from 'lucide-react'
import { getMarketplaceCases, makeOffer } from '../actions'

export default function MarketplacePage() {
  const [loading, setLoading] = useState(true)
  const [cases, setCases] = useState<Record<string, unknown>[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCase, setSelectedCase] = useState<Record<string, unknown> | null>(null)
  const [offerData, setOfferData] = useState({
    proposed_fee_percent: 30,
    message: '',
    estimated_duration_days: 90
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadCases()
  }, [])

  async function loadCases() {
    setLoading(true)
    const result = await getMarketplaceCases()
    if (result.data) {
      setCases(result.data)
    }
    setLoading(false)
  }

  async function handleSubmitOffer() {
    if (!selectedCase) return
    
    setSubmitting(true)
    const result = await makeOffer(selectedCase.id as string, offerData)
    
    if (result.error) {
      alert(result.error)
    } else {
      setSelectedCase(null)
      setOfferData({ proposed_fee_percent: 30, message: '', estimated_duration_days: 90 })
      loadCases()
    }
    setSubmitting(false)
  }

  const filteredCases = cases.filter(c => 
    (c.empresa_nombre as string)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.ciudad as string)?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="bg-transparent">
              <Link href="/oficina-virtual">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-bold text-lg">Marketplace de Casos</h1>
              <p className="text-xs text-muted-foreground">{filteredCases.length} casos disponibles</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por empresa o ciudad..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Cases List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredCases.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No hay casos disponibles</h3>
              <p className="text-sm text-muted-foreground">
                Revisa mas tarde para nuevos casos
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredCases.map((caso) => (
              <Card key={caso.id as string} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <h3 className="font-semibold">{caso.empresa_nombre as string}</h3>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {caso.ciudad as string}, {caso.estado as string}
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary">Nuevo</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Monto Estimado</p>
                        <p className="font-bold text-green-700">
                          ${((caso.monto_estimado as number) || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Antiguedad</p>
                        <p className="font-bold text-blue-700">
                          {(caso.calculos_liquidacion as Record<string, unknown>)?.antiguedad_anios || '?'} años
                        </p>
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full" 
                          onClick={() => setSelectedCase(caso)}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Hacer Oferta
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Hacer Oferta</DialogTitle>
                          <DialogDescription>
                            Caso: {caso.empresa_nombre as string} - ${((caso.monto_estimado as number) || 0).toLocaleString()}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div>
                            <Label>Porcentaje de Honorarios (%)</Label>
                            <Input
                              type="number"
                              min={10}
                              max={50}
                              value={offerData.proposed_fee_percent}
                              onChange={(e) => setOfferData(prev => ({
                                ...prev,
                                proposed_fee_percent: parseInt(e.target.value) || 30
                              }))}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Ganarias aprox. ${(((caso.monto_estimado as number) || 0) * offerData.proposed_fee_percent / 100).toLocaleString()}
                            </p>
                          </div>
                          
                          <div>
                            <Label>Tiempo Estimado (dias)</Label>
                            <Input
                              type="number"
                              min={30}
                              max={365}
                              value={offerData.estimated_duration_days}
                              onChange={(e) => setOfferData(prev => ({
                                ...prev,
                                estimated_duration_days: parseInt(e.target.value) || 90
                              }))}
                            />
                          </div>
                          
                          <div>
                            <Label>Mensaje al Trabajador</Label>
                            <Textarea
                              placeholder="Presentate y explica por que eres el mejor abogado para este caso..."
                              value={offerData.message}
                              onChange={(e) => setOfferData(prev => ({
                                ...prev,
                                message: e.target.value
                              }))}
                              rows={4}
                            />
                          </div>
                          
                          <Button 
                            className="w-full" 
                            onClick={handleSubmitOffer}
                            disabled={submitting || !offerData.message}
                          >
                            {submitting ? 'Enviando...' : 'Enviar Oferta'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
