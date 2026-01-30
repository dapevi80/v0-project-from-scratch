import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { asignarCasoConToken } from '../actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AsignarCasoPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token
  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Enlace invalido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              El enlace de asignación no es válido o falta el token.
            </p>
            <Button asChild>
              <Link href="/dashboard">Volver al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/acceso?redirect=${encodeURIComponent(`/casos/asignar?token=${token}`)}`)
  }
  
  const result = await asignarCasoConToken(token)
  if (result.error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No se pudo asignar el caso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{result.error}</p>
            <Button asChild>
              <Link href="/dashboard">Ir al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  redirect(`/caso/${result.casoId}`)
}
