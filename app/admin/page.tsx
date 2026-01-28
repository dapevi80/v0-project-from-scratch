'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Briefcase, 
  Scale, 
  ChevronRight,
  FileText,
  Settings,
  Building2,
  UserCheck,
  LogOut,
  Shield,
  FolderOpen,
  TrendingUp
} from 'lucide-react'
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
  
  // Auto-logout por inactividad para usuarios verificados
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

    // Obtener perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
      router.replace('/dashboard')
      return
    }

    // Obtener estadisticas
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Card className="max-w-sm">
          <CardContent className="p-6 text-center">
            <p className="text-slate-600">No tienes permisos de administrador</p>
            <Button className="mt-4" onClick={() => router.push('/dashboard')}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                data.isSuperAdmin 
                  ? 'bg-gradient-to-br from-red-500 to-red-600' 
                  : 'bg-gradient-to-br from-purple-500 to-purple-600'
              }`}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-800">
                  {data.isSuperAdmin ? 'Super Admin' : 'Administrador'}
                </h1>
                <p className="text-xs text-slate-500">{data.profile.full_name}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-slate-600 hover:text-slate-800"
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
          <Badge className={`${
            data.isSuperAdmin 
              ? 'bg-red-100 text-red-700' 
              : 'bg-purple-100 text-purple-700'
          }`}>
            {data.isSuperAdmin ? 'Super Administrador' : 'Administrador'}
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-slate-500">Usuarios</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{data.stats.totalUsuarios}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <FolderOpen className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-slate-500">Cotizaciones</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{data.stats.totalCotizaciones}</p>
              {data.stats.cotizacionesNuevas > 0 && (
                <p className="text-xs text-amber-600">{data.stats.cotizacionesNuevas} nuevas</p>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-4 h-4 text-green-600" />
                <span className="text-xs text-slate-500">Casos</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{data.stats.totalCasos}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Scale className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-slate-500">Abogados</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{data.stats.totalAbogados}</p>
              {data.stats.abogadosPendientes > 0 && (
                <p className="text-xs text-purple-600">{data.stats.abogadosPendientes} pendientes</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Menu de opciones */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-slate-500 px-1">Gestion</h2>
          
          {/* Leads / Cotizaciones */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <Link href="/abogado/leads" className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-800">Leads / Cotizaciones</h3>
                    {data.stats.cotizacionesNuevas > 0 && (
                      <Badge className="bg-amber-100 text-amber-700 text-xs">
                        {data.stats.cotizacionesNuevas}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Ver y asignar cotizaciones a abogados</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
            </CardContent>
          </Card>

          {/* Casos Activos */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <Link href="/admin/casos" className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-800">Casos Activos</h3>
                  <p className="text-xs text-slate-500">Gestionar casos en proceso</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
            </CardContent>
          </Card>

          {/* Verificar Abogados */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <Link href="/admin/solicitudes-abogados" className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-800">Verificar Abogados</h3>
                    {data.stats.abogadosPendientes > 0 && (
                      <Badge className="bg-purple-100 text-purple-700 text-xs">
                        {data.stats.abogadosPendientes}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Aprobar solicitudes de abogados</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
            </CardContent>
          </Card>

          {/* Usuarios */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <Link href="/admin/usuarios" className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-800">Usuarios</h3>
                  <p className="text-xs text-slate-500">Gestionar todos los usuarios</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
            </CardContent>
          </Card>

          {/* Solo para superadmin */}
          {data.isSuperAdmin && (
            <>
              <h2 className="text-sm font-medium text-slate-500 px-1 mt-6">Super Admin</h2>
              
              {/* Configuracion */}
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <Link href="/admin/config" className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-800">Configuracion</h3>
                      <p className="text-xs text-slate-500">Ajustes del sistema</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </Link>
                </CardContent>
              </Card>
              
              {/* Reportes */}
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <Link href="/admin/reportes" className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-800">Reportes</h3>
                      <p className="text-xs text-slate-500">Estadisticas y metricas</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </Link>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-8">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex items-center justify-center gap-6 text-xs text-slate-400">
            <span>mecorrieron.mx</span>
            <span>Panel de {data.isSuperAdmin ? 'Super Admin' : 'Admin'}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
