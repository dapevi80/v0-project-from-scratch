'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, Copy, Check, Users, Scale, Briefcase, 
  ChevronRight, Share2, QrCode, Gift, TrendingUp
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface FamilyMember {
  user_id: string
  full_name: string
  email: string
  rol: string
  nivel: number
  referral_code: string
  casos_count: number
  activo: boolean
}

interface FirstLineLawyer {
  user_id: string
  full_name: string
  email: string
  phone: string | null
  estado: string
  casos_activos: number
  referral_code: string
}

interface TreeStats {
  total: number
  abogados: number
  trabajadores: number
  porNivel: Record<number, number>
}

export default function ReferidosPage() {
  const [loading, setLoading] = useState(true)
  const [codigoReferido, setCodigoReferido] = useState('')
  const [copied, setCopied] = useState(false)
  const [familia, setFamilia] = useState<FamilyMember[]>([])
  const [primeraLinea, setPrimeraLinea] = useState<FirstLineLawyer[]>([])
  const [stats, setStats] = useState<TreeStats>({ total: 0, abogados: 0, trabajadores: 0, porNivel: {} })
  const [userRole, setUserRole] = useState<string>('')

  const loadData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    // Obtener perfil y codigo
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code, role')
      .eq('id', user.id)
      .single()
    
    if (profile) {
      setCodigoReferido(profile.referral_code || '')
      setUserRole(profile.role || '')
      
      // Si no tiene codigo, generar uno
      if (!profile.referral_code) {
        const { data: newCode } = await supabase
          .rpc('generar_codigo_referido', { p_user_id: user.id })
        if (newCode) setCodigoReferido(newCode)
      }
    }
    
    // Obtener familia de referidos
    const { data: familiaData } = await supabase
      .rpc('obtener_familia_referidos', { p_user_id: user.id, p_nivel_max: 5 })
    
    if (familiaData) {
      setFamilia(familiaData)
      
      // Calcular stats
      const newStats: TreeStats = { total: familiaData.length, abogados: 0, trabajadores: 0, porNivel: {} }
      familiaData.forEach((m: FamilyMember) => {
        newStats.porNivel[m.nivel] = (newStats.porNivel[m.nivel] || 0) + 1
        if (m.rol === 'abogado' || m.rol === 'guest_lawyer') newStats.abogados++
        if (m.rol === 'worker' || m.rol === 'guest_worker') newStats.trabajadores++
      })
      setStats(newStats)
    }
    
    // Si es admin, obtener primera linea de abogados
    if (profile?.role === 'admin' || profile?.role === 'superadmin') {
      const { data: lawyersData } = await supabase
        .rpc('obtener_abogados_primera_linea', { p_admin_id: user.id })
      if (lawyersData) setPrimeraLinea(lawyersData)
    }
    
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const copyCode = async () => {
    await navigator.clipboard.writeText(codigoReferido)
    setCopied(true)
    toast.success('Codigo copiado al portapapeles')
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLink = async () => {
    const url = `${window.location.origin}/registro?ref=${codigoReferido}`
    if (navigator.share) {
      await navigator.share({
        title: 'Unete a mecorrieron.mx',
        text: 'Calcula tu liquidacion laboral gratis',
        url
      })
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado al portapapeles')
    }
  }

  const getRolBadge = (rol: string) => {
    switch (rol) {
      case 'superadmin':
        return <Badge className="bg-red-600 text-white">Super Admin</Badge>
      case 'admin':
        return <Badge className="bg-purple-600 text-white">Admin</Badge>
      case 'abogado':
        return <Badge className="bg-blue-600 text-white">Abogado</Badge>
      case 'guest_lawyer':
        return <Badge variant="outline" className="border-blue-400 text-blue-600">Abogado Guest</Badge>
      case 'worker':
        return <Badge className="bg-green-600 text-white">Trabajador</Badge>
      case 'guest_worker':
        return <Badge variant="outline" className="border-green-400 text-green-600">Guest</Badge>
      default:
        return <Badge variant="secondary">{rol}</Badge>
    }
  }

  const getNivelLabel = (nivel: number) => {
    switch (nivel) {
      case 1: return 'Primera Linea'
      case 2: return 'Segunda Linea'
      case 3: return 'Tercera Linea'
      case 4: return 'Cuarta Linea'
      case 5: return 'Quinta Linea'
      default: return `Nivel ${nivel}`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/abogado/dashboard" className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="text-3xl">🔗</span>
            <div>
              <h1 className="font-bold text-lg">Mi Red de Referidos</h1>
              <p className="text-xs text-muted-foreground">Invita y gana comisiones</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Codigo de Referido */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="w-5 h-5 text-blue-600" />
              Tu Codigo de Referido
            </CardTitle>
            <CardDescription>Comparte este codigo y gana comisiones por cada registro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input 
                value={codigoReferido} 
                readOnly 
                className="font-mono text-lg font-bold text-center bg-white"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={copyCode}
                className="shrink-0 bg-white"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={shareLink} className="flex-1 gap-2">
                <Share2 className="w-4 h-4" />
                Compartir Link
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent">
                <QrCode className="w-4 h-4" />
                QR
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              Link: {typeof window !== 'undefined' ? window.location.origin : ''}/registro?ref={codigoReferido}
            </p>
          </CardContent>
        </Card>

        {/* Estadisticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <span className="text-2xl">👥</span>
              <p className="text-2xl font-bold mt-1 text-purple-700">{stats.total}</p>
              <p className="text-xs text-purple-600">Total Red</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <span className="text-2xl">⚖️</span>
              <p className="text-2xl font-bold mt-1 text-blue-700">{stats.abogados}</p>
              <p className="text-xs text-blue-600">Abogados</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4 text-center">
              <span className="text-2xl">👷</span>
              <p className="text-2xl font-bold mt-1 text-green-700">{stats.trabajadores}</p>
              <p className="text-xs text-green-600">Trabajadores</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
            <CardContent className="p-4 text-center">
              <span className="text-2xl">📈</span>
              <p className="text-2xl font-bold mt-1 text-amber-700">{stats.porNivel[1] || 0}</p>
              <p className="text-xs text-amber-600">1ra Linea</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="familia" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="familia" className="gap-2">
              <Users className="w-4 h-4" />
              Mi Familia ({familia.length})
            </TabsTrigger>
            {(userRole === 'admin' || userRole === 'superadmin') && (
              <TabsTrigger value="asignar" className="gap-2">
                <Briefcase className="w-4 h-4" />
                Asignar Casos
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab Familia */}
          <TabsContent value="familia" className="space-y-3 mt-4">
            {familia.length === 0 ? (
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="py-12 text-center">
                  <span className="text-4xl mb-4 block">🌱</span>
                  <h3 className="font-semibold text-lg mb-2">Aun no tienes referidos</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Comparte tu codigo y comienza a construir tu red
                  </p>
                  <Button onClick={shareLink} className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Invitar ahora
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Agrupar por nivel */}
                {[1, 2, 3, 4, 5].map(nivel => {
                  const miembrosNivel = familia.filter(m => m.nivel === nivel)
                  if (miembrosNivel.length === 0) return null
                  
                  return (
                    <div key={nivel}>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        {getNivelLabel(nivel)} ({miembrosNivel.length})
                      </h3>
                      <div className="space-y-2">
                        {miembrosNivel.map((miembro) => (
                          <Card key={miembro.user_id} className="hover:shadow-sm transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                    <span className="text-lg">
                                      {miembro.rol.includes('abogado') || miembro.rol.includes('lawyer') ? '⚖️' : '👤'}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium">{miembro.full_name || 'Usuario'}</p>
                                    <p className="text-xs text-muted-foreground">{miembro.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getRolBadge(miembro.rol)}
                                  {miembro.casos_count > 0 && (
                                    <Badge variant="outline">{miembro.casos_count} casos</Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </TabsContent>

          {/* Tab Asignar Casos (solo admin) */}
          {(userRole === 'admin' || userRole === 'superadmin') && (
            <TabsContent value="asignar" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Abogados de Primera Linea</CardTitle>
                  <CardDescription>
                    Puedes asignar casos a estos abogados que estan directamente en tu red
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {primeraLinea.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Scale className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No tienes abogados en tu primera linea</p>
                      <p className="text-sm">Invita abogados con tu codigo de referido</p>
                    </div>
                  ) : (
                    primeraLinea.map((abogado) => (
                      <Card key={abogado.user_id} className="bg-blue-50/50 border-blue-100">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <Scale className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold">{abogado.full_name}</p>
                                <p className="text-xs text-muted-foreground">{abogado.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {abogado.estado}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {abogado.casos_activos} casos activos
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Link href={`/admin/asignar-caso?abogado=${abogado.user_id}`}>
                              <Button size="sm" className="gap-1">
                                <Briefcase className="w-4 h-4" />
                                Asignar
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Reglas de Comisiones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-600" />
              Programa de Referidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-xl">💰</span>
              <div>
                <p className="font-semibold text-green-800">Primera Linea: 10% comision</p>
                <p className="text-green-600 text-xs">Por cada caso ganado de tus referidos directos</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-xl">📊</span>
              <div>
                <p className="font-semibold text-blue-800">Segunda Linea: 5% comision</p>
                <p className="text-blue-600 text-xs">Por cada caso ganado de referidos de tus referidos</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <span className="text-xl">🎁</span>
              <div>
                <p className="font-semibold text-purple-800">Bonos por Volumen</p>
                <p className="text-purple-600 text-xs">Alcanza 10+ referidos activos y desbloquea bonos especiales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
