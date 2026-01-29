'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Coins, CreditCard, Zap, Crown, Sparkles, Check } from 'lucide-react'
import { MatrixRain } from '@/components/ui/matrix-rain'

interface PaqueteFichas {
  id: string
  nombre: string
  fichas: number
  precio: number
  descuento?: number
  popular?: boolean
  descripcion: string
}

interface Suscripcion {
  id: string
  nombre: string
  precioMensual: number
  fichasIncluidas: number
  beneficios: string[]
  popular?: boolean
}

export default function WalletPage() {
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'fichas' | 'suscripciones'>('fichas')

  useEffect(() => {
    setLoading(false)
  }, [])

  const paquetesFichas: PaqueteFichas[] = [
    { id: '1', nombre: 'Starter', fichas: 100, precio: 99, descripcion: 'Ideal para probar' },
    { id: '2', nombre: 'Basico', fichas: 500, precio: 449, descuento: 10, descripcion: 'Uso personal' },
    { id: '3', nombre: 'Pro', fichas: 1500, precio: 1199, descuento: 20, popular: true, descripcion: 'Mas popular' },
    { id: '4', nombre: 'Business', fichas: 5000, precio: 3499, descuento: 30, descripcion: 'Para despachos' },
    { id: '5', nombre: 'Enterprise', fichas: 15000, precio: 8999, descuento: 40, descripcion: 'Alto volumen' },
  ]

  const suscripciones: Suscripcion[] = [
    { 
      id: '1', 
      nombre: 'Basico', 
      precioMensual: 199, 
      fichasIncluidas: 200,
      beneficios: ['200 fichas/mes', 'Calculadora ilimitada', 'Soporte email']
    },
    { 
      id: '2', 
      nombre: 'Pro', 
      precioMensual: 499, 
      fichasIncluidas: 600,
      popular: true,
      beneficios: ['600 fichas/mes', 'AutoCCL incluido', 'Leads prioritarios', 'Soporte WhatsApp']
    },
    { 
      id: '3', 
      nombre: 'Enterprise', 
      precioMensual: 1999, 
      fichasIncluidas: 3000,
      beneficios: ['3000 fichas/mes', 'API access', 'Multi-usuario', 'Soporte dedicado', 'Reportes custom']
    },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-500 font-mono animate-pulse">Cargando wallet...</div>
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
                <h1 className="font-mono font-bold text-green-400">WALLET & MARKETPLACE</h1>
                <p className="text-xs text-green-700 font-mono">Fichas y suscripciones</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-950 border border-green-700 rounded-full">
              <Coins className="w-4 h-4 text-green-400" />
              <span className="font-mono font-bold text-green-400">1,250</span>
              <span className="text-green-700 text-xs font-mono">fichas</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl relative z-10">
        {/* Tabs */}
        <div className="flex gap-2 justify-center">
          <Button
            variant={tab === 'fichas' ? 'default' : 'outline'}
            onClick={() => setTab('fichas')}
            className={tab === 'fichas' 
              ? 'bg-green-600 text-black font-mono' 
              : 'border-green-900 text-green-500 hover:bg-green-950 font-mono bg-transparent'
            }
          >
            <Coins className="w-4 h-4 mr-2" />
            Comprar Fichas
          </Button>
          <Button
            variant={tab === 'suscripciones' ? 'default' : 'outline'}
            onClick={() => setTab('suscripciones')}
            className={tab === 'suscripciones' 
              ? 'bg-green-600 text-black font-mono' 
              : 'border-green-900 text-green-500 hover:bg-green-950 font-mono bg-transparent'
            }
          >
            <Crown className="w-4 h-4 mr-2" />
            Suscripciones (-10%)
          </Button>
        </div>

        {/* Contenido Fichas */}
        {tab === 'fichas' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {paquetesFichas.map((paquete) => (
              <Card 
                key={paquete.id} 
                className={`bg-black/80 border-green-900 hover:border-green-500 transition-all hover:shadow-[0_0_20px_rgba(0,255,0,0.2)] ${
                  paquete.popular ? 'border-green-500 ring-1 ring-green-500' : ''
                }`}
              >
                <CardContent className="p-4 text-center">
                  {paquete.popular && (
                    <Badge className="bg-green-600 text-black font-mono mb-2">
                      <Sparkles className="w-3 h-3 mr-1" />
                      POPULAR
                    </Badge>
                  )}
                  <div className="w-12 h-12 rounded-full bg-green-950 border border-green-700 flex items-center justify-center mx-auto mb-3">
                    <Coins className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="font-mono font-bold text-green-400 text-lg">{paquete.nombre}</h3>
                  <p className="font-mono text-3xl font-bold text-green-300 my-2">
                    {paquete.fichas.toLocaleString()}
                  </p>
                  <p className="text-green-700 font-mono text-xs mb-3">{paquete.descripcion}</p>
                  <div className="mb-3">
                    {paquete.descuento ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-green-700 line-through text-sm font-mono">
                          {formatCurrency(paquete.precio / (1 - paquete.descuento/100))}
                        </span>
                        <Badge className="bg-red-900 text-red-300 text-[10px]">-{paquete.descuento}%</Badge>
                      </div>
                    ) : null}
                    <p className="font-mono font-bold text-green-400 text-xl">
                      {formatCurrency(paquete.precio)}
                    </p>
                    <p className="text-green-800 font-mono text-[10px]">
                      {formatCurrency(paquete.precio / paquete.fichas)}/ficha
                    </p>
                  </div>
                  <Button className="w-full bg-green-600 text-black font-mono hover:bg-green-500">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Comprar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Contenido Suscripciones */}
        {tab === 'suscripciones' && (
          <>
            <div className="text-center mb-4">
              <Badge className="bg-amber-900 text-amber-300 font-mono">
                <Zap className="w-3 h-3 mr-1" />
                Ahorra 10% pagando mensual con tarjeta
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {suscripciones.map((sub) => (
                <Card 
                  key={sub.id} 
                  className={`bg-black/80 border-green-900 hover:border-green-500 transition-all ${
                    sub.popular ? 'border-green-500 ring-1 ring-green-500 scale-105' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    {sub.popular && (
                      <Badge className="bg-green-600 text-black font-mono mb-2 w-full justify-center">
                        <Crown className="w-3 h-3 mr-1" />
                        RECOMENDADO
                      </Badge>
                    )}
                    <h3 className="font-mono font-bold text-green-400 text-lg text-center">{sub.nombre}</h3>
                    <div className="text-center my-3">
                      <p className="font-mono text-3xl font-bold text-green-300">
                        {formatCurrency(sub.precioMensual * 0.9)}
                      </p>
                      <p className="text-green-700 font-mono text-xs line-through">
                        {formatCurrency(sub.precioMensual)}/mes
                      </p>
                      <p className="text-green-600 font-mono text-xs mt-1">
                        {sub.fichasIncluidas.toLocaleString()} fichas/mes incluidas
                      </p>
                    </div>
                    <div className="space-y-2 mb-4">
                      {sub.beneficios.map((beneficio, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-green-500 text-xs font-mono">
                          <Check className="w-3 h-3 text-green-400" />
                          {beneficio}
                        </div>
                      ))}
                    </div>
                    <Button className="w-full bg-green-600 text-black font-mono hover:bg-green-500">
                      Suscribirme
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Info Mercado Pago */}
        <Card className="bg-black/80 border-green-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">MP</span>
              </div>
              <div className="flex-1">
                <p className="font-mono text-green-400 text-sm">Pagos procesados por Mercado Pago</p>
                <p className="font-mono text-green-700 text-xs">Todas las compras generan factura automatica en SAT</p>
              </div>
              <Badge className="bg-green-950 text-green-400 border border-green-700 font-mono">
                Seguro
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Terminal footer */}
        <div className="mt-8 p-3 bg-black border border-green-900 rounded-lg font-mono text-xs">
          <p className="text-green-600">
            <span className="text-green-400">root@wallet</span>
            <span className="text-white">:</span>
            <span className="text-blue-400">~</span>
            <span className="text-white">$ </span>
            <span className="text-green-300">API: MercadoPago v2 | Facturacion: Automatica</span>
          </p>
        </div>
      </main>
    </div>
  )
}
