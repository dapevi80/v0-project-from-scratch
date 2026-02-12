import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

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
  const code = String(body?.code || '').trim()

  if (!code) {
    return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
  }

  const { data: verification } = await admin
    .from('email_verifications')
    .select('id, email, expires_at')
    .eq('user_id', user.id)
    .eq('code', code)
    .is('verified_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!verification) {
    return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
  }

  const expiresAt = new Date(verification.expires_at)
  if (expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: 'Código expirado' }, { status: 400 })
  }

  const { error: updateError } = await admin
    .from('email_verifications')
    .update({ verified_at: new Date().toISOString() })
    .eq('id', verification.id)

  if (updateError) {
    return NextResponse.json({ error: 'No se pudo validar el código' }, { status: 500 })
  }

  const { data: whatsappVerification } = await admin
    .from('whatsapp_verifications')
    .select('verified_at')
    .eq('user_id', user.id)
    .not('verified_at', 'is', null)
    .order('verified_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!whatsappVerification?.verified_at) {
    return NextResponse.json({ success: true, requiresSecondFactor: true })
  }

  return NextResponse.json({ success: true, requiresSecondFactor: false })
}
