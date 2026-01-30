'use server'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { consumirCreditosIA } from '@/lib/ai/credits-system'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const costo = Number(body.costo || 1)
  const source = body.source || 'chat'
  const assistant = body.assistant || 'lia'

  const result = await consumirCreditosIA(user.id, costo, {
    source,
    assistant
  })

  if (!result.ok) {
    const status = result.error?.toLowerCase().includes('bloqueado') ? 403 : 402
    return NextResponse.json({ ok: false, error: result.error }, { status })
  }

  return NextResponse.json({
    ok: true,
    wallet: result.wallet
  })
}
