import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { randomInt } from 'crypto'

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

  if (!phone) {
    return NextResponse.json({ error: 'Número de WhatsApp requerido' }, { status: 400 })
  }

  const code = String(randomInt(100000, 999999))
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const { error: insertError } = await admin
    .from('whatsapp_verifications')
    .insert({
      user_id: user.id,
      phone,
      code,
      expires_at: expiresAt
    })

  if (insertError) {
    return NextResponse.json({ error: 'No se pudo guardar la verificación' }, { status: 500 })
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) {
    return NextResponse.json(
      { error: 'WhatsApp no configurado' },
      { status: 500 }
    )
  }

  const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: {
        body: `Tu código de verificación de mecorrieron.mx es ${code}. Vence en 10 minutos.`
      }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    return NextResponse.json(
      { error: 'No se pudo enviar el mensaje', details: errorText },
      { status: 502 }
    )
  }

  return NextResponse.json({ success: true })
}
