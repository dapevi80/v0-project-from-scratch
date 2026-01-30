import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, '')
  if (digits.startsWith('52')) {
    return digits
  }
  if (digits.length === 10) {
    return `52${digits}`
  }
  return digits
}

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
  const phone = normalizePhone(body?.phone || '')
  const code = String(body?.code || '').trim()

  if (!phone || !code) {
    return NextResponse.json({ error: 'Código y número requeridos' }, { status: 400 })
  }

  const { data: verification, error: findError } = await admin
    .from('whatsapp_verifications')
    .select('id, expires_at, verified_at')
    .eq('user_id', user.id)
    .eq('phone', phone)
    .eq('code', code)
    .is('verified_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (findError || !verification) {
    return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
  }

  const expiresAt = new Date(verification.expires_at)
  if (expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: 'Código expirado' }, { status: 400 })
  }

  const { error: updateError } = await admin
    .from('whatsapp_verifications')
    .update({ verified_at: new Date().toISOString() })
    .eq('id', verification.id)

  if (updateError) {
    return NextResponse.json({ error: 'No se pudo validar el código' }, { status: 500 })
  }

  await admin
    .from('profiles')
    .update({ phone })
    .eq('id', user.id)

  return NextResponse.json({ success: true, phone })
}
