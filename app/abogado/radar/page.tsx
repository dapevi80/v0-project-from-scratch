'use client'

import { useState, useEffect } from 'react'
import { LeadCard } from '@/components/abogado/lead-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Heart, Zap, Filter, TrendingUp, MapPin, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import confetti from 'canvas-confetti'

export default function RadarLeadsPage() {
  const [casos, setCasos] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [estadisticas, setEstadisticas] = useState({
    vistos: 0,
    tomados: 0,
    pasados: 0
  })

  useEffect(() => {
    cargarCasos()
  }, [])

  async function cargarCasos() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('casos')
        .select('*')
        .eq('disponible_para_leads', true)
        .eq('estado_lead', 'disponible')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      const casosTransformados = (data || []).map(caso => ({
        id: caso.id,
        folio: caso.folio || 'SIN-FOLIO',
        estado: caso.estado || 'Nacional',
        ciudad: caso.ciudad || 'México',
        montoEstimado: caso.monto_estimado || 50000,
        empresa: caso.empresa_nombre || 'Empresa Confidencial',
        tipoCaso: caso.tipo_caso || 'Despido injustificado',
        diasDesde: Math.floor((Date.now() - new Date(caso.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        prioridad: caso.prioridad || 'media',
        categoria: caso.categoria || 'Laboral'
      }))
      setCasos(casosTransformados)
    } catch (error) {
      console.error('Error cargando casos:', error)
      setCasos([
        { id: '1', folio: 'LAB-2026-001', estado: 'Quintana Roo', ciudad: 'Cancún', montoEstimado: 150000, empresa: 'Hotel Paradise SA', tipoCaso: 'Despido injustificado', diasDesde: 2, prioridad: 'alta', categoria: 'Turismo' },
        { id: '2', folio: 'LAB-2026-002', estado: 'Ciudad de Mexico', ciudad: 'CDMX', montoEstimado: 85000, empresa: 'Tech Solutions MX', tipoCaso: 'Falta de pago', diasDesde: 5, prioridad: 'media', categoria: 'Tecnología' },
        { id: '3', folio: 'LAB-2026-003', estado: 'Jalisco', ciudad: 'Guadalajara', montoEstimado: 120000, empresa: 'Manufactura GDL', tipoCaso: 'Despido discriminatorio', diasDesde: 1, prioridad: 'alta', categoria: 'Manufactura' }
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleSwipeLeft() {
    setEstadisticas(prev => ({ ...prev, vistos: prev.vistos + 1, pasados: prev.pasados + 1 }))
    nextCard()
  }

  async function handleSwipeRight() {
    setEstadisticas(prev => ({ ...prev, vistos: prev.vistos + 1, tomados: prev.tomados + 1 }))
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#00FF41', '#00d9ff', '#FFD700'] })
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('casos').update({ lawyer_id: user.id, estado_lead: 'tomado', assigned_at: new Date().toISOString() }).eq('id', casos[currentIndex].id)
      }
    } catch (error) { console.error('Error:', error) }
    nextCard()
  }

  function nextCard() {
    if (currentIndex < casos.length - 1) { setCurrentIndex(currentIndex + 1) }
    else { cargarCasos(); setCurrentIndex(0) }
  }

  const casoActual = casos[currentIndex]
  const casosRestantes = casos.length - currentIndex

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-green-400 font-mono">Cargando casos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="border-b border-green-500/30 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/abogado/dashboard">
                <Button variant="ghost" className="text-green-400 hover:text-green-300">← Dashboard</Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Zap className="w-6 h-6 text-green-500" /> Radar de Leads
                </h1>
                <p className="text-sm text-green-400 font-mono">{casosRestantes} casos disponibles</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="text-center"><p className="text-gray-400">Vistos</p><p className="text-white font-bold">{estadisticas.vistos}</p></div>
                <div className="text-center"><p className="text-gray-400">Tomados</p><p className="text-green-400 font-bold">{estadisticas.tomados}</p></div>
                <div className="text-center"><p className="text-gray-400">Pasados</p><p className="text-red-400 font-bold">{estadisticas.pasados}</p></div>
              </div>
              <Button variant="outline" className="border-green-500 text-green-400"><Filter className="w-4 h-4 mr-2" />Filtros</Button>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="relative h-[650px] mb-8">
            {casos.length === 0 ? (
              <Card className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-green-500/30 flex items-center justify-center">
                <div className="text-center p-8">
                  <TrendingUp className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">¡Sin casos por ahora!</h3>
                  <p className="text-gray-400 mb-4">Ya revisaste todos los casos disponibles.</p>
                  <Button onClick={cargarCasos} className="bg-green-600 hover:bg-green-700"><Zap className="w-4 h-4 mr-2" />Recargar</Button>
                </div>
              </Card>
            ) : (
              <>
                {currentIndex + 1 < casos.length && (
                  <LeadCard key={casos[currentIndex + 1].id} caso={casos[currentIndex + 1]} onSwipeLeft={() => {}} onSwipeRight={() => {}} style={{ zIndex: 1, scale: 0.95, opacity: 0.5 }} />
                )}
                {casoActual && (
                  <LeadCard key={casoActual.id} caso={casoActual} onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight} style={{ zIndex: 2 }} />
                )}
              </>
            )}
          </div>
          <div className="flex justify-center gap-6">
            <Button onClick={handleSwipeLeft} size="lg" variant="outline" className="w-20 h-20 rounded-full border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"><X className="w-8 h-8" /></Button>
            <Button onClick={handleSwipeRight} size="lg" className="w-20 h-20 rounded-full bg-green-600 hover:bg-green-700 text-white"><Heart className="w-8 h-8" /></Button>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-950/30 border-blue-500/30 p-4"><MapPin className="w-8 h-8 text-blue-400 mb-2" /><h4 className="text-white font-semibold mb-1">Nacional</h4><p className="text-xs text-gray-400">Casos de todo México</p></Card>
            <Card className="bg-green-950/30 border-green-500/30 p-4"><DollarSign className="w-8 h-8 text-green-400 mb-2" /><h4 className="text-white font-semibold mb-1">Sin comisión inicial</h4><p className="text-xs text-gray-400">Solo pagas al ganar</p></Card>
            <Card className="bg-purple-950/30 border-purple-500/30 p-4"><Zap className="w-8 h-8 text-purple-400 mb-2" /><h4 className="text-white font-semibold mb-1">Contacto directo</h4><p className="text-xs text-gray-400">Al tomar el caso</p></Card>
          </div>
        </div>
      </div>
    </div>
  )
         }
