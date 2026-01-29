'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Search, CreditCard, Users, TrendingUp, Calendar } from 'lucide-react'
import { MatrixRain } from '@/components/ui/matrix-rain'
import { createClient } from '@/lib/supabase/client'

interface Suscripcion {
  id: string
  user_id: string
  tipo: 'basico' | 'pro' | 'enterprise'
  status: 'activa' | 'pausada' | 'cancelada' | 'vencida'
  monto: number
  fecha_inicio: string
  fecha_renovacion: string
  user_name?: string
  user_email?: string
}

export default function CobrosPage() {
  const [loading, setLoading] = useState(true)
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([])
  const [filtro, setFiltro] = useState('todas')
  const [busqueda, setBusqueda] = useState('')
  const [stats, setStats] = useState({
    totalActivas: 0,
    ingresoMensual: 0,
    porVencer: 0,
    canceladas: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    
    // Simular datos de suscripciones
    const mockSuscripciones: Suscripcion[] = [
      { id: '1', user_id: 'u1', tipo: 'pro', status: 'activa', monto: 499, fecha_inicio: '2024-01-15', fecha_renovacion: '2026-02-15', user_name: 'Lic. Carlos Mendez', user_email: 'carlos@despacho.mx' },
      { id: '2', user_id: 'u2', tipo: 'basico', status: 'activa', monto: 199, fecha_inicio: '2024-02-01', fecha_renovacion: '2026-02-01', user_name: 'Ana Martinez', user_email: 'ana@abogados.mx' },
      { id: '3', user_id: 'u3', tipo: 'enterprise', status: 'activa', monto: 1999, fecha_inicio: '2024-01-01', fecha_renovacion: '2026-02-01', user_name: 'Despacho Legal MX', user_email: 'admin@legalmx.com' },
      { id: '4', user_id: 'u4', tipo: 'pro', status: 'pausada', monto: 499, fecha_inicio: '2023-11-01', fecha_renovacion: '2026-01-01', user_name: 'Roberto Juarez', user_email: 'roberto@law.mx' },
      { id: '5', user_id: 'u5', tipo: 'basico', status: 'vencida', monto: 199, fecha_inicio: '2023-12-01', fecha_renovacion: '2026-01-01', user_name: 'Maria Lopez', user_email: 'maria@correo.mx' },
    ]
    
    setSuscripciones(mockSuscripciones)
    setStats({
      totalActivas: mockSuscripciones.filter(s => s.status === 'activa').length,
      ingresoMensual: mockSuscripciones.filter(s => s.status === 'activa').reduce((acc, s) => acc + s.monto, 0),
      porVencer: mockSuscripciones.filter(s => new Date(s.fecha_renovacion) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length,
      canceladas: mockSuscripciones.filter(s => s.status === 'cancelada' || s.status === 'vencida').length
    })
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  }

  const filteredSuscripciones = suscripciones.filter(s => {
    if (filtro !== 'todas' && s.status !== filtro) return false
    if (busqueda && !s.user_name?.toLowerCase().includes(busqueda.toLowerCase()) && 
        !s.user_email?.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  })

  const statusColors: Record<string, string> = {
    activa: 'bg-green-900 text-green-300 border-green-600',
    pausada: 'bg-yellow-900 text-yellow-300 border-yellow-600',
    cancelada: 'bg-red-900 text-red-300 border-red-600',
    vencida: 'bg-gray-900 text-gray-300 border-gray-600'
  }

  const tipoColors: Record<string, string> = {
    basico: 'text-blue-400',
    pro: 'text-purple-400',
    enterprise: 'text-amber-400'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-500 font-mono animate-pulse">Cargando cobros...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative">
      <MatrixRain />
      
      <header className="bg-black/95 border-b border-green-900 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 hover:bg-green-950 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-green-500" />
            </Link>
            <div>
              <h1 className="font-mono font-bold text-green-400">COBROS Y SUSCRIPCIONES</h1>
              <p className="text-xs text-green-700 font-mono">Sistema de pagos recurrentes</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <Card className="bg-black border-green-900">
            <CardContent className="p-3 text-center">
              <Users className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-400 font-mono">{stats.totalActivas}</p>
              <p className="text-[10px] text-green-700 font-mono">Activas</p>
            </CardContent>
          </Card>
          <Card className="bg-black border-green-900">
            <CardContent className="p-3 text-center">
              <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-400 font-mono">{formatCurrency(stats.ingresoMensual)}</p>
              <p className="text-[10px] text-green-700 font-mono">MRR</p>
            </CardContent>
          </Card>
          <Card className="bg-black border-yellow-900">
            <CardContent className="p-3 text-center">
              <Calendar className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-yellow-400 font-mono">{stats.porVencer}</p>
              <p className="text-[10px] text-yellow-700 font-mono">Por vencer</p>
            </CardContent>
          </Card>
          <Card className="bg-black border-red-900">
            <CardContent className="p-3 text-center">
              <CreditCard className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-red-400 font-mono">{stats.canceladas}</p>
              <p className="text-[10px] text-red-700 font-mono">Canceladas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
            <Input 
              placeholder="Buscar usuario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 bg-black border-green-900 text-green-400 font-mono placeholder:text-green-800"
            />
          </div>
          {['todas', 'activa', 'pausada', 'vencida'].map((f) => (
            <Button
              key={f}
              variant={filtro === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltro(f)}
              className={filtro === f 
                ? 'bg-green-600 text-black font-mono' 
                : 'border-green-900 text-green-500 hover:bg-green-950 font-mono bg-transparent'
              }
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        {/* Lista de suscripciones */}
        <div className="space-y-2">
          {filteredSuscripciones.map((sub) => (
            <Card key={sub.id} className="bg-black/80 border-green-900 hover:border-green-600 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-mono font-bold ${tipoColors[sub.tipo]}`}>
                        {sub.tipo.toUpperCase()}
                      </span>
                      <Badge className={`text-[10px] ${statusColors[sub.status]}`}>
                        {sub.status}
                      </Badge>
                    </div>
                    <p className="text-green-300 font-mono text-sm">{sub.user_name}</p>
                    <p className="text-green-700 font-mono text-xs">{sub.user_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-mono font-bold">{formatCurrency(sub.monto)}/mes</p>
                    <p className="text-green-700 font-mono text-xs">Renueva: {new Date(sub.fecha_renovacion).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Terminal footer */}
        <div className="mt-8 p-3 bg-black border border-green-900 rounded-lg font-mono text-xs">
          <p className="text-green-600">
            <span className="text-green-400">root@cobros</span>
            <span className="text-white">:</span>
            <span className="text-blue-400">~</span>
            <span className="text-white">$ </span>
            <span className="text-green-300">MRR: {formatCurrency(stats.ingresoMensual)} | Suscripciones: {suscripciones.length}</span>
          </p>
        </div>
      </main>
    </div>
  )
}
