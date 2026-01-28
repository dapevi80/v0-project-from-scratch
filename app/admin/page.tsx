'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut, Terminal } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useInactivityLogout } from '@/hooks/use-inactivity-logout'
import { type UserRole } from '@/lib/types'

interface AdminData {
  profile: {
    id: string
    full_name: string
    email: string
    role: string
  }
  stats: {
    totalUsuarios: number
    totalCotizaciones: number
    totalCasos: number
    totalAbogados: number
    cotizacionesNuevas: number
    abogadosPendientes: number
  }
  isSuperAdmin: boolean
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AdminData | null>(null)
  
  useInactivityLogout({ 
    userRole: (data?.profile?.role as UserRole) || null,
    enabled: !loading && !!data
  })
  
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.replace('/acceso')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
      router.replace('/dashboard')
      return
    }

    const [
      { count: totalUsuarios },
      { count: totalCotizaciones },
      { count: totalCasos },
      { count: totalAbogados },
      { count: cotizacionesNuevas },
      { count: abogadosPendientes }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('cotizaciones').select('*', { count: 'exact', head: true }),
      supabase.from('cases').select('*', { count: 'exact', head: true }),
      supabase.from('lawyer_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('cotizaciones').select('*', { count: 'exact', head: true }).eq('status', 'nueva'),
      supabase.from('lawyer_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending')
    ])

    setData({
      profile,
      stats: {
        totalUsuarios: totalUsuarios || 0,
        totalCotizaciones: totalCotizaciones || 0,
        totalCasos: totalCasos || 0,
        totalAbogados: totalAbogados || 0,
        cotizacionesNuevas: cotizacionesNuevas || 0,
        abogadosPendientes: abogadosPendientes || 0
      },
      isSuperAdmin: profile.role === 'superadmin'
    })
    
    setLoading(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/acceso'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-500 font-mono animate-pulse">Cargando sistema...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="max-w-sm bg-black border-red-500">
          <CardContent className="p-6 text-center">
            <p className="text-red-500 font-mono">Acceso denegado</p>
            <Button className="mt-4 bg-green-600 hover:bg-green-700" onClick={() => router.push('/dashboard')}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Herramientas comunes (abogado)
  const commonTools = [
    { name: 'Mis Casos', href: '/abogado/casos', emoji: '⚖️', description: 'Gestiona casos asignados' },
    { name: 'Mis Referidos', href: '/abogado/referidos', emoji: '🔗', description: 'Red de comisiones' },
    { name: 'Calculadora', href: '/calculadora', emoji: '🧮', description: 'Calcula liquidaciones' },
    { name: 'Boveda', href: '/boveda', emoji: '🔐', description: 'Documentos seguros' },
  ]

  // Herramientas admin
  const adminTools = [
    { name: 'Leads', href: '/abogado/leads', emoji: '📋', description: 'Cotizaciones nuevas', badge: data.stats.cotizacionesNuevas },
    { name: 'Verificar Abogados', href: '/admin/solicitudes-abogados', emoji: '🛡️', description: 'Aprobar solicitudes', badge: data.stats.abogadosPendientes },
    { name: 'Usuarios', href: '/admin/usuarios', emoji: '👥', description: 'Gestionar usuarios' },
    { name: 'Casos Activos', href: '/admin/casos', emoji: '📂', description: 'Todos los casos' },
  ]

  // Herramientas EXCLUSIVAS superadmin
  const superAdminTools = [
    { name: 'Diagnostico CCL', href: '/admin/ccl-diagnostico', emoji: '🔬', description: 'Test 33 portales CCL' },
    { name: 'Config Sistema', href: '/admin/config', emoji: '⚙️', description: 'Ajustes globales' },
    { name: 'Reportes', href: '/admin/reportes', emoji: '📊', description: 'Metricas y analytics' },
    { name: 'Base de Datos', href: '/admin/database', emoji: '🗄️', description: 'Explorar tablas' },
  ]

  return (
    <div className={`min-h-screen ${data.isSuperAdmin ? 'bg-black' : 'bg-gradient-to-b from-slate-50 to-white'}`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-40 ${data.isSuperAdmin ? 'bg-black/95 border-green-900' : 'bg-white'}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {data.isSuperAdmin ? (
                <div className="w-10 h-10 rounded-lg bg-green-950 border border-green-600 flex items-center justify-center">
                  <Terminal className="w-5 h-5 text-green-400" />
                </div>
              ) : (
                <span className="text-3xl">🛡️</span>
              )}
              <div>
                <h1 className={`font-bold text-lg ${data.isSuperAdmin ? 'text-green-400 font-mono' : 'text-slate-800'}`}>
                  {data.isSuperAdmin ? 'SUPERADMIN' : 'Admin Panel'}
                </h1>
                <p className={`text-xs ${data.isSuperAdmin ? 'text-green-600 font-mono' : 'text-slate-500'}`}>
                  {data.profile.full_name}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className={data.isSuperAdmin ? 'text-green-500 hover:text-green-400 hover:bg-green-950' : 'text-slate-600 hover:text-slate-800'}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        {/* Badge de rol */}
        <div className="flex justify-center">
          {data.isSuperAdmin ? (
            <Badge className="bg-green-950 text-green-400 border border-green-600 font-mono px-4 py-1">
              ROOT ACCESS GRANTED
            </Badge>
          ) : (
            <Badge className="bg-purple-100 text-purple-700">
              Administrador
            </Badge>
          )}
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-4 gap-2 ${data.isSuperAdmin ? 'font-mono' : ''}`}>
          <Card className={data.isSuperAdmin ? 'bg-black border-green-900' : 'bg-gradient-to-br from-blue-50 to-white border-blue-100'}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${data.isSuperAdmin ? 'text-green-400' : 'text-blue-600'}`}>
                {data.stats.totalUsuarios}
              </p>
              <p className={`text-[10px] ${data.isSuperAdmin ? 'text-green-700' : 'text-slate-500'}`}>Usuarios</p>
            </CardContent>
          </Card>
          <Card className={data.isSuperAdmin ? 'bg-black border-green-900' : 'bg-gradient-to-br from-amber-50 to-white border-amber-100'}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${data.isSuperAdmin ? 'text-green-400' : 'text-amber-600'}`}>
                {data.stats.totalCotizaciones}
              </p>
              <p className={`text-[10px] ${data.isSuperAdmin ? 'text-green-700' : 'text-slate-500'}`}>Leads</p>
            </CardContent>
          </Card>
          <Card className={data.isSuperAdmin ? 'bg-black border-green-900' : 'bg-gradient-to-br from-green-50 to-white border-green-100'}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${data.isSuperAdmin ? 'text-green-400' : 'text-green-600'}`}>
                {data.stats.totalCasos}
              </p>
              <p className={`text-[10px] ${data.isSuperAdmin ? 'text-green-700' : 'text-slate-500'}`}>Casos</p>
            </CardContent>
          </Card>
          <Card className={data.isSuperAdmin ? 'bg-black border-green-900' : 'bg-gradient-to-br from-purple-50 to-white border-purple-100'}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${data.isSuperAdmin ? 'text-green-400' : 'text-purple-600'}`}>
                {data.stats.totalAbogados}
              </p>
              <p className={`text-[10px] ${data.isSuperAdmin ? 'text-green-700' : 'text-slate-500'}`}>Abogados</p>
            </CardContent>
          </Card>
        </div>

        {/* Herramientas comunes */}
        <div>
          <h2 className={`text-sm font-medium mb-3 px-1 ${data.isSuperAdmin ? 'text-green-600 font-mono' : 'text-slate-500'}`}>
            {data.isSuperAdmin ? '> TOOLS' : 'Herramientas'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {commonTools.map((tool) => (
              <Link key={tool.name} href={tool.href}>
                <Card className={`h-full transition-all cursor-pointer ${
                  data.isSuperAdmin 
                    ? 'bg-black border-green-900 hover:border-green-500 hover:bg-green-950/30' 
                    : 'hover:shadow-md hover:border-primary'
                }`}>
                  <CardContent className="p-3 flex flex-col items-center text-center gap-1">
                    <span className="text-2xl">{tool.emoji}</span>
                    <p className={`font-medium text-xs ${data.isSuperAdmin ? 'text-green-400 font-mono' : 'text-foreground'}`}>
                      {tool.name}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Herramientas admin */}
        <div>
          <h2 className={`text-sm font-medium mb-3 px-1 ${data.isSuperAdmin ? 'text-green-600 font-mono' : 'text-slate-500'}`}>
            {data.isSuperAdmin ? '> ADMIN' : 'Administracion'}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {adminTools.map((tool) => (
              <Link key={tool.name} href={tool.href}>
                <Card className={`h-full transition-all cursor-pointer ${
                  data.isSuperAdmin 
                    ? 'bg-black border-green-900 hover:border-green-500 hover:bg-green-950/30' 
                    : 'hover:shadow-md hover:border-primary'
                }`}>
                  <CardContent className="p-3 flex flex-col items-center text-center gap-1 relative">
                    {tool.badge && tool.badge > 0 && (
                      <Badge className={`absolute -top-1 -right-1 text-[10px] px-1.5 ${
                        data.isSuperAdmin ? 'bg-green-600 text-black' : 'bg-red-500 text-white'
                      }`}>
                        {tool.badge}
                      </Badge>
                    )}
                    <span className="text-2xl">{tool.emoji}</span>
                    <p className={`font-medium text-xs ${data.isSuperAdmin ? 'text-green-400 font-mono' : 'text-foreground'}`}>
                      {tool.name}
                    </p>
                    <p className={`text-[10px] ${data.isSuperAdmin ? 'text-green-700' : 'text-muted-foreground'}`}>
                      {tool.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Herramientas EXCLUSIVAS superadmin */}
        {data.isSuperAdmin && (
          <div>
            <h2 className="text-sm font-medium mb-3 px-1 text-green-500 font-mono flex items-center gap-2">
              <span className="animate-pulse">{'>'}</span> ROOT_ACCESS
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {superAdminTools.map((tool) => (
                <Link key={tool.name} href={tool.href}>
                  <Card className="h-full transition-all cursor-pointer bg-green-950/50 border-green-600 hover:border-green-400 hover:bg-green-900/50">
                    <CardContent className="p-3 flex flex-col items-center text-center gap-1">
                      <span className="text-2xl">{tool.emoji}</span>
                      <p className="font-mono font-medium text-xs text-green-300">
                        {tool.name}
                      </p>
                      <p className="text-[10px] text-green-600">
                        {tool.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Terminal footer solo para superadmin */}
        {data.isSuperAdmin && (
          <div className="mt-8 p-3 bg-black border border-green-900 rounded-lg font-mono text-xs">
            <p className="text-green-600">
              <span className="text-green-400">root@mecorrieron</span>
              <span className="text-white">:</span>
              <span className="text-blue-400">~</span>
              <span className="text-white">$ </span>
              <span className="text-green-300 animate-pulse">_</span>
            </p>
            <p className="text-green-700 mt-1">Sistema operativo. {data.stats.totalUsuarios} usuarios activos.</p>
          </div>
        )}
      </main>
    </div>
  )
}
