'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  Copy, 
  Share2, 
  Users, 
  DollarSign, 
  TrendingUp,
  Gift,
  CheckCircle2,
  Clock,
  ExternalLink,
  Wallet
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ReferidosPage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ 
    referral_code: string
    full_name: string
    role: string
  } | null>(null)
  const [referidos, setReferidos] = useState<Array<{
    id: string
    full_name: string
    email: string
    role: string
    created_at: string
    casos_count: number
  }>>([])
  const [stats, setStats] = useState({
    totalReferidos: 0,
    referidosActivos: 0,
    comisionesGeneradas: 0,
    comisionesPendientes: 0
  })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // Obtener perfil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('referral_code, full_name, role')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData)
    }

    // Obtener referidos (usuarios que usaron mi codigo)
    const { data: referidosData } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .eq('referred_by_code', profileData?.referral_code)
      .order('created_at', { ascending: false })

    if (referidosData) {
      // Contar casos de cada referido
      const referidosConCasos = await Promise.all(
        referidosData.map(async (ref) => {
          const { count } = await supabase
            .from('casos')
            .select('*', { count: 'exact', head: true })
            .eq('worker_id', ref.id)
          
          return {
            ...ref,
            casos_count: count || 0
          }
        })
      )
      
      setReferidos(referidosConCasos)
      
      // Calcular estadisticas
      const totalReferidos = referidosConCasos.length
      const referidosActivos = referidosConCasos.filter(r => r.casos_count > 0).length
      // Comisiones simuladas por ahora
      const comisionesGeneradas = referidosActivos * 500
      const comisionesPendientes = (totalReferidos - referidosActivos) * 100

      setStats({
        totalReferidos,
        referidosActivos,
        comisionesGeneradas,
        comisionesPendientes
      })
    }

    setLoading(false)
  }

  function copyReferralLink() {
    if (!profile?.referral_code) return
    
    const link = `https://mecorrieron.mx/r/${profile.referral_code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareReferralLink() {
    if (!profile?.referral_code) return
    
    const link = `https://mecorrieron.mx/r/${profile.referral_code}`
    const text = 'Te comparto mecorrieron.mx - La plataforma que ayuda a trabajadores despedidos a reclamar lo que les corresponde. Usa mi codigo:'
    
    if (navigator.share) {
      navigator.share({
        title: 'mecorrieron.mx',
        text: text,
        url: link
      })
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + link)}`, '_blank')
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('es-MX', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="p-2 hover:bg-muted rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Red de Referidos</h1>
                <p className="text-xs text-muted-foreground">
                  Gana comisiones por cada referido
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Link de referido */}
        <Card className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Gift className="w-8 h-8" />
              <div>
                <h2 className="font-bold text-lg">Tu codigo de referido</h2>
                <p className="text-cyan-100 text-sm">Comparte y gana comisiones</p>
              </div>
            </div>
            
            <div className="bg-white/20 rounded-lg p-3 mb-4">
              <p className="text-center font-mono text-2xl font-bold tracking-wider">
                {profile?.referral_code || 'XXXXXX'}
              </p>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  readOnly
                  value={`mecorrieron.mx/r/${profile?.referral_code || ''}`}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/70 pr-10"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-white hover:bg-white/20"
                  onClick={copyReferralLink}
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Button
                variant="secondary"
                className="bg-white text-cyan-600 hover:bg-cyan-50"
                onClick={shareReferralLink}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-cyan-600" />
              <p className="text-2xl font-bold">{stats.totalReferidos}</p>
              <p className="text-xs text-muted-foreground">Total Referidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{stats.referidosActivos}</p>
              <p className="text-xs text-muted-foreground">Con Casos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
              <p className="text-2xl font-bold">${stats.comisionesGeneradas}</p>
              <p className="text-xs text-muted-foreground">Generado</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-amber-600" />
              <p className="text-2xl font-bold">${stats.comisionesPendientes}</p>
              <p className="text-xs text-muted-foreground">Pendiente</p>
            </CardContent>
          </Card>
        </div>

        {/* Cómo funciona */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cómo funcionan las comisiones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium">Comparte tu código</p>
                  <p className="text-sm text-muted-foreground">
                    Envía tu link a trabajadores que necesiten ayuda legal
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium">Se registran con tu codigo</p>
                  <p className="text-sm text-muted-foreground">
                    Cuando calculan su liquidacion y crean una cuenta
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium">Ganas comision</p>
                  <p className="text-sm text-muted-foreground">
                    Recibes un porcentaje cuando su caso se resuelve exitosamente
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de referidos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Mis Referidos ({referidos.length})
            </CardTitle>
            <CardDescription>
              Personas que se registraron con tu codigo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referidos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Aun no tienes referidos</p>
                <p className="text-sm">Comparte tu codigo para empezar a ganar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {referidos.map(ref => (
                  <div 
                    key={ref.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{ref.full_name || 'Usuario'}</p>
                        <p className="text-xs text-muted-foreground">
                          Registrado {formatDate(ref.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {ref.casos_count > 0 ? (
                        <Badge className="bg-green-100 text-green-700">
                          {ref.casos_count} caso{ref.casos_count > 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Sin casos</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* CTA Wallet */}
        <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="w-10 h-10 text-emerald-600" />
                <div>
                  <h3 className="font-semibold">Retira tus ganancias</h3>
                  <p className="text-sm text-muted-foreground">
                    Transfiere tus comisiones a USDT
                  </p>
                </div>
              </div>
              <Link href="/dashboard">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Wallet className="w-4 h-4 mr-2" />
                  Mi Wallet
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
