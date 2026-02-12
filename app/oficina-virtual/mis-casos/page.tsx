'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FolderOpen, MapPin, Briefcase, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CasoItem {
  id: string
  folio: string | null
  empresa_nombre: string | null
  status: string | null
  estado: string | null
  ciudad: string | null
  updated_at: string | null
}

interface OfferItem {
  id: string
  status: string | null
  casos?: CasoItem | null
}

export default function MisCasosPage() {
  const [loading, setLoading] = useState(true)
  const [casos, setCasos] = useState<CasoItem[]>([])
  const [offers, setOffers] = useState<OfferItem[]>([])

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

    const { data: casosData } = await supabase
      .from('casos')
      .select('id, folio, empresa_nombre, status, estado, ciudad, updated_at')
      .eq('lawyer_id', user.id)
      .order('updated_at', { ascending: false })

    const { data: offersData } = await supabase
      .from('case_offers')
      .select('id, status, casos(id, folio, empresa_nombre, status, estado, ciudad, updated_at)')
      .eq('lawyer_id', user.id)
      .eq('status', 'accepted')

    setCasos(casosData || [])
    setOffers(offersData || [])
    setLoading(false)
  }

  const nuevosCasos = useMemo(
    () => casos.filter((caso) => caso.status === 'assigned'),
    [casos]
  )

  const casosRadar = useMemo(
    () => offers.map((offer) => offer.casos).filter(Boolean) as CasoItem[],
    [offers]
  )

  const casosActivos = useMemo(
    () => casos.filter((caso) => ['in_conciliation', 'in_trial'].includes(caso.status || '')),
    [casos]
  )

  function renderCasoList(list: CasoItem[], emptyLabel: string) {
    if (list.length === 0) {
      return (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground text-center">
            {emptyLabel}
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-3">
        {list.map((caso) => (
          <Card key={caso.id}>
            <CardContent className="p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{caso.empresa_nombre || 'Empresa sin nombre'}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {caso.ciudad || 'Ciudad'}{caso.estado ? `, ${caso.estado}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {caso.folio && <Badge variant="secondary">{caso.folio}</Badge>}
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/oficina-virtual/caso/${caso.id}`}>Ver caso</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
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
              <h1 className="font-bold text-lg">Mis casos</h1>
              <p className="text-xs text-muted-foreground">Gestiona casos nuevos, radar y activos</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <Card>
            <CardContent className="p-10 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground mt-4">Cargando casos...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Casos nuevos creados por el usuario</h2>
              </div>
              {renderCasoList(nuevosCasos, 'No hay casos nuevos asignados actualmente.')}
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Casos tomados del radar</h2>
              </div>
              {renderCasoList(casosRadar, 'No hay casos tomados del radar todavía.')}
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Casos activos en juicio o conciliacion</h2>
              </div>
              {renderCasoList(casosActivos, 'No hay casos activos en juicio o conciliacion.')}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
