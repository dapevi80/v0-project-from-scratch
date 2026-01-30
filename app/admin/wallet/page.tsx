'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Coins, CreditCard, Zap, Crown, Sparkles, Check, ShieldCheck, Ticket, KeyRound, BadgeCheck } from 'lucide-react'
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
  const [tab, setTab] = useState<'monedas' | 'suscripciones' | 'emision'>('monedas')

  useEffect(() => {
    setLoading(false)
  }, [])

  const paquetesFichas: PaqueteFichas[] = [
    { id: '1', nombre: 'Starter', fichas: 120, precio: 99, descripcion: 'Ideal para probar IA' },
    { id: '2', nombre: 'Basico', fichas: 600, precio: 449, descuento: 10, descripcion: 'Uso personal' },
    { id: '3', nombre: 'Pro', fichas: 2000, precio: 1199, descuento: 20, popular: true, descripcion: 'Despachos activos' },
    { id: '4', nombre: 'Business', fichas: 6500, precio: 3499, descuento: 30, descripcion: 'Equipos legales' },
    { id: '5', nombre: 'Enterprise', fichas: 18000, precio: 8999, descuento: 40, descripcion: 'Alto volumen' },
  ]

  const suscripciones: Suscripcion[] = [
    { 
      id: '1', 
      nombre: 'Basico', 
      precioMensual: 199, 
      fichasIncluidas: 200,
      beneficios: ['200 monedas IA/mes', 'Calculadora ilimitada', 'Soporte email']
    },
    { 
      id: '2', 
      nombre: 'Pro', 
      precioMensual: 499, 
      fichasIncluidas: 600,
      popular: true,
      beneficios: ['600 monedas IA/mes', 'AutoCCL incluido', 'Leads prioritarios', 'Soporte WhatsApp']
    },
    { 
      id: '3', 
      nombre: 'Enterprise', 
      precioMensual: 1999, 
      fichasIncluidas: 3000,
      beneficios: ['3000 monedas IA/mes', 'API access', 'Multi-usuario', 'Soporte dedicado', 'Reportes custom']
    },
  ]

  const emisionesNFT = [
    {
      title: 'Cupones',
      icon: Ticket,
      description: 'NFT intercambiables para suscripciones y paquetes de monedas.'
    },
    {
      title: 'Monedas IA',
      icon: Coins,
      description: 'Creditos para herramientas de IA y automatizacion.'
    },
    {
      title: 'VCard + Credenciales',
      icon: BadgeCheck,
      description: 'Identidad digital y tarjetas profesionales verificables.'
    },
    {
      title: 'Llave digital SAT',
      icon: KeyRound,
      description: 'Certificados y llaves oficiales con custodia segura.'
    },
    {
      title: 'Firma digital',
      icon: ShieldCheck,
      description: 'Firmas electronicas para documentos legales.'
    }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-500 font-mono animate-pulse">Cargando cartera...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative">
      <MatrixRain />
      
      <header className="bg-black/95 border-b border-green-900 sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/admin" className="p-1.5 sm:p-2 hover:bg-green-950 rounded-lg transition-colors">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              </Link>
              <div>
                <h1 className="font-mono font-bold text-green-400 text-sm sm:text-base">CARTERA</h1>
                <p className="text-[10px] sm:text-xs text-green-700 font-mono hidden sm:block">Monedas IA y suscripciones</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-950 border border-green-700 rounded-full">
              <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
              <span className="font-mono font-bold text-green-400">1,250</span>
              <span className="text-green-700 text-xs font-mono">monedas</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-4xl relative z-10">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
          <Button
            variant={tab === 'monedas' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('monedas')}
            className={`text-xs sm:text-sm ${tab === 'monedas' 
              ? 'bg-green-600 text-black font-mono' 
              : 'border-green-900 text-green-500 hover:bg-green-950 font-mono bg-transparent'
            }`}
          >
            <Coins className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Comprar</span> Monedas
          </Button>
          <Button
            variant={tab === 'suscripciones' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('suscripciones')}
            className={`text-xs sm:text-sm ${tab === 'suscripciones' 
              ? 'bg-green-600 text-black font-mono' 
              : 'border-green-900 text-green-500 hover:bg-green-950 font-mono bg-transparent'
            }`}
          >
            <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Suscripciones</span><span className="sm:hidden">Suscrip.</span> (-10%)
          </Button>
          <Button
            variant={tab === 'emision' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('emision')}
            className={`text-xs sm:text-sm ${tab === 'emision' 
              ? 'bg-green-600 text-black font-mono' 
              : 'border-green-900 text-green-500 hover:bg-green-950 font-mono bg-transparent'
            }`}
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Emision NFT
          </Button>
        </div>

        {/* Contenido Monedas */}
        {tab === 'monedas' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {paquetesFichas.map((paquete) => (
              <Card 
                key={paquete.id} 
                className={`bg-black/80 border-green-900 hover:border-green-500 transition-all hover:shadow-[0_0_20px_rgba(0,255,0,0.2)] ${
                  paquete.popular ? 'border-green-500 ring-1 ring-green-500' : ''
                }`}
              >
                <CardContent className="p-2 sm:p-4 text-center">
                  {paquete.popular && (
                    <Badge className="bg-green-600 text-black font-mono mb-1 sm:mb-2 text-[9px] sm:text-xs">
                      <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                      TOP
                    </Badge>
                  )}
                  <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-green-950 border border-green-700 flex items-center justify-center mx-auto mb-1 sm:mb-3">
                    <Coins className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" />
                  </div>
                  <h3 className="font-mono font-bold text-green-400 text-xs sm:text-lg">{paquete.nombre}</h3>
                  <p className="font-mono text-lg sm:text-3xl font-bold text-green-300 my-1 sm:my-2">
                    {paquete.fichas.toLocaleString()}
                  </p>
                  <div className="mb-2 sm:mb-3">
                    {paquete.descuento ? (
                      <Badge className="bg-red-900 text-red-300 text-[8px] sm:text-[10px] mb-1">-{paquete.descuento}%</Badge>
                    ) : null}
                    <p className="font-mono font-bold text-green-400 text-sm sm:text-xl">
                      {formatCurrency(paquete.precio)}
                    </p>
                  </div>
                  <Button size="sm" className="w-full bg-green-600 text-black font-mono hover:bg-green-500 text-[10px] sm:text-xs h-7 sm:h-9">
                    <CreditCard className="w-3 h-3 mr-1" />
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
            <div className="text-center mb-2 sm:mb-4">
              <Badge className="bg-amber-900 text-amber-300 font-mono text-[10px] sm:text-xs">
                <Zap className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                Ahorra 10% con tarjeta
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {suscripciones.map((sub) => (
                <Card 
                  key={sub.id} 
                  className={`bg-black/80 border-green-900 hover:border-green-500 transition-all ${
                    sub.popular ? 'border-green-500 ring-1 ring-green-500 sm:scale-105' : ''
                  }`}
                >
                  <CardContent className="p-3 sm:p-4">
                    {sub.popular && (
                      <Badge className="bg-green-600 text-black font-mono mb-2 w-full justify-center text-[10px] sm:text-xs">
                        <Crown className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                        RECOMENDADO
                      </Badge>
                    )}
                    <h3 className="font-mono font-bold text-green-400 text-sm sm:text-lg text-center">{sub.nombre}</h3>
                    <div className="text-center my-2 sm:my-3">
                      <p className="font-mono text-xl sm:text-3xl font-bold text-green-300">
                        {formatCurrency(sub.precioMensual * 0.9)}
                      </p>
                      <p className="text-green-700 font-mono text-[10px] sm:text-xs line-through">
                        {formatCurrency(sub.precioMensual)}/mes
                      </p>
                      <p className="text-green-600 font-mono text-[10px] sm:text-xs mt-1">
                        {sub.fichasIncluidas.toLocaleString()} monedas/mes
                      </p>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                      {sub.beneficios.slice(0, 3).map((beneficio, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 sm:gap-2 text-green-500 text-[10px] sm:text-xs font-mono">
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400 flex-shrink-0" />
                          <span className="truncate">{beneficio}</span>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" className="w-full bg-green-600 text-black font-mono hover:bg-green-500 text-xs sm:text-sm">
                      Suscribirme
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Contenido Emision */}
        {tab === 'emision' && (
          <div className="space-y-4 sm:space-y-6">
            <Card className="bg-black/80 border-green-900">
              <CardHeader className="pb-2">
                <CardTitle className="font-mono text-green-400 text-sm sm:text-base">Modelo de negocio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-[10px] sm:text-xs text-green-200 font-mono">
                <p>
                  La Cartera emite NFTs desde Superadmin: USDT, MXN estimado, cupones, llaves y firmas. Los cupones
                  se venden como suscripciones mensuales o packs intercambiables por monedas IA.
                </p>
                <p>
                  Las monedas IA son creditos para herramientas inteligentes. Los despachos pagan suscripciones
                  recurrentes, mientras que los abogados pueden comprar monedas a demanda o por cupones.
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {emisionesNFT.map((emision) => {
                const Icon = emision.icon
                return (
                  <Card key={emision.title} className="bg-black/80 border-green-900">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-green-950 border border-green-700 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                          <p className="font-mono text-green-400 text-xs sm:text-sm font-semibold">{emision.title}</p>
                          <p className="font-mono text-green-700 text-[10px] sm:text-xs">{emision.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Card className="bg-black/80 border-green-900">
              <CardHeader className="pb-2">
                <CardTitle className="font-mono text-green-400 text-sm sm:text-base">Plan de rewards y dinamica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-[10px] sm:text-xs text-green-200 font-mono">
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>Logros: cada milestone libera cupones NFT (onboarding, referidos, casos cerrados).</li>
                  <li>Cupones: canjeables por monedas IA o descuentos en suscripciones mensuales.</li>
                  <li>Intercambio: usuarios pueden transferir cupones entre carteras verificadas.</li>
                  <li>Distribucion: Superadmin mina y dispersa NFTs segun rol (abogados, despachos, clientes).</li>
                  <li>Bloqueo inteligente: llaves, contraseñas y vCards no requieren verificacion.</li>
                  <li>Cripto + monedas IA: requieren cuenta verificada y backup de seed phrase.</li>
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className="bg-green-950 text-green-300 border border-green-700 font-mono text-[10px] sm:text-xs">
                    Rewards automaticos
                  </Badge>
                  <Badge className="bg-green-950 text-green-300 border border-green-700 font-mono text-[10px] sm:text-xs">
                    Emision controlada
                  </Badge>
                  <Badge className="bg-green-950 text-green-300 border border-green-700 font-mono text-[10px] sm:text-xs">
                    Cupones intercambiables
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Info Mercado Pago */}
        <Card className="bg-black/80 border-green-900">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-[10px] sm:text-sm">MP</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-green-400 text-xs sm:text-sm">Pagos via Mercado Pago</p>
                <p className="font-mono text-green-700 text-[10px] sm:text-xs truncate">Factura automatica SAT</p>
              </div>
              <Badge className="bg-green-950 text-green-400 border border-green-700 font-mono text-[10px] sm:text-xs hidden sm:flex">
                Seguro
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Terminal footer */}
        <div className="mt-4 sm:mt-8 p-2 sm:p-3 bg-black border border-green-900 rounded-lg font-mono text-[10px] sm:text-xs overflow-x-auto">
          <p className="text-green-600 whitespace-nowrap">
            <span className="text-green-400">root@cartera</span>
            <span className="text-white">$ </span>
            <span className="text-green-300">API: MercadoPago</span>
          </p>
        </div>
      </main>
    </div>
  )
}
