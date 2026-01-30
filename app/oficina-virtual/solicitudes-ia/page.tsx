'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, Sparkles, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CasoItem {
  id: string
  folio: string | null
  empresa_nombre: string | null
  status: string | null
  estado: string | null
  ciudad: string | null
}

export default function SolicitudesIAPage() {
  const [loading, setLoading] = useState(true)
  const [casos, setCasos] = useState<CasoItem[]>([])

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
      .select('id, folio, empresa_nombre, status, estado, ciudad')
      .eq('lawyer_id', user.id)
      .order('updated_at', { ascending: false })

    setCasos(casosData || [])
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
              <h1 className="font-bold text-lg">Generador IA de solicitudes</h1>
              <p className="text-xs text-muted-foreground">Selecciona un caso para generar solicitudes</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <Card>
            <CardContent className="p-10 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground mt-4">Cargando casos...</p>
            </CardContent>
          </Card>
        ) : casos.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold">No hay casos disponibles</p>
              <p className="text-sm text-muted-foreground">Tus casos apareceran aqui cuando se asignen.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {casos.map((caso) => (
              <Card key={caso.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-base">{caso.empresa_nombre || 'Empresa sin nombre'}</CardTitle>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {caso.ciudad || 'Ciudad'}{caso.estado ? `, ${caso.estado}` : ''}
                      </p>
                    </div>
                    {caso.folio && <Badge variant="secondary">{caso.folio}</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild variant="default" className="flex-1">
                    <Link href={`/oficina-virtual/ccl?caso=${caso.id}&modo=ia`}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generar solicitud con IA
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/oficina-virtual/ccl?caso=${caso.id}`}>
                      <FileText className="w-4 h-4 mr-2" />
                      Generar solicitud manual
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
