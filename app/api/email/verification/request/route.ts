import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { randomInt } from 'crypto'
import { enviarEmailTransaccional } from '@/lib/email/send-notification'
import { templateCorreoVerificacionCorreo, templateTextoPlanoVerificacionCorreo } from '@/lib/email/templates'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const admin = createAdminClient()

  if (!supabase || !admin) {
    return NextResponse.json({ error: 'Servicio no configurado' }, { status: 500 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const email = String(body?.email || user.email || '').trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: 'Correo requerido' }, { status: 400 })
  }

  const code = String(randomInt(100000, 999999))
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const { error: insertError } = await admin
    .from('email_verifications')
    .insert({
      user_id: user.id,
      email,
      code,
      expires_at: expiresAt
    })

  if (insertError) {
    return NextResponse.json({ error: 'No se pudo guardar la verificación' }, { status: 500 })
  }

  const html = templateCorreoVerificacionCorreo({ codigo: code })
  const text = templateTextoPlanoVerificacionCorreo({ codigo: code })

  const result = await enviarEmailTransaccional(email, 'Verifica tu correo en mecorrieron.mx', html, text)

  if (!result.success) {
    return NextResponse.json({ error: result.error || 'No se pudo enviar el correo' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
