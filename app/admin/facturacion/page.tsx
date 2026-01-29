'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Search, FileText, Download, CheckCircle, XCircle, Clock } from 'lucide-react'
import { MatrixRain } from '@/components/ui/matrix-rain'

interface Factura {
  id: string
  folio: string
  rfc_emisor: string
  rfc_receptor: string
  receptor_nombre: string
  subtotal: number
  iva: number
  total: number
  status: 'timbrada' | 'cancelada' | 'pendiente' | 'error'
  fecha_emision: string
  uuid?: string
}

export default function FacturacionPage() {
  const [loading, setLoading] = useState(true)
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [filtro, setFiltro] = useState('todas')
  const [busqueda, setBusqueda] = useState('')
  const [stats, setStats] = useState({
    timbradas: 0,
    pendientes: 0,
    canceladas: 0,
    totalFacturado: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    // Simular datos de facturas
    const mockFacturas: Factura[] = [
      { id: '1', folio: 'A-001', rfc_emisor: 'MCO850101XXX', rfc_receptor: 'XAXX010101000', receptor_nombre: 'Publico en General', subtotal: 430.17, iva: 68.83, total: 499, status: 'timbrada', fecha_emision: '2026-01-28', uuid: 'ABC123-DEF456-GHI789' },
      { id: '2', folio: 'A-002', rfc_emisor: 'MCO850101XXX', rfc_receptor: 'MERC901215AB1', receptor_nombre: 'Carlos Mendez Rodriguez', subtotal: 1723.28, iva: 275.72, total: 1999, status: 'timbrada', fecha_emision: '2026-01-27', uuid: 'JKL012-MNO345-PQR678' },
      { id: '3', folio: 'A-003', rfc_emisor: 'MCO850101XXX', rfc_receptor: 'LOMA880520XY2', receptor_nombre: 'Ana Lopez Martinez', subtotal: 171.55, iva: 27.45, total: 199, status: 'pendiente', fecha_emision: '2026-01-28' },
      { id: '4', folio: 'A-004', rfc_emisor: 'MCO850101XXX', rfc_receptor: 'GAJU750310ZZ9', receptor_nombre: 'Roberto Juarez Garcia', subtotal: 430.17, iva: 68.83, total: 499, status: 'cancelada', fecha_emision: '2026-01-25', uuid: 'STU901-VWX234-YZA567' },
      { id: '5', folio: 'A-005', rfc_emisor: 'MCO850101XXX', rfc_receptor: 'XAXX010101000', receptor_nombre: 'Publico en General', subtotal: 43.10, iva: 6.90, total: 50, status: 'timbrada', fecha_emision: '2026-01-28', uuid: 'BCD890-EFG123-HIJ456' },
    ]
    
    setFacturas(mockFacturas)
    setStats({
      timbradas: mockFacturas.filter(f => f.status === 'timbrada').length,
      pendientes: mockFacturas.filter(f => f.status === 'pendiente').length,
      canceladas: mockFacturas.filter(f => f.status === 'cancelada').length,
      totalFacturado: mockFacturas.filter(f => f.status === 'timbrada').reduce((acc, f) => acc + f.total, 0)
    })
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  }

  const filteredFacturas = facturas.filter(f => {
    if (filtro !== 'todas' && f.status !== filtro) return false
    if (busqueda && !f.receptor_nombre.toLowerCase().includes(busqueda.toLowerCase()) && 
        !f.folio.toLowerCase().includes(busqueda.toLowerCase()) &&
        !f.rfc_receptor.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  })

  const statusConfig: Record<string, { color: string, icon: typeof CheckCircle }> = {
    timbrada: { color: 'bg-green-900 text-green-300 border-green-600', icon: CheckCircle },
    pendiente: { color: 'bg-yellow-900 text-yellow-300 border-yellow-600', icon: Clock },
    cancelada: { color: 'bg-red-900 text-red-300 border-red-600', icon: XCircle },
    error: { color: 'bg-red-900 text-red-300 border-red-600', icon: XCircle }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-500 font-mono animate-pulse">Conectando con SAT...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative">
      <MatrixRain />
      
      <header className="bg-black/95 border-b border-green-900 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="p-2 hover:bg-green-950 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-green-500" />
              </Link>
              <div>
                <h1 className="font-mono font-bold text-green-400">FACTURACION SAT</h1>
                <p className="text-xs text-green-700 font-mono">CFDI 4.0 - Timbrado electronico</p>
              </div>
            </div>
            <Button size="sm" className="bg-green-600 text-black font-mono hover:bg-green-500">
              + Nueva Factura
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <Card className="bg-black border-green-900">
            <CardContent className="p-3 text-center">
              <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-400 font-mono">{stats.timbradas}</p>
              <p className="text-[10px] text-green-700 font-mono">Timbradas</p>
            </CardContent>
          </Card>
          <Card className="bg-black border-yellow-900">
            <CardContent className="p-3 text-center">
              <Clock className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-yellow-400 font-mono">{stats.pendientes}</p>
              <p className="text-[10px] text-yellow-700 font-mono">Pendientes</p>
            </CardContent>
          </Card>
          <Card className="bg-black border-red-900">
            <CardContent className="p-3 text-center">
              <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-red-400 font-mono">{stats.canceladas}</p>
              <p className="text-[10px] text-red-700 font-mono">Canceladas</p>
            </CardContent>
          </Card>
          <Card className="bg-black border-green-900">
            <CardContent className="p-3 text-center">
              <FileText className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-green-400 font-mono">{formatCurrency(stats.totalFacturado)}</p>
              <p className="text-[10px] text-green-700 font-mono">Facturado</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
            <Input 
              placeholder="Buscar por RFC, nombre o folio..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 bg-black border-green-900 text-green-400 font-mono placeholder:text-green-800"
            />
          </div>
          {['todas', 'timbrada', 'pendiente', 'cancelada'].map((f) => (
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

        {/* Lista de facturas */}
        <div className="space-y-2">
          {filteredFacturas.map((factura) => {
            const StatusIcon = statusConfig[factura.status].icon
            return (
              <Card key={factura.id} className="bg-black/80 border-green-900 hover:border-green-600 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-green-400">{factura.folio}</span>
                        <Badge className={`text-[10px] ${statusConfig[factura.status].color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {factura.status}
                        </Badge>
                      </div>
                      <p className="text-green-300 font-mono text-sm">{factura.receptor_nombre}</p>
                      <p className="text-green-700 font-mono text-xs">RFC: {factura.rfc_receptor}</p>
                      {factura.uuid && (
                        <p className="text-green-800 font-mono text-[10px] mt-1">UUID: {factura.uuid}</p>
                      )}
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="text-green-400 font-mono font-bold">{formatCurrency(factura.total)}</p>
                        <p className="text-green-700 font-mono text-xs">{new Date(factura.fecha_emision).toLocaleDateString()}</p>
                      </div>
                      {factura.status === 'timbrada' && (
                        <Button size="sm" variant="ghost" className="text-green-500 hover:bg-green-950 p-2">
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Terminal footer */}
        <div className="mt-8 p-3 bg-black border border-green-900 rounded-lg font-mono text-xs">
          <p className="text-green-600">
            <span className="text-green-400">root@sat</span>
            <span className="text-white">:</span>
            <span className="text-blue-400">~</span>
            <span className="text-white">$ </span>
            <span className="text-green-300">CFDI 4.0 | PAC: Finkok | Facturas: {facturas.length}</span>
          </p>
        </div>
      </main>
    </div>
  )
}
