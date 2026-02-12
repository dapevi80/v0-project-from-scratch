'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, UserCheck, Network, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ClienteItem {
  id: string
  empresa_nombre: string | null
  status: string | null
  worker_id: string | null
  profiles?: {
    full_name: string | null
    email: string | null
    phone: string | null
  } | null
}

interface ReferidoItem {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  created_at: string | null
}

interface EquipoItem {
  user_id: string
  full_name: string
  email: string
  phone: string | null
  cedula_profesional: string | null
  estado: string
  casos_activos: number
  referral_code: string
}

export default function MiEquipoPage() {
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<ClienteItem[]>([])
  const [referidos, setReferidos] = useState<ReferidoItem[]>([])
  const [equipo, setEquipo] = useState<EquipoItem[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [referralCode, setReferralCode] = useState<string | null>(null)

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

    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, referral_code')
      .eq('id', user.id)
      .single()

    const adminRole = ['admin', 'superadmin'].includes(profileData?.role || '')
    setIsAdmin(adminRole)
    setReferralCode(profileData?.referral_code || null)

    const { data: casosData } = await supabase
      .from('casos')
      .select('id, empresa_nombre, status, worker_id, profiles!casos_worker_id_fkey(full_name, email, phone)')
      .eq('lawyer_id', user.id)
      .order('updated_at', { ascending: false })

    setClientes(casosData || [])

    if (profileData?.referral_code) {
      const { data: referidosData } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .eq('referred_by_code', profileData.referral_code)
        .order('created_at', { ascending: false })

      setReferidos(referidosData || [])
    }

    if (adminRole) {
      const { data: equipoData } = await supabase
        .rpc('obtener_abogados_primera_linea', { p_admin_id: user.id })

      setEquipo(equipoData || [])
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="bg-transparent">
              <Link href="/oficina-virtual">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-bold text-lg">Mi equipo y red</h1>
              <p className="text-xs text-muted-foreground">Clientes, referidos y equipo vinculado</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <Card>
            <CardContent className="p-10 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground mt-4">Cargando red...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Clientes activos</h2>
              </div>
              {clientes.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-sm text-muted-foreground text-center">
                    No hay clientes vinculados todavia.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {clientes.map((cliente) => (
                    <Card key={cliente.id}>
                      <CardContent className="p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold">{cliente.profiles?.full_name || 'Cliente sin nombre'}</p>
                          <p className="text-xs text-muted-foreground">{cliente.empresa_nombre || 'Empresa no registrada'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {cliente.status && <Badge variant="secondary">{cliente.status}</Badge>}
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/oficina-virtual/caso/${cliente.id}`}>Ver caso</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Clientes referidos</h2>
              </div>
              {referidos.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-sm text-muted-foreground text-center">
                    {referralCode ? 'Aun no tienes referidos registrados.' : 'Tu codigo de referido esta pendiente.'}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {referidos.map((ref) => (
                    <Card key={ref.id}>
                      <CardContent className="p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold">{ref.full_name || 'Usuario sin nombre'}</p>
                          <p className="text-xs text-muted-foreground">{ref.email || 'Correo no registrado'}</p>
                        </div>
                        {ref.role && <Badge variant="secondary">{ref.role}</Badge>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Equipo de abogados</h2>
              </div>
              {!isAdmin ? (
                <Card>
                  <CardContent className="p-6 text-sm text-muted-foreground text-center">
                    Esta seccion esta disponible para cuentas admin.
                  </CardContent>
                </Card>
              ) : equipo.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-sm text-muted-foreground text-center">
                    No hay abogados vinculados a tu cuenta.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {equipo.map((abogado) => (
                    <Card key={abogado.user_id}>
                      <CardContent className="p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold">{abogado.full_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {abogado.estado}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {abogado.casos_activos > 0 && (
                            <Badge variant="secondary">{abogado.casos_activos} casos activos</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
