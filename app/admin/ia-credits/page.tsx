'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, ShieldCheck, Coins, RefreshCw, Lock, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getAiCreditsDashboard } from './actions'

interface AiCreditsDashboard {
  totals: {
    totalWallets: number
    totalMonthly: number
    totalUsed: number
    totalExtra: number
    blocked: number
    byPlan: Record<string, number>
  }
  recentTx: Array<{
    id: string
    tipo: string
    monto: number
    fuente: string
    created_at: string
    user_id: string
  }>
}

export default function AdminIaCreditsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AiCreditsDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    const result = await getAiCreditsDashboard()
    if (result.error) {
      setError(result.error)
      setData(null)
    } else {
      setError(null)
      setData(result.data as AiCreditsDashboard)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-black/95 border-b border-green-900 sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="p-2 hover:bg-green-950 rounded-lg transition-colors">
                <ArrowLeft className="w-4 h-4 text-green-400" />
              </Link>
              <div>
                <h1 className="font-mono font-bold text-green-400 text-sm sm:text-base">IA CREDITS</h1>
                <p className="text-[10px] sm:text-xs text-green-700 font-mono hidden sm:block">
                  Consumo, planes y recompensas
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={loadData}
              variant="outline"
              className="border-green-700 text-green-300 hover:bg-green-950"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-6 space-y-6 max-w-5xl">
        {loading ? (
          <div className="text-green-500 font-mono animate-pulse">Cargando dashboard IA...</div>
        ) : error ? (
          <Card className="bg-black/80 border-red-700">
            <CardContent className="p-4 text-red-300 font-mono text-xs">
              Error cargando dashboard: {error}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="bg-black/80 border-green-900">
                <CardContent className="p-4 text-center">
                  <Coins className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-xl font-bold text-green-200">{data?.totals.totalWallets}</p>
                  <p className="text-xs text-green-600 font-mono">Carteras IA</p>
                </CardContent>
              </Card>
              <Card className="bg-black/80 border-green-900">
                <CardContent className="p-4 text-center">
                  <BarChart3 className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <p className="text-xl font-bold text-blue-200">{data?.totals.totalUsed}</p>
                  <p className="text-xs text-blue-500 font-mono">Monedas usadas</p>
                </CardContent>
              </Card>
              <Card className="bg-black/80 border-green-900">
                <CardContent className="p-4 text-center">
                  <Sparkles className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <p className="text-xl font-bold text-amber-200">{data?.totals.totalExtra}</p>
                  <p className="text-xs text-amber-500 font-mono">Rewards/Cupones</p>
                </CardContent>
              </Card>
              <Card className="bg-black/80 border-green-900">
                <CardContent className="p-4 text-center">
                  <Lock className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <p className="text-xl font-bold text-red-200">{data?.totals.blocked}</p>
                  <p className="text-xs text-red-500 font-mono">Bloqueadas</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="bg-black/80 border-green-900 lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-mono text-green-300">Ultimas transacciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-green-100 font-mono">
                  {data?.recentTx.length ? (
                    data.recentTx.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between border border-green-900 rounded-lg p-2">
                        <div>
                          <p className="text-green-300">{tx.tipo} • {tx.fuente}</p>
                          <p className="text-[10px] text-green-700">{new Date(tx.created_at).toLocaleString()}</p>
                        </div>
                        <Badge className={tx.tipo === 'debit' ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}>
                          {tx.tipo === 'debit' ? '-' : '+'}{tx.monto}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-green-600">Sin transacciones recientes.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-black/80 border-green-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-mono text-green-300">Distribucion de planes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-green-100 font-mono">
                  {data?.totals.byPlan && Object.keys(data.totals.byPlan).length ? (
                    Object.entries(data.totals.byPlan).map(([plan, count]) => (
                      <div key={plan} className="flex items-center justify-between border border-green-900 rounded-lg p-2">
                        <span className="text-green-200 capitalize">{plan}</span>
                        <Badge className="bg-green-950 text-green-300 border border-green-700">{count}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-green-600">No hay planes activos.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-black/80 border-green-900">
              <CardContent className="p-4 flex items-center gap-3 text-xs font-mono text-green-200">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                <p>
                  Panel listo para controlar consumo de monedas IA, bloqueos por plan y sincronizacion con rewards/cupones NFT.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
